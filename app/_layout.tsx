// app/_layout.tsx
import React, { useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { Platform } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";

import { AppProvider, useApp } from "@/contexts/AppContext";
import { PlatformConnectionProvider } from "@/contexts/PlatformConnectionContext";
import { trpc, trpcClient } from "@/lib/trpc";
import ErrorBoundary from "@/components/ErrorBoundary";

console.log("[ENV TEST]", process.env.EXPO_PUBLIC_APP_URL);

// 🚫 SplashScreen-Handling
if (Platform.OS === "web") {
  // @ts-ignore
  SplashScreen.hideAsync = async () => {};
  // @ts-ignore
  SplashScreen.preventAutoHideAsync = async () => {};
  console.log("⚠️ SplashScreen disabled for web context");
} else {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

const queryClient = new QueryClient();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootLayoutNav() {
  const { hasCompletedOnboarding, hasActiveSubscription, isLoading } = useApp();
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();
  const [appReady, setAppReady] = useState(false);

  // Splash Timeout + Hide
  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      setAppReady(true);
      if (Platform.OS !== "web") {
        SplashScreen.hideAsync().catch(() => {});
      }
    };

    const timeout = setTimeout(finish, 2500);
    if (!isLoading) finish();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isLoading]);

  const { inOnboarding, inSubscription, inTabs, inWeeklyReview, allowOutsideTabs } = useMemo(() => {
    const list = Array.isArray(segments) ? (segments as unknown as string[]) : [];
    const first = list[0] || "";
    const path = list.join("/");

    return {
      inOnboarding: first === "onboarding",
      inSubscription: first === "subscription",
      inTabs: first === "(tabs)",
      inWeeklyReview: first === "weekly-review",
      allowOutsideTabs:
        path === "onboarding/connect-platforms" ||
        path === "connected/success",
    };
  }, [segments]);

  // 🔗 Global Deep-Link-Handler (socialpro://connected/success?page_id=&ig_user_id=)
  useEffect(() => {
    const handleUrl = (url?: string | null) => {
      if (!url) return;
      try {
        const u = new URL(url);
        // akzeptiere sowohl socialpro://connected/success als auch ggf. socialpro:///connected/success
        const host = u.host || u.hostname; // 'connected'
        const path = u.pathname;           // '/success'
        if (host === "connected" && path === "/success") {
          const page_id = u.searchParams.get("page_id") || "";
          const ig_user_id = u.searchParams.get("ig_user_id") || "";
          router.push({
            pathname: "/connected/success",
            params: { page_id, ig_user_id },
          } as any);
        }
      } catch (e) {
        console.warn("[Linking] parse error", e);
      }
    };

    // Event Listener (App bereits offen)
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));

    // Initial URL (App via Deep Link gestartet)
    Linking.getInitialURL().then(handleUrl).catch(() => {});

    return () => sub.remove();
  }, [router]);

  // Navigation rules
  useEffect(() => {
    if (!appReady || !navState?.key || inWeeklyReview) return;

    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace("/onboarding/welcome");
      return;
    }

    if (hasCompletedOnboarding && !hasActiveSubscription() && !inSubscription) {
      router.replace("/subscription");
      return;
    }

    if (hasCompletedOnboarding && hasActiveSubscription() && !inTabs && !allowOutsideTabs) {
      router.replace("/(tabs)/(dashboard)");
    }
  }, [
    appReady,
    navState?.key,
    hasCompletedOnboarding,
    hasActiveSubscription,
    inOnboarding,
    inSubscription,
    inTabs,
    inWeeklyReview,
    allowOutsideTabs,
    router,
  ]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding/welcome" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/company-info" />
      <Stack.Screen
        name="onboarding/connect-platforms"
        options={{ presentation: "modal", title: "Plattformen verbinden" }}
      />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="weekly-review" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen
        name="connected/success"
        options={{ title: "Verbindung", presentation: "modal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppProvider>
            <PlatformConnectionProvider>
              <ErrorBoundary>
                <RootLayoutNav />
              </ErrorBoundary>
            </PlatformConnectionProvider>
          </AppProvider>
        </GestureHandlerRootView>
      </trpc.Provider>
    </QueryClientProvider>
  );
}

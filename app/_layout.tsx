// app/_layout.tsx
import React, { useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AppProvider, useApp } from "@/contexts/AppContext";
import { PlatformConnectionProvider } from "@/contexts/PlatformConnectionContext";
import { trpc, trpcClient } from "@/lib/trpc";
import ErrorBoundary from "@/components/ErrorBoundary";

console.log("[ENV TEST]", process.env.EXPO_PUBLIC_APP_URL);

// Splash-Screen steuern, Fehler nie werfen
SplashScreen.preventAutoHideAsync().catch(() => {});

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

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setAppReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    }, 2500);

    if (!isLoading) {
      setAppReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }

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
        path === "connected/success", // ✅ erlaubt
    };
  }, [segments]);

  // Navigation rules
  useEffect(() => {
    if (!appReady) return;
    if (!navState?.key) return;

    if (inWeeklyReview) return;

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

  // ✅ remove "connect" screen — it's causing route warnings
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

      {/* ✅ OAuth Success Screen */}
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

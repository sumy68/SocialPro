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

// Splash direkt verhindern, aber Fehler schlucken (nie throwen)
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

// Optional: Start im Tab-Bereich
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootLayoutNav() {
  const { hasCompletedOnboarding, hasActiveSubscription, isLoading } = useApp();
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  const [appReady, setAppReady] = useState(false);

  // 1) Splash niemals ewig stehen lassen (Fail-Open nach 2.5s)
  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setAppReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    }, 2500);

    // Sobald der App-Context „fertig“ meldet → sofort Splash weg
    if (!isLoading) {
      setAppReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isLoading]);

  // 2) Segment-Flags (für Redirect-Regeln)
  const { inOnboarding, inSubscription, inTabs, inWeeklyReview, allowOutsideTabs } = useMemo(() => {
    const list = Array.isArray(segments) ? (segments as unknown as string[]) : [];
    const first = list[0] || "";
    const path = list.join("/");

    return {
      inOnboarding: first === "onboarding",
      inSubscription: first === "subscription",
      inTabs: first === "(tabs)",
      inWeeklyReview: first === "weekly-review",
      // ggf. eine Route erlauben, die außerhalb der Tabs liegt
      allowOutsideTabs:
        path === "onboarding/connect-platforms" ||
        path === "connected/success",
    };
  }, [segments]);

  // 3) Redirects erst ausführen, wenn Navigation „ready“ UND App sichtbar ist
  useEffect(() => {
    if (!appReady) return;
    if (!navState?.key) return; // Navigation noch nicht bereit → warten

    // weekly-review nicht umleiten
    if (inWeeklyReview) return;

    // Onboarding erzwungen
    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace("/onboarding/welcome" as any);
      return;
    }

    // Subscription erzwungen
    if (hasCompletedOnboarding && !hasActiveSubscription() && !inSubscription) {
      router.replace("/subscription" as any);
      return;
    }

    // Fertig → in Tabs, falls wir nicht schon dort sind (außer erlaubte Einzelroute)
    if (hasCompletedOnboarding && hasActiveSubscription() && !inTabs && !allowOutsideTabs) {
      router.replace("/(tabs)/(dashboard)" as any);
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

  // Wichtig: Den Stack IMMER rendern (kein "return null"), damit bei Delays trotzdem UI entsteht.
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

      {/* NEU: OAuth-Screens */}
      <Stack.Screen
        name="connect"
        options={{ title: "Plattformen verbinden" }}
      />
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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { PlatformConnectionProvider } from "@/contexts/PlatformConnectionContext";
import { trpc, trpcClient } from "@/lib/trpc";
import ErrorBoundary from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { hasCompletedOnboarding, hasActiveSubscription, isLoading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inSubscription = segments[0] === 'subscription';
    const inTabs = segments[0] === '(tabs)';
    const inWeeklyReview = segments[0] === 'weekly-review';

    const routePath = Array.isArray(segments) ? (segments as unknown as string[]).join('/') : '';
    const allowOutsideTabs = routePath === 'onboarding/connect-platforms';

    console.log('[Navigation] Checking navigation state:', {
      hasCompletedOnboarding,
      hasActiveSubscription: hasActiveSubscription(),
      inOnboarding,
      inSubscription,
      inTabs,
      inWeeklyReview,
      allowOutsideTabs,
      segments,
      routePath,
    });

    if (inWeeklyReview) {
      return;
    }

    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding/welcome' as any);
    } else if (hasCompletedOnboarding && !hasActiveSubscription() && !inSubscription) {
      router.replace('/subscription' as any);
    } else if (hasCompletedOnboarding && hasActiveSubscription() && !inTabs && !allowOutsideTabs) {
      router.replace('/(tabs)/(dashboard)' as any);
    }
  }, [hasCompletedOnboarding, hasActiveSubscription, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding/welcome" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/company-info" />
      <Stack.Screen name="onboarding/connect-platforms" options={{ presentation: 'modal', title: 'Plattformen verbinden' }} />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="weekly-review" options={{ headerShown: false, presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

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

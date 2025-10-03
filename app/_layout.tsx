import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocialMediaProvider } from "@/contexts/SocialMediaContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Zurück" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="subscription" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="language-selection" options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let splashTimeoutId: NodeJS.Timeout;
    
    const prepare = async () => {
      try {
        // Minimal delay for proper hydration
        timeoutId = setTimeout(() => {
          setIsReady(true);
          
          // Hide splash screen after a short delay
          splashTimeoutId = setTimeout(() => {
            SplashScreen.hideAsync().catch(console.error);
          }, 200);
        }, 50);
      } catch (error) {
        console.error('Error during app initialization:', error);
        // Ensure we always set ready to true
        setIsReady(true);
      }
    };

    prepare();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (splashTimeoutId) clearTimeout(splashTimeoutId);
    };
  }, []);

  // Show loading only briefly to prevent hydration mismatch
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <LanguageProvider>
          <AuthProvider>
            <SocialMediaProvider>
              <RootLayoutNav />
            </SocialMediaProvider>
          </AuthProvider>
        </LanguageProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});

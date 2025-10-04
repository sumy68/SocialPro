import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocialMediaProvider } from "@/contexts/SocialMediaContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

// Verhindert, dass der Splash Screen automatisch verschwindet
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 Minuten
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
    // ✅ Typ-Safe Timer-Fix (funktioniert in React Native & Web)
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let splashTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const prepare = async () => {
      try {
        // Kurze Verzögerung für sauberes Hydrieren
        timeoutId = setTimeout(() => {
          setIsReady(true);

          // Splash Screen leicht verzögert ausblenden
          splashTimeoutId = setTimeout(() => {
            SplashScreen.hideAsync().catch(console.error);
          }, 200);
        }, 50);
      } catch (error) {
        console.error("Error during app initialization:", error);
        setIsReady(true);
      }
    };

    prepare();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (splashTimeoutId) clearTimeout(splashTimeoutId);
    };
  }, []);

  // Zeige kurz einen Loader, bis App bereit ist
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
});

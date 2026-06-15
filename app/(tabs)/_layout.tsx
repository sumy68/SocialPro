// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useApp } from "@/contexts/AppContext";
import { PlatformConnectionProvider } from "@/contexts/PlatformConnectionContext";
import { translations } from "@/constants/translations";
import type { Language } from "@/constants/translations";

export default function TabLayout() {
  const { language } = useApp();
  const { isLoaded, isSignedIn } = useAuth();
  const t = translations[language as Language] ?? translations.de;

  // Schutz: kein Zugriff auf die Tabs ohne gültige Session
  // (fängt abgelaufene Tokens und wiederhergestellte Navigation ab).
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <PlatformConnectionProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#EF4444",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#E5E7EB",
            height: 70,
            paddingBottom: 8,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="(dashboard)"
          options={{
            tabBarLabel: t.tabs.dashboard,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="(calendar)"
          options={{
            tabBarLabel: t.tabs.calendar,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="(create)"
          options={{
            tabBarLabel: t.tabs.create,
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="add-circle-outline"
                color={color}
                size={size + 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="(reports)"
          options={{
            tabBarLabel: t.tabs.reports,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="(settings)"
          options={{
            tabBarLabel: t.tabs.settings,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </PlatformConnectionProvider>
  );
}
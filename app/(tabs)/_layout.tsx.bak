import { Tabs } from "expo-router";
import { LayoutDashboard, Calendar, PlusCircle, BarChart3, Settings } from "lucide-react-native";
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";

export default function TabLayout() {
  const t = useTranslation();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0A66C2',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600' as const,
          marginBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="(dashboard)"
        options={{
          title: t.tabs.dashboard,
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(calendar)"
        options={{
          title: t.tabs.calendar,
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(create)"
        options={{
          title: t.tabs.create,
          tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(reports)"
        options={{
          title: t.tabs.reports,
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

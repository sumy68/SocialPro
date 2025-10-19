import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Einstellungen' }} />
      <Stack.Screen name="api-status" options={{ title: 'API Status' }} />
    </Stack>
  );
}

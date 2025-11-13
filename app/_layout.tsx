import { Stack } from 'expo-router';
import { AppProvider } from '@/contexts/AppContext';
import { ReactQueryProvider } from '@/lib/query';

export default function RootLayout() {
  return (
    <ReactQueryProvider>
      <AppProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AppProvider>
    </ReactQueryProvider>
  );
}

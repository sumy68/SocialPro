import { Stack } from 'expo-router';
import { AppProvider } from '@/contexts/AppContext';
import { ReactQueryProvider } from '@/lib/query';
import { useEffect } from 'react';
import { initRevenueCat } from '@/lib/purchases';

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      try {
        await initRevenueCat();
      } catch (e) {
        console.warn('[RevenueCat] init failed', e);
      }
    })();
  }, []);

  return (
    <ReactQueryProvider>
      <AppProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AppProvider>
    </ReactQueryProvider>
  );
}

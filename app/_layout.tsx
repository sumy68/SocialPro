import { Stack } from 'expo-router';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { AppProvider } from '@/contexts/AppContext';
import { ReactQueryProvider } from '@/lib/query';
import { useEffect } from 'react';
import { initRevenueCat } from '@/lib/purchases';
import * as SecureStore from 'expo-secure-store';

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      console.log('[Clerk] Get token:', key, item ? 'EXISTS' : 'MISSING');
      return item;
    } catch (error) {
      console.error('[Clerk] Error getting token:', error);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      console.log('[Clerk] Save token:', key);
      return SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('[Clerk] Error saving token:', error);
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

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
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <ReactQueryProvider>
          <AppProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </AppProvider>
        </ReactQueryProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

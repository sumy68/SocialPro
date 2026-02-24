import { Stack } from 'expo-router';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { AppProvider } from '@/contexts/AppContext';
import { ReactQueryProvider } from '@/lib/query';
import { useEffect } from 'react';
import { initRevenueCat } from '@/lib/purchases';
import { View, Text } from 'react-native';
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

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

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

  if (!publishableKey) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>App wird geladen...</Text>
      </View>
    );
  }

  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: '#EF4444',
          colorText: '#000000',
          colorTextSecondary: '#666666',
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: '#EF4444',
          },
          footerActionLink: {
            color: '#EF4444',
          },
          socialButtonsBlockButton: {
            borderColor: '#E5E7EB',
          },
        },
      }}
    >
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
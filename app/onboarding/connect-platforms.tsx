import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Linkedin, Instagram, Music2, Youtube, CheckCircle } from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { Platform } from '@/constants/types';
import { useApp } from '@/contexts/AppContext';
import { trpc, trpcVanillaClient, getBaseUrl } from '@/lib/trpc';
import * as WebBrowser from 'expo-web-browser';
import React, { useMemo, useRef, useState } from "react";
import { getRedirectUri } from '@/lib/oauth';

WebBrowser.maybeCompleteAuthSession();

export default function ConnectPlatformsScreen() {
  const router = useRouter();
  const t = useTranslation();
  const { connectedPlatforms, connectPlatform, disconnectPlatform } = useApp();
  const [connecting, setConnecting] = useState<Platform | null>(null);

  const saveTokenMutation = trpc.platforms.saveToken.useMutation();
  const disconnectMutation = trpc.platforms.disconnect.useMutation();

  const pkceRef = useRef<Record<Platform, { verifier: string; challenge: string; state: string } | null>>({
    instagram: null,
    linkedin: null,
    tiktok: null,
    youtube: null,
  });

  function randomUrlSafe(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      result += chars[idx];
    }
    return result;
  }

  async function generatePKCE(): Promise<{ verifier: string; state: string }> {
    const verifier = randomUrlSafe(64);
    const state = randomUrlSafe(32);
    return { verifier, state };
  }

  const handleConnect = async (platform: Platform) => {
    console.log('[OAuth] Starting OAuth flow for:', platform);
    setConnecting(platform);

    try {
      let authUrl = '';
      let isDemoMode = false;

      try {
        console.log('[OAuth] Base URL being used:', getBaseUrl());
        console.log('[OAuth] Full tRPC URL:', `${getBaseUrl()}/api/trpc`);

        let initResult: any;

        const pkce = await generatePKCE();
        pkceRef.current[platform] = { verifier: pkce.verifier, challenge: '', state: pkce.state };
        const initInput = { state: pkce.state, codeVerifier: pkce.verifier } as any;

        switch (platform) {
          case 'instagram':
            console.log('[OAuth] Calling Instagram init...');
            initResult = await trpcVanillaClient.platforms.oauth.instagram.init.query(initInput);
            console.log('[OAuth] Instagram init response:', initResult);
            break;
          case 'linkedin':
            console.log('[OAuth] Calling LinkedIn init...');
            initResult = await trpcVanillaClient.platforms.oauth.linkedin.init.query(initInput);
            console.log('[OAuth] LinkedIn init response:', initResult);
            break;
          case 'tiktok':
            console.log('[OAuth] Calling TikTok init...');
            initResult = await trpcVanillaClient.platforms.oauth.tiktok.init.query(initInput);
            console.log('[OAuth] TikTok init response:', initResult);
            break;
          case 'youtube':
            console.log('[OAuth] Calling YouTube init...');
            initResult = await trpcVanillaClient.platforms.oauth.youtube.init.query(initInput);
            console.log('[OAuth] YouTube init response:', initResult);
            break;
          default:
            throw new Error(`Unsupported platform: ${platform}`);
        }

        authUrl = initResult.authUrl;
        isDemoMode = initResult.isDemoMode || false;
      } catch {
        console.log('[OAuth] Backend not available, using Demo Mode automatically');

        isDemoMode = true;
        authUrl = 'demo://auth';

        await new Promise(resolve => {
          Alert.alert(
            'Demo Mode',
            `Backend server not available.\n\n✓ Simulating ${t.platforms[platform]} connection\n✓ All features work in demo mode\n✓ Data saved locally\n\nTo enable real OAuth:\n• Set EXPO_PUBLIC_APP_URL in .env\n• Restart the app`,
            [{ text: 'Continue', onPress: () => resolve(undefined) }]
          );
        });
      }

      console.log('[OAuth] Opening auth URL:', authUrl, 'Demo mode:', isDemoMode);

      let tokenData: any;

      if (isDemoMode) {
        console.log('[OAuth] Demo mode - simulating connection');
        tokenData = {
          accessToken: `demo_${platform}_access_token`,
          refreshToken: `demo_${platform}_refresh_token`,
          userId: `demo_${platform}_user_id`,
          username: `Demo ${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        };
      } else {
        const returnUrl = getRedirectUri();
        console.log('[OAuth] Redirect URI:', returnUrl);

        const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
        console.log('[OAuth] WebBrowser result:', result);

        if (result.type === 'success' && result.url) {
          let code: string | null = null;
          let state: string | null = null;
          try {
            const queryString = result.url.split('?')[1] ?? '';
            const params = new URLSearchParams(queryString);
            code = params.get('code');
            state = params.get('state');
          } catch {
            console.log('[OAuth] Fallback parsing for auth code');
            const codeMatch = result.url.match(/[?&]code=([^&]+)/);
            const stateMatch = result.url.match(/[?&]state=([^&]+)/);
            code = codeMatch?.[1] ? decodeURIComponent(codeMatch[1]) : null;
            state = stateMatch?.[1] ? decodeURIComponent(stateMatch[1]) : null;
          }

          if (!code) throw new Error('No authorization code received');

          const expected = pkceRef.current[platform];
          if (expected?.state && state && expected.state !== state) {
            throw new Error('State mismatch. Please try again.');
          }

          console.log('[OAuth] Authorization code received, exchanging for token...');

          const codeVerifier = pkceRef.current[platform]?.verifier;

          switch (platform) {
            case 'instagram':
              tokenData = await trpcVanillaClient.platforms.oauth.instagram.callback.mutate({ code, state: state ?? undefined });
              console.log('[OAuth][callback][instagram] tokenData =', tokenData);
              break;
            case 'linkedin':
              tokenData = await trpcVanillaClient.platforms.oauth.linkedin.callback.mutate({ code, codeVerifier: codeVerifier ?? undefined, state: state ?? undefined });
              console.log('[OAuth][callback][linkedin] tokenData =', tokenData);
              break;
            case 'tiktok':
              tokenData = await trpcVanillaClient.platforms.oauth.tiktok.callback.mutate({ code, state: state ?? undefined });
              console.log('[OAuth][callback][tiktok] tokenData =', tokenData);
              break;
            case 'youtube':
              tokenData = await trpcVanillaClient.platforms.oauth.youtube.callback.mutate({ code, codeVerifier: codeVerifier ?? undefined, state: state ?? undefined });
              console.log('[OAuth][callback][youtube] tokenData =', tokenData);
              break;
          }
        } else if (result.type === 'cancel') {
          console.log('[OAuth] User cancelled');
          return;
        } else {
          throw new Error('OAuth flow was not completed');
        }
      }

      if (tokenData) {
        console.log('[OAuth] Token received, saving...');

        // --- TEMP Ping: Backend erreichbar? ---
        try {
          const baseUrl = getBaseUrl();
          const pingUrl = `${baseUrl}/api/platforms/status`;
          console.log('[Ping] URL:', pingUrl);

          const res = await fetch(pingUrl, { headers: { Accept: 'application/json' } });
          const ct = res.headers.get('content-type');
          const txt = await res.text();

          console.log('[Ping] status:', res.status, 'content-type:', ct);
          console.log('[Ping] body:', txt);
        } catch (e) {
          console.log('[Ping] failed:', e);
        }
        // --- TEMP Ping Ende ---

        try {
          await saveTokenMutation.mutateAsync({
            platform,
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            userId: tokenData.userId,
            username: tokenData.username,
            expiresAt: tokenData.expiresAt,
          });
        } catch (saveError: any) {
          console.warn('[OAuth] Failed to save token to backend (expected in demo mode):', saveError?.message || saveError);
        }

        await connectPlatform(
          platform,
          tokenData.username,
          tokenData.userId,
          tokenData.accessToken,
          tokenData.refreshToken,
          tokenData.expiresAt
        );

        console.log('[OAuth] Platform connected successfully:', platform);
        Alert.alert(
          'Success',
          `${t.platforms[platform]} connected successfully!${isDemoMode ? ' (Demo Mode)' : ''}`
        );
      }
    } catch (error: any) {
      console.error('[OAuth] Error connecting platform:', error);
      Alert.alert(
        'Connection Failed',
        error?.message || 'Failed to connect platform. Please try again.'
      );
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    Alert.alert(
      'Disconnect Platform',
      `Are you sure you want to disconnect ${t.platforms[platform]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectMutation.mutateAsync({ platform });
            } catch (error: any) {
              console.warn('[OAuth] Failed to disconnect from backend (expected in demo mode):', error?.message || error);
            }
            await disconnectPlatform(platform);
            Alert.alert('Success', `${t.platforms[platform]} disconnected successfully`);
          },
        },
      ]
    );
  };

  const handleContinue = () => {
    router.push('/subscription' as any);
  };

  const getPlatformStatus = (platform: Platform) => {
    return connectedPlatforms.find(p => p.platform === platform);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t.onboarding.platforms.title,
          headerBackTitle: t.back,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.onboarding.platforms.title}</Text>
          <Text style={styles.subtitle}>{t.onboarding.platforms.subtitle}</Text>
        </View>

        <View style={styles.platforms}>
          <PlatformCard
            icon={<Linkedin size={32} color="#0A66C2" />}
            name={t.platforms.linkedin}
            color="#0A66C2"
            status={getPlatformStatus('linkedin')}
            onConnect={() => handleConnect('linkedin')}
            onDisconnect={() => handleDisconnect('linkedin')}
            isConnecting={connecting === 'linkedin'}
          />
          <PlatformCard
            icon={<Instagram size={32} color="#E1306C" />}
            name={t.platforms.instagram}
            color="#E1306C"
            status={getPlatformStatus('instagram')}
            onConnect={() => handleConnect('instagram')}
            onDisconnect={() => handleDisconnect('instagram')}
            isConnecting={connecting === 'instagram'}
          />
          <PlatformCard
            icon={<Music2 size={32} color="#000000" />}
            name={t.platforms.tiktok}
            color="#000000"
            status={getPlatformStatus('tiktok')}
            onConnect={() => handleConnect('tiktok')}
            onDisconnect={() => handleDisconnect('tiktok')}
            isConnecting={connecting === 'tiktok'}
          />
          <PlatformCard
            icon={<Youtube size={32} color="#FF0000" />}
            name={t.platforms.youtube}
            color="#FF0000"
            status={getPlatformStatus('youtube')}
            onConnect={() => handleConnect('youtube')}
            onDisconnect={() => handleDisconnect('youtube')}
            isConnecting={connecting === 'youtube'}
          />
        </View>

        <TouchableOpacity style={styles.skipButton} onPress={handleContinue} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>{t.onboarding.platforms.connectLater}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function PlatformCard({
  icon,
  name,
  color,
  status,
  onConnect,
  onDisconnect,
  isConnecting,
}: {
  icon: React.ReactNode;
  name: string;
  color: string;
  status?: { platform: Platform; connected: boolean; accountName?: string };
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}) {
  const isConnected = status?.connected || false;

  return (
    <View style={[styles.platformCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.platformInfo}>
        {icon}
        <View style={styles.platformTextContainer}>
          <Text style={styles.platformName}>{name}</Text>
          {isConnected && status?.accountName && <Text style={styles.accountName}>{status.accountName}</Text>}
        </View>
        {isConnected && <CheckCircle size={20} color="#10B981" />}
      </View>
      {isConnecting ? (
        <ActivityIndicator color={color} />
      ) : (
        <TouchableOpacity
          style={[styles.connectButton, { backgroundColor: isConnected ? '#F3F4F6' : color }]}
          onPress={isConnected ? onDisconnect : onConnect}
          activeOpacity={0.8}
        >
          <Text style={[styles.connectButtonText, { color: isConnected ? '#6B7280' : '#FFFFFF' }]}>
            {isConnected ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  contentContainer: { padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700' as const, color: '#0F1419', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', paddingHorizontal: 20 },
  platforms: { gap: 16, marginBottom: 32 },
  platformCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  platformTextContainer: { flex: 1 },
  platformName: { fontSize: 18, fontWeight: '600' as const, color: '#0F1419' },
  accountName: { fontSize: 12, color: '#666', marginTop: 2 },
  connectButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  connectButtonText: { fontSize: 14, fontWeight: '600' as const, color: '#FFFFFF' },
  skipButton: { paddingVertical: 16, alignItems: 'center' },
  skipButtonText: { fontSize: 16, fontWeight: '600' as const, color: '#0A66C2' },
});

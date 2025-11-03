import startInstagramOAuth from '../../src/utils/instagramOAuth';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Linkedin, Instagram, Music2, Youtube, CheckCircle } from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { Platform } from '@/constants/types';
import { useApp } from '@/contexts/AppContext';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';


// Expo: evtl. Browser schließen nach OAuth
WebBrowser.maybeCompleteAuthSession();

// ✅ ENV aus app.config.js
const { EXPO_PUBLIC_APP_URL, EXPO_PUBLIC_SCHEME } = Constants.expoConfig?.extra ?? {};
const APP_URL = (EXPO_PUBLIC_APP_URL as string) || '';
const API_BASE = `${APP_URL}/api`;
const DEEP_LINK_SCHEME = (EXPO_PUBLIC_SCHEME as string) || 'socialpro';

const OAUTH_STATE = 'test-user-123';

// ✅ Plattform spezifische OAuth URLs (außer IG = Backend)
function buildLinkedInAuthUrl() {
  const redirectUri = encodeURIComponent(`${API_BASE}/oauth/linkedin/callback`);
  const scope = encodeURIComponent('w_member_social r_liteprofile');
  const state = encodeURIComponent(OAUTH_STATE);
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=DEIN_LINKEDIN_CLIENT_ID&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
}
function buildTikTokAuthUrl() {
  const redirectUri = encodeURIComponent(`${API_BASE}/oauth/tiktok/callback`);
  const scope = encodeURIComponent('user.info.basic video.list video.upload');
  const state = encodeURIComponent(OAUTH_STATE);
  return `https://www.tiktok.com/v2/auth/authorize/?client_key=DEIN_TIKTOK_CLIENT_KEY&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
}
function buildYouTubeAuthUrl() {
  const redirectUri = encodeURIComponent(`${API_BASE}/oauth/youtube/callback`);
  const scope = encodeURIComponent(
    'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly'
  );
  const state = encodeURIComponent(OAUTH_STATE);
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=DEIN_YT_CLIENT_ID&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&include_granted_scopes=true&state=${state}`;
}

export default function ConnectPlatformsScreen() {
  const router = useRouter();
  const t = useTranslation();
  const { connectedPlatforms, disconnectPlatform } = useApp();
  const [connecting, setConnecting] = useState<Platform | null>(null);

  const startConnect = async (platform: Platform) => {
    try {
      setConnecting(platform);

      if (platform === 'linkedin') {
        return await WebBrowser.openBrowserAsync(buildLinkedInAuthUrl());
      }
      if (platform === 'tiktok') {
        return await WebBrowser.openBrowserAsync(buildTikTokAuthUrl());
      }
      if (platform === 'youtube') {
        return await WebBrowser.openBrowserAsync(buildYouTubeAuthUrl());
      }
      if (platform === 'instagram') {
        return await startInstagramOAuth(OAUTH_STATE);
      }

      throw new Error('Unsupported platform: ' + platform);
    } catch (err: any) {
      console.error('[OAuth] Error:', err);
      Alert.alert('Error', err?.message ?? 'OAuth failed');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    Alert.alert(
      'Disconnect Platform',
      `Disconnect ${t.platforms[platform]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectPlatform(platform);
            Alert.alert('Done', `${t.platforms[platform]} disconnected`);
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: t.onboarding.platforms.title, headerBackTitle: t.back }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.onboarding.platforms.title}</Text>
          <Text style={styles.subtitle}>{t.onboarding.platforms.subtitle}</Text>
        </View>

        <View style={styles.platforms}>
          {/* ✅ LinkedIn */}
          <PlatformCard
            icon={<Linkedin size={32} color="#0A66C2" />}
            name={t.platforms.linkedin}
            color="#0A66C2"
            status={connectedPlatforms.find(p => p.platform === 'linkedin')}
            onConnect={() => startConnect('linkedin')}
            onDisconnect={() => handleDisconnect('linkedin')}
            isConnecting={connecting === 'linkedin'}
          />

          {/* ✅ Instagram */}
          <PlatformCard
            icon={<Instagram size={32} color="#E1306C" />}
            name={t.platforms.instagram}
            color="#E1306C"
            status={connectedPlatforms.find(p => p.platform === 'instagram')}
            onConnect={() => startConnect('instagram')}
            onDisconnect={() => handleDisconnect('instagram')}
            isConnecting={connecting === 'instagram'}
          />

          {/* ✅ TikTok */}
          <PlatformCard
            icon={<Music2 size={32} color="#000000" />}
            name={t.platforms.tiktok}
            color="#000000"
            status={connectedPlatforms.find(p => p.platform === 'tiktok')}
            onConnect={() => startConnect('tiktok')}
            onDisconnect={() => handleDisconnect('tiktok')}
            isConnecting={connecting === 'tiktok'}
          />

          {/* ✅ YouTube */}
          <PlatformCard
            icon={<Youtube size={32} color="#FF0000" />}
            name={t.platforms.youtube}
            color="#FF0000"
            status={connectedPlatforms.find(p => p.platform === 'youtube')}
            onConnect={() => startConnect('youtube')}
            onDisconnect={() => handleDisconnect('youtube')}
            isConnecting={connecting === 'youtube'}
          />
        </View>

        <TouchableOpacity onPress={() => router.push('/subscription' as any)} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>
            {t.onboarding.platforms.connectLater}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

// ✅ ROBUSTE VERSION — crashes verhindern
function PlatformCard({
  icon,
  name,
  color,
  status,
  onConnect = () => {},
  onDisconnect = () => {},
  isConnecting = false,
}) {
  const isConnected = !!status?.connected;
  const bg = color || '#888';

  const handlePress = () => {
    try {
      if (isConnected) onDisconnect();
      else onConnect();
    } catch (e) {
      console.error('[PlatformCard] onPress error:', e);
    }
  };

  return (
    <View style={[styles.platformCard, { borderLeftColor: bg, borderLeftWidth: 4 }]}>
      <View style={styles.platformInfo}>
        {icon}
        <View style={styles.platformTextContainer}>
          <Text style={styles.platformName}>{name}</Text>
          {isConnected && status?.accountName && (
            <Text style={styles.accountName}>{status.accountName}</Text>
          )}
        </View>
        {isConnected && <CheckCircle size={20} color="#10B981" />}
      </View>

      {isConnecting ? (
        <ActivityIndicator color={bg} />
      ) : (
        <TouchableOpacity
          style={[styles.connectButton, { backgroundColor: isConnected ? '#F3F4F6' : bg }]}
          onPress={handlePress}
        >
          <Text style={[styles.connectButtonText, { color: isConnected ? '#6B7280' : '#FFF' }]}>
            {isConnected ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  contentContainer: { padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F1419', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', paddingHorizontal: 20 },
  platforms: { gap: 16, marginBottom: 32 },
  platformCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  platformTextContainer: { flex: 1 },
  platformName: { fontSize: 18, fontWeight: '600', color: '#0F1419' },
  accountName: { fontSize: 12, color: '#666', marginTop: 2 },
  connectButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  connectButtonText: { fontSize: 14, fontWeight: '600' },
  skipButton: { paddingVertical: 16, alignItems: 'center' },
  skipButtonText: { fontSize: 16, fontWeight: '600', color: '#0A66C2' },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Linkedin, Instagram, Music2, Youtube, CheckCircle } from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { Platform } from '@/constants/types';
import { useApp } from '@/contexts/AppContext';
import * as Linking from 'expo-linking';

// ---------------------------------------------
// KONFIG
// ---------------------------------------------

// Das ist dein öffentliches Backend bei Render
const RENDER_BASE = 'https://socialpro-fnvo.onrender.com';

// Diese IDs kommen aus den Developer-Konsolen der Plattformen
// (später aus .env reinziehen)
const LINKEDIN_CLIENT_ID = 'DEIN_LINKEDIN_CLIENT_ID';
const IG_CLIENT_ID = 'DEIN_IG_CLIENT_ID';
const TIKTOK_CLIENT_KEY = 'DEIN_TIKTOK_CLIENT_KEY'; // TikTok nennt das client_key
const YT_CLIENT_ID = 'DEIN_YT_CLIENT_ID';

// Das packen wir als state rein, damit Backend weiß, welcher User das war
// später ersetzen durch echte userId aus deinem Login/Session
const OAUTH_STATE = 'test-user-123';

// ---------------------------------------------
// OAUTH URL BUILDER pro Plattform
// ---------------------------------------------

function buildLinkedInAuthUrl() {
  const redirectUri = encodeURIComponent(`${RENDER_BASE}/oauth/linkedin/callback`);
  const scope = encodeURIComponent('w_member_social r_liteprofile');
  const state = encodeURIComponent(OAUTH_STATE);

  return (
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scope}` +
    `&state=${state}`
  );
}

function buildInstagramAuthUrl() {
  const redirectUri = encodeURIComponent(`${RENDER_BASE}/oauth/instagram/callback`);
  const scope = encodeURIComponent('user_profile,user_media'); // anpassen je nach App Setup
  const state = encodeURIComponent(OAUTH_STATE);

  return (
    `https://api.instagram.com/oauth/authorize` +
    `?client_id=${IG_CLIENT_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scope}` +
    `&response_type=code` +
    `&state=${state}`
  );
}

function buildTikTokAuthUrl() {
  const redirectUri = encodeURIComponent(`${RENDER_BASE}/oauth/tiktok/callback`);
  const scope = encodeURIComponent('user.info.basic video.list video.upload'); // anpassen bei TikTok
  const state = encodeURIComponent(OAUTH_STATE);

  return (
    `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${TIKTOK_CLIENT_KEY}` +
    `&response_type=code` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scope}` +
    `&state=${state}`
  );
}

function buildYouTubeAuthUrl() {
  const redirectUri = encodeURIComponent(`${RENDER_BASE}/oauth/youtube/callback`);
  const scope = encodeURIComponent([
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
  ].join(' '));

  const state = encodeURIComponent(OAUTH_STATE);
  const accessType = 'offline'; // wichtig: damit Google auch refresh_token gibt
  const includeGrantedScopes = 'true';
  const responseType = 'code';

  return (
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${YT_CLIENT_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=${responseType}` +
    `&scope=${scope}` +
    `&access_type=${accessType}` +
    `&include_granted_scopes=${includeGrantedScopes}` +
    `&state=${state}`
  );
}

// ---------------------------------------------
// SCREEN
// ---------------------------------------------

export default function ConnectPlatformsScreen() {
  const router = useRouter();
  const t = useTranslation();
  const { connectedPlatforms, connectPlatform, disconnectPlatform } = useApp();
  const [connecting, setConnecting] = useState<Platform | null>(null);

  // Verbinden-Handler: öffnet NUR den Browser zur Plattform.
  // Danach übernimmt dein Backend (`hono.ts`) den Callback
  // und macht redirect zurück zu socialpro://connected/success?...,
  // was bei dir den success-screen öffnet und im success-screen
  // rufen wir connectPlatform(...) auf.
  const startConnect = async (platform: Platform) => {
    try {
      setConnecting(platform);

      let url = '';
      if (platform === 'linkedin') {
        url = buildLinkedInAuthUrl();
      } else if (platform === 'instagram') {
        url = buildInstagramAuthUrl();
      } else if (platform === 'tiktok') {
        url = buildTikTokAuthUrl();
      } else if (platform === 'youtube') {
        url = buildYouTubeAuthUrl();
      } else {
        throw new Error('Unsupported platform: ' + platform);
      }

      console.log('[OAuth] opening external auth url:', url);
      // Wichtig: wir öffnen jetzt SYSTEM-BROWSER (nicht WebBrowser AuthSession)
      // Die Plattform leitet dann zu deinem Backend weiter
      // Dein Backend leitet dann zurück in die App mit socialpro://...
      Linking.openURL(url);
    } catch (err: any) {
      console.error('[OAuth] Error starting connect:', err);
      Alert.alert(
        'Connection Failed',
        err?.message || 'Failed to start connection. Please try again.'
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
              // wir callen hier aktuell noch dein altes disconnect
              // das kann so bleiben falls dein Backend das schon kennt
              await disconnectPlatform(platform);
              Alert.alert('Success', `${t.platforms[platform]} disconnected successfully`);
            } catch (error: any) {
              console.warn('[OAuth] Failed to disconnect:', error?.message || error);
              Alert.alert('Error', 'Could not disconnect. Please try again.');
            }
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
            onConnect={() => startConnect('linkedin')}
            onDisconnect={() => handleDisconnect('linkedin')}
            isConnecting={connecting === 'linkedin'}
          />
          <PlatformCard
            icon={<Instagram size={32} color="#E1306C" />}
            name={t.platforms.instagram}
            color="#E1306C"
            status={getPlatformStatus('instagram')}
            onConnect={() => startConnect('instagram')}
            onDisconnect={() => handleDisconnect('instagram')}
            isConnecting={connecting === 'instagram'}
          />
          <PlatformCard
            icon={<Music2 size={32} color="#000000" />}
            name={t.platforms.tiktok}
            color="#000000"
            status={getPlatformStatus('tiktok')}
            onConnect={() => startConnect('tiktok')}
            onDisconnect={() => handleDisconnect('tiktok')}
            isConnecting={connecting === 'tiktok'}
          />
          <PlatformCard
            icon={<Youtube size={32} color="#FF0000" />}
            name={t.platforms.youtube}
            color="#FF0000"
            status={getPlatformStatus('youtube')}
            onConnect={() => startConnect('youtube')}
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


// Karte für jede Plattform (UI Komponente)
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
          {isConnected && status?.accountName && (
            <Text style={styles.accountName}>{status.accountName}</Text>
          )}
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


// Styles
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

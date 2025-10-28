import { useEffect, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '@/contexts/AppContext';

export default function OAuthResultScreen() {
  // Params aus Deep Link: socialpro://connected/success?platform=linkedin&ok=1&state=user123
  const { platform, ok, message, state } = useLocalSearchParams<{
    platform?: string;
    ok?: string;
    message?: string;
    state?: string;
  }>();

  const router = useRouter();
  const { connectPlatform } = useApp();

  const success = useMemo(() => ok === '1', [ok]);
  const platformName = Array.isArray(platform) ? platform[0] : platform;

  // Nach erfolgreichem OAuth direkt im Context markieren -> connected = true
  useEffect(() => {
    if (success && platformName) {
      // Dummy werte für jetzt. Später ersetzen wir das mit echten Daten aus dem Backend.
      connectPlatform(
        platformName as any,        // Platform type ('linkedin' | 'instagram' | ...)
        platformName + ' Account',  // accountName placeholder
        'pending-account-id',       // accountId placeholder
        undefined,                  // accessToken (kommt später vom Backend)
        undefined,                  // refreshToken
        undefined,                  // expiresAt
      );
    }
  }, [success, platformName, connectPlatform]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {success ? 'Verbunden ✅' : 'Fehler ❌'}
      </Text>

      <Text style={styles.platformText}>
        {platformName
          ? `Plattform: ${platformName}`
          : 'Plattform unbekannt'}
      </Text>

      {!success && message ? (
        <Text style={styles.errorText}>
          Hinweis: {decodeURIComponent(String(message))}
        </Text>
      ) : null}

      {success ? (
        <Text style={styles.desc}>
          Die Plattform ist jetzt verknüpft. Geplante Posts können automatisch rausgehen.
        </Text>
      ) : (
        <Text style={styles.desc}>
          Verbindung fehlgeschlagen. Bitte nochmal versuchen.
        </Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          router.push('/connect');
        }}
      >
        <Text style={styles.buttonText}>Zurück</Text>
      </TouchableOpacity>

      {/* Debug Info, optional */}
      {state ? (
        <Text style={styles.debugText}>User-ID (state): {state}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0B', padding: 24, gap: 16, justifyContent: 'center' },
  title: { color: 'white', fontSize: 24, fontWeight: '700' },
  platformText: { color: '#9E9E9E', fontSize: 16 },
  errorText: { color: '#ff5b5b', fontSize: 14, fontWeight: '500' },
  desc: { color: 'white', fontSize: 15, lineHeight: 20 },
  button: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    marginTop: 12,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  debugText: { color: '#3d3d3d', fontSize: 12, marginTop: 24 },
});

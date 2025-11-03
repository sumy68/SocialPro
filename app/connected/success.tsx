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

  // Nach erfolgreichem OAuth direkt im Context markieren
  useEffect(() => {
    if (success && platformName) {
      // Platzhalter bis echtes Token aus Backend kommt
      connectPlatform(
        platformName as any,
        platformName + ' Account',
        'pending-account-id',
        undefined,
        undefined,
        undefined,
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
          // ✅ Fix: existierende Route verwenden
          router.push('/onboarding/connect-platforms');
        }}
      >
        <Text style={styles.buttonText}>Weiter</Text>
      </TouchableOpacity>

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

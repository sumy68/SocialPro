import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform as RNPlatform } from 'react-native';
import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { getBaseUrl } from '@/lib/trpc';
import { AlertCircle, CheckCircle2, Server, Wifi } from 'lucide-react-native';

export default function APIStatusScreen() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [responseTime, setResponseTime] = useState<number | null>(null);

  useEffect(() => {
    checkAPIStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAPIStatus = async () => {
    setStatus('checking');
    setErrorMessage('');

    const url = getBaseUrl();
    setBaseUrl(url);

    const startTime = Date.now();
    try {
      // 👉 ping deinen echten Health-Endpoint
      const res = await fetch(`${url}/health`, { method: 'GET' });
      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      if (res.ok) {
        // 2xx = ok
        setStatus('connected');
        return;
      }

      // Nicht-OK: Text lesen, sinnvolle Fehlermeldung bauen
      const text = await res.text();
      setStatus('disconnected');

      if (text?.includes('<!DOCTYPE html>') || text?.includes('<html')) {
        setErrorMessage('Health-URL liefert HTML statt JSON. Prüfe Server-Routing oder Render-Konfiguration.');
      } else {
        setErrorMessage(`Unerwartete Antwort: ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      setStatus('disconnected');
      setResponseTime(null);
      const msg = String(err?.message ?? 'Network request failed');
      setErrorMessage(msg);
    }
  };

  const envVars = {
    'EXPO_PUBLIC_APP_URL': process.env.EXPO_PUBLIC_APP_URL || 'Not set',
    'EXPO_PUBLIC_RORK_API_BASE_URL': process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'Not set',
    'EXPO_PUBLIC_DEMO_MODE': process.env.EXPO_PUBLIC_DEMO_MODE ?? 'Not set',
    'Platform': RNPlatform.OS,
    'Current Base URL': baseUrl,
    'Health URL': baseUrl ? `${baseUrl}/health` : '…',
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'API Status',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Backend Connection Status</Text>
          <Text style={styles.subtitle}>Checks connectivity to your production backend</Text>
        </View>

        <View style={[styles.statusCard, status === 'connected' ? styles.statusConnected : styles.statusDisconnected]}>
          {status === 'checking' ? (
            <Server size={48} color="#6B7280" />
          ) : status === 'connected' ? (
            <CheckCircle2 size={48} color="#10B981" />
          ) : (
            <AlertCircle size={48} color="#EF4444" />
          )}

          <Text style={[styles.statusText, status === 'connected' ? styles.statusTextConnected : styles.statusTextDisconnected]}>
            {status === 'checking' ? 'Checking…' : status === 'connected' ? 'Connected' : 'Disconnected'}
          </Text>

          {responseTime !== null && (
            <Text style={styles.responseTime}>Response time: {responseTime}ms</Text>
          )}

          {errorMessage ? (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={checkAPIStatus}
          activeOpacity={0.7}
        >
          <Wifi size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment Configuration</Text>
          {Object.entries(envVars).map(([key, value]) => (
            <View key={key} style={styles.envRow}>
              <Text style={styles.envKey}>{key}:</Text>
              <Text style={styles.envValue}>{String(value)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Troubleshooting</Text>
          {status === 'connected' ? (
            <Text style={styles.helpText}>
              <Text style={styles.bold}>Backend is connected.</Text>{'\n'}
              All API features (OAuth, publishing, data) should work with your production server.
            </Text>
          ) : (
            <Text style={styles.helpText}>
              <Text style={styles.bold}>No connection to backend.</Text>{'\n\n'}
              1) Öffne im Browser: {baseUrl || '<BASE_URL>'}/health {'\n'}
              2) Falls 404: Ist <Text style={styles.bold}>/health</Text> im Server implementiert? (bei dir: ja){'\n'}
              3) Render-Dashboard: letzte Deploy-Logs checken{'\n'}
              4) In <Text style={styles.bold}>.env.development / .env.production</Text> sicherstellen:{'\n'}
              {'   '}EXPO_PUBLIC_APP_URL = https://socialpro-fnvo.onrender.com{'\n'}
              5) App neu starten: <Text style={styles.bold}>npx expo start --tunnel -c</Text> oder interner EAS-Build
            </Text>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0F1419',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusConnected: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  statusDisconnected: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 16,
  },
  statusTextConnected: {
    color: '#10B981',
  },
  statusTextDisconnected: {
    color: '#EF4444',
  },
  responseTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorMessage: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0F1419',
    marginBottom: 12,
  },
  envRow: {
    marginBottom: 8,
  },
  envKey: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 2,
  },
  envValue: {
    fontSize: 14,
    color: '#0F1419',
    fontFamily: 'monospace' as const,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700' as const,
    color: '#0F1419',
  },
});

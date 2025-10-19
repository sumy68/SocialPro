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
  }, []);

  const checkAPIStatus = async () => {
    setStatus('checking');
    setErrorMessage('');
    
    const url = getBaseUrl();
    setBaseUrl(url);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${url}/api/trpc/example.hi`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      
      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType?.includes('application/json')) {
        setStatus('connected');
      } else {
        const text = await response.text();
        setStatus('disconnected');
        
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          setErrorMessage('API endpoint returns HTML instead of JSON. API routes may not be properly configured.');
        } else {
          setErrorMessage(`Unexpected response: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error: any) {
      setStatus('disconnected');
      setErrorMessage(error.message || 'Network request failed');
    }
  };

  const envVars = {
    'EXPO_PUBLIC_APP_URL': process.env.EXPO_PUBLIC_APP_URL || 'Not set',
    'EXPO_PUBLIC_RORK_API_BASE_URL': process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'Not set',
    'Platform': RNPlatform.OS,
    'Current Base URL': baseUrl,
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
          <Text style={styles.subtitle}>Check if the tRPC backend is accessible</Text>
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
            {status === 'checking' ? 'Checking...' : status === 'connected' ? 'Connected' : 'Disconnected'}
          </Text>
          
          {responseTime !== null && (
            <Text style={styles.responseTime}>Response time: {responseTime}ms</Text>
          )}
          
          {errorMessage && (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          )}
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
              <Text style={styles.envValue}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Fix</Text>
          <Text style={styles.helpText}>
            {status === 'disconnected' ? (
              <>
                <Text style={styles.bold}>Backend not available.{'\n\n'}</Text>
                <Text>The app is running in Demo Mode, which means:{'\n\n'}</Text>
                <Text>\u2022 Platform connections are simulated{'\n'}</Text>
                <Text>\u2022 All data is stored locally{'\n'}</Text>
                <Text>\u2022 Publishing features work with demo data{'\n\n'}</Text>
                <Text style={styles.bold}>To enable real OAuth:{'\n\n'}</Text>
                <Text>1. Ensure your backend server is running{'\n'}</Text>
                <Text>2. Set EXPO_PUBLIC_APP_URL in your .env file{'\n'}</Text>
                <Text>3. Restart the app with: bun run start{'\n\n'}</Text>
                <Text>For development, the API URL should match your tunnel URL provided by Rork.</Text>
              </>
            ) : (
              <>
                <Text style={styles.bold}>Backend is connected!{'\n\n'}</Text>
                <Text>Your app can use real OAuth connections and publish to social media platforms.</Text>
              </>
            )}
          </Text>
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
    backgroundColor: '#0A66C2',
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

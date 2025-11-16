import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { translations } from '@/constants/translations';

export default function WelcomeScreen() {
  const router = useRouter();
  const { language } = useApp();
  const t = translations[language] ?? translations.de;
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View
          style={{
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 40,
            flex: 1,
            paddingHorizontal: 32,
          }}
        >
          <View style={styles.content}>
            <Text style={styles.emoji}>🚀</Text>

            <Text style={styles.title}>SocialPro</Text>

            <Text style={styles.subtitle}>
              Automatisieren Sie Ihre Social Media Posts auf LinkedIn,
              Instagram, TikTok & YouTube
            </Text>

            <View style={styles.features}>
              <FeatureItem text="LinkedIn • Instagram • TikTok • YouTube" />
              <FeatureItem text="Post-Planung & Automatisierung" />
              <FeatureItem text="KI-generierte Captions & Hashtags" />
              <FeatureItem text="Analytics & Auswertungen" />
              <FeatureItem text="Wöchentliche Insights & Empfehlungen" />
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/onboarding/company-info' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Jetzt starten</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureDot} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 40,
  },
  title: {
    fontSize: 54,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  features: {
    width: '100%',
    gap: 18,
    paddingHorizontal: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  featureText: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.background,
  },
});

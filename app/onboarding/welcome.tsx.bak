import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';

import { useTranslation } from '@/hooks/useTranslation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40, flex: 1, paddingHorizontal: 32 }}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.emoji}>🚀</Text>
            </View>
            
            <Text style={styles.title}>SocialPro</Text>
            <Text style={styles.subtitle}>{t.onboarding.welcome.subtitle}</Text>

            <View style={styles.features}>
              <FeatureItem text="LinkedIn • Instagram • TikTok • YouTube" />
              <FeatureItem text={t.subscription.features.scheduling} />
              <FeatureItem text={t.subscription.features.aiCaptions} />
              <FeatureItem text={t.subscription.features.analytics} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/onboarding/company-info' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{t.onboarding.welcome.cta}</Text>
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
  iconContainer: {
    marginBottom: 48,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    fontSize: 56,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 64,
    lineHeight: 24,
    maxWidth: 320,
  },
  features: {
    width: '100%',
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.background,
    letterSpacing: -0.3,
  },
});

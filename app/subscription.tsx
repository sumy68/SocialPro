import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { useApp } from '@/contexts/AppContext';
import { translations } from '@/constants/translations';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { language } = useApp();
  const t = translations[language] ?? translations.de;
  const s = t.subscription ?? ({} as any);

  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const handleStartTrial = () => {
    // hier später IAP-Logik, aktuell nur Flow weiter
    router.replace('/(tabs)/(dashboard)' as any);
  };

  const handleRestore = () => {
    // stub – später echte Restore-Logik
    // z.B. Alert oder native API
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: s.title ?? 'Wählen Sie Ihren Plan',
          headerBackTitle: t.back ?? 'Zurück',
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>{s.title ?? 'Wählen Sie Ihren Plan'}</Text>
        <Text style={styles.subtitle}>
          {s.subtitle ?? '3 Tage kostenlos testen, jederzeit kündbar'}
        </Text>

        <View style={styles.trialBadge}>
          <Text style={styles.trialBadgeText}>
            {s.trialBadge ?? '3 Tage Gratis'}
          </Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billing === 'monthly' && styles.toggleButtonActive,
            ]}
            onPress={() => setBilling('monthly')}
          >
            <Text
              style={[
                styles.toggleText,
                billing === 'monthly' && styles.toggleTextActive,
              ]}
            >
              {s.monthly ?? 'Monatlich'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billing === 'yearly' && styles.toggleButtonActive,
            ]}
            onPress={() => setBilling('yearly')}
          >
            <Text
              style={[
                styles.toggleText,
                billing === 'yearly' && styles.toggleTextActive,
              ]}
            >
              {s.yearly ?? 'Jährlich'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceMain}>
            {billing === 'monthly'
              ? s.monthlyPrice ?? '29,99€'
              : s.yearlyPrice ?? '300€'}
          </Text>
          <Text style={styles.priceSecondary}>
            {billing === 'monthly'
              ? s.perMonth ?? '/Monat'
              : s.perYear ?? '/Jahr'}
          </Text>
          {billing === 'yearly' && (
            <Text style={styles.saveText}>
              {s.saveYearly ?? '40€ sparen'}
            </Text>
          )}
        </View>

        <View style={styles.features}>
          <FeatureItem
            text={s.features?.unlimited ?? 'Unbegrenzte Posts'}
          />
          <FeatureItem
            text={
              s.features?.scheduling ?? 'Post-Planung & Automatisierung'
            }
          />
          <FeatureItem
            text={
              s.features?.aiCaptions ??
              'KI-generierte Captions & Hashtags'
            }
          />
          <FeatureItem
            text={s.features?.analytics ?? 'Detaillierte Analytics'}
          />
          <FeatureItem
            text={
              s.features?.contentSuggestions ?? 'KI-Content-Vorschläge'
            }
          />
          <FeatureItem
            text={
              s.features?.weeklyReports ??
              'Wöchentliche Performance-Reports'
            }
          />
          <FeatureItem
            text={s.features?.support ?? 'Premium Support'}
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleStartTrial}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            {s.startTrial ?? '3-Tage-Testversion starten'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleRestore}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>
            {s.restore ?? 'Käufe wiederherstellen'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          {s.terms ??
            'Nach der Testphase wird Ihr Abonnement automatisch verlängert. Jederzeit kündbar in den iPhone-Einstellungen.'}
        </Text>
      </ScrollView>
    </>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.dot} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  trialBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 20,
  },
  trialBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  priceCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceMain: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceSecondary: {
    fontSize: 16,
    color: '#D1D5DB',
    marginLeft: 4,
  },
  saveText: {
    fontSize: 13,
    color: '#FACC15',
    fontWeight: '600',
  },
  features: {
    marginBottom: 24,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#111827',
    textDecorationLine: 'underline',
  },
  terms: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
  },
});

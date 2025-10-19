import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { Check, Rocket } from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { useApp } from '@/contexts/AppContext';
import { Colors } from '@/constants/colors';

export default function SubscriptionScreen() {
  const router = useRouter();
  const t = useTranslation();
  const { startTrial } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleStartTrial = async () => {
    console.log('[Subscription] Starting trial with plan:', selectedPlan);
    
    try {
      await startTrial(selectedPlan);
      console.log('[Subscription] Trial started, navigating to tabs...');
      router.replace('/(tabs)' as any);
    } catch (error) {
      console.error('[Subscription] Error starting trial:', error);
      Alert.alert('Error', 'Failed to start trial. Please try again.');
    }
  };

  const handleRestore = () => {
    Alert.alert('Restore Purchases', 'In production, this would restore previous purchases from App Store.');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t.subscription.title,
          headerBackTitle: t.back,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Rocket size={64} color={Colors.accent} strokeWidth={1.5} />
          <Text style={styles.headerTitle}>{t.subscription.title}</Text>
          <Text style={styles.headerSubtitle}>{t.subscription.subtitle}</Text>
          
          <View style={styles.trialBadge}>
            <Text style={styles.trialBadgeText}>{t.subscription.trialBadge}</Text>
          </View>
        </View>

        <View style={styles.plansContainer}>
          <PlanCard
            title={t.subscription.monthly}
            price={t.subscription.monthlyPrice}
            period={t.subscription.perMonth}
            selected={selectedPlan === 'monthly'}
            onSelect={() => setSelectedPlan('monthly')}
          />
          <PlanCard
            title={t.subscription.yearly}
            price={t.subscription.yearlyPrice}
            period={t.subscription.perYear}
            badge={t.subscription.saveYearly}
            selected={selectedPlan === 'yearly'}
            onSelect={() => setSelectedPlan('yearly')}
            highlighted
          />
        </View>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>All Plans Include:</Text>
          <FeatureItem text={t.subscription.features.unlimited} />
          <FeatureItem text={t.subscription.features.scheduling} />
          <FeatureItem text={t.subscription.features.aiCaptions} />
          <FeatureItem text={t.subscription.features.analytics} />
          <FeatureItem text={t.subscription.features.contentSuggestions} />
          <FeatureItem text={t.subscription.features.weeklyReports} />
          <FeatureItem text={t.subscription.features.support} />
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartTrial}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>{t.subscription.startTrial}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreButtonText}>{t.subscription.restore}</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>{t.subscription.terms}</Text>
      </ScrollView>
    </>
  );
}

function PlanCard({
  title,
  price,
  period,
  badge,
  selected,
  onSelect,
  highlighted,
}: {
  title: string;
  price: string;
  period: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
  highlighted?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        selected && styles.planCardSelected,
        highlighted && styles.planCardHighlighted,
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {badge && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <View style={styles.planHeader}>
        <View style={styles.planTitleContainer}>
          <Text style={[styles.planTitle, selected && styles.planTitleSelected]}>{title}</Text>
          <View style={styles.priceContainer}>
            <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>{price}</Text>
            <Text style={[styles.planPeriod, selected && styles.planPeriodSelected]}>{period}</Text>
          </View>
        </View>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Check size={20} color={Colors.accent} strokeWidth={3} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  trialBadge: {
    backgroundColor: Colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  trialBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  plansContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  planCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.backgroundSecondary,
  },
  planCardHighlighted: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeContainer: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: Colors.accent,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitleContainer: {
    flex: 1,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  planTitleSelected: {
    color: Colors.accent,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  planPriceSelected: {
    color: Colors.accent,
  },
  planPeriod: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  planPeriodSelected: {
    color: Colors.accent,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },
  features: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  startButton: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.background,
    letterSpacing: -0.3,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  terms: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});

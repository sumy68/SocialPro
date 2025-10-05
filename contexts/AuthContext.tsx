// app/(premium)/SubscriptionScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Check, Crown, X, Zap } from 'lucide-react-native';

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, products, subscribe, restorePurchases } = useAuth();

  // Preise dynamisch vom Store (über react-native-iap)
  const monthly = products.find(p => p.productId === 'com.deinpaket.socialpro.premium.monthly');
  const yearly  = products.find(p => p.productId === 'com.deinpaket.socialpro.premium.yearly');

  const monthlyPrice = monthly?.localizedPrice ?? '…';
  const yearlyPrice  = yearly?.localizedPrice ?? '…';

  // Zusatzinfos berechnen (Monatsäquivalent & Ersparnis)
  const m = monthly?.price ?? 0;
  const y = yearly?.price ?? 0;
  const perMonthYearly = y ? y / 12 : null;
  const savings = m && y ? m * 12 - y : null;

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      await subscribe(selectedPlan);
      Alert.alert(
        'Abonnement erfolgreich!',
        'Willkommen bei SocialPro Premium! Sie haben jetzt Zugang zu allen Features.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Fehler', 'Abonnement konnte nicht abgeschlossen werden.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    const ok = await restorePurchases();
    Alert.alert(ok ? 'Erfolg' : 'Hinweis', ok ? 'Käufe wiederhergestellt.' : 'Keine aktiven Käufe gefunden.');
  };

  const isSubscribed = user?.subscriptionStatus === 'active';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color="#6B7280" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SocialPro Premium</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Crown color="#8B5CF6" size={48} />
          <Text style={styles.heroTitle}>Schalten Sie Ihr volles Potenzial frei</Text>
          <Text style={styles.heroSubtitle}>
            Professionelle Social Media Verwaltung mit KI-Power
          </Text>
        </View>

        <View style={styles.features}>
          {[
            'Unbegrenzte Post-Planung',
            'KI-Content-Generator',
            'Erweiterte Analytics',
            'Multi-Platform-Publishing',
            'Trend-Scanner & Insights',
            'Priority Support',
          ].map((feature, index) => (
            <View style={styles.featureItem} key={index}>
              <Check color="#10B981" size={20} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {!isSubscribed && (
          <>
            <View style={styles.trialSection}>
              <View style={styles.trialBadge}>
                <Zap color="#F59E0B" size={16} />
                <Text style={styles.trialBadgeText}>3 Tage kostenlos testen</Text>
              </View>
              <Text style={styles.trialNote}>
                Keine Kreditkarte erforderlich • Jederzeit kündbar
              </Text>
            </View>

            <View style={styles.planSelector}>
              {/* Monatlich */}
              <TouchableOpacity
                style={[styles.planOption, selectedPlan === 'monthly' && styles.planOptionSelected]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Monatlich</Text>
                  <Text style={styles.planPrice}>{monthlyPrice}</Text>
                </View>
                <Text style={styles.planPeriod}>pro Monat</Text>
              </TouchableOpacity>

              {/* Jährlich */}
              <TouchableOpacity
                style={[styles.planOption, selectedPlan === 'yearly' && styles.planOptionSelected]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>2 Monate gratis</Text>
                </View>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Jährlich</Text>
                  <Text style={styles.planPrice}>{yearlyPrice}</Text>
                </View>
                <Text style={styles.planPeriod}>
                  pro Jahr {perMonthYearly ? `(≈ ${perMonthYearly.toFixed(2)} €/Monat)` : ''}
                </Text>
                {Boolean(savings) && (
                  <Text style={styles.planSavings}>
                    Du sparst ca. {savings!.toFixed(2)} €
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.subscribeButton, isProcessing && styles.subscribeButtonDisabled]}
              onPress={handleSubscribe}
              disabled={isProcessing}
            >
              <Text style={styles.subscribeButtonText}>
                {isProcessing ? 'Wird verarbeitet...' :
                  `${selectedPlan === 'monthly' ? 'Monatlich' : 'Jährlich'} abonnieren`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRestore}>
              <Text style={styles.restoreText}>Käufe wiederherstellen</Text>
            </TouchableOpacity>
          </>
        )}

        {isSubscribed && (
          <View style={styles.subscribedStatus}>
            <Check color="#10B981" size={32} />
            <Text style={styles.subscribedTitle}>Sie sind Premium-Mitglied!</Text>
            <Text style={styles.subscribedText}>
              Genießen Sie alle Premium-Features von SocialPro.
            </Text>
          </View>
        )}

        <Text style={styles.disclaimer}>
          Das Abonnement verlängert sich automatisch, sofern nicht mindestens 24 Stunden
          vor Ablauf gekündigt wird. Verwaltung/Kündigung: iOS Einstellungen → Apple-ID → Abonnements.
          Mit dem Kauf stimmen Sie unseren Nutzungsbedingungen und Datenschutzrichtlinien zu.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  placeholder: { width: 32 },
  content: { flex: 1, paddingHorizontal: 20 },
  hero: { alignItems: 'center', paddingVertical: 32 },
  heroTitle: {
    fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center',
    marginTop: 16, marginBottom: 8,
  },
  heroSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  features: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureText: { fontSize: 16, color: '#374151', marginLeft: 12 },
  trialSection: {
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 20, marginBottom: 24,
    alignItems: 'center', borderWidth: 1, borderColor: '#FED7AA',
  },
  trialBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 8,
  },
  trialBadgeText: { fontSize: 14, fontWeight: '600', color: '#D97706', marginLeft: 4 },
  trialNote: { fontSize: 12, color: '#92400E', textAlign: 'center' },
  planSelector: { marginBottom: 24 },
  planOption: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 12,
    borderWidth: 2, borderColor: '#F3F4F6', position: 'relative',
  },
  planOptionSelected: { borderColor: '#8B5CF6' },
  planBadge: {
    position: 'absolute', top: -8, right: 16, backgroundColor: '#10B981',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  planBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  planName: { fontSize: 18, fontWeight: '600', color: '#111827' },
  planPrice: { fontSize: 24, fontWeight: 'bold', color: '#8B5CF6' },
  planPeriod: { fontSize: 14, color: '#6B7280' },
  planSavings: { fontSize: 14, color: '#10B981', fontWeight: '600', marginTop: 4 },
  subscribeButton: {
    backgroundColor: '#8B5CF6', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginBottom: 16, shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  subscribeButtonDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0, elevation: 0 },
  subscribeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  restoreText: {
    color: '#6B7280', textAlign: 'center', fontSize: 14, marginBottom: 24, textDecorationLine: 'underline',
  },
  subscribedStatus: { alignItems: 'center', paddingVertical: 32 },
  subscribedTitle: { fontSize: 20, fontWeight: 'bold', color: '#10B981', marginTop: 12, marginBottom: 8 },
  subscribedText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  disclaimer: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 16, marginBottom: 32 },
});

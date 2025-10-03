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
  const { user, startTrial, subscribe } = useAuth();

  const handleStartTrial = async () => {
    try {
      await startTrial();
      Alert.alert(
        'Testphase gestartet!',
        'Sie haben jetzt 3 Tage kostenlosen Zugang zu allen Premium-Features.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Fehler', 'Testphase konnte nicht gestartet werden.');
    }
  };

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

  const canStartTrial = user?.subscriptionStatus === 'none';
  const isTrialActive = user?.subscriptionStatus === 'trial';
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
          <View style={styles.featureItem}>
            <Check color="#10B981" size={20} />
            <Text style={styles.featureText}>Unbegrenzte Post-Planung</Text>
          </View>
          <View style={styles.featureItem}>
            <Check color="#10B981" size={20} />
            <Text style={styles.featureText}>KI-Content-Generator</Text>
          </View>
          <View style={styles.featureItem}>
            <Check color="#10B981" size={20} />
            <Text style={styles.featureText}>Erweiterte Analytics</Text>
          </View>
          <View style={styles.featureItem}>
            <Check color="#10B981" size={20} />
            <Text style={styles.featureText}>Multi-Platform-Publishing</Text>
          </View>
          <View style={styles.featureItem}>
            <Check color="#10B981" size={20} />
            <Text style={styles.featureText}>Trend-Scanner & Insights</Text>
          </View>
          <View style={styles.featureItem}>
            <Check color="#10B981" size={20} />
            <Text style={styles.featureText}>Priority Support</Text>
          </View>
        </View>

        {canStartTrial && (
          <View style={styles.trialSection}>
            <View style={styles.trialBadge}>
              <Zap color="#F59E0B" size={16} />
              <Text style={styles.trialBadgeText}>3 Tage kostenlos testen</Text>
            </View>
            <TouchableOpacity style={styles.trialButton} onPress={handleStartTrial}>
              <Text style={styles.trialButtonText}>Kostenlose Testphase starten</Text>
            </TouchableOpacity>
            <Text style={styles.trialNote}>
              Keine Kreditkarte erforderlich • Jederzeit kündbar
            </Text>
          </View>
        )}

        {isTrialActive && user?.trialEndsAt && (
          <View style={styles.trialStatus}>
            <Text style={styles.trialStatusTitle}>Testphase aktiv</Text>
            <Text style={styles.trialStatusText}>
              Ihre Testphase endet am {user.trialEndsAt.toLocaleDateString('de-DE')}
            </Text>
          </View>
        )}

        {!isSubscribed && (
          <>
            <View style={styles.planSelector}>
              <TouchableOpacity
                style={[styles.planOption, selectedPlan === 'monthly' && styles.planOptionSelected]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Monatlich</Text>
                  <Text style={styles.planPrice}>29,99€</Text>
                </View>
                <Text style={styles.planPeriod}>pro Monat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planOption, selectedPlan === 'yearly' && styles.planOptionSelected]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>2 Monate gratis</Text>
                </View>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Jährlich</Text>
                  <Text style={styles.planPrice}>300€</Text>
                </View>
                <Text style={styles.planPeriod}>pro Jahr (25€/Monat)</Text>
                <Text style={styles.planSavings}>Sie sparen 60€</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.subscribeButton, isProcessing && styles.subscribeButtonDisabled]}
              onPress={handleSubscribe}
              disabled={isProcessing}
            >
              <Text style={styles.subscribeButtonText}>
                {isProcessing ? 'Wird verarbeitet...' : `${selectedPlan === 'monthly' ? 'Monatlich' : 'Jährlich'} abonnieren`}
              </Text>
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
          Durch den Kauf stimmen Sie unseren Nutzungsbedingungen und Datenschutzrichtlinien zu.
          Das Abonnement verlängert sich automatisch.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  features: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  trialSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  trialBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 4,
  },
  trialButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  trialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  trialNote: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  trialStatus: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  trialStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  trialStatusText: {
    fontSize: 14,
    color: '#047857',
  },
  planSelector: {
    marginBottom: 24,
  },
  planOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    position: 'relative',
  },
  planOptionSelected: {
    borderColor: '#8B5CF6',
  },
  planBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  planPeriod: {
    fontSize: 14,
    color: '#6B7280',
  },
  planSavings: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  subscribeButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  subscribedStatus: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  subscribedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 12,
    marginBottom: 8,
  },
  subscribedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 32,
  },
});
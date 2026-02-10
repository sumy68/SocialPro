import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import Purchases, { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_START_KEY = '@trial_start_date';

export default function PaywallScreen() {
  const router = useRouter();
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      setOfferings(offerings);
    } catch (error) {
      console.error('Error loading offerings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      if (customerInfo.entitlements.active['premium']) {
        router.replace('/onboarding/welcome');
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleSkip = async () => {
    try {
      const trialStartDate = await AsyncStorage.getItem(TRIAL_START_KEY);
      
      if (!trialStartDate) {
        const now = new Date().toISOString();
        await AsyncStorage.setItem(TRIAL_START_KEY, now);
      }
      
      router.replace('/onboarding/welcome');
    } catch (error) {
      console.error('Error starting trial:', error);
      router.replace('/onboarding/welcome');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const currentOffering = offerings?.current;
  const monthlyPackage = currentOffering?.availablePackages.find(
    pkg => pkg.identifier === '$rc_monthly'
  );
  const annualPackage = currentOffering?.availablePackages.find(
    pkg => pkg.identifier === '$rc_annual'
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Später</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Starte deine kostenlose Testversion</Text>
      <Text style={styles.subtitle}>3 Tage gratis, dann wähle deinen Plan</Text>

      <View style={styles.trialBadge}>
        <Text style={styles.trialBadgeText}>🎁 3 TAGE KOSTENLOS</Text>
      </View>

      {monthlyPackage && (
        <TouchableOpacity
          style={styles.packageCard}
          onPress={() => handlePurchase(monthlyPackage)}
          disabled={purchasing}
        >
          <View style={styles.packageHeader}>
            <Text style={styles.packageTitle}>Monatlich</Text>
            <Text style={styles.packagePrice}>
              {monthlyPackage.product.priceString}/Monat
            </Text>
          </View>
          <Text style={styles.packageDescription}>
            3 Tage gratis, dann monatlich abgerechnet
          </Text>
        </TouchableOpacity>
      )}

      {annualPackage && (
        <TouchableOpacity
          style={[styles.packageCard, styles.popularPackage]}
          onPress={() => handlePurchase(annualPackage)}
          disabled={purchasing}
        >
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>AM BELIEBTESTEN</Text>
          </View>
          <View style={styles.packageHeader}>
            <Text style={styles.packageTitle}>Jährlich</Text>
            <Text style={styles.packagePrice}>
              {annualPackage.product.priceString}/Jahr
            </Text>
          </View>
          <Text style={styles.packageDescription}>
            3 Tage gratis, dann jährlich - spare 30%
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.terms}>
        Die Testversion verlängert sich automatisch in ein kostenpflichtiges Abo, wenn sie nicht 24 Stunden vor Ablauf gekündigt wird. Jederzeit in den Einstellungen kündbar.
      </Text>

      {purchasing && (
        <ActivityIndicator size="large" color="#7C3AED" style={styles.purchasingIndicator} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  trialBadge: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 40,
  },
  trialBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  packageCard: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
  },
  popularPackage: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3F4F6',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  packageDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  terms: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 16,
  },
  purchasingIndicator: {
    marginTop: 20,
  },
});
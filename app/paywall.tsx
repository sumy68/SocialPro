import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import Purchases, { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/contexts/AppContext';
import { translations } from '@/constants/translations';
import type { Language } from '@/constants/translations';

const TRIAL_START_KEY = '@trial_start_date';
const PAYWALL_SEEN_KEY = '@socialpro:paywallSeen';

const paywallT: Record<string, Record<string, string>> = {
  de: {
    skip: 'Später', title: 'Starte deine kostenlose Testversion', subtitle: '3 Tage gratis, dann wähle deinen Plan',
    trialBadge: '🎁 3 TAGE KOSTENLOS', monthly: 'Monatlich', yearly: 'Jährlich', perMonth: '/Monat', perYear: '/Jahr',
    monthlyDesc: '3 Tage gratis, dann monatlich abgerechnet', yearlyDesc: '3 Tage gratis, dann jährlich - spare 30%',
    popular: 'AM BELIEBTESTEN',
    terms: 'Die Testversion verlängert sich automatisch in ein kostenpflichtiges Abo, wenn sie nicht 24 Stunden vor Ablauf gekündigt wird. Jederzeit in den Einstellungen kündbar.',
    privacyPolicy: 'Datenschutz', eula: 'Nutzungsbedingungen', and: ' & ',
  },
  en: {
    skip: 'Later', title: 'Start your free trial', subtitle: '3 days free, then choose your plan',
    trialBadge: '🎁 3 DAYS FREE', monthly: 'Monthly', yearly: 'Yearly', perMonth: '/month', perYear: '/year',
    monthlyDesc: '3 days free, then billed monthly', yearlyDesc: '3 days free, then billed yearly - save 30%',
    popular: 'MOST POPULAR',
    terms: 'The trial automatically converts to a paid subscription if not cancelled 24 hours before expiry. Cancel anytime in Settings.',
    privacyPolicy: 'Privacy Policy', eula: 'Terms of Use', and: ' & ',
  },
  es: {
    skip: 'Después', title: 'Inicia tu prueba gratuita', subtitle: '3 días gratis, luego elige tu plan',
    trialBadge: '🎁 3 DÍAS GRATIS', monthly: 'Mensual', yearly: 'Anual', perMonth: '/mes', perYear: '/año',
    monthlyDesc: '3 días gratis, luego facturación mensual', yearlyDesc: '3 días gratis, luego facturación anual - ahorra 30%',
    popular: 'MÁS POPULAR',
    terms: 'La prueba se convierte automáticamente en una suscripción de pago si no se cancela 24 horas antes del vencimiento. Cancela en cualquier momento.',
    privacyPolicy: 'Política de privacidad', eula: 'Términos de uso', and: ' & ',
  },
  tr: {
    skip: 'Sonra', title: 'Ücretsiz denemenizi başlatın', subtitle: '3 gün ücretsiz, sonra planınızı seçin',
    trialBadge: '🎁 3 GÜN ÜCRETSİZ', monthly: 'Aylık', yearly: 'Yıllık', perMonth: '/ay', perYear: '/yıl',
    monthlyDesc: '3 gün ücretsiz, sonra aylık faturalandırma', yearlyDesc: '3 gün ücretsiz, sonra yıllık faturalandırma - %30 tasarruf',
    popular: 'EN POPÜLER',
    terms: 'Deneme süresi, sona ermeden 24 saat önce iptal edilmezse otomatik olarak ücretli aboneliğe dönüşür. İstediğiniz zaman iptal edebilirsiniz.',
    privacyPolicy: 'Gizlilik Politikası', eula: 'Kullanım Koşulları', and: ' & ',
  },
};

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const t = paywallT[language] ?? paywallT.de;
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => { loadOfferings(); }, []);

  const loadOfferings = async () => {
    try { const o = await Purchases.getOfferings(); setOfferings(o); }
    catch (e) { console.error('Error loading offerings:', e); }
    finally { setLoading(false); }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['premium']) {
        await AsyncStorage.setItem(PAYWALL_SEEN_KEY, 'true');
        router.replace('/onboarding/company-info');
      }
    } catch (error: any) { if (!error.userCancelled) console.error('Purchase error:', error); }
    finally { setPurchasing(false); }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(PAYWALL_SEEN_KEY, 'true');
      const trialStartDate = await AsyncStorage.getItem(TRIAL_START_KEY);
      if (!trialStartDate) { await AsyncStorage.setItem(TRIAL_START_KEY, new Date().toISOString()); }
      router.replace('/onboarding/company-info');
    } catch (error) { console.error('Error starting trial:', error); router.replace('/onboarding/company-info'); }
  };

  if (loading) {
    return (<View style={styles.loadingContainer}><ActivityIndicator size="large" color="#EF4444" /></View>);
  }

  const currentOffering = offerings?.current;
  const monthlyPackage = currentOffering?.availablePackages.find(pkg => pkg.identifier === '$rc_monthly');
  const annualPackage = currentOffering?.availablePackages.find(pkg => pkg.identifier === '$rc_annual');

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
      <TouchableOpacity style={[styles.skipButton, { top: insets.top + 8 }]} onPress={handleSkip}>
        <Text style={styles.skipText}>{t.skip}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t.title}</Text>
      <Text style={styles.subtitle}>{t.subtitle}</Text>

      <View style={styles.trialBadge}>
        <Text style={styles.trialBadgeText}>{t.trialBadge}</Text>
      </View>

      {/* Links BEFORE purchase buttons - prominent & always visible */}
      <View style={styles.linksRow}>
        <TouchableOpacity onPress={() => Linking.openURL('https://smyagency.de/datenschutz-socialpro.html')}>
          <Text style={styles.link}>{t.privacyPolicy}</Text>
        </TouchableOpacity>
        <Text style={styles.linkSeparator}>{t.and}</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
          <Text style={styles.link}>{t.eula}</Text>
        </TouchableOpacity>
      </View>

      {monthlyPackage ? (
        <TouchableOpacity style={styles.packageCard} onPress={() => handlePurchase(monthlyPackage)} disabled={purchasing}>
          <View style={styles.packageHeader}>
            <Text style={styles.packageTitle}>{t.monthly}</Text>
            <Text style={styles.packagePrice}>{monthlyPackage.product.priceString}{t.perMonth}</Text>
          </View>
          <Text style={styles.packageDescription}>{t.monthlyDesc}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.packageCard}>
          <View style={styles.packageHeader}>
            <Text style={styles.packageTitle}>{t.monthly}</Text>
            <Text style={styles.packagePrice}>€4,99{t.perMonth}</Text>
          </View>
          <Text style={styles.packageDescription}>{t.monthlyDesc}</Text>
        </View>
      )}

      {annualPackage ? (
        <TouchableOpacity style={[styles.packageCard, styles.popularPackage]} onPress={() => handlePurchase(annualPackage)} disabled={purchasing}>
          <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>{t.popular}</Text></View>
          <View style={styles.packageHeader}>
            <Text style={styles.packageTitle}>{t.yearly}</Text>
            <Text style={styles.packagePrice}>{annualPackage.product.priceString}{t.perYear}</Text>
          </View>
          <Text style={styles.packageDescription}>{t.yearlyDesc}</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.packageCard, styles.popularPackage]}>
          <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>{t.popular}</Text></View>
          <View style={styles.packageHeader}>
            <Text style={styles.packageTitle}>{t.yearly}</Text>
            <Text style={styles.packagePrice}>€34,99{t.perYear}</Text>
          </View>
          <Text style={styles.packageDescription}>{t.yearlyDesc}</Text>
        </View>
      )}

      <Text style={styles.terms}>{t.terms}</Text>

      {purchasing && (<ActivityIndicator size="large" color="#EF4444" style={styles.purchasingIndicator} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 60 },
  skipButton: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  skipText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, marginTop: 20 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  trialBadge: { backgroundColor: '#10B981', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, alignSelf: 'center', marginBottom: 20 },
  trialBadgeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linksRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  link: { fontSize: 12, color: '#EF4444', textDecorationLine: 'underline' },
  linkSeparator: { fontSize: 12, color: '#9CA3AF', marginHorizontal: 4 },
  packageCard: { borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 16, padding: 20, marginBottom: 15 },
  popularPackage: { borderColor: '#EF4444', backgroundColor: '#F3F4F6' },
  popularBadge: { position: 'absolute', top: -12, right: 20, backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  popularBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  packageTitle: { fontSize: 20, fontWeight: 'bold' },
  packagePrice: { fontSize: 24, fontWeight: 'bold', color: '#EF4444' },
  packageDescription: { fontSize: 14, color: '#6B7280' },
  terms: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 30, lineHeight: 16 },
  purchasingIndicator: { marginTop: 20 },
});
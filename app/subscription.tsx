import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { Check, Rocket } from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { useApp } from '@/contexts/AppContext';
import * as InAppPurchases from 'expo-in-app-purchases';
import { Colors } from '@/constants/colors';

// 🔥 Deine Produkt-IDs aus App Store Connect
const PRODUCT_IDS = [
  "com.deinpaket.socialpro.premium.monthly2",
  "com.deinpaket.socialpro.premium.yearly",
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const t = useTranslation() as any;
  const { startTrial } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // 🔥 SAFER TEXT-MAPPING MIT DEFAULTS
  // -------------------------------------------------------
  const S = {
    title: t?.subscription?.title ?? "Wählen Sie Ihren Plan",
    subtitle: t?.subscription?.subtitle ?? "3 Tage kostenlos testen, jederzeit kündbar",
    trialBadge: t?.subscription?.trialBadge ?? "3 Tage Gratis",
    monthly: t?.subscription?.monthly ?? "Monatlich",
    yearly: t?.subscription?.yearly ?? "Jährlich",
    monthlyPrice: t?.subscription?.monthlyPrice ?? "29,99€",
    yearlyPrice: t?.subscription?.yearlyPrice ?? "300€",
    perMonth: t?.subscription?.perMonth ?? "/Monat",
    perYear: t?.subscription?.perYear ?? "/Jahr",
    saveYearly: t?.subscription?.saveYearly ?? "40€ sparen",
    featuresTitle: t?.subscription?.featuresTitle ?? "Alle Pläne beinhalten:",
    features: {
      unlimited: t?.subscription?.features?.unlimited ?? "Unbegrenzte Posts",
      scheduling: t?.subscription?.features?.scheduling ?? "Post-Planung & Automatisierung",
      aiCaptions: t?.subscription?.features?.aiCaptions ?? "KI-Captions & Hashtags",
      analytics: t?.subscription?.features?.analytics ?? "Detaillierte Analytics",
      contentSuggestions: t?.subscription?.features?.contentSuggestions ?? "KI-Content-Vorschläge",
      weeklyReports: t?.subscription?.features?.weeklyReports ?? "Wöchentliche Reports",
      support: t?.subscription?.features?.support ?? "Premium Support",
    },
    startTrial: t?.subscription?.startTrial ?? "3-Tage-Testversion starten",
    restore: t?.subscription?.restore ?? "Käufe wiederherstellen",
    terms:
      t?.subscription?.terms ??
      "Nach der Testphase wird Ihr Abonnement automatisch verlängert. Jederzeit kündbar in den iPhone-Einstellungen.",
    back: t?.back ?? "Zurück",
  };

  // -------------------------------------------------------
  // 🔥 IAP INITIALISIEREN
  // -------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        if (__DEV__) {
          console.log("[IAP] Skipping product load in dev (__DEV__)");
          setLoading(false);
          return;
        }

        const { responseCode, results } = await InAppPurchases.getProductsAsync(PRODUCT_IDS);

        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          console.log("[IAP] Products loaded:", results);
          setProducts(results);
        } else {
          console.warn("[IAP] Failed to load products");
        }

        setLoading(false);
      } catch (err) {
        console.error("[IAP] Error loading products:", err);
        setLoading(false);
      }
    };

    init();

    const subscription = InAppPurchases.setPurchaseListener(
      ({ responseCode, results }) => {
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          results?.forEach(async (purchase) => {
            if (!purchase.acknowledged) {
              console.log("[IAP] Purchase successful:", purchase);

              await InAppPurchases.finishTransactionAsync(purchase, true);

              await startTrial(selectedPlan);
              router.replace("/(tabs)");
            }
          });
        } else {
          console.warn("[IAP] Purchase failed or canceled.");
        }
      }
    );

    return () => {
      if (subscription && typeof subscription.remove === "function") {
        subscription.remove();
      }
    };
  }, []);

  // -------------------------------------------------------
  // 🔥 Kauf starten
  // -------------------------------------------------------
  const handleStartTrial = async () => {
    try {
      const productId =
        selectedPlan === "monthly"
          ? "com.deinpaket.socialpro.premium.monthly2"
          : "com.deinpaket.socialpro.premium.yearly";

      console.log("[IAP] Starting purchase:", productId);

      await InAppPurchases.purchaseItemAsync(productId);
    } catch (error) {
      console.error("[IAP] Error purchasing:", error);
      Alert.alert("Error", "Unable to complete purchase. Please try again.");
    }
  };

  // -------------------------------------------------------
  // 🔥 Restore
  // -------------------------------------------------------
  const handleRestore = async () => {
    try {
      const history = await InAppPurchases.getPurchaseHistoryAsync();
      console.log("[IAP] Restore history:", history);

      Alert.alert("Erfolgreich", "Käufe wurden wiederhergestellt.");
    } catch (error) {
      Alert.alert("Fehler", "Wiederherstellen nicht möglich.");
    }
  };

  // -------------------------------------------------------
  // 🔥 UI
  // -------------------------------------------------------
  return (
    <>
      <Stack.Screen
        options={{
          title: S.title,
          headerBackTitle: S.back,
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Rocket size={64} color={Colors.accent} strokeWidth={1.5} />
          <Text style={styles.headerTitle}>{S.title}</Text>
          <Text style={styles.headerSubtitle}>{S.subtitle}</Text>

          <View style={styles.trialBadge}>
            <Text style={styles.trialBadgeText}>{S.trialBadge}</Text>
          </View>
        </View>

        <View style={styles.plansContainer}>
          <PlanCard
            title={S.monthly}
            price={S.monthlyPrice}
            period={S.perMonth}
            selected={selectedPlan === 'monthly'}
            onSelect={() => setSelectedPlan('monthly')}
          />
          <PlanCard
            title={S.yearly}
            price={S.yearlyPrice}
            period={S.perYear}
            badge={S.saveYearly}
            selected={selectedPlan === 'yearly'}
            onSelect={() => setSelectedPlan('yearly')}
            highlighted
          />
        </View>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>{S.featuresTitle}</Text>

          <FeatureItem text={S.features.unlimited} />
          <FeatureItem text={S.features.scheduling} />
          <FeatureItem text={S.features.aiCaptions} />
          <FeatureItem text={S.features.analytics} />
          <FeatureItem text={S.features.contentSuggestions} />
          <FeatureItem text={S.features.weeklyReports} />
          <FeatureItem text={S.features.support} />
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartTrial}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>{S.startTrial}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreButtonText}>{S.restore}</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>{S.terms}</Text>
      </ScrollView>
    </>
  );
}

// -------------------------------------------------------

function PlanCard({ title, price, period, badge, selected, onSelect, highlighted }) {
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
      {badge ? (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}

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

function FeatureItem({ text }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Check size={20} color={Colors.accent} strokeWidth={3} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// -------------------------------------------------------
// STYLES
// -------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { paddingBottom: 40 },
  header: {
    padding: 40,
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: "center",
  },
  trialBadge: {
    backgroundColor: Colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  trialBadgeText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  plansContainer: { paddingHorizontal: 24, gap: 16, marginBottom: 32 },
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
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: Colors.accent,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planTitleContainer: { flex: 1 },
  planTitle: { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  planTitleSelected: { color: Colors.accent },
  priceContainer: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  planPrice: { fontSize: 32, fontWeight: "800", color: Colors.text },
  planPriceSelected: { color: Colors.accent },
  planPeriod: { fontSize: 16, color: Colors.textSecondary },
  planPeriodSelected: { color: Colors.accent },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: Colors.accent },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.accent },
  features: { paddingHorizontal: 24, marginBottom: 32, gap: 12 },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { fontSize: 16, color: Colors.text, flex: 1 },
  startButton: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.background,
    letterSpacing: -0.3,
  },
  restoreButton: { paddingVertical: 12, alignItems: "center", marginBottom: 16 },
  restoreButtonText: { fontSize: 16, fontWeight: "600", color: Colors.accent },
  terms: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});

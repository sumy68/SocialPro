import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import { useTranslation } from "@/hooks/useTranslation";
import { translations } from '@/constants/translations';
import type { Language } from '@/constants/translations';
import Purchases from "react-native-purchases";

export default function SubscriptionManageScreen() {
  const router = useRouter();
  const t = useTranslation();
  const app = useApp() as any;
  const lang = (app.language ?? 'de') as Language;
  const st = (translations[lang] ?? translations.de).settings;

  const subscription = app.subscription ?? null;
  const isDemo = app.demoMode ?? app.isDemoMode ?? false;

  const planKey = subscription?.plan ?? null;
  const status = subscription?.status ?? "none";

  const planLabel =
    planKey === "monthly"
      ? st?.monthly || "Monthly"
      : planKey === "yearly"
      ? st?.yearly || "Yearly"
      : "Kein aktives Abo";

  const statusLabel =
    status === "active"
      ? "Aktiv"
      : status === "trial"
      ? "Testphase"
      : status === "expired"
      ? "Abgelaufen"
      : "Kein aktives Abo";

  const renewal =
    subscription?.renewalDate ??
    subscription?.expiresAt ??
    null;

  // ✅ NEU: Premium Upgrade Handler
  const handleUpgradeToPremium = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
        // Zeige RevenueCat Paywall - nimm erstes Package
        const purchaserInfo = await Purchases.purchasePackage(offerings.current.availablePackages[0]);
        
        // Check ob Premium aktiviert
        if (typeof purchaserInfo.entitlements.active['premium'] !== 'undefined') {
          Alert.alert('✅', 'Premium activated!');
          // Optional: App Context updaten
          if (typeof app.checkSubscription === 'function') {
            await app.checkSubscription();
          }
        }
      } else {
        Alert.alert('Error', 'No options available');
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('[Premium Upgrade]', e);
        Alert.alert('Error', 'Purchase failed');
      }
    }
  };

  const handleOpenStoreSubscriptions = async () => {
    const url = "https://apps.apple.com/account/subscriptions";
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.warn("[Subscription] Cannot open subscriptions URL");
      }
    } catch (e) {
      console.error("[Subscription] Failed to open subscriptions URL", e);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: st?.manageSubscription || 'Manage Subscription',
          headerBackTitle: '',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Kopfbereich wie bei FaceApp */}
        <Text style={styles.appName}>SocialPro</Text>
        <Text style={styles.planText}>{planLabel}</Text>

        {renewal ? (
          <View style={styles.row}>
            <Text style={styles.rowIcon}>📅</Text>
            <Text style={styles.rowText}>
              Läuft {status === "expired" ? "bis" : "am"} {String(renewal)}{" "}
              {status === "expired" && "(abgelaufen)"}
            </Text>
          </View>
        ) : (
          <View style={styles.row}>
            <Text style={styles.rowIcon}>📅</Text>
            <Text style={styles.rowText}>{statusLabel}</Text>
          </View>
        )}

        {isDemo && (
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>Demo-Modus</Text>
          </View>
        )}

        {/* Support-Block */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Text style={styles.sectionText}>
            Bei Fragen zu deinem SocialPro-Abo oder Problemen in der App kannst
            du uns jederzeit direkt kontaktieren:
          </Text>
          <Text style={styles.sectionTextBold}>info@smyagency.de</Text>
        </View>

        {/* App-Store-Zahlungslogik (wichtig für Apple) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payments</Text>
          <Text style={styles.sectionText}>
            SocialPro-Abos werden vollständig über den Apple App Store
            verwaltet. Die Abrechnung, Verlängerung und Kündigung deines Abos
            erfolgen ausschließlich über dein Apple-Konto.
          </Text>
          <Text style={styles.sectionText}>
            Um dein Abo zu kündigen, zu verlängern oder den Tarif zu wechseln,
            öffne die App-Store-Abos über den Button unten und folge den
            Anweisungen von Apple.
          </Text>

          {/* ✅ NEU: Premium Upgrade Button - nur wenn NICHT aktiv */}
          {status !== 'active' && (
            <TouchableOpacity
              style={[styles.buttonPrimary, styles.upgradeButton]}
              activeOpacity={0.8}
              onPress={handleUpgradeToPremium}
            >
              <Text style={styles.buttonPrimaryText}>
                🚀 Premium Upgrade
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.buttonPrimary}
            activeOpacity={0.8}
            onPress={handleOpenStoreSubscriptions}
          >
            <Text style={styles.buttonPrimaryText}>
              Manage in App Store
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonGhost}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonGhostText}>
              ← Back
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  planText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rowIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  rowText: {
    fontSize: 14,
    color: "#4B5563",
  },
  demoBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    marginBottom: 16,
  },
  demoBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4F46E5",
  },
  sectionCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 6,
  },
  sectionTextBold: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  upgradeButton: {
    backgroundColor: "#EF4444",
    marginBottom: 12,
  },
  buttonPrimary: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#BE123C",
  },
  buttonPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  buttonGhost: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  buttonGhostText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
});
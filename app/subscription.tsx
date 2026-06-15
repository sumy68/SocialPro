import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import { router } from "expo-router";

import { getCustomerInfo, getOfferings, purchasePackage, restorePurchases, isPro } from "@/lib/purchases";

// Apple Guideline 3.1.2(c): required legal links on any purchase screen.
const EULA_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
const PRIVACY_URL = "https://smyagency.de/datenschutz-socialpro.html";

// Auto-renewal disclosure required for auto-renewable subscriptions.
const AUTO_RENEWAL_NOTICE =
  "Verlängert sich automatisch. Jederzeit kündbar in den App-Store-Einstellungen.";

// Map RevenueCat package type to a human-readable billing period.
function billingPeriodLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case "MONTHLY":
      return "monatlich";
    case "ANNUAL":
      return "jährlich";
    case "WEEKLY":
      return "wöchentlich";
    case "SIX_MONTH":
      return "halbjährlich";
    case "THREE_MONTH":
      return "vierteljährlich";
    case "TWO_MONTH":
      return "alle 2 Monate";
    case "LIFETIME":
      return "einmalig";
    default:
      return "";
  }
}

async function openExternalUrl(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Falls canOpenURL false liefert (z. B. Schema-Whitelist), trotzdem versuchen.
      await Linking.openURL(url);
    }
  } catch (e) {
    console.warn("[Subscription] Failed to open URL", url, e);
  }
}

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);

      const [offerings, customer] = await Promise.all([
        getOfferings(),
        getCustomerInfo(),
      ]);

      const current = offerings.all?.["default"] ?? offerings.current ?? null;

      setOffering(current);
      setInfo(customer);

      if (!current) {
        console.warn("[RevenueCat] No current offering found. Check Offerings in dashboard.");
      }
    } catch (e) {
      console.warn("[RevenueCat] load failed", e);
      Alert.alert("Error", "Could not load subscriptions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onBuy(pkg: PurchasesPackage) {
    try {
      setPurchasingId(pkg.identifier);
      const updated = await purchasePackage(pkg);
      setInfo(updated);

      if (isPro(updated)) {
        Alert.alert("Welcome to Premium! ��", "Your premium access is now active.");
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.toLowerCase().includes("cancel")) return;

      console.warn("[RevenueCat] purchase failed", e);
      Alert.alert("Error", "Please try again");
    } finally {
      setPurchasingId(null);
    }
  }

  async function onRestore() {
    try {
      setLoading(true);
      const restored = await restorePurchases();
      setInfo(restored);

      if (isPro(restored)) {
        Alert.alert("✅", "Restored successfully");
      } else {
        Alert.alert("!", "No active subscriptions found");
      }
    } catch (e) {
      console.warn("[RevenueCat] restore failed", e);
      Alert.alert("Error", "Please try again");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          paddingTop: insets.top + 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#E0E0E0"
        }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 28, color: "#EF4444" }}>←</Text>
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>Premium</Text>
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>Lade Premium-Optionen...</Text>
        </View>
      </View>
    );
  }

  if (!offering) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          paddingTop: insets.top + 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#E0E0E0"
        }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 28, color: "#EF4444" }}>←</Text>
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>Premium</Text>
        </View>

        <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, textAlign: "center" }}>
            Premium-Abos nicht verfügbar
          </Text>
          <Text style={{ fontSize: 14, opacity: 0.7, marginBottom: 24, textAlign: "center" }}>
            Please try again later.
          </Text>

          <Pressable
            onPress={load}
            style={{ padding: 16, borderRadius: 12, backgroundColor: "#EF4444" }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 16 }}>
              Erneut versuchen
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const packages = offering.availablePackages ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      <View style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        padding: 16, 
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0"
      }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ fontSize: 28, color: "#EF4444" }}>←</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>Premium</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 8 }}>Premium</Text>
        <Text style={{ fontSize: 16, opacity: 0.7, marginBottom: 24 }}>
          Hole dir vollen Zugriff auf alle Premium-Features
        </Text>

        {packages.length === 0 ? (
          <Text style={{ opacity: 0.7, textAlign: "center", marginTop: 20 }}>
            Keine Premium-Pakete verfügbar
          </Text>
        ) : (
          <View style={{ gap: 16 }}>
            {packages.map((pkg) => {
              const price = pkg.product.priceString;
              const title = pkg.product.title;
              const desc = pkg.product.description;
              const period = billingPeriodLabel(pkg);
              const busy = purchasingId === pkg.identifier;
              // Preis inkl. Laufzeit, z. B. "9,99 € / monatlich"
              const priceWithPeriod = period ? `${price} / ${period}` : price;

              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => onBuy(pkg)}
                  disabled={busy}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: "#EF4444",
                    backgroundColor: "#fff",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  <Text style={{ fontWeight: "800", fontSize: 18, marginBottom: 4 }}>{title}</Text>
                  {period ? (
                    <Text style={{ fontWeight: "600", fontSize: 14, color: "#EF4444", marginBottom: 4 }}>
                      Laufzeit: {period}
                    </Text>
                  ) : null}
                  <Text style={{ opacity: 0.7, marginBottom: 16 }}>{desc}</Text>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontWeight: "800", fontSize: 20, color: "#EF4444" }}>{priceWithPeriod}</Text>
                    <View style={{
                      backgroundColor: "#EF4444",
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 8
                    }}>
                      <Text style={{ color: "#fff", fontWeight: "700" }}>
                        {busy ? "..." : "Jetzt kaufen"}
                      </Text>
                    </View>
                  </View>

                  {/* Auto-Renewal-Hinweis pro Abo (Apple 3.1.2) */}
                  <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 12, lineHeight: 16 }}>
                    {AUTO_RENEWAL_NOTICE}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={onRestore}
          style={{ 
            padding: 16, 
            borderRadius: 12, 
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#ddd",
            marginTop: 24 
          }}
        >
          <Text style={{ color: "#EF4444", textAlign: "center", fontWeight: "600" }}>
            Käufe wiederherstellen
          </Text>
        </Pressable>

        {/* Pflicht-Disclosure (Apple 3.1.2) */}
        <Text style={{ fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 24, lineHeight: 18 }}>
          Die Zahlung wird bei Kaufbestätigung deinem Apple-ID-Konto belastet. {AUTO_RENEWAL_NOTICE}
          {" "}Die Verlängerung wird 24 Stunden vor Ablauf des aktuellen Zeitraums berechnet.
        </Text>

        {/* Funktionierende Pflicht-Links (Apple 3.1.2(c)) */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16, marginBottom: 8 }}>
          <Pressable onPress={() => openExternalUrl(EULA_URL)} hitSlop={8}>
            <Text style={{ fontSize: 13, color: "#EF4444", textDecorationLine: "underline" }}>
              Nutzungsbedingungen
            </Text>
          </Pressable>
          <Text style={{ fontSize: 13, color: "#9CA3AF", marginHorizontal: 8 }}>&amp;</Text>
          <Pressable onPress={() => openExternalUrl(PRIVACY_URL)} hitSlop={8}>
            <Text style={{ fontSize: 13, color: "#EF4444", textDecorationLine: "underline" }}>
              Datenschutz
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
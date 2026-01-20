import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import { router } from "expo-router";

import { getCustomerInfo, getOfferings, purchasePackage, restorePurchases, isPro } from "@/lib/purchases";

export default function SubscriptionScreen() {
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const proActive = useMemo(() => (info ? isPro(info) : false), [info]);

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
      Alert.alert("Fehler", "Abos konnten nicht geladen werden. Bitte versuche es später erneut.");
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
        Alert.alert("Willkommen bei Premium! 🎉", "Dein Premium-Zugang ist jetzt aktiv.");
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.toLowerCase().includes("cancel")) return;

      console.warn("[RevenueCat] purchase failed", e);
      Alert.alert("Kauf fehlgeschlagen", "Bitte versuche es erneut.");
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
        Alert.alert("Erfolgreich wiederhergestellt", "Dein Premium-Zugang ist aktiv.");
      } else {
        Alert.alert("Keine Käufe gefunden", "Es wurden keine aktiven Abonnements gefunden.");
      }
    } catch (e) {
      console.warn("[RevenueCat] restore failed", e);
      Alert.alert("Wiederherstellung fehlgeschlagen", "Bitte versuche es erneut.");
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
            Bitte versuche es später erneut.
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
              const busy = purchasingId === pkg.identifier;

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
                  <Text style={{ opacity: 0.7, marginBottom: 16 }}>{desc}</Text>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontWeight: "800", fontSize: 20, color: "#EF4444" }}>{price}</Text>
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
      </ScrollView>
    </View>
  );
}
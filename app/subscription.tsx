import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from "react-native-purchases";

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

      // meistens ist "current" gesetzt
      const current = offerings.current ?? null;

      setOffering(current);
      setInfo(customer);

      if (!current) {
        console.warn("[RevenueCat] No current offering found. Check Offerings in dashboard.");
      }
    } catch (e) {
      console.warn("[RevenueCat] load failed", e);
      Alert.alert("Abo", "Konnte Abos gerade nicht laden.");
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
        Alert.alert("Lets go 🔥", "Premium ist aktiv!");
      } else {
        Alert.alert("Hinweis", "Kauf ok, aber Entitlement noch nicht aktiv. Check RevenueCat Entitlement ID.");
      }
    } catch (e: any) {
      // User cancel ist normal
      const msg = String(e?.message ?? e);
      if (msg.toLowerCase().includes("cancel")) return;

      console.warn("[RevenueCat] purchase failed", e);
      Alert.alert("Kauf fehlgeschlagen", "Bitte nochmal versuchen.");
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
        Alert.alert("Wiederhergestellt ✅", "Premium ist aktiv.");
      } else {
        Alert.alert("Info", "Kein aktives Abo gefunden.");
      }
    } catch (e) {
      console.warn("[RevenueCat] restore failed", e);
      Alert.alert("Restore fehlgeschlagen", "Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Lade Abos…</Text>
      </View>
    );
  }

  if (!offering) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          Keine Abos verfügbar
        </Text>
        <Text style={{ opacity: 0.8, marginBottom: 16 }}>
          RevenueCat hat kein “current offering”. Check im Dashboard:
          Offerings → set “current” + Packages zuweisen.
        </Text>

        <Pressable
          onPress={load}
          style={{ padding: 14, borderRadius: 12, backgroundColor: "#111" }}
        >
          <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
            Neu laden
          </Text>
        </Pressable>
      </View>
    );
  }

  const packages = offering.availablePackages ?? [];

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "800" }}>Premium</Text>

      <View style={{ padding: 14, borderRadius: 14, backgroundColor: "#f2f2f2" }}>
        <Text style={{ fontWeight: "700" }}>
          Status: {proActive ? "✅ Aktiv" : "❌ Nicht aktiv"}
        </Text>
        <Text style={{ opacity: 0.8, marginTop: 6 }}>
          Wenn du kaufst und es bleibt ❌, dann ist fast immer die Entitlement-ID falsch
          (muss exakt matchen).
        </Text>
      </View>

      {packages.length === 0 ? (
        <Text style={{ opacity: 0.8 }}>
          Offering gefunden, aber keine Packages drin. Check RevenueCat → Offering Packages.
        </Text>
      ) : (
        packages.map((pkg) => {
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
                padding: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#ddd",
                backgroundColor: "#fff",
                opacity: busy ? 0.6 : 1,
              }}
            >
              <Text style={{ fontWeight: "800", fontSize: 16 }}>{title}</Text>
              <Text style={{ opacity: 0.8, marginTop: 4 }}>{desc}</Text>

              <View style={{ marginTop: 12, flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "800" }}>{price}</Text>
                <Text style={{ fontWeight: "700" }}>{busy ? "…" : "Kaufen"}</Text>
              </View>
            </Pressable>
          );
        })
      )}

      <Pressable
        onPress={onRestore}
        style={{ padding: 14, borderRadius: 12, backgroundColor: "#111", marginTop: 6 }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>
          Käufe wiederherstellen
        </Text>
      </Pressable>
    </ScrollView>
  );
}

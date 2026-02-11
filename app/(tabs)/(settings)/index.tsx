import { Stack, router } from "expo-router";
// app/(tabs)/(settings)/index.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";

import {
  User,
  Link2,
  Globe,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  AlertCircle,
  RefreshCw,
  Building2,
} from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/contexts/AppContext";
import { usePlatformConnection } from "@/contexts/PlatformConnectionContext";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import type { Platform } from "@/constants/types";

export default function SettingsScreen() {
  const t = useTranslation();

  const { language, setLanguage, subscription, connectedPlatforms, accountType } = useApp();
  const { statusMap, checking, checkAllPlatforms, refreshPlatformToken } =
    usePlatformConnection();

  useEffect(() => {
    checkAllPlatforms();
  }, []);

  const handleLanguageToggle = () => {
    router.push('/language-selection');
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync(
        "https://smyagency.de/datenschutz-socialpro.html"
      );
    } catch (error) {
      console.error("Error opening browser:", error);
      Alert.alert("Error", "Could not open privacy policy");
    }
  };

  const handleManageSubscription = () => {
    router.push("/subscription-manage");
  };

  const handleLogout = () => {
    router.replace("/onboarding/welcome");
  };

  const handleRefreshPlatform = async (platform: Platform) => {
    try {
      const result = await refreshPlatformToken(platform);
      if (result.success) {
        Alert.alert("Success", "Token refreshed successfully");
      } else if (result.requiresReauth) {
        Alert.alert("Reconnection Required", "Please reconnect your account", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reconnect",
            onPress: () =>
              router.push("/onboarding/connect-platforms" as any),
          },
        ]);
      } else {
        Alert.alert("Error", result.error || "Failed to refresh token");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to refresh token");
    }
  };

  // ✅ Count nur für LinkedIn / Instagram / TikTok
  const connectedCount = connectedPlatforms.filter(
    (p) =>
      p.connected &&
      (p.platform === "linkedin" ||
        p.platform === "instagram" ||
        p.platform === "tiktok")
  ).length;

  const isLinkedInConnected = connectedPlatforms.some(
    (p) => p.platform === "linkedin" && p.connected
  );
  const isInstagramConnected = connectedPlatforms.some(
    (p) => p.platform === "instagram" && p.connected
  );
  const isTikTokConnected = connectedPlatforms.some(
    (p) => p.platform === "tiktok" && p.connected
  );

  const getAccountTypeLabel = () => {
    if (accountType === 'business') return 'Unternehmen';
    if (accountType === 'creator') return 'Creator';
    if (accountType === 'both') return 'Beides';
    return 'Nicht festgelegt';
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Einstellungen",
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <SettingItem
            icon={<Building2 size={24} color="#EF4444" />}
            label="Account-Typ"
            value={getAccountTypeLabel()}
            onPress={() => router.push("/onboarding/company-info")}
          />

          <SettingItem
            icon={<User size={24} color="#EF4444" />}
            label="Profil"
            value="Edit"
            onPress={() =>
              router.push("/(tabs)/(settings)/company-info-edit")
            }
          />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() =>
              router.push("/onboarding/connect-platforms" as any)
            }
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Link2 size={24} color="#E1306C" />
              </View>
              <Text style={styles.settingLabel}>
                Verbundene Plattformen
              </Text>
            </View>

            <View style={styles.platformStatusContainer}>
              {checking ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <View style={styles.platformBadges}>
                  <View
                    style={[
                      styles.platformDot,
                      isLinkedInConnected && styles.platformDotActive,
                    ]}
                  />
                  <View
                    style={[
                      styles.platformDot,
                      isInstagramConnected && styles.platformDotActive,
                    ]}
                  />
                  <View
                    style={[
                      styles.platformDot,
                      isTikTokConnected && styles.platformDotActive,
                    ]}
                  />
                </View>
              )}
              <Text style={styles.settingValue}>{connectedCount}/3</Text>
            </View>
          </TouchableOpacity>

          {Object.values(statusMap).some(
            (p) => p.connected && p.isExpired
          ) && (
            <View style={styles.warningBanner}>
              <AlertCircle size={16} color="#F59E0B" />
              <Text style={styles.warningText}>Some tokens need refresh</Text>
              <TouchableOpacity onPress={() => checkAllPlatforms()}>
                <RefreshCw size={16} color="#F59E0B" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <SettingItem
            icon={<Globe size={24} color="#EF4444" />}
            label="Sprache"
            value={language === "de" ? "Deutsch" : "English"}
            onPress={handleLanguageToggle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abonnement</Text>

          <View style={styles.subscriptionCard}>
            <Text style={styles.subscriptionTitle}>
              Aktueller Plan
            </Text>
            <Text style={styles.subscriptionPlan}>
              {subscription.plan === "monthly"
                ? "Monthly"
                : subscription.plan === "yearly"
                ? "Yearly"
                : "No Plan"}
            </Text>
            <Text style={styles.subscriptionStatus}>
              Status:{" "}
              {subscription.status === "trial"
                ? "Trial"
                : subscription.status}
            </Text>
          </View>

          <SettingItem
            icon={<CreditCard size={24} color="#10B981" />}
            label="Abonnement verwalten"
            onPress={handleManageSubscription}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rechtliches</Text>

          <SettingItem
            icon={<FileText size={24} color="#666" />}
            label="Datenschutz"
            onPress={handleOpenPrivacyPolicy}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <SettingItem
            icon={<HelpCircle size={24} color="#F59E0B" />}
            label="Support kontaktieren"
            onPress={() =>
              Alert.alert("Support", "info@smyagency.de")
            }
          />
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Abmelden</Text>
        </TouchableOpacity>


        <Text style={styles.version}>SocialPro v1.0.0</Text>
      </ScrollView>
    </>
  );
}

function SettingItem({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>{icon}</View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {value && <Text style={styles.settingValue}>{value}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingItem: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontSize: 16,
    color: "#0F1419",
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600" as const,
  },
  subscriptionCard: {
    backgroundColor: "#FEE2E2",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  subscriptionTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  subscriptionPlan: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: "#EF4444",
    marginBottom: 4,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: "#666",
    textTransform: "capitalize",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginTop: 16,
  },
  platformStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  platformBadges: {
    flexDirection: "row",
    gap: 4,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    padding: 12,
    marginTop: 1,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#92400E",
  },
  platformDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E5E7EB",
  },
  platformDotActive: {
    backgroundColor: "#10B981",
  },
});
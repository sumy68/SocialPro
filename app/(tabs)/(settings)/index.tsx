import { Stack, router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
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
import { useApp } from "@/contexts/AppContext";
import { translations } from "@/constants/translations";
import type { Language } from "@/constants/translations";
import { usePlatformConnection } from "@/contexts/PlatformConnectionContext";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import type { Platform } from "@/constants/types";

export default function SettingsScreen() {
  const { language, setLanguage, subscription, connectedPlatforms, accountType } = useApp();
  const t = (translations[language as Language] ?? translations.de);
  const s = t.settings;
  const { statusMap, checking, checkAllPlatforms, refreshPlatformToken } = usePlatformConnection();

  useEffect(() => { checkAllPlatforms(); }, []);

  const handleLanguageToggle = () => { router.push('/language-selection'); };

  const handleOpenPrivacyPolicy = async () => {
    try { await WebBrowser.openBrowserAsync("https://smyagency.de/datenschutz-socialpro.html"); }
    catch (error) { console.error("Error opening browser:", error); }
  };

  const handleManageSubscription = () => { router.push("/subscription-manage"); };

  const handleLogout = () => { router.replace("/onboarding/welcome"); };

  const handleRefreshPlatform = async (platform: Platform) => {
    try {
      const result = await refreshPlatformToken(platform);
      if (result.success) { Alert.alert("OK", "Token refreshed"); }
      else if (result.requiresReauth) {
        Alert.alert("Reconnect", "Please reconnect your account", [
          { text: t.cancel, style: "cancel" },
          { text: s.connectPlatform, onPress: () => router.push("/onboarding/connect-platforms" as any) },
        ]);
      }
    } catch (error: any) { Alert.alert("Error", error.message); }
  };

  const connectedCount = connectedPlatforms.filter(
    (p) => p.connected && (p.platform === "linkedin" || p.platform === "instagram" || p.platform === "tiktok")
  ).length;

  const isLinkedInConnected = connectedPlatforms.some((p) => p.platform === "linkedin" && p.connected);
  const isInstagramConnected = connectedPlatforms.some((p) => p.platform === "instagram" && p.connected);
  const isTikTokConnected = connectedPlatforms.some((p) => p.platform === "tiktok" && p.connected);

  const getAccountTypeLabel = () => {
    if (accountType === 'business') return s.business;
    if (accountType === 'creator') return s.creator;
    if (accountType === 'both') return s.both;
    return s.notSet;
  };

  const getLanguageLabel = () => {
    if (language === 'de') return 'Deutsch';
    if (language === 'en') return 'English';
    if (language === 'es') return 'Español';
    if (language === 'tr') return 'Türkçe';
    return 'Deutsch';
  };

  const getPlanLabel = () => {
    if (subscription.plan === "monthly") return s.monthly;
    if (subscription.plan === "yearly") return s.yearly;
    return s.noPlan;
  };

  const getStatusLabel = () => {
    if (subscription.status === "trial") return s.trial;
    if (subscription.status === "active") return "Active";
    return subscription.status;
  };

  return (
    <>
      <Stack.Screen options={{ title: s.title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{s.account}</Text>

          <SettingItem
            icon={<Building2 size={24} color="#EF4444" />}
            label={s.accountType}
            value={getAccountTypeLabel()}
            onPress={() => router.push("/onboarding/company-info")}
          />
          <SettingItem
            icon={<User size={24} color="#EF4444" />}
            label={s.profile}
            value={t.edit}
            onPress={() => router.push("/(tabs)/(settings)/company-info-edit")}
          />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/onboarding/connect-platforms" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}><Link2 size={24} color="#E1306C" /></View>
              <Text style={styles.settingLabel}>{s.connectedPlatforms}</Text>
            </View>
            <View style={styles.platformStatusContainer}>
              {checking ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <View style={styles.platformBadges}>
                  <View style={[styles.platformDot, isLinkedInConnected && styles.platformDotActive]} />
                  <View style={[styles.platformDot, isInstagramConnected && styles.platformDotActive]} />
                  <View style={[styles.platformDot, isTikTokConnected && styles.platformDotActive]} />
                </View>
              )}
              <Text style={styles.settingValue}>{connectedCount}/3</Text>
            </View>
          </TouchableOpacity>

          {Object.values(statusMap).some((p) => p.connected && p.isExpired) && (
            <View style={styles.warningBanner}>
              <AlertCircle size={16} color="#F59E0B" />
              <Text style={styles.warningText}>Token refresh needed</Text>
              <TouchableOpacity onPress={() => checkAllPlatforms()}>
                <RefreshCw size={16} color="#F59E0B" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{s.preferences}</Text>
          <SettingItem
            icon={<Globe size={24} color="#EF4444" />}
            label={s.language}
            value={getLanguageLabel()}
            onPress={handleLanguageToggle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{s.subscription}</Text>
          <View style={styles.subscriptionCard}>
            <Text style={styles.subscriptionTitle}>{s.currentPlan}</Text>
            <Text style={styles.subscriptionPlan}>{getPlanLabel()}</Text>
            <Text style={styles.subscriptionStatus}>{s.status}: {getStatusLabel()}</Text>
          </View>
          <SettingItem
            icon={<CreditCard size={24} color="#10B981" />}
            label={s.manageSubscription}
            onPress={handleManageSubscription}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{s.legal}</Text>
          <SettingItem
            icon={<FileText size={24} color="#666" />}
            label={s.privacyPolicy}
            onPress={handleOpenPrivacyPolicy}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{s.support}</Text>
          <SettingItem
            icon={<HelpCircle size={24} color="#F59E0B" />}
            label={s.contactSupport}
            onPress={() => Alert.alert(s.support, "info@smyagency.de")}
          />
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{s.feedback || 'Feedback'}</Text>
          <SettingItem
            icon={<HelpCircle size={24} color="#10B981" />}
            label={s.reportProblem || 'Report a Problem'}
            onPress={() => Linking.openURL('mailto:info@smyagency.de?subject=' + encodeURIComponent(s.reportProblemSubject || 'SocialPro - Bug Report') + '&body=' + encodeURIComponent((s.reportProblemBody || 'Hi SMY Team, I found an issue:') + '\n\n'))}
          />
          <SettingItem
            icon={<Lightbulb size={24} color="#F59E0B" />}
            label={s.featureRequest || 'Request a Feature'}
            onPress={() => Linking.openURL('mailto:info@smyagency.de?subject=' + encodeURIComponent(s.featureRequestSubject || 'SocialPro - Feature Request') + '&body=' + encodeURIComponent((s.featureRequestBody || 'Hi SMY Team, I would love to see:') + '\n\n'))}
          />
        </View>

        {/* SMY Agency Branding */}
        <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 8 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E1306C', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, gap: 8, marginBottom: 16 }}
            onPress={() => Linking.openURL('https://instagram.com/socialproapp')}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{s.followUs || 'Follow us @socialproapp'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://smyagency.de')} style={{ alignItems: 'center' }}>
            <Text style={{ color: '#999', fontSize: 12 }}>{s.poweredBy || 'Powered by SMY Agency, Munich'}</Text>
            <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '500', marginTop: 2 }}>smyagency.de</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{s.logout}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>SocialPro v1.0.0</Text>
      </ScrollView>
    </>
  );
}

function SettingItem({ icon, label, value, onPress }: { icon: React.ReactNode; label: string; value?: string; onPress?: () => void; }) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>{icon}</View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {value && <Text style={styles.settingValue}>{value}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  brandingSection: { alignItems: 'center', marginTop: 8, marginBottom: 24 },
  instagramButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E1306C', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, gap: 8, marginBottom: 16 },
  instagramButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  brandingText: { color: '#999', fontSize: 13, textAlign: 'center', marginBottom: 2 },
  brandingLink: { color: '#EF4444', fontSize: 13, textAlign: 'center', fontWeight: '500' },
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  contentContainer: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: 12, paddingHorizontal: 4 },
  settingItem: { backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, marginBottom: 1, borderWidth: 1, borderColor: "#E0E0E0" },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F8F9FA", alignItems: "center", justifyContent: "center" },
  settingLabel: { fontSize: 16, color: "#0F1419", flex: 1 },
  settingValue: { fontSize: 14, color: "#EF4444", fontWeight: "600" },
  subscriptionCard: { backgroundColor: "#FEE2E2", padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#EF4444" },
  subscriptionTitle: { fontSize: 14, color: "#666", marginBottom: 8 },
  subscriptionPlan: { fontSize: 24, fontWeight: "800", color: "#EF4444", marginBottom: 4 },
  subscriptionStatus: { fontSize: 14, color: "#666", textTransform: "capitalize" },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, marginTop: 24 },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#EF4444" },
  version: { textAlign: "center", fontSize: 12, color: "#999", marginTop: 16 },
  platformStatusContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  platformBadges: { flexDirection: "row", gap: 4 },
  warningBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF3C7", padding: 12, marginTop: 1, borderWidth: 1, borderColor: "#F59E0B" },
  warningText: { flex: 1, fontSize: 14, color: "#92400E" },
  platformDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E5E7EB" },
  platformDotActive: { backgroundColor: "#10B981" },
});
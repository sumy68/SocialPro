import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { User, Link2, Globe, CreditCard, FileText, HelpCircle, LogOut, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { useApp } from '@/contexts/AppContext';
import { usePlatformConnection } from '@/contexts/PlatformConnectionContext';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from "react";

export default function SettingsScreen() {
  const router = useRouter();
  const t = useTranslation();

  // ⬇️ WICHTIG: connectedPlatforms aus AppContext ziehen
  const { language, setLanguage, subscription, connectedPlatforms } = useApp();

  // Token-Checker kann bleiben (nur nicht mehr für den Counter)
  const { statusMap, checking, checkAllPlatforms, refreshPlatformToken } = usePlatformConnection();

  useEffect(() => {
    checkAllPlatforms();
  }, []);

  const handleLanguageToggle = () => {
    const newLang = language === 'de' ? 'en' : 'de';
    setLanguage(newLang);
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://smyagency.de/datenschutz-socialpro.html');
    } catch (error) {
      console.error('Error opening browser:', error);
      Alert.alert('Error', 'Could not open privacy policy');
    }
  };

  const handleManageSubscription = () => {
    Alert.alert(
      t.settings.manageSubscription,
      'In production, this would open App Store subscription settings'
    );
  };

  const handleRefreshPlatform = async (platform: 'instagram' | 'linkedin' | 'tiktok' | 'youtube') => {
    try {
      const result = await refreshPlatformToken(platform);
      if (result.success) {
        Alert.alert('Success', 'Token refreshed successfully');
      } else if (result.requiresReauth) {
        Alert.alert(
          'Reconnection Required',
          'Please reconnect your account',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reconnect', onPress: () => router.push('/onboarding/connect-platforms' as any) }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to refresh token');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to refresh token');
    }
  };

  // ✅ jetzt echter Count aus AppContext
  const connectedCount = connectedPlatforms.filter(p => p.connected).length;

  return (
    <>
      <Stack.Screen
        options={{
          title: t.settings.title,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.account}</Text>
          
          <SettingItem
            icon={<User size={24} color="#0A66C2" />}
            label={t.settings.profile}
            value="Edit"
            onPress={() => Alert.alert('Profile', 'Profile settings would open here')}
          />
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/onboarding/connect-platforms' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Link2 size={24} color="#E1306C" />
              </View>
              <Text style={styles.settingLabel}>{t.settings.connectedPlatforms}</Text>
            </View>

            {/* ✅ Badges + Zähler aus connectedPlatforms */}
            <View style={styles.platformStatusContainer}>
              {checking ? (
                <ActivityIndicator size="small" color="#0A66C2" />
              ) : (
                <View style={styles.platformBadges}>
                  {connectedPlatforms.map((p) => (
                    <View
                      key={p.platform}
                      style={[
                        styles.platformBadge,
                        { backgroundColor: p.connected ? '#D1FAE5' : '#F3F4F6' },
                      ]}
                    >
                      {p.connected ? (
                        <CheckCircle size={12} color="#10B981" />
                      ) : (
                        <View style={styles.disconnectedDot} />
                      )}
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.settingValue}>{connectedCount}/4</Text>
            </View>
          </TouchableOpacity>

          {/* Optional: Warnbanner weiterhin über statusMap (wenn dein Token-Checker Expiry kennt) */}
          {Object.values(statusMap).some(p => p.connected && p.isExpired) && (
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
            icon={<Globe size={24} color="#7C3AED" />}
            label={t.settings.language}
            value={language === 'de' ? t.settings.german : t.settings.english}
            onPress={handleLanguageToggle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.subscription}</Text>
          
          <View style={styles.subscriptionCard}>
            <Text style={styles.subscriptionTitle}>{t.settings.currentPlan}</Text>
            <Text style={styles.subscriptionPlan}>
              {subscription.plan === 'monthly' ? 'Monthly' : subscription.plan === 'yearly' ? 'Yearly' : 'No Plan'}
            </Text>
            <Text style={styles.subscriptionStatus}>
              Status: {subscription.status === 'trial' ? 'Trial' : subscription.status}
            </Text>
          </View>
          
          <SettingItem
            icon={<CreditCard size={24} color="#10B981" />}
            label={t.settings.manageSubscription}
            onPress={handleManageSubscription}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.legal}</Text>
          
          <SettingItem
            icon={<FileText size={24} color="#666" />}
            label={t.settings.privacyPolicy}
            onPress={handleOpenPrivacyPolicy}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.support}</Text>
          
          <SettingItem
            icon={<HelpCircle size={24} color="#F59E0B" />}
            label={t.settings.contactSupport}
            onPress={() => Alert.alert('Support', 'support@socialpro.app')}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t.settings.logout}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    fontWeight: '700' as const,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#0F1419',
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: '#0A66C2',
    fontWeight: '600' as const,
  },
  subscriptionCard: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0A66C2',
  },
  subscriptionTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  subscriptionPlan: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#0A66C2',
    marginBottom: 4,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 16,
  },
  platformStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  platformBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    marginTop: 1,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
  },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Linking,
  Image,
} from 'react-native';
import {
  User,
  Settings as SettingsIcon,
  CreditCard,
  Bell,
  Shield,
  Globe,
  Palette,
  Lock,
  Users,
  Database,
  MessageSquare,
  HelpCircle,
  Info,
  ChevronRight,
  LogOut,
  Camera,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { router } from 'expo-router';

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
}) => {
  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.textContainer}>
          <Text style={styles.settingsItemTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingsItemRight}>
        {rightElement}
        {showChevron && !rightElement && (
          <ChevronRight size={20} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );
};

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    postReminders: true,
    analytics: false,
    team: true,
    marketing: false,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSaveSettings = useCallback(async () => {
    try {
      // Hier würden normalerweise die Einstellungen gespeichert werden
      // Für jetzt simulieren wir das Speichern
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHasUnsavedChanges(false);
      Alert.alert(
        t('common.success'),
        t('common.settingsSaved')
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('settings.errorSaving')
      );
    }
  }, [t]);

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('settings.confirmLogout'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.logout'), onPress: logout, style: 'destructive' },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('account.deleteAccount'),
      t('account.deleteWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          onPress: () => {
            // Handle account deletion
            Alert.alert(t('settings.confirmDelete'), t('settings.comingSoon'));
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleContactSupport = (method: 'phone' | 'email') => {
    if (method === 'phone') {
      Linking.openURL('tel:+4915236137216');
    } else {
      Linking.openURL('mailto:info@smyagency.de');
    }
  };

  const handleOpenWebsite = (url: string) => {
    Linking.openURL(url);
  };

  const socialMediaPlatforms = [
    { name: 'Instagram', icon: Instagram, connected: true },
    { name: 'Facebook', icon: Facebook, connected: false },
    { name: 'LinkedIn', icon: Linkedin, connected: true },
    { name: 'YouTube', icon: Youtube, connected: false },
    { name: 'Twitter', icon: Twitter, connected: false },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      {/* Profile Section */}
      <SettingsSection title={t('settings.profile')}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Max Mustermann'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'max@example.com'}</Text>
          </View>
        </View>
        
        <SettingsItem
          icon={<User size={20} color="#8B5CF6" />}
          title={t('profile.personalInfo')}
          subtitle={`${t('profile.name')}, ${t('profile.email')}, ${t('profile.phone')}`}
          onPress={() => Alert.alert(t('profile.personalInfo'), t('settings.comingSoon'))}
        />
        
        <SettingsItem
          icon={<CreditCard size={20} color="#8B5CF6" />}
          title={t('profile.billingAddress')}
          subtitle={`${t('profile.billingAddress')} ${t('settings.manageBilling')}`}
          onPress={() => Alert.alert(t('profile.billingAddress'), t('settings.comingSoon'))}
        />
      </SettingsSection>

      {/* Account Section */}
      <SettingsSection title={t('settings.account')}>
        <SettingsItem
          icon={<Lock size={20} color="#8B5CF6" />}
          title={t('account.changePassword')}
          subtitle={t('account.changePassword')}
          onPress={() => Alert.alert(t('account.changePassword'), t('settings.comingSoon'))}
        />
      </SettingsSection>

      {/* Subscription Section */}
      <SettingsSection title={t('settings.subscription')}>
        <SettingsItem
          icon={<CreditCard size={20} color="#8B5CF6" />}
          title={t('subscription.currentPlan')}
          subtitle={`${user?.subscriptionType === 'yearly' ? t('subscription.yearly') : t('subscription.monthly')} - ${user?.subscriptionStatus === 'trial' ? t('subscription.trial') : t('subscription.active')}`}
          onPress={() => router.push('/subscription')}
        />
        
        <SettingsItem
          icon={<CreditCard size={20} color="#8B5CF6" />}
          title={t('subscription.paymentMethod')}
          subtitle={`${t('subscription.paymentMethod')} ${t('settings.manageBilling')}`}
          onPress={() => Alert.alert(t('subscription.paymentMethod'), t('settings.comingSoon'))}
        />
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection title={t('settings.notifications')}>
        <SettingsItem
          icon={<Bell size={20} color="#8B5CF6" />}
          title={t('notifications.pushNotifications')}
          rightElement={
            <Switch
              value={notifications.push}
              onValueChange={(value) => {
                setNotifications(prev => ({ ...prev, push: value }));
                setHasUnsavedChanges(true);
              }}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor={notifications.push ? '#FFFFFF' : '#FFFFFF'}
            />
          }
          showChevron={false}
        />
        
        <SettingsItem
          icon={<Bell size={20} color="#8B5CF6" />}
          title={t('notifications.emailNotifications')}
          rightElement={
            <Switch
              value={notifications.email}
              onValueChange={(value) => {
                setNotifications(prev => ({ ...prev, email: value }));
                setHasUnsavedChanges(true);
              }}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor={notifications.email ? '#FFFFFF' : '#FFFFFF'}
            />
          }
          showChevron={false}
        />
        
        <SettingsItem
          icon={<Bell size={20} color="#8B5CF6" />}
          title={t('notifications.analyticsAlerts')}
          subtitle={t('settings.aiNotifications')}
          rightElement={
            <Switch
              value={notifications.analytics}
              onValueChange={(value) => {
                setNotifications(prev => ({ ...prev, analytics: value }));
                setHasUnsavedChanges(true);
              }}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor={notifications.analytics ? '#FFFFFF' : '#FFFFFF'}
            />
          }
          showChevron={false}
        />
      </SettingsSection>

      {/* Security Section */}
      <SettingsSection title={t('settings.security')}>
        <SettingsItem
          icon={<Shield size={20} color="#8B5CF6" />}
          title={t('security.twoFactor')}
          subtitle={twoFactorEnabled ? t('settings.enabled') : t('settings.disabled')}
          rightElement={
            <Switch
              value={twoFactorEnabled}
              onValueChange={(value) => {
                setTwoFactorEnabled(value);
                setHasUnsavedChanges(true);
              }}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor={twoFactorEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          }
          showChevron={false}
        />
        
        <SettingsItem
          icon={<Shield size={20} color="#8B5CF6" />}
          title={t('security.deviceManagement')}
          subtitle={`${t('security.activeDevices')} ${t('settings.manageDevices')}`}
          onPress={() => Alert.alert(t('security.deviceManagement'), t('settings.comingSoon'))}
        />
      </SettingsSection>

      {/* Language & Region Section */}
      <SettingsSection title={t('settings.language')}>
        <SettingsItem
          icon={<Globe size={20} color="#8B5CF6" />}
          title={t('language.select')}
          subtitle={{
            de: 'Deutsch',
            en: 'English',
            tr: 'Türkçe',
            es: 'Español',
            fr: 'Français',
          }[language]}
          onPress={() => router.push('/language-selection')}
        />
      </SettingsSection>

      {/* Appearance Section */}
      <SettingsSection title={t('settings.appearance')}>
        <SettingsItem
          icon={<Palette size={20} color="#8B5CF6" />}
          title={t('appearance.theme')}
          subtitle={darkMode ? t('appearance.dark') : t('appearance.light')}
          rightElement={
            <Switch
              value={darkMode}
              onValueChange={(value) => {
                setDarkMode(value);
                setHasUnsavedChanges(true);
              }}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor={darkMode ? '#FFFFFF' : '#FFFFFF'}
            />
          }
          showChevron={false}
        />
      </SettingsSection>

      {/* Integrations Section */}
      <SettingsSection title={t('settings.integrations')}>
        <Text style={styles.subsectionTitle}>{t('integrations.socialMedia')}</Text>
        {socialMediaPlatforms.map((platform) => {
          const IconComponent = platform.icon;
          return (
            <SettingsItem
              key={platform.name}
              icon={<IconComponent size={20} color="#8B5CF6" />}
              title={platform.name}
              subtitle={platform.connected ? t('integrations.connected') : t('integrations.notConnected')}
              rightElement={
                platform.connected ? (
                  <CheckCircle size={20} color="#10B981" />
                ) : (
                  <XCircle size={20} color="#EF4444" />
                )
              }
              onPress={() => {
                if (platform.connected) {
                  Alert.alert(
                    `${platform.name} ${t('settings.disconnect')}`,
                    t('settings.confirmDisconnect').replace('{platform}', platform.name),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('integrations.disconnect'), style: 'destructive' },
                    ]
                  );
                } else {
                  Alert.alert(
                    `${platform.name} ${t('integrations.connect')}`,
                    t('settings.connectPlatform').replace('{platform}', platform.name),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('integrations.connect') },
                    ]
                  );
                }
              }}
            />
          );
        })}
      </SettingsSection>

      {/* Team Section */}
      <SettingsSection title={t('settings.team')}>
        <SettingsItem
          icon={<Users size={20} color="#8B5CF6" />}
          title={t('team.members')}
          subtitle={`${t('team.members')} ${t('settings.manageMembers')}`}
          onPress={() => Alert.alert(t('team.members'), t('settings.comingSoon'))}
        />
        
        <SettingsItem
          icon={<Users size={20} color="#8B5CF6" />}
          title={t('team.roles')}
          subtitle={t('team.roles')}
          onPress={() => Alert.alert(t('team.roles'), t('settings.comingSoon'))}
        />
      </SettingsSection>

      {/* Privacy Section */}
      <SettingsSection title={t('settings.privacy')}>
        <SettingsItem
          icon={<Database size={20} color="#8B5CF6" />}
          title={t('privacy.dataExport')}
          subtitle={t('privacy.dataDownload')}
          onPress={() => Alert.alert(t('privacy.dataExport'), t('settings.comingSoon'))}
        />
        
        <SettingsItem
          icon={<Shield size={20} color="#8B5CF6" />}
          title={t('privacy.privacyPolicy')}
          onPress={() => handleOpenWebsite('https://smyagency.de/datenschutz')}
        />
        
        <SettingsItem
          icon={<Shield size={20} color="#8B5CF6" />}
          title={t('privacy.termsOfService')}
          onPress={() => handleOpenWebsite('https://smyagency.de/agb')}
        />
      </SettingsSection>

      {/* Support Section */}
      <SettingsSection title={t('settings.support')}>
        <SettingsItem
          icon={<HelpCircle size={20} color="#8B5CF6" />}
          title={t('support.contactUs')}
          subtitle="+49 1523 6137216 • info@smyagency.de"
          onPress={() => {
            Alert.alert(
              t('support.contactUs'),
              t('settings.contactMethod'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('support.phone'), onPress: () => handleContactSupport('phone') },
                { text: t('support.email'), onPress: () => handleContactSupport('email') },
              ]
            );
          }}
        />
        
        <SettingsItem
          icon={<MessageSquare size={20} color="#8B5CF6" />}
          title={t('support.feedback')}
          subtitle={t('support.feedback')}
          onPress={() => Alert.alert(t('support.feedback'), t('settings.comingSoon'))}
        />
      </SettingsSection>

      {/* About Section */}
      <SettingsSection title={t('settings.about')}>
        <SettingsItem
          icon={<Info size={20} color="#8B5CF6" />}
          title={t('about.version')}
          subtitle="1.0.0 (Build 1)"
          showChevron={false}
        />
        
        <SettingsItem
          icon={<Info size={20} color="#8B5CF6" />}
          title={t('about.impressum')}
          onPress={() => handleOpenWebsite('https://smyagency.de/impressum.html')}
        />
      </SettingsSection>

      {/* Save Settings Button */}
      {hasUnsavedChanges && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSettings}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>{t('common.saveSettings')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Danger Zone */}
      <SettingsSection title={t('common.dangerZone')}>
        <SettingsItem
          icon={<LogOut size={20} color="#EF4444" />}
          title={t('common.logout')}
          onPress={handleLogout}
          showChevron={false}
        />
        
        <SettingsItem
          icon={<User size={20} color="#EF4444" />}
          title={t('account.deleteAccount')}
          subtitle={t('account.deleteWarning')}
          onPress={handleDeleteAccount}
          showChevron={false}
        />
      </SettingsSection>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SocialPro © 2024</Text>
        <Text style={styles.footerText}>{t('settings.madeWith')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginHorizontal: 20,
    marginTop: 8,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  saveButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
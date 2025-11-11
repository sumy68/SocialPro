import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BarChart3, Rocket, Users, Heart, MessageCircle, TrendingUp, ChevronRight, Bell, Clock, Lightbulb } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { platformPerformance } from '@/hooks/useAnalytics';
import React, { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { language, connectedPlatforms, posts, companyInfo } = useApp();
  const router = useRouter();
  
  const connectedPlatformData = useMemo(() => {
    return platformPerformance.filter(platform => 
      connectedPlatforms.find(cp => cp.platform === platform.platform && cp.connected)
    );
  }, [connectedPlatforms]);

  const totalMetrics = useMemo(() => {
    const connected = connectedPlatformData;
    const totalFollowers = connected.reduce((sum, p) => sum + p.followers, 0);
    const avgEngagement = connected.length > 0 
      ? (connected.reduce((sum, p) => sum + p.engagement, 0) / connected.length).toFixed(1)
      : '0.0';
    const totalReach = connected.reduce((sum, p) => sum + p.reach, 0);
    const postsThisWeek = posts.filter(post => {
      const postDate = new Date(post.scheduledDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return postDate > weekAgo;
    }).length;

    return {
      followers: totalFollowers,
      engagement: avgEngagement,
      reach: totalReach,
      postsCount: postsThisWeek
    };
  }, [connectedPlatformData, posts]);
  
  const userName = companyInfo?.companyName || (language === 'de' ? 'dort' : 'there');
  const greeting = language === 'de' ? `Guten Tag, ${userName}! 👋` : `Good Day, ${userName}! 👋`;
  const subtitle = language === 'de' ? 'Bereit, großartigen Content zu erstellen?' : 'Ready to create great content?';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color={Colors.text} strokeWidth={2} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.weeklyReviewCard}
          activeOpacity={0.7}
          onPress={() => {
            console.log('[Dashboard] Weekly review button pressed');
            try {
              router.push('/weekly-review');
              console.log('[Dashboard] Navigation to weekly-review initiated');
            } catch (error) {
              console.error('[Dashboard] Navigation error:', error);
            }
          }}
        >
          <View style={styles.weeklyReviewHeader}>
            <View style={styles.weeklyReviewIcon}>
              <BarChart3 size={24} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View style={styles.weeklyReviewTitleContainer}>
              <Text style={styles.weeklyReviewTitle}>
                {language === 'de' ? 'Wochenrückblick' : 'Weekly Review'}
              </Text>
              <Text style={styles.weeklyReviewDate}>
                {language === 'de' ? 'Woche vom 19.09. - 25.09.' : 'Week of Sept 19 - Sept 25'}
              </Text>
            </View>
            <ChevronRight size={24} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          
          <View style={styles.weeklyReviewStats}>
            <View style={styles.weeklyReviewStat}>
              <Text style={styles.weeklyReviewStatValue}>50.2K</Text>
              <Text style={styles.weeklyReviewStatLabel}>
                {language === 'de' ? 'Gesamtreichweite' : 'Total Reach'}
              </Text>
            </View>
            <View style={styles.weeklyReviewStat}>
              <Text style={styles.weeklyReviewStatValue}>1.4K</Text>
              <Text style={styles.weeklyReviewStatLabel}>
                {language === 'de' ? 'Gesamte Interaktionen' : 'Total Interactions'}
              </Text>
            </View>
            <View style={styles.weeklyReviewStat}>
              <Text style={styles.weeklyReviewStatValue}>+149</Text>
              <Text style={styles.weeklyReviewStatLabel}>
                {language === 'de' ? 'Neue Follower' : 'New Followers'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.aiContentCard}>
          <View style={styles.aiContentHeader}>
            <View style={styles.aiContentIcon}>
              <Rocket size={24} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View style={styles.aiContentTextContainer}>
              <Text style={styles.aiContentTitle}>
                {language === 'de' ? '🎯 KI-Content-Vorschlag' : '🎯 AI Content Suggestion'}
              </Text>
              <Text style={styles.aiContentDescription}>
                {language === 'de' 
                  ? '"Produktivitätstipps" sind im Trend! Erstelle jetzt ein Reel für 40% mehr Reichweite.'
                  : '"Productivity tips" are trending! Create a Reel now for 40% more reach.'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.aiContentButton}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/(create)')}
          >
            <Text style={styles.aiContentButtonText}>
              {language === 'de' ? 'Jetzt erstellen' : 'Create Now'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Übersicht' : 'Overview'}
          </Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Users size={20} color={Colors.purple} strokeWidth={2} />
                <Text style={styles.metricChange}>+12%</Text>
              </View>
              <Text style={styles.metricValue}>
                {totalMetrics.followers >= 1000 
                  ? `${(totalMetrics.followers / 1000).toFixed(1)}K` 
                  : totalMetrics.followers || 0}
              </Text>
              <Text style={styles.metricLabel}>
                {language === 'de' ? 'Gesamte Follower' : 'Total Followers'}
              </Text>
            </View>
            
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Heart size={20} color={Colors.accent} strokeWidth={2} />
                <Text style={styles.metricChange}>+0.8%</Text>
              </View>
              <Text style={styles.metricValue}>{totalMetrics.engagement || 0}%</Text>
              <Text style={styles.metricLabel}>
                {language === 'de' ? 'Engagement-Rate' : 'Engagement Rate'}
              </Text>
            </View>
            
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <MessageCircle size={20} color={Colors.success} strokeWidth={2} />
                <Text style={styles.metricChange}>+3</Text>
              </View>
              <Text style={styles.metricValue}>{totalMetrics.postsCount || 0}</Text>
              <Text style={styles.metricLabel}>
                {language === 'de' ? 'Posts diese Woche' : 'Posts this Week'}
              </Text>
            </View>
            
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <TrendingUp size={20} color={Colors.warning} strokeWidth={2} />
                <Text style={styles.metricChange}>+28%</Text>
              </View>
              <Text style={styles.metricValue}>
                {totalMetrics.reach >= 1000 
                  ? `${(totalMetrics.reach / 1000).toFixed(1)}K` 
                  : totalMetrics.reach || 0}
              </Text>
              <Text style={styles.metricLabel}>
                {language === 'de' ? 'Reichweite' : 'Reach'}
              </Text>
            </View>
          </View>
        </View>

        {connectedPlatformData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'de' ? 'Plattformen' : 'Platforms'}
            </Text>
            <View style={styles.platformList}>
              {connectedPlatformData.map((platform) => (
                <PlatformCard key={platform.platform} platform={platform} language={language} />
              ))}
            </View>
          </View>
        )}

        {connectedPlatformData.length === 0 && (
          <View style={styles.section}>
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIcon}>
                <Rocket size={48} color={Colors.accent} strokeWidth={2} />
              </View>
              <Text style={styles.emptyStateTitle}>
                {language === 'de' ? 'Keine Plattformen verbunden' : 'No Platforms Connected'}
              </Text>
              <Text style={styles.emptyStateDescription}>
                {language === 'de' 
                  ? 'Verbinde deine Social-Media-Konten in den Einstellungen, um Analytics zu sehen.'
                  : 'Connect your social media accounts in settings to see analytics.'}
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/(settings)')}
              >
                <Text style={styles.emptyStateButtonText}>
                  {language === 'de' ? 'Plattformen verbinden' : 'Connect Platforms'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? '💡 Wichtigste Erkenntnisse' : '💡 Top Insights'}
          </Text>
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <View style={[styles.insightIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <TrendingUp size={24} color={Colors.accent} strokeWidth={2} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>
                  {language === 'de' ? 'Video-Content übertrifft andere' : 'Video Content Outperforms'}
                </Text>
                <Text style={styles.insightDescription}>
                  {language === 'de' 
                    ? 'Ihre Video-Posts erhalten 40% mehr Interaktionen als statische Bilder'
                    : 'Your video posts get 40% more interactions than static images'}
                </Text>
                <View style={styles.insightBadge}>
                  <Text style={styles.insightBadgeText}>+40%</Text>
                </View>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={[styles.insightIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Clock size={24} color={Colors.accent} strokeWidth={2} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>
                  {language === 'de' ? 'Beste Posting-Zeit' : 'Best Posting Time'}
                </Text>
                <Text style={styles.insightDescription}>
                  {language === 'de' 
                    ? 'Ihre Zielgruppe ist an Wochentagen zwischen 14-16 Uhr am aktivsten'
                    : 'Your audience is most active on weekdays between 2-4 PM'}
                </Text>
                <View style={styles.insightBadge}>
                  <Text style={styles.insightBadgeText}>14-16 Uhr</Text>
                </View>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={[styles.insightIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Lightbulb size={24} color={Colors.accent} strokeWidth={2} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>
                  {language === 'de' ? 'Trending-Thema' : 'Trending Topic'}
                </Text>
                <Text style={styles.insightDescription}>
                  {language === 'de' 
                    ? 'Posts über Produktivität performen diese Woche 25% besser'
                    : 'Posts about productivity perform 25% better this week'}
                </Text>
                <View style={styles.insightBadge}>
                  <Text style={styles.insightBadgeText}>+25%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? '🎯 Empfehlungen' : '🎯 Recommendations'}
          </Text>
          <View style={styles.recommendationsContainer}>
            <TouchableOpacity 
              style={styles.recommendationCard}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/(create)')}
            >
              <View style={styles.recommendationPriority}>
                <View style={[styles.priorityDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.priorityText}>
                  {language === 'de' ? 'Hohe Priorität' : 'High Priority'}
                </Text>
              </View>
              <Text style={styles.recommendationTitle}>
                {language === 'de' ? 'Mehr Video-Content erstellen' : 'Create More Video Content'}
              </Text>
              <Text style={styles.recommendationDescription}>
                {language === 'de' 
                  ? 'Video-Posts sind Ihre Top-Performer. Erstellen Sie diese Woche 2-3 weitere Reels.'
                  : 'Video posts are your top performers. Create 2-3 more Reels this week.'}
              </Text>
              <View style={styles.recommendationAction}>
                <Text style={styles.recommendationActionText}>
                  {language === 'de' ? 'Reels erstellen' : 'Create Reels'}
                </Text>
                <ChevronRight size={16} color={Colors.accent} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.recommendationCard}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/(calendar)')}
            >
              <View style={styles.recommendationPriority}>
                <View style={[styles.priorityDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.priorityText}>
                  {language === 'de' ? 'Mittlere Priorität' : 'Medium Priority'}
                </Text>
              </View>
              <Text style={styles.recommendationTitle}>
                {language === 'de' ? 'Posting-Zeitplan optimieren' : 'Optimize Posting Schedule'}
              </Text>
              <Text style={styles.recommendationDescription}>
                {language === 'de' 
                  ? 'Planen Sie mehr Posts zwischen 14-16 Uhr für maximale Sichtbarkeit.'
                  : 'Schedule more posts between 2-4 PM for maximum visibility.'}
              </Text>
              <View style={styles.recommendationAction}>
                <Text style={styles.recommendationActionText}>
                  {language === 'de' ? 'Posts planen' : 'Schedule Posts'}
                </Text>
                <ChevronRight size={16} color={Colors.warning} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? '👁️ Reichweite im Detail' : '👁️ Reach Details'}
          </Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {language === 'de' ? 'Organische Reichweite' : 'Organic Reach'}
              </Text>
              <Text style={styles.detailValue}>142.8K</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {language === 'de' ? 'Bezahlte Reichweite' : 'Paid Reach'}
              </Text>
              <Text style={styles.detailValue}>13.4K</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {language === 'de' ? 'Virale Reichweite' : 'Viral Reach'}
              </Text>
              <Text style={styles.detailValue}>8.2K</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>
                {language === 'de' ? 'Story-Reichweite' : 'Story Reach'}
              </Text>
              <Text style={styles.detailValue}>24.6K</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? '❤️ Engagement-Details' : '❤️ Engagement Details'}
          </Text>
          <View style={styles.engagementGrid}>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>8.7K</Text>
              <Text style={styles.engagementLabel}>
                {language === 'de' ? 'Likes' : 'Likes'}
              </Text>
              <Text style={styles.engagementChange}>+18%</Text>
            </View>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>1.2K</Text>
              <Text style={styles.engagementLabel}>
                {language === 'de' ? 'Kommentare' : 'Comments'}
              </Text>
              <Text style={styles.engagementChange}>+24%</Text>
            </View>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>456</Text>
              <Text style={styles.engagementLabel}>
                {language === 'de' ? 'Shares' : 'Shares'}
              </Text>
              <Text style={styles.engagementChange}>+32%</Text>
            </View>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>234</Text>
              <Text style={styles.engagementLabel}>
                {language === 'de' ? 'Speichern' : 'Saves'}
              </Text>
              <Text style={styles.engagementChange}>+41%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function PlatformCard({ platform, language }: { platform: typeof platformPerformance[0]; language: 'de' | 'en' }) {
  const platformName = getPlatformName(platform.platform);
  const platformColor = platform.color;
  
  return (
    <View style={styles.platformCard}>
      <View style={styles.platformCardContent}>
        <View style={styles.platformHeader}>
          <View style={[styles.platformIndicator, { backgroundColor: platformColor }]} />
          <View style={styles.platformInfo}>
            <Text style={styles.platformName}>{platformName}</Text>
            <Text style={styles.platformFollowers}>
              {platform.followers.toLocaleString()} {language === 'de' ? 'Follower' : 'Followers'}
            </Text>
          </View>
        </View>
        <Text style={styles.platformChange}>{platform.change}</Text>
      </View>
      <View style={styles.platformStats}>
        <View style={styles.platformStat}>
          <Text style={styles.platformStatLabel}>
            {language === 'de' ? 'Engagement' : 'Engagement'}
          </Text>
          <Text style={styles.platformStatValue}>{platform.engagement}%</Text>
        </View>
        <View style={styles.platformStat}>
          <Text style={styles.platformStatLabel}>
            {language === 'de' ? 'Reichweite' : 'Reach'}
          </Text>
          <Text style={styles.platformStatValue}>{(platform.reach / 1000).toFixed(1)}K</Text>
        </View>
      </View>
    </View>
  );
}

function getPlatformName(platform: string): string {
  switch (platform) {
    case 'instagram': return 'Instagram';
    case 'tiktok': return 'TikTok';
    case 'linkedin': return 'LinkedIn';
    case 'youtube': return 'YouTube';
    default: return platform;
  }
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  contentContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  weeklyReviewCard: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  weeklyReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weeklyReviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  weeklyReviewTitleContainer: {
    flex: 1,
  },
  weeklyReviewTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  weeklyReviewDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  weeklyReviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyReviewStat: {
    flex: 1,
  },
  weeklyReviewStatValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  weeklyReviewStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  aiContentCard: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  aiContentHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  aiContentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiContentTextContainer: {
    flex: 1,
  },
  aiContentTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  aiContentDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  aiContentButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  aiContentButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricChange: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.purple,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -1,
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  platformList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  platformCardContent: {
    marginBottom: 12,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformIndicator: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 12,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  platformFollowers: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  platformChange: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  platformStats: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  platformStat: {
    flex: 1,
  },
  platformStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  platformStatValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  insightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  insightBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  recommendationsContainer: {
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  recommendationPriority: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
  },
  recommendationTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  recommendationActionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  engagementCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  engagementValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  engagementLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  engagementChange: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  emptyStateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});

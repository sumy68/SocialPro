import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  BarChart3,
  Rocket,
  Users,
  Heart,
  MessageCircle,
  TrendingUp,
  ChevronRight,
  Clock,
  Lightbulb,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { translations } from '@/constants/translations';
import type { Language } from '@/constants/translations';
import { platformPerformance } from '@/mocks/analytics';
import React, { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { useDashboardInsights } from '@/hooks/useDashboardInsights';
import { useAIContentSuggestions } from '@/hooks/useAIContentSuggestions';
import { useWeeklyTips } from '@/hooks/useWeeklyTips';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { language, connectedPlatforms, posts, companyInfo, accountType, userProfile } = useApp();
  const router = useRouter();
  const { data: insights } = useDashboardInsights();
  const d = (translations[language as Language] ?? translations.de).dashboard;
  const { suggestions: aiSuggestions, loading: aiLoading } = useAIContentSuggestions();
  const { tips: weeklyTips, loading: tipsLoading } = useWeeklyTips();

  const connectedPlatformData = useMemo(() => {
    return platformPerformance.filter(platform =>
      connectedPlatforms.find(cp => cp.platform === platform.platform && cp.connected),
    );
  }, [connectedPlatforms]);

  const totalMetrics = useMemo(() => {
    const connected = connectedPlatformData;
    const totalFollowers = connected.reduce((sum, p) => sum + p.followers, 0);
    const avgEngagement =
      connected.length > 0
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
      postsCount: postsThisWeek,
    };
  }, [connectedPlatformData, posts]);

  const userName = companyInfo?.companyName || '';
  const greeting = `${d.welcome}, ${userName}! 👋`;
  const subtitle = d.overview;

  const formatK = (value?: number) => {
    if (!value || value === 0) return '0';
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return String(value);
  };

  const formatPercent = (value?: number) => {
    if (value == null) return '0%';
    if (value > 0) return `+${value}%`;
    if (value < 0) return `${value}%`;
    return '0%';
  };

  const formatSigned = (value?: number) => {
    if (value == null) return '+0';
    if (value > 0) return `+${value}`;
    if (value < 0) return `${value}`;
    return '0';
  };

  const generatedInsights = useMemo(() => {
    type InsightCard = {
      id: string;
      icon: 'trending' | 'clock' | 'lightbulb';
      title: string;
      description: string;
      badge: string;
    };

    if (!insights) {
      const t = (de: string, en: string) => language === 'de' ? de : language === 'es' ? en : language === 'tr' ? en : en;
      const cards: InsightCard[] = [
        {
          id: 'fallback-1',
          icon: 'trending',
          title: t('Video-Content übertrifft andere', 'Video Content Outperforms'),
          description: t(
            'Ihre Video-Posts erhalten 40% mehr Interaktionen als statische Bilder',
            'Your video posts get 40% more interactions than static images',
          ),
          badge: '+40%',
        },
        {
          id: 'fallback-2',
          icon: 'clock',
          title: t('Beste Posting-Zeit', 'Best Posting Time'),
          description: t(
            'Ihre Zielgruppe ist an Wochentagen zwischen 14-16 Uhr am aktivsten',
            'Your audience is most active on weekdays between 2-4 PM',
          ),
          badge: language === 'de' ? '14-16 Uhr' : '2-4 PM',
        },
        {
          id: 'fallback-3',
          icon: 'lightbulb',
          title: t('Trending-Thema', 'Trending Topic'),
          description: t(
            'Posts über Produktivität performen diese Woche 25% besser',
            'Posts about productivity perform 25% better this week',
          ),
          badge: '+25%',
        },
      ];
      return cards;
    }

    const t = (de: string, en: string) => language === 'de' ? de : language === 'es' ? en : language === 'tr' ? en : en;
    const eb = insights.engagementBreakdown;
    const rb = insights.reachBreakdown;
    const summary = insights.weeklySummary;

    const engagementMap = {
      likes: eb.likes ?? 0,
      comments: eb.comments ?? 0,
      shares: eb.shares ?? 0,
      saves: eb.saves ?? 0,
    };

    const topEngKey = (Object.keys(engagementMap) as Array<keyof typeof engagementMap>).reduce(
      (best, key) => (engagementMap[key] > engagementMap[best] ? key : best),
      'likes',
    );

    const topEngLabel =
      topEngKey === 'likes'
        ? t('Likes', 'Likes')
        : topEngKey === 'comments'
        ? t('Kommentare', 'Comments')
        : topEngKey === 'shares'
        ? t('Shares', 'Shares')
        : t('Speichern', 'Saves');

    const reachMap = {
      organic: rb.organic ?? 0,
      paid: rb.paid ?? 0,
      viral: rb.viral ?? 0,
      stories: rb.stories ?? 0,
    };

    const topReachKey = (Object.keys(reachMap) as Array<keyof typeof reachMap>).reduce(
      (best, key) => (reachMap[key] > reachMap[best] ? key : best),
      'organic',
    );

    const topReachLabel =
      topReachKey === 'organic'
        ? t('organische Reichweite', 'organic reach')
        : topReachKey === 'paid'
        ? t('bezahlte Reichweite', 'paid reach')
        : topReachKey === 'viral'
        ? t('virale Reichweite', 'viral reach')
        : t('Story-Reichweite', 'story reach');

    const engagementRate =
      summary.totalReach > 0
        ? Math.round((summary.totalInteractions / summary.totalReach) * 1000) / 10
        : 0;

    const cards: InsightCard[] = [
      {
        id: 'engagement-top',
        icon: 'trending',
        title: t(
          `${topEngLabel} sind dein stärkster Engagement-Treiber`,
          `${topEngLabel} are your strongest engagement driver`,
        ),
        description:
          language === 'de' ? `Interaktionen über ${topEngLabel}` : language === 'es' ? `Interacciones via ${topEngLabel}` : language === 'tr' ? `${topEngLabel} üzerinden etkileşim` : `Interactions via ${topEngLabel}`,
        badge: formatK(engagementMap[topEngKey]),
      },
      {
        id: 'reach-top',
        icon: 'clock',
        title:
          language === 'de' ? `Fokus auf ${topReachLabel}` : language === 'es' ? `Enfócate en ${topReachLabel}` : language === 'tr' ? `${topReachLabel} odaklan` : `Focus on ${topReachLabel}`,
        description:
          language === 'de' ? `Reichweite über ${topReachLabel}` : language === 'es' ? `Alcance via ${topReachLabel}` : language === 'tr' ? `${topReachLabel} erişim` : `Reach via ${topReachLabel}`,
        badge: formatK(reachMap[topReachKey]),
      },
      {
        id: 'engagement-rate',
        icon: 'lightbulb',
        title:
          d.engagementRate,
        description:
          language === 'de' ? `Engagement-Rate: ${engagementRate.toFixed(1)}%` : `Engagement rate: ${engagementRate.toFixed(1)}%`,
        badge: `${engagementRate.toFixed(1)}%`,
      },
    ];

    return cards;
  }, [insights, language]);

  const eb = insights?.engagementBreakdown;
  const summary = insights?.weeklySummary;

  const bestPlatform = useMemo(() => {
    if (connectedPlatformData.length === 0) return null;
    return connectedPlatformData.reduce((best, current) => 
      current.engagement > best.engagement ? current : best
    );
  }, [connectedPlatformData]);

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
                {d.weeklyReview}
              </Text>
              <Text style={styles.weeklyReviewDate}>
                {insights?.weekLabel || (d.thisWeek)}
              </Text>
            </View>
            <ChevronRight size={24} color="#FFFFFF" strokeWidth={2.5} />
          </View>

          <View style={styles.weeklyReviewStats}>
            <View style={styles.weeklyReviewStat}>
              <Text style={styles.weeklyReviewStatValue}>
                {insights?.weeklySummary ? formatK(insights.weeklySummary.totalReach) : '—'}
              </Text>
              <Text style={styles.weeklyReviewStatLabel}>
                {d.totalReach}
              </Text>
            </View>
            <View style={styles.weeklyReviewStat}>
              <Text style={styles.weeklyReviewStatValue}>
                {insights?.weeklySummary
                  ? formatK(insights.weeklySummary.totalInteractions)
                  : '—'}
              </Text>
              <Text style={styles.weeklyReviewStatLabel}>
                {d.totalInteractions}
              </Text>
            </View>
            <View style={styles.weeklyReviewStat}>
              <Text style={styles.weeklyReviewStatValue}>
                {insights?.weeklySummary ? `+${insights.weeklySummary.newFollowers}` : '+0'}
              </Text>
              <Text style={styles.weeklyReviewStatLabel}>
                {d.newFollowers}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {bestPlatform && (
          <View style={styles.bestPlatformCard}>
            <View style={styles.bestPlatformHeader}>
              <Text style={styles.bestPlatformEmoji}>👑</Text>
              <View style={styles.bestPlatformTextContainer}>
                <Text style={styles.bestPlatformTitle}>
                  {d.bestPlatform}
                </Text>
                <Text style={styles.bestPlatformName}>
                  {bestPlatform.platform === 'instagram' ? 'Instagram' : 
                   bestPlatform.platform === 'linkedin' ? 'LinkedIn' : 'TikTok'}
                </Text>
              </View>
              <Text style={styles.bestPlatformStat}>
                {bestPlatform.engagement}% {'Engagement'}
              </Text>
            </View>
          </View>
        )}

        {aiSuggestions.length > 0 && !aiLoading && (
          <View style={styles.aiContentCard}>
            <View style={styles.aiContentHeader}>
              <View style={styles.aiContentIcon}>
                <Rocket size={24} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={styles.aiContentTextContainer}>
                <Text style={styles.aiContentTitle}>
                  {d.aiContentSuggestion}
                </Text>
                <Text style={styles.aiContentDescription}>
                  {aiSuggestions[0].description}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.aiContentButton}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/(create)')}
            >
              <Text style={styles.aiContentButtonText}>
                {d.createNow}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Übersicht mit dynamischen lila Changes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {d.overview}
          </Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Users size={20} color={Colors.purple} strokeWidth={2} />
                <Text style={styles.metricChange}>
                  {summary ? formatPercent(summary.followersChangePercent) : '+0%'}
                </Text>
              </View>
              <Text style={styles.metricValue}>
                {totalMetrics.followers >= 1000
                  ? `${(totalMetrics.followers / 1000).toFixed(1)}K`
                  : totalMetrics.followers || 0}
              </Text>
              <Text style={styles.metricLabel}>
                {d.totalFollowers}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Heart size={20} color={Colors.accent} strokeWidth={2} />
                <Text style={styles.metricChange}>
                  {summary ? formatPercent(summary.engagementRateChangePercent) : '+0%'}
                </Text>
              </View>
              <Text style={styles.metricValue}>{totalMetrics.engagement || 0}%</Text>
              <Text style={styles.metricLabel}>
                {d.engagementRate}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <MessageCircle size={20} color={Colors.success} strokeWidth={2} />
                <Text style={styles.metricChange}>
                  {summary ? formatSigned(summary.postsChange) : '+0'}
                </Text>
              </View>
              <Text style={styles.metricValue}>{totalMetrics.postsCount || 0}</Text>
              <Text style={styles.metricLabel}>
                {d.postsThisWeek}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <TrendingUp size={20} color={Colors.warning} strokeWidth={2} />
                <Text style={styles.metricChange}>
                  {summary ? formatPercent(summary.reachChangePercent) : '+0%'}
                </Text>
              </View>
              <Text style={styles.metricValue}>
                {totalMetrics.reach >= 1000
                  ? `${(totalMetrics.reach / 1000).toFixed(1)}K`
                  : totalMetrics.reach || 0}
              </Text>
              <Text style={styles.metricLabel}>
                {d.reach}
              </Text>
            </View>
          </View>
        </View>

        {connectedPlatformData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {d.platforms}
            </Text>
            <View style={styles.platformList}>
              {connectedPlatformData.map(platform => (
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
                {d.noPlatforms}
              </Text>
              <Text style={styles.emptyStateDescription}>
                {d.noPlatformsDesc}
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/(settings)')}
              >
                <Text style={styles.emptyStateButtonText}>
                  {d.connectPlatforms}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {d.topInsights}
          </Text>
          <View style={styles.insightsContainer}>
            {generatedInsights.map(card => (
              <View key={card.id} style={styles.insightCard}>
                <View
                  style={[
                    styles.insightIconContainer,
                    { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                  ]}
                >
                  {card.icon === 'trending' && (
                    <TrendingUp size={24} color={Colors.accent} strokeWidth={2} />
                  )}
                  {card.icon === 'clock' && (
                    <Clock size={24} color={Colors.accent} strokeWidth={2} />
                  )}
                  {card.icon === 'lightbulb' && (
                    <Lightbulb size={24} color={Colors.accent} strokeWidth={2} />
                  )}
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{card.title}</Text>
                  <Text style={styles.insightDescription}>{card.description}</Text>
                  {!!card.badge && (
                    <View style={styles.insightBadge}>
                      <Text style={styles.insightBadgeText}>{card.badge}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {d.recommendations}
          </Text>
          <View style={styles.recommendationsContainer}>
            {weeklyTips.length > 0 ? weeklyTips.map((tip) => (
              <TouchableOpacity
                key={tip.id}
                style={styles.recommendationCard}
                activeOpacity={0.7}
                onPress={() => router.push(tip.actionRoute as any)}
              >
                <View style={styles.recommendationPriority}>
                  <View style={[styles.priorityDot, { backgroundColor: tip.priority === 'high' ? Colors.accent : tip.priority === 'medium' ? Colors.warning : Colors.success }]} />
                  <Text style={styles.priorityText}>
                    {tip.priority === 'high' ? d.highPriority : tip.priority === 'medium' ? d.mediumPriority : 'Low'}
                  </Text>
                </View>
                <Text style={styles.recommendationTitle}>{tip.title}</Text>
                <Text style={styles.recommendationDescription}>{tip.description}</Text>
                <View style={styles.recommendationAction}>
                  <Text style={styles.recommendationActionText}>{tip.actionLabel}</Text>
                  <ChevronRight size={16} color={tip.priority === 'high' ? Colors.accent : Colors.warning} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            )) : (
              <Text style={{ color: '#999', fontSize: 14 }}>{tipsLoading ? '...' : d.overview}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {d.reachDetails}
          </Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {d.organicReach}
              </Text>
              <Text style={styles.detailValue}>
                {insights ? formatK(insights.reachBreakdown.organic) : '0'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {d.paidReach}
              </Text>
              <Text style={styles.detailValue}>
                {insights ? formatK(insights.reachBreakdown.paid) : '0'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {d.viralReach}
              </Text>
              <Text style={styles.detailValue}>
                {insights ? formatK(insights.reachBreakdown.viral) : '0'}
              </Text>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>
                {d.storyReach}
              </Text>
              <Text style={styles.detailValue}>
                {insights ? formatK(insights.reachBreakdown.stories) : '0'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {d.engagementDetails}
          </Text>
          <View style={styles.engagementGrid}>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>{formatK(eb?.likes)}</Text>
              <Text style={styles.engagementLabel}>
                {d.likes}
              </Text>
              <Text style={styles.engagementChange}>
                {formatPercent(eb?.likesChange)}
              </Text>
            </View>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>{formatK(eb?.comments)}</Text>
              <Text style={styles.engagementLabel}>
                {d.comments}
              </Text>
              <Text style={styles.engagementChange}>
                {formatPercent(eb?.commentsChange)}
              </Text>
            </View>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>{formatK(eb?.shares)}</Text>
              <Text style={styles.engagementLabel}>
                {d.shares}
              </Text>
              <Text style={styles.engagementChange}>
                {formatPercent(eb?.sharesChange)}
              </Text>
            </View>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>{formatK(eb?.saves)}</Text>
              <Text style={styles.engagementLabel}>
                {d.saves}
              </Text>
              <Text style={styles.engagementChange}>
                {formatPercent(eb?.savesChange)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function PlatformCard({
  platform,
  language,
}: {
  platform: typeof platformPerformance[0];
  language: 'de' | 'en';
}) {
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
              {Number((platform as any).followers ?? 0).toLocaleString()}{' '}
              {d.followers}
            </Text>
          </View>
        </View>
        <Text style={styles.platformChange}>{platform.change}</Text>
      </View>
      <View style={styles.platformStats}>
        <View style={styles.platformStat}>
          <Text style={styles.platformStatLabel}>
            {'Engagement'}
          </Text>
          <Text style={styles.platformStatValue}>{platform.engagement}%</Text>
        </View>
        <View style={styles.platformStat}>
          <Text style={styles.platformStatLabel}>
            {d.reach}
          </Text>
          <Text style={styles.platformStatValue}>{(platform.reach / 1000).toFixed(1)}K</Text>
        </View>
      </View>
    </View>
  );
}

function getPlatformName(platform: string): string {
  switch (platform) {
    case 'instagram':
      return 'Instagram';
    case 'tiktok':
      return 'TikTok';
    case 'linkedin':
      return 'LinkedIn';
    default:
      return platform;
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
  bestPlatformCard: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  bestPlatformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestPlatformEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  bestPlatformTextContainer: {
    flex: 1,
  },
  bestPlatformTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 4,
    opacity: 0.7,
  },
  bestPlatformName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
    letterSpacing: -0.3,
  },
  bestPlatformStat: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
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
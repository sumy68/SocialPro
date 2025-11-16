import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Eye, Heart, Users, TrendingUp, TrendingDown, BarChart3, MessageCircle, Share2 } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Platform as SocialPlatform } from '@/constants/types';

type TimePeriod = '7' | '30' | '90';

export default function ReportsScreen() {
  const { posts, connectedPlatforms, language } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30');

  const periodDays = selectedPeriod === '7' ? 7 : selectedPeriod === '30' ? 30 : 90;

  const activePlatforms = useMemo(
    () =>
      (connectedPlatforms || [])
        .filter((p) => p.connected)
        .map((p) => p.platform as SocialPlatform),
    [connectedPlatforms]
  );

  const allPostedPosts = useMemo(
    () =>
      posts.filter(
        (p) =>
          p.status === 'posted' &&
          p.performance &&
          p.performance.length > 0 &&
          p.postedAt
      ),
    [posts]
  );

  const { currentPosts, previousPosts } = useMemo(() => {
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - periodDays);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - periodDays);

    const previousEnd = currentStart;

    const inRange = (d: Date, start: Date, end: Date) =>
      d.getTime() >= start.getTime() && d.getTime() < end.getTime();

    const _currentPosts = allPostedPosts.filter((p) =>
      inRange(new Date(p.postedAt), currentStart, now)
    );

    const _previousPosts = allPostedPosts.filter((p) =>
      inRange(new Date(p.postedAt), previousStart, previousEnd)
    );

    return { currentPosts: _currentPosts, previousPosts: _previousPosts };
  }, [allPostedPosts, periodDays]);

  const sumMetric = (
    postsArr: typeof allPostedPosts,
    metric: 'reach' | 'engagement' | 'impressions' | 'likes' | 'comments' | 'shares',
    platform?: SocialPlatform
  ): number => {
    return postsArr.reduce((sum, post) => {
      const perfEntries = (post.performance || []).filter((perf) =>
        platform ? perf.platform === platform : activePlatforms.includes(perf.platform)
      );
      const postSum = perfEntries.reduce((inner, perf) => inner + (perf[metric] || 0), 0);
      return sum + postSum;
    }, 0);
  };

  const calcChangePercent = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  const performanceHighlights = useMemo(() => {
    const currentReach = sumMetric(currentPosts, 'reach');
    const previousReach = sumMetric(previousPosts, 'reach');
    const currentEngagement = sumMetric(currentPosts, 'engagement');
    const previousEngagement = sumMetric(previousPosts, 'engagement');
    const currentImpressions = sumMetric(currentPosts, 'impressions');
    const previousImpressions = sumMetric(previousPosts, 'impressions');
    const currentLikes = sumMetric(currentPosts, 'likes');
    const previousLikes = sumMetric(previousPosts, 'likes');

    const reachChange = calcChangePercent(currentReach, previousReach);
    const engagementChange = calcChangePercent(currentEngagement, previousEngagement);
    const impressionsChange = calcChangePercent(currentImpressions, previousImpressions);
    const likesChange = calcChangePercent(currentLikes, previousLikes);

    const label =
      selectedPeriod === '7'
        ? language === 'de'
          ? 'vs. letzte 7 Tage'
          : 'vs. last 7 days'
        : selectedPeriod === '30'
        ? language === 'de'
          ? 'vs. letzter Monat'
          : 'vs. last 30 days'
        : language === 'de'
        ? 'vs. letzte 90 Tage'
        : 'vs. last 90 days';

    const formatChange = (val: number) =>
      `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;

    return [
      {
        id: '1',
        icon: 'eye',
        label: language === 'de' ? 'Reichweite' : 'Reach',
        value: formatNumber(currentReach),
        change: formatChange(reachChange),
        changePercent: reachChange,
        changeLabel: label,
        color: '#007AFF',
      },
      {
        id: '2',
        icon: 'heart',
        label: language === 'de' ? 'Engagement' : 'Engagement',
        value: formatNumber(currentEngagement),
        change: formatChange(engagementChange),
        changePercent: engagementChange,
        changeLabel: label,
        color: '#FF3B30',
      },
      {
        id: '3',
        icon: 'users',
        label: language === 'de' ? 'Impressionen' : 'Impressions',
        value: formatNumber(currentImpressions),
        change: formatChange(impressionsChange),
        changePercent: impressionsChange,
        changeLabel: label,
        color: '#34C759',
      },
      {
        id: '4',
        icon: 'trending-up',
        label: language === 'de' ? 'Likes' : 'Likes',
        value: formatNumber(currentLikes),
        change: formatChange(likesChange),
        changePercent: likesChange,
        changeLabel: label,
        color: '#FF9500',
      },
    ];
  }, [currentPosts, previousPosts, selectedPeriod, language, activePlatforms]);

  const platformPerformance = useMemo(() => {
    const result = activePlatforms.map((platform) => {
      const currentReach = sumMetric(currentPosts, 'reach', platform);
      const previousReach = sumMetric(previousPosts, 'reach', platform);
      const currentEngagement = sumMetric(currentPosts, 'engagement', platform);
      const previousEngagement = sumMetric(previousPosts, 'engagement', platform);

      const currentLikes = sumMetric(currentPosts, 'likes', platform);
      const previousLikes = sumMetric(previousPosts, 'likes', platform);

      const currentImpressions = sumMetric(currentPosts, 'impressions', platform);
      const previousImpressions = sumMetric(previousPosts, 'impressions', platform);

      const reachChange = calcChangePercent(currentReach, previousReach);
      const engagementChange = calcChangePercent(currentEngagement, previousEngagement);
      const impressionsChange = calcChangePercent(currentImpressions, previousImpressions);
      const likesChange = calcChangePercent(currentLikes, previousLikes);

      const avgEngagementRate =
        currentImpressions > 0 ? (currentEngagement / currentImpressions) * 100 : 0;

      return {
        platform,
        followers: Math.floor(currentReach * 0.3),
        reach: currentReach,
        engagement: parseFloat(avgEngagementRate.toFixed(1)),
        reachChange,
        engagementChange,
        likesChange,
        impressionsChange,
        change: `${reachChange > 0 ? '+' : ''}${reachChange.toFixed(1)}%`,
        color: getPlatformColor(platform),
      };
    });

    return result.sort(
      (a, b) =>
        b.reachChange - a.reachChange || b.reach - a.reach // zuerst Steigerung, dann absolute Reichweite
    );
  }, [activePlatforms, currentPosts, previousPosts]);

  const bestPlatform = useMemo(() => {
    if (platformPerformance.length === 0) return null;

    // nimm die Plattform mit der höchsten Reichweiten-Steigerung, bei Gleichstand höchste Reichweite
    return platformPerformance.reduce((best, current) => {
      const bestScore = best.reachChange * 2 + best.reach; // kleine Gewichtung
      const currentScore = current.reachChange * 2 + current.reach;
      return currentScore > bestScore ? current : best;
    });
  }, [platformPerformance]);

  const topPostsForPeriod = useMemo(() => {
    return currentPosts
      .slice()
      .sort((a, b) => {
        const aReach = (a.performance || []).reduce((s, p) => s + (p.reach || 0), 0);
        const bReach = (b.performance || []).reduce((s, p) => s + (p.reach || 0), 0);
        return bReach - aReach;
      })
      .slice(0, 5);
  }, [currentPosts]);

  function renderPlatformComparison() {
    if (!bestPlatform) {
      return (
        <Text style={{ color: '#666', fontSize: 13 }}>
          {language === 'de'
            ? 'Noch keine Daten für einen Plattform-Vergleich.'
            : 'No data available for platform comparison yet.'}
        </Text>
      );
    }

    return (
      <View>
        <View style={styles.bestPlatformCard}>
          <View style={styles.bestPlatformHeader}>
            <View
              style={[
                styles.crownIcon,
                { backgroundColor: bestPlatform.color + '15' },
              ]}
            >
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
            <View style={styles.bestPlatformInfo}>
              <Text style={styles.bestPlatformLabel}>
                {language === 'de'
                  ? 'Bestperformende Plattform'
                  : 'Best Performing Platform'}
              </Text>
              <Text
                style={[styles.bestPlatformName, { color: bestPlatform.color }]}
              >
                {formatPlatformName(bestPlatform.platform)}
              </Text>
            </View>
          </View>
          <View style={styles.bestPlatformStats}>
            <View style={styles.bestPlatformStat}>
              <Text style={styles.bestPlatformStatValue}>
                {formatNumber(bestPlatform.reach)}
              </Text>
              <Text style={styles.bestPlatformStatLabel}>
                {language === 'de' ? 'Reichweite' : 'Reach'}
              </Text>
            </View>
            <View style={styles.bestPlatformStat}>
              <Text style={styles.bestPlatformStatValue}>
                {bestPlatform.engagement.toFixed(1)}%
              </Text>
              <Text style={styles.bestPlatformStatLabel}>
                {language === 'de' ? 'Engagement-Rate' : 'Engagement rate'}
              </Text>
            </View>
            <View style={styles.bestPlatformStat}>
              <Text style={styles.bestPlatformStatValue}>
                {bestPlatform.change}
              </Text>
              <Text style={styles.bestPlatformStatLabel}>
                {language === 'de' ? 'Reichweiten-Wachstum' : 'Reach growth'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.platformsList}>
          {platformPerformance.map((platform) => {
            const isPositive = platform.reachChange >= 0;
            return (
              <View key={platform.platform} style={styles.platformCard}>
                <View style={styles.platformCardHeader}>
                  <View
                    style={[
                      styles.platformIndicator,
                      { backgroundColor: platform.color },
                    ]}
                  />
                  <Text style={styles.platformName}>
                    {formatPlatformName(platform.platform)}
                  </Text>
                  <View
                    style={[
                      styles.platformChange,
                      { backgroundColor: isPositive ? '#ECFDF5' : '#FEF2F2' },
                    ]}
                  >
                    {isPositive ? (
                      <TrendingUp size={12} color="#10B981" />
                    ) : (
                      <TrendingDown size={12} color="#EF4444" />
                    )}
                    <Text
                      style={[
                        styles.platformChangeText,
                        { color: isPositive ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {platform.change}
                    </Text>
                  </View>
                </View>

                <View style={styles.platformStats}>
                  <View style={styles.platformStatItem}>
                    <Text style={styles.platformStatLabel}>
                      {language === 'de' ? 'Follower' : 'Followers'}
                    </Text>
                    <Text style={styles.platformStatValue}>
                      {formatNumber(platform.followers)}
                    </Text>
                  </View>
                  <View style={styles.platformStatItem}>
                    <Text style={styles.platformStatLabel}>
                      {language === 'de' ? 'Reichweite' : 'Reach'}
                    </Text>
                    <Text style={styles.platformStatValue}>
                      {formatNumber(platform.reach)}
                    </Text>
                  </View>
                  <View style={styles.platformStatItem}>
                    <Text style={styles.platformStatLabel}>
                      {language === 'de' ? 'Engagement-Rate' : 'Eng. rate'}
                    </Text>
                    <Text style={styles.platformStatValue}>
                      {platform.engagement.toFixed(1)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.performanceBar}>
                  <View
                    style={[
                      styles.performanceBarFill,
                      {
                        width: `${Math.min(platform.engagement, 100)}%`,
                        backgroundColor: platform.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  const hasActivePlatforms = activePlatforms.length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Analytics',
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {language === 'de' ? 'Analytics' : 'Analytics'}
          </Text>
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === '7' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('7')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === '7' && styles.periodButtonTextActive,
                ]}
              >
                7 Tage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === '30' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('30')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === '30' && styles.periodButtonTextActive,
                ]}
              >
                30 Tage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === '90' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('90')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === '90' && styles.periodButtonTextActive,
                ]}
              >
                90 Tage
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!hasActivePlatforms && (
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <Text style={{ fontSize: 15, color: '#666', lineHeight: 20 }}>
              {language === 'de'
                ? 'Verbinde zuerst mindestens eine Plattform, damit wir deine Analytics aus echten Insights berechnen können.'
                : 'Connect at least one platform so we can calculate analytics from your real insights.'}
            </Text>
          </View>
        )}

        {hasActivePlatforms && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'de' ? 'Übersicht' : 'Overview'}
              </Text>
              <View style={styles.metricsGrid}>
                {performanceHighlights.map((metric) => {
                  const positive = metric.changePercent >= 0;
                  return (
                    <View key={metric.id} style={styles.metricCard}>
                      <View
                        style={[
                          styles.metricIconContainer,
                          { backgroundColor: metric.color + '15' },
                        ]}
                      >
                        {getIcon(metric.icon, metric.color)}
                      </View>
                      <Text style={styles.metricLabel}>{metric.label}</Text>
                      <Text style={styles.metricValue}>{metric.value}</Text>
                      <View style={styles.metricChangeContainer}>
                        {positive ? (
                          <TrendingUp size={14} color="#10B981" />
                        ) : (
                          <TrendingDown size={14} color="#EF4444" />
                        )}
                        <Text
                          style={[
                            styles.metricChange,
                            { color: positive ? '#10B981' : '#EF4444' },
                          ]}
                        >
                          {metric.change}
                        </Text>
                      </View>
                      <Text style={styles.metricChangeLabel}>
                        {metric.changeLabel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'de'
                  ? 'Plattform-Vergleich'
                  : 'Platform comparison'}
              </Text>
              {renderPlatformComparison()}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'de' ? 'Top Beiträge' : 'Top posts'}
              </Text>
              {topPostsForPeriod.length === 0 && (
                <Text style={{ fontSize: 13, color: '#666' }}>
                  {language === 'de'
                    ? 'Keine Beiträge im ausgewählten Zeitraum.'
                    : 'No posts in the selected period.'}
                </Text>
              )}
              {topPostsForPeriod.map((post) => {
                const totalReach =
                  post.performance?.reduce(
                    (sum, p) => sum + (p.reach || 0),
                    0
                  ) || 0;
                const totalLikes =
                  post.performance?.reduce(
                    (sum, p) => sum + (p.likes || 0),
                    0
                  ) || 0;
                const totalComments =
                  post.performance?.reduce(
                    (sum, p) => sum + (p.comments || 0),
                    0
                  ) || 0;
                const totalShares =
                  post.performance?.reduce(
                    (sum, p) => sum + (p.shares || 0),
                    0
                  ) || 0;

                return (
                  <View key={post.id} style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <View style={styles.postPlatformBadge}>
                        <Text style={styles.postPlatformText}>
                          {post.platforms.length}{' '}
                          {language === 'de'
                            ? post.platforms.length === 1
                              ? 'Plattform'
                              : 'Plattformen'
                            : post.platforms.length === 1
                            ? 'platform'
                            : 'platforms'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.postTitle} numberOfLines={2}>
                      {post.caption ||
                        (language === 'de' ? 'Kein Text' : 'No text')}
                    </Text>
                    <View style={styles.postStats}>
                      <View style={styles.postStat}>
                        <Eye size={16} color="#666" />
                        <Text style={styles.postStatText}>
                          {formatNumber(totalReach)}
                        </Text>
                      </View>
                      <View style={styles.postStat}>
                        <Heart size={16} color="#666" />
                        <Text style={styles.postStatText}>
                          {formatNumber(totalLikes)}
                        </Text>
                      </View>
                      <View style={styles.postStat}>
                        <MessageCircle size={16} color="#666" />
                        <Text style={styles.postStatText}>
                          {totalComments}
                        </Text>
                      </View>
                      <View style={styles.postStat}>
                        <Share2 size={16} color="#666" />
                        <Text style={styles.postStatText}>
                          {totalShares}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.postDate}>
                      {post.postedAt
                        ? new Date(post.postedAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

function getIcon(iconName: string, color: string) {
  const iconProps = { size: 20, color };
  switch (iconName) {
    case 'eye':
      return <Eye {...iconProps} />;
    case 'heart':
      return <Heart {...iconProps} />;
    case 'users':
      return <Users {...iconProps} />;
    case 'trending-up':
      return <TrendingUp {...iconProps} />;
    default:
      return <Eye {...iconProps} />;
  }
}

function getPlatformColor(platform: SocialPlatform | string): string {
  switch (platform) {
    case 'instagram':
      return '#E1306C';
    case 'linkedin':
      return '#0A66C2';
    case 'tiktok':
      return '#000000';
    default:
      return '#666666';
  }
}

function formatPlatformName(platform: string): string {
  switch (platform) {
    case 'instagram':
      return 'Instagram';
    case 'linkedin':
      return 'LinkedIn';
    case 'tiktok':
      return 'TikTok';
    default:
      return platform.charAt(0).toUpperCase() + platform.slice(1);
  }
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 80,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000000',
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
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -1,
  },
  metricChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  metricChangeLabel: {
    fontSize: 11,
    color: '#999',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postPlatformBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  postPlatformText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000000',
    marginBottom: 12,
    lineHeight: 22,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 13,
    color: '#666',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  bestPlatformCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  bestPlatformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  crownIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEmoji: {
    fontSize: 24,
  },
  bestPlatformInfo: {
    flex: 1,
  },
  bestPlatformLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  bestPlatformName: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  bestPlatformStats: {
    flexDirection: 'row',
    gap: 16,
  },
  bestPlatformStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  bestPlatformStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 4,
  },
  bestPlatformStatLabel: {
    fontSize: 11,
    color: '#666',
  },
  platformsList: {
    gap: 12,
  },
  platformCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  platformCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  platformIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  platformName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
  },
  platformChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  platformChangeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  platformStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  platformStatItem: {
    flex: 1,
  },
  platformStatLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  platformStatValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
  },
  performanceBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

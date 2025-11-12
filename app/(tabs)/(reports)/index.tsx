import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Eye, Heart, Users, TrendingUp, BarChart3, MessageCircle, Share2 } from 'lucide-react-native';
import React, { useState, useMemo } from "react";
import { useApp } from '@/contexts/AppContext';
import { Platform } from '@/constants/types';

type TimePeriod = '7' | '30' | '90';

export default function ReportsScreen() {
  const { posts } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30');
  
  const postedPosts = useMemo(() => posts.filter(p => p.status === 'posted' && p.performance), [posts]);
  
  const performanceHighlights = useMemo(() => {
    const totalReach = postedPosts.reduce((sum, post) => {
      return sum + (post.performance?.reduce((pSum, p) => pSum + p.reach, 0) || 0);
    }, 0);
    
    const totalEngagement = postedPosts.reduce((sum, post) => {
      return sum + (post.performance?.reduce((pSum, p) => pSum + p.engagement, 0) || 0);
    }, 0);
    
    const totalImpressions = postedPosts.reduce((sum, post) => {
      return sum + (post.performance?.reduce((pSum, p) => pSum + p.impressions, 0) || 0);
    }, 0);
    
    const totalLikes = postedPosts.reduce((sum, post) => {
      return sum + (post.performance?.reduce((pSum, p) => pSum + p.likes, 0) || 0);
    }, 0);
    
    return [
      { id: '1', icon: 'eye', label: 'Reichweite', value: formatNumber(totalReach), change: '+12%', changeLabel: 'vs. letzter Monat', color: '#007AFF' },
      { id: '2', icon: 'heart', label: 'Engagement', value: formatNumber(totalEngagement), change: '+8%', changeLabel: 'vs. letzter Monat', color: '#FF3B30' },
      { id: '3', icon: 'users', label: 'Impressionen', value: formatNumber(totalImpressions), change: '+15%', changeLabel: 'vs. letzter Monat', color: '#34C759' },
      { id: '4', icon: 'trending-up', label: 'Likes', value: formatNumber(totalLikes), change: '+10%', changeLabel: 'vs. letzter Monat', color: '#FF9500' },
    ];
  }, [postedPosts]);
  
  const platformPerformance = useMemo(() => {
    const platforms: Platform[] = ['instagram', 'linkedin', 'tiktok'];
    
    return platforms.map(platform => {
      const platformPosts = postedPosts.filter(p => p.platforms.includes(platform));
      const platformMetrics = platformPosts.flatMap(p => p.performance?.filter(perf => perf.platform === platform) || []);
      
      const totalReach = platformMetrics.reduce((sum, m) => sum + m.reach, 0);
      const totalEngagement = platformMetrics.reduce((sum, m) => sum + m.engagement, 0);
      const avgEngagement = platformMetrics.length > 0 ? totalEngagement / platformMetrics.length : 0;
      
      return {
        platform,
        followers: Math.floor(totalReach * 0.3),
        reach: totalReach,
        engagement: parseFloat(avgEngagement.toFixed(1)),
        change: '+' + Math.floor(Math.random() * 20 + 5) + '%',
        color: getPlatformColor(platform),
      };
    }).sort((a, b) => (b.reach * b.engagement) - (a.reach * a.engagement));
  }, [postedPosts]);

  const bestPlatform = useMemo(() => {
    if (platformPerformance.length === 0) {
      return {
        platform: 'instagram' as Platform,
        followers: 0,
        reach: 0,
        engagement: 0,
        change: '+0%',
        color: '#E1306C',
      };
    }
    return platformPerformance.reduce((best, current) => {
      const currentScore = current.reach * (current.engagement / 100);
      const bestScore = best.reach * (best.engagement / 100);
      return currentScore > bestScore ? current : best;
    });
  }, [platformPerformance]);

  function renderPlatformComparison() {
    return (
      <View>
        <View style={styles.bestPlatformCard}>
          <View style={styles.bestPlatformHeader}>
            <View style={[styles.crownIcon, { backgroundColor: bestPlatform.color + '15' }]}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
            <View style={styles.bestPlatformInfo}>
              <Text style={styles.bestPlatformLabel}>Bestperformende Plattform</Text>
              <Text style={[styles.bestPlatformName, { color: bestPlatform.color }]}>
                {bestPlatform.platform.charAt(0).toUpperCase() + bestPlatform.platform.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.bestPlatformStats}>
            <View style={styles.bestPlatformStat}>
              <Text style={styles.bestPlatformStatValue}>{formatNumber(bestPlatform.reach)}</Text>
              <Text style={styles.bestPlatformStatLabel}>Reichweite</Text>
            </View>
            <View style={styles.bestPlatformStat}>
              <Text style={styles.bestPlatformStatValue}>{bestPlatform.engagement}%</Text>
              <Text style={styles.bestPlatformStatLabel}>Engagement</Text>
            </View>
            <View style={styles.bestPlatformStat}>
              <Text style={styles.bestPlatformStatValue}>{bestPlatform.change}</Text>
              <Text style={styles.bestPlatformStatLabel}>Wachstum</Text>
            </View>
          </View>
        </View>

        <View style={styles.platformsList}>
          {platformPerformance.map((platform) => (
            <View key={platform.platform} style={styles.platformCard}>
              <View style={styles.platformCardHeader}>
                <View style={[styles.platformIndicator, { backgroundColor: platform.color }]} />
                <Text style={styles.platformName}>
                  {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                </Text>
                <View style={styles.platformChange}>
                  <TrendingUp size={12} color="#10B981" />
                  <Text style={styles.platformChangeText}>{platform.change}</Text>
                </View>
              </View>
              
              <View style={styles.platformStats}>
                <View style={styles.platformStatItem}>
                  <Text style={styles.platformStatLabel}>Follower</Text>
                  <Text style={styles.platformStatValue}>{formatNumber(platform.followers)}</Text>
                </View>
                <View style={styles.platformStatItem}>
                  <Text style={styles.platformStatLabel}>Reichweite</Text>
                  <Text style={styles.platformStatValue}>{formatNumber(platform.reach)}</Text>
                </View>
                <View style={styles.platformStatItem}>
                  <Text style={styles.platformStatLabel}>Engagement</Text>
                  <Text style={styles.platformStatValue}>{platform.engagement}%</Text>
                </View>
              </View>
              
              <View style={styles.performanceBar}>
                <View 
                  style={[
                    styles.performanceBarFill, 
                    { 
                      width: `${(platform.engagement / 10) * 100}%`,
                      backgroundColor: platform.color 
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Analytics',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.periodSelector}>
            <TouchableOpacity 
              style={[styles.periodButton, selectedPeriod === '7' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('7')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === '7' && styles.periodButtonTextActive]}>7 Tage</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.periodButton, selectedPeriod === '30' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('30')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === '30' && styles.periodButtonTextActive]}>30 Tage</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.periodButton, selectedPeriod === '90' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('90')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === '90' && styles.periodButtonTextActive]}>90 Tage</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Übersicht</Text>
          <View style={styles.metricsGrid}>
            {performanceHighlights.map((metric) => (
              <View key={metric.id} style={styles.metricCard}>
                <View style={[styles.metricIconContainer, { backgroundColor: metric.color + '15' }]}>
                  {getIcon(metric.icon, metric.color)}
                </View>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <View style={styles.metricChangeContainer}>
                  <TrendingUp size={14} color="#10B981" />
                  <Text style={styles.metricChange}>{metric.change}</Text>
                </View>
                <Text style={styles.metricChangeLabel}>{metric.changeLabel}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plattform-Vergleich</Text>
          {renderPlatformComparison()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Beiträge</Text>
          {postedPosts.slice(0, 5).map((post) => {
            const totalReach = post.performance?.reduce((sum, p) => sum + p.reach, 0) || 0;
            const totalLikes = post.performance?.reduce((sum, p) => sum + p.likes, 0) || 0;
            const totalComments = post.performance?.reduce((sum, p) => sum + p.comments, 0) || 0;
            const totalShares = post.performance?.reduce((sum, p) => sum + p.shares, 0) || 0;
            
            return (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postPlatformBadge}>
                    <Text style={styles.postPlatformText}>
                      {post.platforms.length} {post.platforms.length === 1 ? 'Plattform' : 'Plattformen'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.postTitle} numberOfLines={2}>{post.caption || 'Kein Text'}</Text>
                <View style={styles.postStats}>
                  <View style={styles.postStat}>
                    <Eye size={16} color="#666" />
                    <Text style={styles.postStatText}>{formatNumber(totalReach)}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <Heart size={16} color="#666" />
                    <Text style={styles.postStatText}>{formatNumber(totalLikes)}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <MessageCircle size={16} color="#666" />
                    <Text style={styles.postStatText}>{totalComments}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <Share2 size={16} color="#666" />
                    <Text style={styles.postStatText}>{totalShares}</Text>
                  </View>
                </View>
                <Text style={styles.postDate}>
                  {post.postedAt ? new Date(post.postedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                </Text>
              </View>
            );
          })}
        </View>
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

function getPlatformColor(platform: Platform | string): string {
  switch (platform) {
    case 'instagram':
      return '#E1306C';
    case 'linkedin':
      return '#0A66C2';
      return '#FF0000';
    case 'tiktok':
      return '#000000';
    default:
      return '#666';
  }
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
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
    color: '#10B981',
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
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
  },
  platformChangeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#10B981',
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

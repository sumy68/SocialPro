import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  BarChart3,
  Lightbulb,
  Target,
  Users,
  Activity,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { translations } from '@/constants/translations';
import type { Language } from '@/constants/translations';
import { Colors } from '@/constants/colors';
import { useWeeklyData } from '@/hooks/useWeeklyData';

const { width } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  changePercent: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changePercent,
  icon,
  color,
}) => {
  const isPositive = change >= 0;

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statChange}>
        {isPositive ? (
          <TrendingUp size={16} color="#10B981" />
        ) : (
          <TrendingDown size={16} color="#EF4444" />
        )}
        <Text
          style={[
            styles.statChangeText,
            { color: isPositive ? '#10B981' : '#EF4444' },
          ]}
        >
          {isPositive ? '+' : ''}
          {changePercent.toFixed(1)}%
        </Text>
      </View>
      <Text style={styles.statCompare}>{wr.vsLastWeek || 'vs. last week'}</Text>
    </View>
  );
};

interface TopPost {
  id: string;
  platform: string;
  content: string;
  thumbnail?: string;
  publishedAt: Date;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
}

interface PostCardProps {
  post: TopPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? 'vor 1 Tag' : `vor ${diffDays} Tagen`;
  };

  return (
    <View style={styles.postCard}>
      {post.thumbnail && (
        <Image source={{ uri: post.thumbnail }} style={styles.postThumbnail} />
      )}
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <Text style={styles.postPlatform}>{post.platform}</Text>
          <Text style={styles.postType}>POST</Text>
        </View>
        <Text style={styles.postText} numberOfLines={2}>
          {post.content}
        </Text>
        <Text style={styles.postDate}>{formatDate(post.publishedAt)}</Text>

        <View style={styles.postStats}>
          <View style={styles.postStat}>
            <Eye size={14} color="#6B7280" />
            <Text style={styles.postStatText}>{formatNumber(post.reach)}</Text>
          </View>
          <View style={styles.postStat}>
            <Heart size={14} color="#6B7280" />
            <Text style={styles.postStatText}>{formatNumber(post.likes)}</Text>
          </View>
          <View style={styles.postStat}>
            <MessageCircle size={14} color="#6B7280" />
            <Text style={styles.postStatText}>
              {formatNumber(post.comments)}
            </Text>
          </View>
          <View style={styles.postStat}>
            <Share2 size={14} color="#6B7280" />
            <Text style={styles.postStatText}>{formatNumber(post.shares)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

interface Insight {
  title: string;
  description: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

interface InsightCardProps {
  insight: Insight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getTrendIcon = () => {
    switch (insight.trend) {
      case 'up':
        return <TrendingUp size={16} color={insight.color} />;
      case 'down':
        return <TrendingDown size={16} color={insight.color} />;
      default:
        return <Activity size={16} color={insight.color} />;
    }
  };

  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <View
          style={[
            styles.insightIcon,
            { backgroundColor: insight.color + '20' },
          ]}
        >
          <Lightbulb size={20} color={insight.color} />
        </View>
        <View style={styles.insightTrend}>
          {getTrendIcon()}
          <Text
            style={[styles.insightValue, { color: insight.color }]}
          >
            {insight.value}
          </Text>
        </View>
      </View>
      <Text style={styles.insightTitle}>{insight.title}</Text>
      <Text style={styles.insightDescription}>{insight.description}</Text>
    </View>
  );
};

interface Recommendation {
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  color: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onActionPress: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onActionPress,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.recommendationCard}>
      <View style={styles.recommendationHeader}>
        <View
          style={[
            styles.recommendationIcon,
            { backgroundColor: recommendation.color + '20' },
          ]}
        >
          <Target size={20} color={recommendation.color} />
        </View>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(recommendation.priority) + '20' },
          ]}
        >
          <Text
            style={[
              styles.priorityText,
              { color: getPriorityColor(recommendation.priority) },
            ]}
          >
            {recommendation.priority.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
      <Text style={styles.recommendationDescription}>
        {recommendation.description}
      </Text>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: recommendation.color }]}
        onPress={onActionPress}
      >
        <Text style={styles.actionButtonText}>{recommendation.action}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function WeeklyReviewScreen() {
  const { connectedPlatforms, posts, language } = useApp();
  const wr = (translations[language as Language] ?? translations.de).dashboard;
  const insets = useSafeAreaInsets();

  // echte Daten aus Hook (die intern aus deinen Insights kommen)
  const { data: weeklyData, isLoading } = useWeeklyData({
    connectedPlatforms,
    posts,
    language,
  });

  const hasConnectedPlatforms =
    connectedPlatforms && connectedPlatforms.some((p) => p.connected);

  const formatDateRange = (start: Date, end: Date): string => {
    const formatDate = (date: Date) =>
      date.toLocaleDateString(language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : language === 'tr' ? 'tr-TR' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Loading
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <Stack.Screen
          options={{
            title: wr.weeklyReview || 'Weekly Review',
            headerShown: true,
            headerBackTitle: '',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>
            {(wr.weeklyReview || 'Weekly Review') + '...'}
          </Text>
        </View>
      </View>
    );
  }

  // Kein Account verbunden → kein Fake-Report, nur Hinweis
  if (!hasConnectedPlatforms) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <Stack.Screen
          options={{
            title: wr.weeklyReview || 'Weekly Review',
            headerShown: true,
            headerBackTitle: '',
          }}
        />
        <View style={styles.emptyStateWrapper}>
          <Text style={styles.emptyStateTitle}>
            {wr.weeklyReview || 'Weekly Review'}
          </Text>
          <Text style={styles.emptyStateText}>
            {(translations[language as Language] ?? translations.de).reports?.connectFirst || 'Connect at least one platform so we can generate your weekly review.'}
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => router.push('/(tabs)/(settings)')}
          >
            <Text style={styles.emptyStateButtonText}>
              {wr.connectPlatforms || 'Connect platforms'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Falls Backend/Hooks noch nichts liefern → neutrale 0-Daten
  if (!weeklyData) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <Stack.Screen
          options={{
            title: wr.weeklyReview || 'Weekly Review',
            headerShown: true,
            headerBackTitle: '',
          }}
        />
        <View style={styles.emptyStateWrapper}>
          <Text style={styles.emptyStateTitle}>
            {wr.weeklyReview || 'Weekly Review'}
          </Text>
          <Text style={styles.emptyStateText}>
            {wr.noData || 'We don’t have enough data for this week yet.'}
          </Text>
        </View>
      </View>
    );
  }

  const comparison = weeklyData.comparisonToPreviousWeek ?? {
    reach: { change: 0, changePercent: 0 },
    engagement: { change: 0, changePercent: 0 },
    followers: { change: 0, changePercent: 0 },
    posts: { change: 0, changePercent: 0 },
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: wr.weeklyReview || 'Weekly Review',
          headerShown: true,
          headerBackTitle: '',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#5B72ED', '#3B54C7']} style={styles.header}>
          <Text style={styles.headerTitle}>
            {wr.weeklyReview || 'Weekly Review 📊'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {wr.overview || 'Performance from the last 7 days'}
          </Text>
          <Text style={styles.headerDate}>
            {formatDateRange(weeklyData.weekStart, weeklyData.weekEnd)}
          </Text>
        </LinearGradient>

        {/* PERFORMANCE HIGHLIGHTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {wr.highlights || 'Performance Highlights'}
          </Text>

          <View style={styles.statsGrid}>
            <StatCard
              title={wr.reach || 'Total Reach'}
              value={formatNumber(weeklyData.totalReach ?? 0)}
              change={comparison.reach.change ?? 0}
              changePercent={comparison.reach.changePercent ?? 0}
              icon={<Eye size={24} color="#EF4444" />}
              color="#EF4444"
            />
            <StatCard
              title={wr.engagement || 'Engagement'}
              value={formatNumber(weeklyData.totalEngagement ?? 0)}
              change={comparison.engagement.change ?? 0}
              changePercent={comparison.engagement.changePercent ?? 0}
              icon={<Heart size={24} color="#EF4444" />}
              color="#EF4444"
            />
            <StatCard
              title={wr.followers || 'New Followers'}
              value={formatNumber(weeklyData.newFollowers ?? 0)}
              change={comparison.followers.change ?? 0}
              changePercent={comparison.followers.changePercent ?? 0}
              icon={<Users size={24} color="#10B981" />}
              color="#10B981"
            />
            <StatCard
              title={
                wr.postsPublished || 'Posts Published'
              }
              value={(weeklyData.postsPublished ?? 0).toString()}
              change={comparison.posts.change ?? 0}
              changePercent={comparison.posts.changePercent ?? 0}
              icon={<Calendar size={24} color="#8B5CF6" />}
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* TOP POSTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {wr.topPosts || 'Top Performing Posts'}
          </Text>
          {(weeklyData.topPerformingPosts ?? []).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {(!weeklyData.topPerformingPosts ||
            weeklyData.topPerformingPosts.length === 0) && (
            <Text style={styles.emptySubText}>
              {wr.noPosts || 'No top posts this week.'}
            </Text>
          )}
        </View>

        {/* PLATFORM PERFORMANCE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {wr.platformPerformance || 'Platform Performance'}
          </Text>
          <View style={styles.platformGrid}>
            {(weeklyData.platformPerformance ?? []).map((platform, index) => (
              <View key={index} style={styles.platformCard}>
                <View
                  style={[
                    styles.platformHeader,
                    { backgroundColor: platform.color + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.platformName,
                      { color: platform.color },
                    ]}
                  >
                    {platform.platform}
                  </Text>
                </View>
                <View style={styles.platformStats}>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>
                      {wr.reach || 'Reach'}
                    </Text>
                    <Text style={styles.platformStatValue}>
                      {formatNumber(platform.reach ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>
                      {wr.engagement || 'Engagement'}
                    </Text>
                    <Text style={styles.platformStatValue}>
                      {formatNumber(platform.engagement ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>
                      {wr.engagementRate || 'Engagement Rate'}
                    </Text>
                    <Text style={styles.platformStatValue}>
                      {(platform.averageEngagementRate ?? 0).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* INSIGHTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {wr.insights || 'Insights'}
          </Text>
          {(weeklyData.insights ?? []).map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
          {(!weeklyData.insights || weeklyData.insights.length === 0) && (
            <Text style={styles.emptySubText}>
              {wr.noData || 'No insights available yet.'}
            </Text>
          )}
        </View>

        {/* RECOMMENDATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {wr.recommendations || 'Recommendations'}
          </Text>
          {(weeklyData.recommendations ?? []).map((recommendation, index) => {
            const handleActionPress = () => {
              if (recommendation.priority === 'high') {
                router.push('/(tabs)/(create)');
              } else if (recommendation.priority === 'medium') {
                router.push('/(tabs)/(calendar)');
              } else {
                // low priority -> später Reminder/sonstiges
                console.log(
                  '[Weekly Review] Low priority recommendation tapped',
                );
              }
            };

            return (
              <RecommendationCard
                key={index}
                recommendation={recommendation}
                onActionPress={handleActionPress}
              />
            );
          })}
          {(!weeklyData.recommendations ||
            weeklyData.recommendations.length === 0) && (
            <Text style={styles.emptySubText}>
              {wr.noData || 'No recommendations yet.'}
            </Text>
          )}
        </View>

        {/* ACTIONS */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/(reports)')}
          >
            <BarChart3 size={20} color="white" />
            <Text style={styles.primaryButtonText}>
              {wr.viewAnalytics || 'View Full Analytics'}
            </Text>
          </TouchableOpacity>

          <View className="secondaryButtons" style={styles.secondaryButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(tabs)/(create)')}
            >
              <Text style={styles.secondaryButtonText}>
                {wr.createContent || 'Create Content'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(tabs)/(calendar)')}
            >
              <Text style={styles.secondaryButtonText}>
                {wr.schedulePost || 'Schedule Post'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statChangeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  statCompare: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  postThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  postContent: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postPlatform: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  postType: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  postDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: (width - 60) / 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  platformHeader: {
    padding: 16,
    alignItems: 'center',
  },
  platformName: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  platformStats: {
    padding: 16,
    paddingTop: 0,
  },
  platformStat: {
    marginBottom: 8,
  },
  platformStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  platformStatValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginLeft: 4,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  actionSection: {
    padding: 20,
    paddingTop: 0,
  },
  primaryButton: {
    backgroundColor: '#5B72ED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  bottomPadding: {
    height: 40,
  },
  emptyStateWrapper: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  emptySubText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

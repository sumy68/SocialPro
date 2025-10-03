import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Download,
  ExternalLink,
  Users,
  Activity
} from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSocialMedia } from '@/contexts/SocialMediaContext';
import { WeeklyReviewData, TopPerformingPost, WeeklyInsight, WeeklyRecommendation } from '@/types/social';

// Import external translations
let externalTranslations: Record<string, Record<string, string>> = {};
try {
  const translationsModule = require('../translations.json');
  externalTranslations = translationsModule && typeof translationsModule === 'object' ? translationsModule : {};
  console.log('Loaded external translations, keys:', Object.keys(externalTranslations).length);
} catch (error) {
  console.warn('Could not load external translations:', error);
  externalTranslations = {};
}

const { width } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  changePercent: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changePercent, icon, color }) => {
  const { t } = useLanguage();
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
        <Text style={[styles.statChangeText, { color: isPositive ? '#10B981' : '#EF4444' }]}>
          {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
        </Text>
      </View>
      <Text style={styles.statCompare}>{t('weekly.comparedToLastWeek')}</Text>
    </View>
  );
};

interface PostCardProps {
  post: TopPerformingPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { t } = useLanguage();
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return t('analytics.weekAgo').replace('1 week', '1 day');
    } else {
      return t('analytics.daysAgo').replace('{days}', diffDays.toString());
    }
  };
  
  return (
    <View style={styles.postCard}>
      {post.thumbnail && (
        <Image source={{ uri: post.thumbnail }} style={styles.postThumbnail} />
      )}
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <Text style={styles.postPlatform}>{post.platform}</Text>
          <Text style={styles.postType}>{post.type.toUpperCase()}</Text>
        </View>
        <Text style={styles.postText} numberOfLines={2}>{post.content}</Text>
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
            <Text style={styles.postStatText}>{formatNumber(post.comments)}</Text>
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

interface InsightCardProps {
  insight: WeeklyInsight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const { t, language } = useLanguage();
  
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
  
  // Get translated text from external translations or fallback to original
  const getTranslatedText = (text: string): string => {
    if (externalTranslations[text] && externalTranslations[text][language]) {
      return externalTranslations[text][language];
    }
    return text;
  };
  
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
          <Lightbulb size={20} color={insight.color} />
        </View>
        <View style={styles.insightTrend}>
          {getTrendIcon()}
          <Text style={[styles.insightValue, { color: insight.color }]}>{insight.value}</Text>
        </View>
      </View>
      <Text style={styles.insightTitle}>{getTranslatedText(insight.title)}</Text>
      <Text style={styles.insightDescription}>{getTranslatedText(insight.description)}</Text>
    </View>
  );
};

interface RecommendationCardProps {
  recommendation: WeeklyRecommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const { language } = useLanguage();
  
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
  
  // Get translated text from external translations or fallback to original
  const getTranslatedText = (text: string): string => {
    console.log('Looking for translation:', text, 'in language:', language);
    console.log('Available keys:', Object.keys(externalTranslations));
    if (externalTranslations[text] && externalTranslations[text][language]) {
      console.log('Found translation:', externalTranslations[text][language]);
      return externalTranslations[text][language];
    }
    console.log('No translation found, returning original');
    return text;
  };
  
  return (
    <View style={styles.recommendationCard}>
      <View style={styles.recommendationHeader}>
        <View style={[styles.recommendationIcon, { backgroundColor: recommendation.color + '20' }]}>
          <Target size={20} color={recommendation.color} />
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(recommendation.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(recommendation.priority) }]}>
            {recommendation.priority.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.recommendationTitle}>{getTranslatedText(recommendation.title)}</Text>
      <Text style={styles.recommendationDescription}>{getTranslatedText(recommendation.description)}</Text>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: recommendation.color }]}>
        <Text style={styles.actionButtonText}>{getTranslatedText(recommendation.action)}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function WeeklyReviewScreen() {
  const { t } = useLanguage();
  const { generateWeeklyReview, getLatestWeeklyReview, accounts, isLoading } = useSocialMedia();
  const [reviewData, setReviewData] = useState<WeeklyReviewData | null>(null);
  const [generating, setGenerating] = useState(false);
  
  useEffect(() => {
    const existingReview = getLatestWeeklyReview();
    if (existingReview) {
      setReviewData(existingReview);
    }
  }, []);
  
  const handleGenerateReview = async () => {
    if (accounts.length === 0) {
      Alert.alert(
        t('weekly.noDataYet'),
        t('weekly.noDataDescription'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('weekly.connectAccounts'), onPress: () => router.push('/settings') }
        ]
      );
      return;
    }
    
    try {
      setGenerating(true);
      const newReview = await generateWeeklyReview();
      setReviewData(newReview);
      
      Alert.alert(
        t('weekly.reportReady'),
        t('weekly.subtitle')
      );
    } catch (error) {
      console.error('Error generating review:', error);
      Alert.alert(
        t('common.error'),
        'Failed to generate weekly review. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  };
  
  const formatDateRange = (start: Date, end: Date): string => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    return t('weekly.weekOf')
      .replace('{start}', formatDate(start))
      .replace('{end}', formatDate(end));
  };
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };
  
  if (isLoading || generating) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: t('weekly.title'), headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>
            {generating ? t('weekly.generatingReport') : t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!reviewData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: t('weekly.title'), headerShown: true }} />
        <View style={styles.emptyContainer}>
          <BarChart3 size={80} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>{t('weekly.noDataYet')}</Text>
          <Text style={styles.emptyDescription}>{t('weekly.noDataDescription')}</Text>
          
          <TouchableOpacity 
            style={styles.generateButton} 
            onPress={handleGenerateReview}
            disabled={accounts.length === 0}
          >
            <Text style={styles.generateButtonText}>
              {accounts.length === 0 ? t('weekly.connectAccounts') : t('weekly.generatingReport')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: t('weekly.title'), 
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleGenerateReview} style={styles.headerButton}>
              <Activity size={20} color="#3B82F6" />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>{t('weekly.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('weekly.subtitle')}</Text>
          <Text style={styles.headerDate}>{formatDateRange(reviewData.weekStart, reviewData.weekEnd)}</Text>
        </LinearGradient>
        
        {/* Performance Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('weekly.performanceHighlights')}</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title={t('weekly.totalReach')}
              value={formatNumber(reviewData.totalReach)}
              change={reviewData.comparisonToPreviousWeek.reach.change}
              changePercent={reviewData.comparisonToPreviousWeek.reach.changePercent}
              icon={<Eye size={24} color="#3B82F6" />}
              color="#3B82F6"
            />
            <StatCard
              title={t('weekly.totalEngagement')}
              value={formatNumber(reviewData.totalEngagement)}
              change={reviewData.comparisonToPreviousWeek.engagement.change}
              changePercent={reviewData.comparisonToPreviousWeek.engagement.changePercent}
              icon={<Heart size={24} color="#EF4444" />}
              color="#EF4444"
            />
            <StatCard
              title={t('weekly.newFollowers')}
              value={formatNumber(reviewData.newFollowers)}
              change={reviewData.comparisonToPreviousWeek.followers.change}
              changePercent={reviewData.comparisonToPreviousWeek.followers.changePercent}
              icon={<Users size={24} color="#10B981" />}
              color="#10B981"
            />
            <StatCard
              title={t('weekly.postsPublished')}
              value={reviewData.postsPublished.toString()}
              change={reviewData.comparisonToPreviousWeek.posts.change}
              changePercent={reviewData.comparisonToPreviousWeek.posts.changePercent}
              icon={<Calendar size={24} color="#8B5CF6" />}
              color="#8B5CF6"
            />
          </View>
        </View>
        
        {/* Top Performing Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('weekly.topPerformingPosts')}</Text>
          {reviewData.topPerformingPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </View>
        
        {/* Platform Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('weekly.platformPerformance')}</Text>
          <View style={styles.platformGrid}>
            {reviewData.platformPerformance.map((platform, index) => (
              <View key={index} style={styles.platformCard}>
                <View style={[styles.platformHeader, { backgroundColor: platform.color + '20' }]}>
                  <Text style={[styles.platformName, { color: platform.color }]}>{platform.platform}</Text>
                </View>
                <View style={styles.platformStats}>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>{t('weekly.reach')}</Text>
                    <Text style={styles.platformStatValue}>{formatNumber(platform.reach)}</Text>
                  </View>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>{t('weekly.engagement')}</Text>
                    <Text style={styles.platformStatValue}>{formatNumber(platform.engagement)}</Text>
                  </View>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>{t('weekly.engagementRate')}</Text>
                    <Text style={styles.platformStatValue}>{platform.averageEngagementRate}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('weekly.insights')}</Text>
          {reviewData.insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </View>
        
        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('weekly.recommendations')}</Text>
          {reviewData.recommendations.map((recommendation, index) => (
            <RecommendationCard key={index} recommendation={recommendation} />
          ))}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/analytics')}
          >
            <BarChart3 size={20} color="white" />
            <Text style={styles.primaryButtonText}>{t('weekly.viewFullAnalytics')}</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtons}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/create')}
            >
              <Text style={styles.secondaryButtonText}>{t('weekly.createContent')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/calendar')}
            >
              <Text style={styles.secondaryButtonText}>{t('weekly.schedulePost')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerButton: {
    padding: 8,
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
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
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statChangeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statCompare: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  postCard: {
    backgroundColor: 'white',
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
    fontWeight: '600',
    color: '#3B82F6',
  },
  postType: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 8,
  },
  postDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
    color: '#6B7280',
    marginLeft: 4,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformCard: {
    backgroundColor: 'white',
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
    fontWeight: 'bold',
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
    color: '#6B7280',
    marginBottom: 2,
  },
  platformStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  insightCard: {
    backgroundColor: 'white',
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
    fontWeight: 'bold',
    marginLeft: 4,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: 'white',
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
    fontWeight: 'bold',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#6B7280',
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
    fontWeight: '600',
  },
  actionSection: {
    padding: 20,
    paddingTop: 0,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
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
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
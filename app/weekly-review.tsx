import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,

  Dimensions,
  Platform
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
  Activity
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Colors } from '@/constants/colors';

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
      <Text style={styles.statCompare}>vs. letzte Woche</Text>
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
      return 'vor 1 Tag';
    } else {
      return `vor ${diffDays} Tagen`;
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
          <Text style={styles.postType}>POST</Text>
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
        <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
          <Lightbulb size={20} color={insight.color} />
        </View>
        <View style={styles.insightTrend}>
          {getTrendIcon()}
          <Text style={[styles.insightValue, { color: insight.color }]}>{insight.value}</Text>
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

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, onActionPress }) => {
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
        <View style={[styles.recommendationIcon, { backgroundColor: recommendation.color + '20' }]}>
          <Target size={20} color={recommendation.color} />
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(recommendation.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(recommendation.priority) }]}>
            {recommendation.priority.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
      <Text style={styles.recommendationDescription}>{recommendation.description}</Text>
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
  const insets = useSafeAreaInsets();
  const [isLoading] = useState(false);
  
  const getPlatformColor = (platformName: string): string => {
    const normalizedPlatform = platformName.toLowerCase();
    switch (normalizedPlatform) {
      case 'instagram': return '#E1306C';
      case 'tiktok': return '#000000';
      case 'linkedin': return '#0A66C2';
      default: return '#5B72ED';
    }
  };

  const weeklyData = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekEnd = now;
    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(weekStart.getDate() - 7);

    const postsThisWeek = posts.filter(post => {
      const postDate = new Date(post.scheduledDate);
      return postDate >= weekStart && postDate <= weekEnd;
    });

    const postsLastWeek = posts.filter(post => {
      const postDate = new Date(post.scheduledDate);
      return postDate >= previousWeekStart && postDate < weekStart;
    });

    const totalReachThisWeek = postsThisWeek.length * 2800 + Math.floor(Math.random() * 5000);
    const totalReachLastWeek = postsLastWeek.length * 2500 + Math.floor(Math.random() * 4000);
    const reachChange = totalReachThisWeek - totalReachLastWeek;
    const reachChangePercent = totalReachLastWeek > 0 
      ? (reachChange / totalReachLastWeek) * 100 
      : 0;

    const totalEngagementThisWeek = postsThisWeek.length * 180 + Math.floor(Math.random() * 300);
    const totalEngagementLastWeek = postsLastWeek.length * 160 + Math.floor(Math.random() * 250);
    const engagementChange = totalEngagementThisWeek - totalEngagementLastWeek;
    const engagementChangePercent = totalEngagementLastWeek > 0 
      ? (engagementChange / totalEngagementLastWeek) * 100 
      : 0;

    const newFollowers = connectedPlatforms.filter(p => p.connected).length * 47 + Math.floor(Math.random() * 50);
    const newFollowersLastWeek = connectedPlatforms.filter(p => p.connected).length * 40 + Math.floor(Math.random() * 40);
    const followersChange = newFollowers - newFollowersLastWeek;
    const followersChangePercent = newFollowersLastWeek > 0 
      ? (followersChange / newFollowersLastWeek) * 100 
      : 0;

    const postsChange = postsThisWeek.length - postsLastWeek.length;
    const postsChangePercent = postsLastWeek.length > 0 
      ? (postsChange / postsLastWeek.length) * 100 
      : 0;

    const topPerformingPosts: TopPost[] = postsThisWeek.slice(0, 3).map((post, index) => {
      const primaryPlatform = post.platforms[0] || 'instagram';
      return {
        id: post.id,
        platform: primaryPlatform.charAt(0).toUpperCase() + primaryPlatform.slice(1),
        content: post.caption,
        thumbnail: post.mediaUrls?.[0] || `https://images.unsplash.com/photo-${1522543558187 + index}?w=400&h=400&fit=crop`,
        publishedAt: new Date(post.scheduledDate),
        reach: 15000 + Math.floor(Math.random() * 20000),
        likes: 300 + Math.floor(Math.random() * 400),
        comments: 50 + Math.floor(Math.random() * 150),
        shares: 20 + Math.floor(Math.random() * 80)
      };
    });

    const platformPerformance = connectedPlatforms
      .filter(p => p.connected)
      .map(platform => {
        const platformPosts = postsThisWeek.filter(p => 
          p.platforms.some(pl => pl.toLowerCase() === platform.platform.toLowerCase())
        );
        const reach = platformPosts.length * 12000 + Math.floor(Math.random() * 15000);
        const engagement = platformPosts.length * 680 + Math.floor(Math.random() * 800);
        const engagementRate = reach > 0 ? ((engagement / reach) * 100).toFixed(1) : '0.0';
        
        return {
          platform: platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1),
          reach,
          engagement,
          averageEngagementRate: parseFloat(engagementRate),
          color: getPlatformColor(platform.platform)
        };
      });

    const insights: Insight[] = [
      {
        title: language === 'de' ? 'Beste Performance am Nachmittag' : 'Best Performance in Afternoon',
        description: language === 'de' 
          ? 'Posts zwischen 14-16 Uhr erreichen 34% mehr Engagement'
          : 'Posts between 2-4 PM get 34% more engagement',
        value: '+34%',
        trend: 'up' as const,
        color: '#10B981'
      },
      {
        title: language === 'de' ? 'Video-Content übertrifft Bilder' : 'Video Content Outperforms Images',
        description: language === 'de'
          ? 'Videos erhalten durchschnittlich 2.5x mehr Interaktionen'
          : 'Videos get 2.5x more interactions on average',
        value: '2.5x',
        trend: 'up' as const,
        color: '#3B82F6'
      },
      {
        title: language === 'de' ? 'Hashtag-Performance steigt' : 'Hashtag Performance Rising',
        description: language === 'de'
          ? 'Posts mit 5-8 Hashtags performen am besten'
          : 'Posts with 5-8 hashtags perform best',
        value: '5-8',
        trend: 'neutral' as const,
        color: '#8B5CF6'
      }
    ];

    const recommendations: Recommendation[] = [
      {
        title: language === 'de' ? 'Mehr Video-Content erstellen' : 'Create More Video Content',
        description: language === 'de'
          ? 'Videos erzielen deutlich bessere Ergebnisse. Planen Sie 3-4 Videos pro Woche ein.'
          : 'Videos achieve significantly better results. Plan 3-4 videos per week.',
        action: language === 'de' ? 'Video planen' : 'Plan Video',
        priority: 'high' as const,
        color: '#EF4444'
      },
      {
        title: language === 'de' ? 'Optimale Posting-Zeiten nutzen' : 'Use Optimal Posting Times',
        description: language === 'de'
          ? 'Verschieben Sie mehr Posts in die Nachmittagsstunden für bessere Reichweite.'
          : 'Move more posts to afternoon hours for better reach.',
        action: language === 'de' ? 'Zeitplan anpassen' : 'Adjust Schedule',
        priority: 'medium' as const,
        color: '#F59E0B'
      },
      {
        title: language === 'de' ? 'Mehr Interaktion mit Followern' : 'More Interaction with Followers',
        description: language === 'de'
          ? 'Beantworten Sie Kommentare innerhalb der ersten Stunde für höhere Sichtbarkeit.'
          : 'Reply to comments within the first hour for higher visibility.',
        action: language === 'de' ? 'Erinnerung setzen' : 'Set Reminder',
        priority: 'low' as const,
        color: '#10B981'
      }
    ];

    return {
      weekStart,
      weekEnd,
      totalReach: totalReachThisWeek,
      totalEngagement: totalEngagementThisWeek,
      newFollowers,
      postsPublished: postsThisWeek.length,
      comparisonToPreviousWeek: {
        reach: { change: reachChange, changePercent: reachChangePercent },
        engagement: { change: engagementChange, changePercent: engagementChangePercent },
        followers: { change: followersChange, changePercent: followersChangePercent },
        posts: { change: postsChange, changePercent: postsChangePercent }
      },
      topPerformingPosts,
      platformPerformance,
      insights,
      recommendations
    };
  }, [connectedPlatforms, posts, language]);

  const mockData = weeklyData;
  
  const formatDateRange = (start: Date, end: Date): string => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    return `Woche vom ${formatDate(start)} - ${formatDate(end)}`;
  };
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ title: 'Wochenrückblick', headerShown: true }} />
      <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>
            {language === 'de' ? 'Lade Wochenrückblick...' : 'Loading Weekly Review...'}
          </Text>
      </View>
    </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen 
        options={{ 
          title: language === 'de' ? 'Wochenrückblick' : 'Weekly Review', 
          headerShown: true,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#5B72ED', '#3B54C7']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>
            {language === 'de' ? 'Wochenrückblick 📊' : 'Weekly Review 📊'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {language === 'de' 
              ? 'Performance der letzten 7 Tage'
              : 'Performance from the last 7 days'}
          </Text>
          <Text style={styles.headerDate}>{formatDateRange(mockData.weekStart, mockData.weekEnd)}</Text>
        </LinearGradient>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Performance-Highlights' : 'Performance Highlights'}
          </Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title={language === 'de' ? 'Gesamtreichweite' : 'Total Reach'}
              value={formatNumber(mockData.totalReach)}
              change={mockData.comparisonToPreviousWeek.reach.change}
              changePercent={mockData.comparisonToPreviousWeek.reach.changePercent}
              icon={<Eye size={24} color="#3B82F6" />}
              color="#3B82F6"
            />
            <StatCard
              title={language === 'de' ? 'Engagement' : 'Engagement'}
              value={formatNumber(mockData.totalEngagement)}
              change={mockData.comparisonToPreviousWeek.engagement.change}
              changePercent={mockData.comparisonToPreviousWeek.engagement.changePercent}
              icon={<Heart size={24} color="#EF4444" />}
              color="#EF4444"
            />
            <StatCard
              title={language === 'de' ? 'Neue Follower' : 'New Followers'}
              value={formatNumber(mockData.newFollowers)}
              change={mockData.comparisonToPreviousWeek.followers.change}
              changePercent={mockData.comparisonToPreviousWeek.followers.changePercent}
              icon={<Users size={24} color="#10B981" />}
              color="#10B981"
            />
            <StatCard
              title={language === 'de' ? 'Posts veröffentlicht' : 'Posts Published'}
              value={mockData.postsPublished.toString()}
              change={mockData.comparisonToPreviousWeek.posts.change}
              changePercent={mockData.comparisonToPreviousWeek.posts.changePercent}
              icon={<Calendar size={24} color="#8B5CF6" />}
              color="#8B5CF6"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Meistgesehene Inhalte' : 'Top Performing Posts'}
          </Text>
          {mockData.topPerformingPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Platform Performance' : 'Platform Performance'}
          </Text>
          <View style={styles.platformGrid}>
            {mockData.platformPerformance.map((platform, index) => (
              <View key={index} style={styles.platformCard}>
                <View style={[styles.platformHeader, { backgroundColor: platform.color + '20' }]}>
                  <Text style={[styles.platformName, { color: platform.color }]}>{platform.platform}</Text>
                </View>
                <View style={styles.platformStats}>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>
                      {language === 'de' ? 'Reichweite' : 'Reach'}
                    </Text>
                    <Text style={styles.platformStatValue}>{formatNumber(platform.reach)}</Text>
                  </View>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>
                      {language === 'de' ? 'Engagement' : 'Engagement'}
                    </Text>
                    <Text style={styles.platformStatValue}>{formatNumber(platform.engagement)}</Text>
                  </View>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>
                      {language === 'de' ? 'Engagement-Rate' : 'Engagement Rate'}
                    </Text>
                    <Text style={styles.platformStatValue}>{platform.averageEngagementRate}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Insights' : 'Insights'}
          </Text>
          {mockData.insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Empfehlungen' : 'Recommendations'}
          </Text>
          {mockData.recommendations.map((recommendation, index) => {
            const handleActionPress = () => {
              console.log('[Weekly Review] Action pressed:', recommendation.action);
              if (recommendation.priority === 'high') {
                router.push('/(tabs)/(create)');
              } else if (recommendation.priority === 'medium') {
                router.push('/(tabs)/(calendar)');
              } else {
                console.log('[Weekly Review] Set reminder action');
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
        </View>
        
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/(reports)')}
          >
            <BarChart3 size={20} color="white" />
            <Text style={styles.primaryButtonText}>
              {language === 'de' ? 'Vollständige Analytics anzeigen' : 'View Full Analytics'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtons}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/(tabs)/(create)')}
            >
              <Text style={styles.secondaryButtonText}>
                {language === 'de' ? 'Content erstellen' : 'Create Content'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/(tabs)/(calendar)')}
            >
              <Text style={styles.secondaryButtonText}>
                {language === 'de' ? 'Post planen' : 'Schedule Post'}
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
    color: '#3B82F6',
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
});

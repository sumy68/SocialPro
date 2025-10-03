import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Instagram,
  Youtube,
  Linkedin,
  Bell,
  Sparkles,
  BarChart3,
  Calendar,
  ArrowRight,
} from "lucide-react-native";
import { useLanguage } from '@/contexts/LanguageContext';
import { useSocialMedia } from '@/contexts/SocialMediaContext';
import { router } from 'expo-router';


export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { getLatestWeeklyReview } = useSocialMedia();
  
  const latestReview = getLatestWeeklyReview();

  const stats = [
    { id: "followers", label: t('dashboard.totalFollowers'), value: "24.8K", change: "+12%", icon: Users, color: "#8B5CF6" },
    { id: "engagement", label: t('dashboard.engagementRate'), value: "4.2%", change: "+0.8%", icon: Heart, color: "#EF4444" },
    { id: "posts", label: t('dashboard.postsThisWeek'), value: "12", change: "+3", icon: MessageCircle, color: "#10B981" },
    { id: "reach", label: t('dashboard.reach'), value: "156K", change: "+28%", icon: TrendingUp, color: "#F59E0B" },
  ];

  const platforms = [
    { id: "instagram", name: "Instagram", followers: "12.4K", icon: Instagram, color: "#E4405F", growth: "+5%" },
    { id: "tiktok", name: "TikTok", followers: "8.2K", icon: MessageCircle, color: "#000000", growth: "+12%" },
    { id: "linkedin", name: "LinkedIn", followers: "3.1K", icon: Linkedin, color: "#0077B5", growth: "+3%" },
    { id: "youtube", name: "YouTube", followers: "1.1K", icon: Youtube, color: "#FF0000", growth: "+8%" },
  ];

  const recentPosts = [
    { id: "post1", platform: "Instagram", content: t('dashboard.morningMotivation'), engagement: "2.4K", time: t('dashboard.hoursAgo').replace('{hours}', '2') },
    { id: "post2", platform: "TikTok", content: t('dashboard.productivityTip'), engagement: "5.1K", time: t('dashboard.hoursAgo').replace('{hours}', '4') },
    { id: "post3", platform: "LinkedIn", content: t('dashboard.industryInsights'), engagement: "892", time: t('dashboard.daysAgo').replace('{days}', '1') },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('dashboard.goodMorning')}</Text>
            <Text style={styles.subtitle}>{t('dashboard.readyToCreate')}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell color="#6B7280" size={24} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Weekly Review Card */}
        {latestReview ? (
          <TouchableOpacity 
            style={styles.weeklyReviewCard}
            onPress={() => router.push('/weekly-review')}
          >
            <LinearGradient
              colors={["#3B82F6", "#1D4ED8"]}
              style={styles.weeklyReviewGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.weeklyReviewContent}>
                <View style={styles.weeklyReviewHeader}>
                  <BarChart3 color="#FFFFFF" size={24} />
                  <View style={styles.weeklyReviewTextContainer}>
                    <Text style={styles.weeklyReviewTitle}>{t('weekly.title')}</Text>
                    <Text style={styles.weeklyReviewSubtitle}>
                      {t('weekly.weekOf')
                        .replace('{start}', latestReview.weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }))
                        .replace('{end}', latestReview.weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }))}
                    </Text>
                  </View>
                  <ArrowRight color="#FFFFFF" size={20} />
                </View>
                
                <View style={styles.weeklyReviewStats}>
                  <View style={styles.weeklyReviewStat}>
                    <Text style={styles.weeklyReviewStatValue}>
                      {latestReview.totalReach >= 1000 ? 
                        (latestReview.totalReach / 1000).toFixed(1) + 'K' : 
                        latestReview.totalReach.toString()}
                    </Text>
                    <Text style={styles.weeklyReviewStatLabel}>{t('weekly.totalReach')}</Text>
                  </View>
                  <View style={styles.weeklyReviewStat}>
                    <Text style={styles.weeklyReviewStatValue}>
                      {latestReview.totalEngagement >= 1000 ? 
                        (latestReview.totalEngagement / 1000).toFixed(1) + 'K' : 
                        latestReview.totalEngagement.toString()}
                    </Text>
                    <Text style={styles.weeklyReviewStatLabel}>{t('weekly.totalEngagement')}</Text>
                  </View>
                  <View style={styles.weeklyReviewStat}>
                    <Text style={styles.weeklyReviewStatValue}>+{latestReview.newFollowers}</Text>
                    <Text style={styles.weeklyReviewStatLabel}>{t('weekly.newFollowers')}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.weeklyReviewCard}
            onPress={() => router.push('/weekly-review')}
          >
            <LinearGradient
              colors={["#6B7280", "#4B5563"]}
              style={styles.weeklyReviewGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.weeklyReviewContent}>
                <View style={styles.weeklyReviewHeader}>
                  <BarChart3 color="#FFFFFF" size={24} />
                  <View style={styles.weeklyReviewTextContainer}>
                    <Text style={styles.weeklyReviewTitle}>{t('weekly.title')}</Text>
                    <Text style={styles.weeklyReviewSubtitle}>
                      {t('weekly.noDataDescription')}
                    </Text>
                  </View>
                  <ArrowRight color="#FFFFFF" size={20} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* AI Suggestion Card */}
        <LinearGradient
          colors={["#8B5CF6", "#7C3AED"]}
          style={styles.aiCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.aiCardContent}>
            <Sparkles color="#FFFFFF" size={24} />
            <View style={styles.aiTextContainer}>
              <Text style={styles.aiTitle}>{t('dashboard.aiContentSuggestion')}</Text>
              <Text style={styles.aiSubtitle}>
                {t('dashboard.productivityTrending')}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.aiButton}>
            <Text style={styles.aiButtonText}>{t('dashboard.createNow')}</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>{t('dashboard.overview')}</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View key={stat.id} style={[styles.statCard, { width: (width - 52) / 2 }]}>
                <View style={styles.statHeader}>
                  <stat.icon color={stat.color} size={20} />
                  <Text style={[styles.statChange, { color: stat.color }]}>{stat.change}</Text>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Platforms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.platforms')}</Text>
          <View style={styles.platformsContainer}>
            {platforms.map((platform) => (
              <View key={platform.id} style={[styles.platformCard, { width: (width - 52) / 2 }]}>
                <View style={styles.platformHeader}>
                  <View style={[styles.platformIcon, { backgroundColor: platform.color + "20" }]}>
                    <platform.icon color={platform.color} size={20} />
                  </View>
                  <Text style={[styles.platformGrowth, { color: "#10B981" }]}>{platform.growth}</Text>
                </View>
                <Text style={styles.platformFollowers}>{platform.followers}</Text>
                <Text style={styles.platformName}>{platform.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentPosts')}</Text>
          {recentPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postPlatform}>
                  <Text style={styles.postPlatformText}>{post.platform}</Text>
                </View>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
              <View style={styles.postFooter}>
                <Text style={styles.postEngagement}>{post.engagement} {t('dashboard.engagements')}</Text>
                <TouchableOpacity>
                  <Text style={styles.viewMore}>{t('dashboard.viewDetails')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },

  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    backgroundColor: "#EF4444",
    borderRadius: 4,
  },
  aiCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  aiCardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  aiTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  aiSubtitle: {
    fontSize: 14,
    color: "#E5E7EB",
    marginTop: 4,
    lineHeight: 20,
  },
  aiButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statChange: {
    fontSize: 12,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  platformsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  platformCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  platformHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  platformIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  platformGrowth: {
    fontSize: 12,
    fontWeight: "600",
  },
  platformFollowers: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  platformName: {
    fontSize: 14,
    color: "#6B7280",
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  postPlatform: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  postPlatformText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  postTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  postContent: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
    lineHeight: 20,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postEngagement: {
    fontSize: 12,
    color: "#6B7280",
  },
  viewMore: {
    fontSize: 12,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  weeklyReviewCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  weeklyReviewGradient: {
    borderRadius: 16,
    padding: 20,
  },
  weeklyReviewContent: {
    flex: 1,
  },
  weeklyReviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  weeklyReviewTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  weeklyReviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  weeklyReviewSubtitle: {
    fontSize: 14,
    color: "#E5E7EB",
    marginTop: 4,
    lineHeight: 20,
  },
  weeklyReviewStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weeklyReviewStat: {
    alignItems: "center",
  },
  weeklyReviewStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  weeklyReviewStatLabel: {
    fontSize: 12,
    color: "#E5E7EB",
    marginTop: 4,
    textAlign: "center",
  },
});
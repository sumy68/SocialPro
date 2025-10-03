import React, { useState } from "react";
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
  TrendingDown,
  Users,
  Heart,
  Eye,
  Target,
  Calendar,
  Award,
} from "lucide-react-native";
import { useLanguage } from '@/contexts/LanguageContext';

export default function AnalyticsScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const overviewStats = [
    {
      label: t('analytics.totalReach'),
      value: "156.2K",
      change: "+28.5%",
      trend: "up",
      icon: Eye,
      color: "#8B5CF6",
    },
    {
      label: t('analytics.engagementRate'),
      value: "4.2%",
      change: "+0.8%",
      trend: "up",
      icon: Heart,
      color: "#EF4444",
    },
    {
      label: t('analytics.newFollowers'),
      value: "2.4K",
      change: "+12.3%",
      trend: "up",
      icon: Users,
      color: "#10B981",
    },
    {
      label: t('analytics.profileVisits'),
      value: "8.9K",
      change: "-2.1%",
      trend: "down",
      icon: Target,
      color: "#F59E0B",
    },
  ];

  const platformStats = [
    {
      platform: "Instagram",
      followers: "12.4K",
      engagement: "5.2%",
      reach: "89.2K",
      color: "#E4405F",
      change: "+15%",
    },
    {
      platform: "TikTok",
      followers: "8.2K",
      engagement: "7.8%",
      reach: "45.1K",
      color: "#000000",
      change: "+32%",
    },
    {
      platform: "LinkedIn",
      followers: "3.1K",
      engagement: "2.4%",
      reach: "18.7K",
      color: "#0077B5",
      change: "+8%",
    },
    {
      platform: "YouTube",
      followers: "1.1K",
      engagement: "3.6%",
      reach: "3.2K",
      color: "#FF0000",
      change: "+22%",
    },
  ];

  const topPosts = [
    {
      id: 1,
      platform: "TikTok",
      content: "5 productivity hacks that changed my life",
      engagement: "12.4K",
      reach: "89.2K",
      date: t('analytics.daysAgo').replace('{days}', '2'),
      performance: "exceptional",
    },
    {
      id: 2,
      platform: "Instagram",
      content: "Behind the scenes of my morning routine",
      engagement: "8.7K",
      reach: "45.1K",
      date: t('analytics.daysAgo').replace('{days}', '5'),
      performance: "good",
    },
    {
      id: 3,
      platform: "LinkedIn",
      content: "The future of remote work: insights from 2024",
      engagement: "3.2K",
      reach: "18.9K",
      date: t('analytics.weekAgo'),
      performance: "average",
    },
  ];

  const insights = [
    {
      type: "trend",
      title: t('analytics.videoPerforming'),
      description: t('analytics.videoDescription'),
      action: t('analytics.createMoreVideos'),
      icon: TrendingUp,
      color: "#10B981",
    },
    {
      type: "timing",
      title: t('analytics.bestPostingTime'),
      description: t('analytics.timingDescription'),
      action: t('analytics.scheduleMore'),
      icon: Calendar,
      color: "#8B5CF6",
    },
    {
      type: "hashtag",
      title: t('analytics.hashtagTrending'),
      description: t('analytics.hashtagDescription'),
      action: t('analytics.useTrendingHashtags'),
      icon: Award,
      color: "#F59E0B",
    },
  ];

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "exceptional":
        return "#10B981";
      case "good":
        return "#8B5CF6";
      case "average":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const getPerformanceText = (performance: string) => {
    switch (performance) {
      case "exceptional":
        return t('analytics.exceptional');
      case "good":
        return t('analytics.good');
      case "average":
        return t('analytics.average');
      default:
        return performance;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('analytics.title')}</Text>
            <Text style={styles.subtitle}>{t('analytics.subtitle')}</Text>
          </View>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {(["7d", "30d", "90d"] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range === "7d" ? t('analytics.7days') : range === "30d" ? t('analytics.30days') : t('analytics.90days')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analytics.overview')}</Text>
          <View style={styles.statsGrid}>
            {overviewStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}>
                    <stat.icon color={stat.color} size={20} />
                  </View>
                  <View style={styles.statTrend}>
                    {stat.trend === "up" ? (
                      <TrendingUp color="#10B981" size={16} />
                    ) : (
                      <TrendingDown color="#EF4444" size={16} />
                    )}
                    <Text
                      style={[
                        styles.statChange,
                        { color: stat.trend === "up" ? "#10B981" : "#EF4444" },
                      ]}
                    >
                      {stat.change}
                    </Text>
                  </View>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Platform Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analytics.platformPerformance')}</Text>
          {platformStats.map((platform, index) => (
            <View key={index} style={styles.platformCard}>
              <View style={styles.platformHeader}>
                <View style={styles.platformInfo}>
                  <View
                    style={[
                      styles.platformIndicator,
                      { backgroundColor: platform.color },
                    ]}
                  />
                  <Text style={styles.platformName}>{platform.platform}</Text>
                </View>
                <Text style={styles.platformChange}>{platform.change}</Text>
              </View>
              <View style={styles.platformStats}>
                <View style={styles.platformStat}>
                  <Text style={styles.platformStatValue}>{platform.followers}</Text>
                  <Text style={styles.platformStatLabel}>{t('analytics.followers')}</Text>
                </View>
                <View style={styles.platformStat}>
                  <Text style={styles.platformStatValue}>{platform.engagement}</Text>
                  <Text style={styles.platformStatLabel}>{t('analytics.engagement')}</Text>
                </View>
                <View style={styles.platformStat}>
                  <Text style={styles.platformStatValue}>{platform.reach}</Text>
                  <Text style={styles.platformStatLabel}>{t('analytics.reach')}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Top Performing Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analytics.topPerformingPosts')}</Text>
          {topPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postPlatform}>
                  <Text style={styles.postPlatformText}>{post.platform}</Text>
                </View>
                <View
                  style={[
                    styles.performanceBadge,
                    { backgroundColor: getPerformanceColor(post.performance) + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.performanceText,
                      { color: getPerformanceColor(post.performance) },
                    ]}
                  >
                    {getPerformanceText(post.performance)}
                  </Text>
                </View>
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
              <View style={styles.postStats}>
                <View style={styles.postStat}>
                  <Heart color="#EF4444" size={16} />
                  <Text style={styles.postStatText}>{post.engagement}</Text>
                </View>
                <View style={styles.postStat}>
                  <Eye color="#6B7280" size={16} />
                  <Text style={styles.postStatText}>{post.reach}</Text>
                </View>
                <Text style={styles.postDate}>{post.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analytics.aiInsights')}</Text>
          {insights.map((insight, index) => (
            <LinearGradient
              key={index}
              colors={[insight.color + "10", insight.color + "05"]}
              style={styles.insightCard}
            >
              <View style={styles.insightHeader}>
                <View style={[styles.insightIcon, { backgroundColor: insight.color + "20" }]}>
                  <insight.icon color={insight.color} size={20} />
                </View>
                <Text style={styles.insightTitle}>{insight.title}</Text>
              </View>
              <Text style={styles.insightDescription}>{insight.description}</Text>
              <TouchableOpacity style={styles.insightAction}>
                <Text style={[styles.insightActionText, { color: insight.color }]}>
                  {insight.action}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },
  timeRangeContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  timeRangeTextActive: {
    color: "#111827",
  },
  section: {
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
    flex: 1,
    minWidth: "45%",
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
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  statTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  platformCard: {
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
  platformHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  platformInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  platformIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 12,
  },
  platformName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  platformChange: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  platformStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  platformStat: {
    alignItems: "center",
  },
  platformStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  platformStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
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
  performanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  postContent: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 12,
    lineHeight: 20,
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  postStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postStatText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  postDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: "auto",
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },
  insightDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  insightAction: {
    alignSelf: "flex-start",
  },
  insightActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
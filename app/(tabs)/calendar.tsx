import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Instagram,
  Youtube,
  Linkedin,
  Clock,
  Facebook,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { router } from "expo-router";

export default function CalendarScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode] = useState<"month">("month");
  const { checkSubscriptionStatus } = useAuth();
  const { t } = useLanguage();
  
  const weekDays = [
    t('calendar.monday'), t('calendar.tuesday'), t('calendar.wednesday'), 
    t('calendar.thursday'), t('calendar.friday'), t('calendar.saturday'), t('calendar.sunday')
  ];
  const monthNames = [
    t('calendar.january'), t('calendar.february'), t('calendar.march'), 
    t('calendar.april'), t('calendar.may'), t('calendar.june'),
    t('calendar.july'), t('calendar.august'), t('calendar.september'), 
    t('calendar.october'), t('calendar.november'), t('calendar.december')
  ];
  
  const scheduledPosts = [
    {
      id: 1,
      date: "2025-01-21",
      time: "09:00",
      platform: "Instagram",
      type: "Reel",
      content: t('calendar.morningMotivation'),
      status: "scheduled",
      icon: Instagram,
      color: "#E4405F",
    },
    {
      id: 2,
      date: "2025-01-21",
      time: "14:30",
      platform: "LinkedIn",
      type: "Artikel",
      content: t('calendar.industryInsights'),
      status: "scheduled",
      icon: Linkedin,
      color: "#0077B5",
    },
    {
      id: 3,
      date: "2025-01-22",
      time: "11:00",
      platform: "YouTube",
      type: "Short",
      content: t('calendar.quickTutorial'),
      status: "draft",
      icon: Youtube,
      color: "#FF0000",
    },
    {
      id: 4,
      date: "2025-01-23",
      time: "16:00",
      platform: "Facebook",
      type: "Post",
      content: t('calendar.communityUpdate'),
      status: "scheduled",
      icon: Facebook,
      color: "#1877F2",
    },
    {
      id: 5,
      date: "2025-01-25",
      time: "10:30",
      platform: "Instagram",
      type: "Story",
      content: t('calendar.behindScenes'),
      status: "draft",
      icon: Instagram,
      color: "#E4405F",
    },
  ];

  const getMonthDates = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - mondayOffset);
    
    const dates = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getPostsForDate = (date: string) => {
    return scheduledPosts.filter(post => post.date === date);
  };

  const monthDates = getMonthDates();
  const currentMonth = selectedDate.getMonth();
  const today = new Date();
  
  const handleCreatePost = () => {
    if (!checkSubscriptionStatus()) {
      router.push('/subscription');
      return;
    }
    router.push('/(tabs)/create');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('calendar.title')}</Text>
            <Text style={styles.subtitle}>{t('calendar.subtitle')}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleCreatePost}>
            <Plus color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>



        {/* Calendar Navigation */}
        <View style={styles.calendarNav}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('prev')}>
            <ChevronLeft color="#6B7280" size={20} />
          </TouchableOpacity>
          <Text style={styles.monthYear}>
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Text>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('next')}>
            <ChevronRight color="#6B7280" size={20} />
          </TouchableOpacity>
        </View>

        {/* Month View */}
        <View style={styles.monthContainer}>
          {/* Week Days Header */}
          <View style={styles.weekDaysHeader}>
            {weekDays.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {Array.from({ length: 6 }, (_, weekIndex) => (
              <View key={weekIndex} style={styles.calendarWeek}>
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dateIndex = weekIndex * 7 + dayIndex;
                  const date = monthDates[dateIndex];
                  const dateStr = formatDate(date);
                  const postsForDate = getPostsForDate(dateStr);
                  const isCurrentMonth = date.getMonth() === currentMonth;
                  const isToday = date.toDateString() === today.toDateString();
                  
                  return (
                    <TouchableOpacity key={dayIndex} style={styles.calendarDay}>
                      <View style={[
                        styles.dayContent,
                        isToday && styles.todayContent,
                        !isCurrentMonth && styles.otherMonthContent
                      ]}>
                        <Text style={[
                          styles.dayNumber,
                          isToday && styles.todayNumber,
                          !isCurrentMonth && styles.otherMonthNumber
                        ]}>
                          {date.getDate()}
                        </Text>
                        
                        {/* Post Indicators */}
                        <View style={styles.postIndicators}>
                          {postsForDate.slice(0, 3).map((post, index) => (
                            <View
                              key={post.id}
                              style={[
                                styles.postDot,
                                { backgroundColor: post.color }
                              ]}
                            />
                          ))}
                          {postsForDate.length > 3 && (
                            <Text style={styles.morePostsText}>+{postsForDate.length - 3}</Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Scheduled Posts List */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>{t('calendar.scheduledPosts')}</Text>
          {scheduledPosts.map(post => (
            <TouchableOpacity key={post.id} style={styles.postCard}>
              <View style={styles.postCardHeader}>
                <View style={styles.postPlatform}>
                  <View style={[styles.platformIcon, { backgroundColor: post.color + "20" }]}>
                    <post.icon color={post.color} size={16} />
                  </View>
                  <Text style={styles.platformName}>{post.platform}</Text>
                </View>
                <View style={styles.postStatus}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: post.status === "scheduled" ? "#10B981" : "#F59E0B" },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {post.status === "scheduled" ? t('calendar.scheduled') : t('calendar.draft')}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.postContent}>{post.content}</Text>
              
              <View style={styles.postCardFooter}>
                <View style={styles.postTime}>
                  <Clock color="#6B7280" size={14} />
                  <Text style={styles.postTimeText}>
                    {new Date(post.date).toLocaleDateString("de-DE", { 
                      month: "short", 
                      day: "numeric" 
                    })} um {post.time}
                  </Text>
                </View>
                <Text style={styles.postType}>{post.type}</Text>
              </View>
            </TouchableOpacity>
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
  addButton: {
    backgroundColor: "#8B5CF6",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  viewToggle: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#111827",
  },
  calendarNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  weekContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  weekHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  dayName: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  dayNumber: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "bold",
    marginTop: 4,
  },
  weekContent: {
    maxHeight: 400,
  },
  hourRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
    minHeight: 60,
  },
  hourLabel: {
    width: 50,
    fontSize: 12,
    color: "#9CA3AF",
    paddingTop: 8,
    paddingLeft: 12,
  },
  hourContent: {
    flex: 1,
    flexDirection: "row",
  },
  dayColumn: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  postItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    padding: 6,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  postIndicator: {
    width: 3,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  postText: {
    fontSize: 10,
    color: "#374151",
    flex: 1,
  },
  postsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
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
  postCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  postPlatform: {
    flexDirection: "row",
    alignItems: "center",
  },
  platformIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  platformName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  postStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  postContent: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 12,
    lineHeight: 20,
  },
  postCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  postTimeText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  postType: {
    fontSize: 12,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  monthContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  weekDaysHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 12,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekDayText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  calendarGrid: {
    paddingBottom: 8,
  },
  calendarWeek: {
    flexDirection: "row",
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
    borderRadius: 8,
  },
  todayContent: {
    backgroundColor: "#8B5CF6",
  },
  otherMonthContent: {
    opacity: 0.3,
  },
  todayNumber: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  otherMonthNumber: {
    color: "#9CA3AF",
  },
  postIndicators: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 4,
    minHeight: 12,
  },
  postDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
    marginVertical: 1,
  },
  morePostsText: {
    fontSize: 8,
    color: "#6B7280",
    fontWeight: "600",
  },
});
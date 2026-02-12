import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Clock, Instagram, Linkedin, ChevronLeft, ChevronRight, Music2 } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { translations } from '@/constants/translations';
import type { Language } from '@/constants/translations';
import { Platform } from '@/constants/types';

type CalendarDay = {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  fullDate: Date;
  posts: Array<{ platform: string; id: string }>;
};

export default function CalendarScreen() {
  const { posts } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const weekDays = cal.weekDays;
  const calendarDays = generateCalendarDays(currentMonth, posts);

  return (
    <>
      <Stack.Screen
        options={{
          title: cal.title,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <ChevronLeft size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <ChevronRight size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekDaysRow}>
            {weekDays.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                <Text
                  style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.dayTextInactive,
                    day.isToday && styles.dayTextToday,
                  ]}
                >
                  {day.date}
                </Text>
                {day.posts.length > 0 && (
                  <View style={styles.postIndicators}>
                    {day.posts.slice(0, 3).map((post) => (
                      <View
                        key={post.id}
                        style={[
                          styles.postDot,
                          { backgroundColor: getPlatformColor(post.platform) },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{cal.postsOn}</Text>
          {posts.filter(p => p.status === 'scheduled').map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.platformIconContainer}>
                  {post.platforms.map((platform, idx) => (
                    <View key={idx}>{getPlatformIcon(platform)}</View>
                  ))}
                </View>
                <Text style={styles.platformName}>
                  {post.platforms.length} {post.platforms.length === 1 ? 'Plattform' : 'Plattformen'}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: post.autoPost ? '#E8F5E9' : '#FFF3E0' }
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: post.autoPost ? '#4CAF50' : '#FF9800' }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: post.autoPost ? '#2E7D32' : '#F57C00' }
                  ]}>
                    {post.autoPost ? 'Auto-Post' : 'Entwurf'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.postTitle} numberOfLines={2}>{post.caption || 'Kein Text'}</Text>
              
              <View style={styles.postFooter}>
                <View style={styles.dateTimeContainer}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.dateTimeText}>
                    {new Date(post.scheduledDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} um {new Date(post.scheduledDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{post.mediaUrls.length} {post.mediaUrls.length === 1 ? 'Bild' : 'Bilder'}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

function getPlatformIcon(platform: Platform) {
  const size = 20;
  switch (platform) {
    case 'instagram':
      return <Instagram size={size} color="#E1306C" />;
    case 'linkedin':
      return <Linkedin size={size} color="#0A66C2" />;
    case 'tiktok':
      return <Music2 size={size} color="#000000" />;
    default:
      return <Instagram size={size} color="#000000" />;
  }
}

function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'instagram':
      return '#E1306C';
    case 'linkedin':
      return '#0A66C2';
    case 'tiktok':
      return '#000000';
    default:
      return '#999999';
  }
}

function generateCalendarDays(date: Date, posts: any[]): CalendarDay[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  
  const days: CalendarDay[] = [];
  
  let startDay = firstDay.getDay() - 1;
  if (startDay === -1) startDay = 6;
  
  for (let i = startDay - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i);
    const postsForDay = getPostsForDate(prevDate, posts);
    days.push({
      date: prevDate.getDate(),
      isCurrentMonth: false,
      isToday: false,
      fullDate: prevDate,
      posts: postsForDay,
    });
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const currentDate = new Date(year, month, i);
    const postsForDay = getPostsForDate(currentDate, posts);
    days.push({
      date: i,
      isCurrentMonth: true,
      isToday: currentDate.toDateString() === today.toDateString(),
      fullDate: currentDate,
      posts: postsForDay,
    });
  }
  
  const remainingDays = 35 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const nextDate = new Date(year, month + 1, i);
    const postsForDay = getPostsForDate(nextDate, posts);
    days.push({
      date: i,
      isCurrentMonth: false,
      isToday: false,
      fullDate: nextDate,
      posts: postsForDay,
    });
  }
  
  return days;
}

function getPostsForDate(date: Date, posts: any[]): Array<{ platform: string; id: string }> {
  return posts
    .filter((post) => {
      const postDate = new Date(post.scheduledDate);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    })
    .flatMap((post) => 
      post.platforms.map((platform: string) => ({ platform, id: post.id }))
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  postIndicators: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    position: 'absolute',
    bottom: 4,
  },
  postDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dayText: {
    fontSize: 15,
    color: '#000000',
  },
  dayTextInactive: {
    color: '#CCCCCC',
  },
  dayTextToday: {
    color: '#FFFFFF',
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
    overflow: 'hidden',
    fontWeight: '600' as const,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 16,
    letterSpacing: -0.5,
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
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  platformIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  platformName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000000',
    marginBottom: 12,
    lineHeight: 22,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 13,
    color: '#666',
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F0F0FF',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
});
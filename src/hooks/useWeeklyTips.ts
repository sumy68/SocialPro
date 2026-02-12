import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WeeklyTip {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel: string;
  actionRoute: string;
  icon: 'trending' | 'clock' | 'lightbulb';
}

const API_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://socialpro-fnvo.onrender.com';
const TIPS_CACHE_KEY = '@weekly_tips';
const TIPS_TIMESTAMP_KEY = '@weekly_tips_timestamp';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function useWeeklyTips() {
  const { language, accountType, companyInfo, connectedPlatforms } = useApp();
  const [tips, setTips] = useState<WeeklyTip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTips();
  }, [language]);

  const loadTips = async () => {
    try {
      // Check cache first
      const cached = await AsyncStorage.getItem(TIPS_CACHE_KEY);
      const timestamp = await AsyncStorage.getItem(TIPS_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < ONE_WEEK_MS) {
          const parsed = JSON.parse(cached);
          // Check if language matches
          if (parsed.language === language) {
            setTips(parsed.tips);
            return;
          }
        }
      }

      // Fetch new tips
      await fetchNewTips();
    } catch (e) {
      console.error('[WeeklyTips] Load error:', e);
    }
  };

  const fetchNewTips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/ai/weekly-tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          accountType,
          companyInfo,
          connectedPlatforms,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch tips');
      const data = await response.json();
      setTips(data.tips || []);

      // Cache
      await AsyncStorage.setItem(TIPS_CACHE_KEY, JSON.stringify({ tips: data.tips, language }));
      await AsyncStorage.setItem(TIPS_TIMESTAMP_KEY, String(Date.now()));
    } catch (err: any) {
      console.error('[WeeklyTips] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { tips, loading, error, refresh: fetchNewTips };
}

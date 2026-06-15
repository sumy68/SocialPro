import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { fetchWithTimeout, TimeoutError } from '@/lib/fetchWithTimeout';

interface AIContentSuggestion {
  title: string;
  description: string;
  platform: 'instagram' | 'linkedin' | 'tiktok';
  contentType: 'reel' | 'post' | 'carousel' | 'story';
  priority: 'high' | 'medium' | 'low';
  estimatedReach: string;
  reason: string;
}

const API_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://socialpro-fnvo.onrender.com';

export function useAIContentSuggestions() {
  const { accountType, userProfile, companyInfo, connectedPlatforms, language } = useApp();
  const [suggestions, setSuggestions] = useState<AIContentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountType || !userProfile) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithTimeout(`${API_URL}/api/ai/content-suggestions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountType,
            userProfile,
            companyInfo,
            connectedPlatforms,
            language,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch AI suggestions');
        }

        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (err: any) {
        console.error('[AI Suggestions] Error:', err);
        setError(
          err instanceof TimeoutError
            ? 'Zeitüberschreitung – bitte später erneut versuchen.'
            : err?.message ?? 'Vorschläge konnten nicht geladen werden.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [accountType, userProfile, companyInfo, connectedPlatforms]);

  return { suggestions, loading, error };
}
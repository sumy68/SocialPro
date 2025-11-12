import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Language } from '@/constants/translations';
import { CompanyInfo, ConnectedPlatform, SubscriptionInfo, Post, Platform } from '@/constants/types';

const STORAGE_KEYS = {
  LANGUAGE: '@socialpro:language',
  ONBOARDING: '@socialpro:onboarding',
  COMPANY_INFO: '@socialpro:companyInfo',
  PLATFORMS: '@socialpro:platforms',
  SUBSCRIPTION: '@socialpro:subscription',
  POSTS: '@socialpro:posts',
} as const;

const ALL_PLATFORMS: Platform[] = ['linkedin', 'instagram', 'tiktok'];

/** stellt sicher, dass alle Plattform-Einträge existieren */
function ensureAllPlatforms(list: ConnectedPlatform[] | null | undefined): ConnectedPlatform[] {
  const base = list?.slice() ?? [];
  const map = new Map<Platform, ConnectedPlatform>(base.map(p => [p.platform, p]));
  for (const p of ALL_PLATFORMS) {
    if (!map.has(p)) map.set(p, { platform: p, connected: false });
  }
  return Array.from(map.values()).sort(
    (a, b) => ALL_PLATFORMS.indexOf(a.platform) - ALL_PLATFORMS.indexOf(b.platform)
  );
}

export const [AppProvider, useApp] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>('de');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [companyInfo, setCompanyInfoState] = useState<CompanyInfo | null>(null);
  const [connectedPlatforms, setConnectedPlatformsState] = useState<ConnectedPlatform[]>(ensureAllPlatforms([]));
  const [subscription, setSubscriptionState] = useState<SubscriptionInfo>({ plan: null, status: 'expired' });
  const [posts, setPostsState] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storage load timeout')), 3000)
      );

      const loadPromise = Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING),
        AsyncStorage.getItem(STORAGE_KEYS.COMPANY_INFO),
        AsyncStorage.getItem(STORAGE_KEYS.PLATFORMS),
        AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION),
        AsyncStorage.getItem(STORAGE_KEYS.POSTS),
      ]);

      const [
        storedLanguage,
        storedOnboarding,
        storedCompanyInfo,
        storedPlatforms,
        storedSubscription,
        storedPosts,
      ] = (await Promise.race([loadPromise, timeoutPromise])) as (string | null)[];

      if (storedLanguage) setLanguageState(storedLanguage as Language);
      if (storedOnboarding) setHasCompletedOnboarding(JSON.parse(storedOnboarding));
      if (storedCompanyInfo) setCompanyInfoState(JSON.parse(storedCompanyInfo));

      // Plattformen immer vollständig sicherstellen
      const parsedPlatforms: ConnectedPlatform[] | null = storedPlatforms ? JSON.parse(storedPlatforms) : null;
      setConnectedPlatformsState(ensureAllPlatforms(parsedPlatforms));

      if (storedSubscription) setSubscriptionState(JSON.parse(storedSubscription));

      if (storedPosts) {
        try {
          const parsed = JSON.parse(storedPosts);
          setPostsState(parsed);
        } catch {
          await AsyncStorage.removeItem(STORAGE_KEYS.POSTS);
          setPostsState([]);
        }
      }
    } catch (error) {
      console.warn('[AppContext] loadStoredData failed:', (error as Error)?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('[AppContext] Error saving language:', error);
    }
  }, []);

  const completeOnboarding = useCallback(async (info: CompanyInfo) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(true));
      await AsyncStorage.setItem(STORAGE_KEYS.COMPANY_INFO, JSON.stringify(info));
      setHasCompletedOnboarding(true);
      setCompanyInfoState(info);
    } catch (error) {
      console.error('[AppContext] Error completing onboarding:', error);
    }
  }, []);

  const updateCompanyInfo = useCallback(async (info: CompanyInfo) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMPANY_INFO, JSON.stringify(info));
      setCompanyInfoState(info);
    } catch (error) {
      console.error('[AppContext] Error updating company info:', error);
    }
  }, []);

  /** ✅ Plattform verbinden (z. B. nach OAuth) */
  const connectPlatform = useCallback(
    async (
      platform: Platform,
      accountName?: string,
      accountId?: string,
      accessToken?: string,
      refreshToken?: string,
      expiresAt?: string
    ) => {
      try {
        setConnectedPlatformsState(prev => {
          const ensured = ensureAllPlatforms(prev);
          const updated = ensured.map(p =>
            p.platform === platform
              ? {
                  ...p,
                  connected: true,
                  accountName: accountName ?? p.accountName,
                  accountId: accountId ?? p.accountId,
                  accessToken,
                  refreshToken,
                  expiresAt,
                }
              : p
          );
          AsyncStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      } catch (error) {
        console.error('[AppContext] Error connecting platform:', error);
      }
    },
    []
  );

  /** Plattform trennen */
  const disconnectPlatform = useCallback(async (platform: Platform) => {
    try {
      setConnectedPlatformsState(prev => {
        const ensured = ensureAllPlatforms(prev);
        const updated = ensured.map(p =>
          p.platform === platform ? { platform: p.platform, connected: false } : p
        );
        AsyncStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch (error) {
      console.error('[AppContext] Error disconnecting platform:', error);
    }
  }, []);

  /** Trial & Subscription Handling */
  const startTrial = useCallback(async (plan: 'monthly' | 'yearly') => {
    try {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);

      const newSubscription: SubscriptionInfo = {
        plan,
        status: 'trial',
        trialEndsAt: trialEndsAt.toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(newSubscription));
      setSubscriptionState(newSubscription);
    } catch (error) {
      console.error('[AppContext] Error starting trial:', error);
    }
  }, []);

  const updateSubscription = useCallback(async (subscriptionInfo: SubscriptionInfo) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(subscriptionInfo));
      setSubscriptionState(subscriptionInfo);
    } catch (error) {
      console.error('[AppContext] Error updating subscription:', error);
    }
  }, []);

  /** Posts speichern etc. */
  const addPost = useCallback(async (post: Post) => {
    try {
      setPostsState(prev => {
        const updated = [post, ...prev];
        AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch (error) {
      console.error('[AppContext] Error adding post:', error);
    }
  }, []);

  const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
    try {
      setPostsState(prev => {
        const updated = prev.map(p => (p.id === postId ? { ...p, ...updates } : p));
        AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch (error) {
      console.error('[AppContext] Error updating post:', error);
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
      setPostsState(prev => {
        const updated = prev.filter(p => p.id !== postId);
        AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch (error) {
      console.error('[AppContext] Error deleting post:', error);
    }
  }, []);

  /** automatische Dummy-Performance */
  const generateRandomMetrics = (platform: Platform) => {
    const baseReach = Math.floor(Math.random() * 5000) + 1000;
    const engagementRate = Math.random() * 0.15 + 0.02;
    const engagement = Math.floor(baseReach * engagementRate);

    return {
      platform,
      reach: baseReach,
      impressions: Math.floor(baseReach * (Math.random() * 0.3 + 1.1)),
      engagement,
      likes: Math.floor(engagement * (Math.random() * 0.3 + 0.6)),
      comments: Math.floor(engagement * (Math.random() * 0.15 + 0.05)),
      shares: Math.floor(engagement * (Math.random() * 0.1 + 0.02)),
      clicks: Math.floor(engagement * (Math.random() * 0.2 + 0.1)),
    };
  };

  const processScheduledPosts = useCallback(async () => {
    const now = new Date();

    setPostsState(prev => {
      let hasChanges = false;
      const updated = prev.map(post => {
        if (post.status === 'scheduled' && post.autoPost) {
          const scheduledTime = new Date(post.scheduledDate);
          if (scheduledTime <= now) {
            hasChanges = true;
            const performance = post.platforms.map(platform => generateRandomMetrics(platform));
            return {
              ...post,
              status: 'posted' as const,
              postedAt: now.toISOString(),
              performance,
            };
          }
        }

        if (post.status === 'posted' && !post.performance) {
          hasChanges = true;
          const performance = post.platforms.map(platform => generateRandomMetrics(platform));
          return { ...post, performance };
        }

        return post;
      });

      if (hasChanges) {
        AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated)).catch(() => {});
      }

      return updated;
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;
    processScheduledPosts();
    const interval = setInterval(processScheduledPosts, 30000);
    return () => clearInterval(interval);
  }, [isLoading, processScheduledPosts]);

  const hasActiveSubscription = useCallback(() => {
    return subscription.status === 'trial' || subscription.status === 'active';
  }, [subscription.status]);

  return useMemo(
    () => ({
      language,
      setLanguage,
      hasCompletedOnboarding,
      completeOnboarding,
      companyInfo,
      updateCompanyInfo,
      connectedPlatforms,
      connectPlatform, // <— wichtig: wird vom IG-Login aufgerufen
      disconnectPlatform,
      subscription,
      startTrial,
      updateSubscription,
      hasActiveSubscription,
      posts,
      addPost,
      updatePost,
      deletePost,
      isLoading,
    }),
    [
      language,
      hasCompletedOnboarding,
      companyInfo,
      connectedPlatforms,
      subscription,
      posts,
      isLoading,
    ]
  );
});

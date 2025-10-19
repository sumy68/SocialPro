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

export const [AppProvider, useApp] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>('de');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [companyInfo, setCompanyInfoState] = useState<CompanyInfo | null>(null);
  const [connectedPlatforms, setConnectedPlatformsState] = useState<ConnectedPlatform[]>([
    { platform: 'linkedin', connected: false },
    { platform: 'instagram', connected: false },
    { platform: 'tiktok', connected: false },
    { platform: 'youtube', connected: false },
  ]);
  const [subscription, setSubscriptionState] = useState<SubscriptionInfo>({
    plan: null,
    status: 'expired',
  });
  const [posts, setPostsState] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      console.log('[AppContext] Loading stored data...');
      
      const [
        storedLanguage,
        storedOnboarding,
        storedCompanyInfo,
        storedPlatforms,
        storedSubscription,
        storedPosts,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING),
        AsyncStorage.getItem(STORAGE_KEYS.COMPANY_INFO),
        AsyncStorage.getItem(STORAGE_KEYS.PLATFORMS),
        AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION),
        AsyncStorage.getItem(STORAGE_KEYS.POSTS),
      ]);

      if (storedLanguage) {
        setLanguageState(storedLanguage as Language);
      }
      
      if (storedOnboarding) {
        setHasCompletedOnboarding(JSON.parse(storedOnboarding));
      }
      
      if (storedCompanyInfo) {
        setCompanyInfoState(JSON.parse(storedCompanyInfo));
      }
      
      if (storedPlatforms) {
        setConnectedPlatformsState(JSON.parse(storedPlatforms));
      }
      
      if (storedSubscription) {
        setSubscriptionState(JSON.parse(storedSubscription));
      }
      
      if (storedPosts) {
        try {
          const parsed = JSON.parse(storedPosts);
          setPostsState(parsed);
        } catch (parseError) {
          console.error('[AppContext] Error parsing stored posts, clearing corrupt data:', parseError);
          await AsyncStorage.removeItem(STORAGE_KEYS.POSTS);
          setPostsState([]);
        }
      }

      console.log('[AppContext] Data loaded successfully');
    } catch (error) {
      console.error('[AppContext] Error loading stored data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      console.log('[AppContext] Setting language to:', lang);
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('[AppContext] Error saving language:', error);
    }
  }, []);

  const completeOnboarding = useCallback(async (info: CompanyInfo) => {
    try {
      console.log('[AppContext] Completing onboarding with company info');
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
      console.log('[AppContext] Updating company info');
      await AsyncStorage.setItem(STORAGE_KEYS.COMPANY_INFO, JSON.stringify(info));
      setCompanyInfoState(info);
    } catch (error) {
      console.error('[AppContext] Error updating company info:', error);
    }
  }, []);

  const connectPlatform = useCallback(async (
    platform: Platform, 
    accountName: string, 
    accountId: string,
    accessToken?: string,
    refreshToken?: string,
    expiresAt?: string
  ) => {
    try {
      console.log('[AppContext] Connecting platform:', platform);
      setConnectedPlatformsState(prev => {
        const updated = prev.map(p =>
          p.platform === platform
            ? { ...p, connected: true, accountName, accountId, accessToken, refreshToken, expiresAt }
            : p
        );
        AsyncStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('[AppContext] Error connecting platform:', error);
    }
  }, []);

  const disconnectPlatform = useCallback(async (platform: Platform) => {
    try {
      console.log('[AppContext] Disconnecting platform:', platform);
      setConnectedPlatformsState(prev => {
        const updated = prev.map(p =>
          p.platform === platform
            ? { platform: p.platform, connected: false }
            : p
        );
        AsyncStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('[AppContext] Error disconnecting platform:', error);
    }
  }, []);

  const startTrial = useCallback(async (plan: 'monthly' | 'yearly') => {
    try {
      console.log('[AppContext] Starting trial with plan:', plan);
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
      console.log('[AppContext] Updating subscription');
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(subscriptionInfo));
      setSubscriptionState(subscriptionInfo);
    } catch (error) {
      console.error('[AppContext] Error updating subscription:', error);
    }
  }, []);

  const addPost = useCallback(async (post: Post) => {
    try {
      console.log('[AppContext] Adding post');
      setPostsState(prev => {
        const updated = [post, ...prev];
        AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('[AppContext] Error adding post:', error);
    }
  }, []);

  const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
    try {
      console.log('[AppContext] Updating post:', postId);
      setPostsState(prev => {
        const updated = prev.map(p =>
          p.id === postId ? { ...p, ...updates } : p
        );
        AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('[AppContext] Error updating post:', error);
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
      console.log('[AppContext] Deleting post:', postId);
      setPostsState(prev => {
        const updated = prev.filter(p => p.id !== postId);
        AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('[AppContext] Error deleting post:', error);
    }
  }, []);

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
            console.log('[AppContext] Auto-posting scheduled post:', post.id);
            hasChanges = true;
            
            const performance = post.platforms.map(platform => 
              generateRandomMetrics(platform)
            );
            
            return {
              ...post,
              status: 'posted' as const,
              postedAt: now.toISOString(),
              performance,
            };
          }
        }
        
        if (post.status === 'posted' && !post.performance) {
          console.log('[AppContext] Generating metrics for posted post:', post.id);
          hasChanges = true;
          
          const performance = post.platforms.map(platform => 
            generateRandomMetrics(platform)
          );
          
          return {
            ...post,
            performance,
          };
        }
        
        return post;
      });
      
      if (hasChanges) {
        AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
      }
      
      return updated;
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    processScheduledPosts();
    
    const interval = setInterval(() => {
      processScheduledPosts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isLoading, processScheduledPosts]);

  const hasActiveSubscription = useCallback(() => {
    return subscription.status === 'trial' || subscription.status === 'active';
  }, [subscription.status]);

  return useMemo(() => ({
    language,
    setLanguage,
    hasCompletedOnboarding,
    completeOnboarding,
    companyInfo,
    updateCompanyInfo,
    connectedPlatforms,
    connectPlatform,
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
  }), [
    language,
    setLanguage,
    hasCompletedOnboarding,
    completeOnboarding,
    companyInfo,
    updateCompanyInfo,
    connectedPlatforms,
    connectPlatform,
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
  ]);
});

import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { SocialMediaAccount, MediaFile, WeeklyReviewData } from '@/types/social';
import { Alert } from 'react-native';

interface SocialMediaContextType {
  accounts: SocialMediaAccount[];
  mediaFiles: MediaFile[];
  weeklyReviews: WeeklyReviewData[];
  isLoading: boolean;
  connectAccount: (platform: string) => Promise<void>;
  disconnectAccount: (accountId: string) => Promise<void>;
  uploadMedia: (files: any[]) => Promise<MediaFile[]>;
  deleteMedia: (fileId: string) => Promise<void>;
  getConnectedPlatforms: () => string[];
  isAccountConnected: (platform: string) => boolean;
  generateWeeklyReview: () => Promise<WeeklyReviewData>;
  getLatestWeeklyReview: () => WeeklyReviewData | null;
  getAllWeeklyReviews: () => WeeklyReviewData[];
}

export const [SocialMediaProvider, useSocialMedia] = createContextHook((): SocialMediaContextType => {
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsData, mediaData, reviewsData] = await Promise.all([
        AsyncStorage.getItem('socialAccounts'),
        AsyncStorage.getItem('mediaFiles'),
        AsyncStorage.getItem('weeklyReviews')
      ]);
      
      if (accountsData && typeof accountsData === 'string' && accountsData.trim()) {
        try {
          // Validate JSON format before parsing
          if (!accountsData.startsWith('[') && !accountsData.startsWith('{')) {
            console.warn('Invalid JSON format for accounts data, clearing storage');
            await AsyncStorage.removeItem('socialAccounts');
            return;
          }
          
          const parsedAccounts = JSON.parse(accountsData);
          if (Array.isArray(parsedAccounts)) {
            setAccounts(parsedAccounts.map((acc: any) => ({
              ...acc,
              lastSync: acc.lastSync ? new Date(acc.lastSync) : undefined
            })));
          } else {
            console.warn('Invalid accounts data format, clearing storage');
            await AsyncStorage.removeItem('socialAccounts');
          }
        } catch (parseError) {
          console.error('Error parsing accounts data:', parseError);
          await AsyncStorage.removeItem('socialAccounts');
        }
      }
      
      if (mediaData && typeof mediaData === 'string' && mediaData.trim()) {
        try {
          // Validate JSON format before parsing
          if (!mediaData.startsWith('[') && !mediaData.startsWith('{')) {
            console.warn('Invalid JSON format for media data, clearing storage');
            await AsyncStorage.removeItem('mediaFiles');
            return;
          }
          
          const parsedMedia = JSON.parse(mediaData);
          if (Array.isArray(parsedMedia)) {
            setMediaFiles(parsedMedia.map((file: any) => ({
              ...file,
              uploadedAt: new Date(file.uploadedAt)
            })));
          } else {
            console.warn('Invalid media data format, clearing storage');
            await AsyncStorage.removeItem('mediaFiles');
          }
        } catch (parseError) {
          console.error('Error parsing media data:', parseError);
          await AsyncStorage.removeItem('mediaFiles');
        }
      }
      
      if (reviewsData && typeof reviewsData === 'string' && reviewsData.trim()) {
        try {
          // Validate JSON format before parsing
          if (!reviewsData.startsWith('[') && !reviewsData.startsWith('{')) {
            console.warn('Invalid JSON format for reviews data, clearing storage');
            await AsyncStorage.removeItem('weeklyReviews');
            return;
          }
          
          const parsedReviews = JSON.parse(reviewsData);
          if (Array.isArray(parsedReviews)) {
            setWeeklyReviews(parsedReviews.map((review: any) => ({
              ...review,
              weekStart: new Date(review.weekStart),
              weekEnd: new Date(review.weekEnd),
              topPerformingPosts: review.topPerformingPosts?.map((post: any) => ({
                ...post,
                publishedAt: new Date(post.publishedAt)
              })) || []
            })));
          } else {
            console.warn('Invalid weekly reviews data format, clearing storage');
            await AsyncStorage.removeItem('weeklyReviews');
          }
        } catch (parseError) {
          console.error('Error parsing weekly reviews data:', parseError);
          await AsyncStorage.removeItem('weeklyReviews');
        }
      }
    } catch (error) {
      console.error('Error loading social media data:', error);
      // Clear all corrupted data if there's a general error
      try {
        await Promise.all([
          AsyncStorage.removeItem('socialAccounts'),
          AsyncStorage.removeItem('mediaFiles'),
          AsyncStorage.removeItem('weeklyReviews')
        ]);
      } catch (clearError) {
        console.error('Error clearing corrupted data:', clearError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveAccounts = async (newAccounts: SocialMediaAccount[]) => {
    try {
      await AsyncStorage.setItem('socialAccounts', JSON.stringify(newAccounts));
      setAccounts(newAccounts);
    } catch (error) {
      console.error('Error saving accounts:', error);
    }
  };

  const saveMediaFiles = async (newFiles: MediaFile[]) => {
    try {
      await AsyncStorage.setItem('mediaFiles', JSON.stringify(newFiles));
      setMediaFiles(newFiles);
    } catch (error) {
      console.error('Error saving media files:', error);
    }
  };

  const saveWeeklyReviews = async (newReviews: WeeklyReviewData[]) => {
    try {
      await AsyncStorage.setItem('weeklyReviews', JSON.stringify(newReviews));
      setWeeklyReviews(newReviews);
    } catch (error) {
      console.error('Error saving weekly reviews:', error);
    }
  };

  const connectAccount = async (platform: string) => {
    try {
      setIsLoading(true);
      
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock account data
      const mockUsernames: { [key: string]: string } = {
        'Instagram': '@mein_business',
        'TikTok': '@mein_business_tiktok',
        'LinkedIn': 'Mein Business',
        'YouTube': 'Mein Business Channel',
        'Facebook': 'Mein Business Page'
      };
      
      const newAccount: SocialMediaAccount = {
        id: Date.now().toString(),
        platform,
        username: mockUsernames[platform] || '@mein_account',
        isConnected: true,
        accessToken: 'mock_token_' + Date.now(),
        profilePicture: 'https://via.placeholder.com/50',
        followers: Math.floor(Math.random() * 10000) + 1000,
        lastSync: new Date()
      };
      
      const updatedAccounts = [...accounts.filter(acc => acc.platform !== platform), newAccount];
      await saveAccounts(updatedAccounts);
      
      // Show success message - will be handled by the component using translations
      console.log(`${platform} connected successfully`);
    } catch (error) {
      console.error('Error connecting account:', error);
      // Show error message - will be handled by the component using translations
      throw new Error('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
      await saveAccounts(updatedAccounts);
      console.log('Account disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting account:', error);
      throw new Error('Disconnect failed');
    }
  };

  const uploadMedia = async (files: any[]): Promise<MediaFile[]> => {
    try {
      setIsLoading(true);
      
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const uploadedFiles: MediaFile[] = files.map((file, index) => ({
        id: Date.now().toString() + index,
        uri: file.uri,
        type: file.type?.startsWith('video') ? 'video' : 'image',
        name: file.name || `media_${Date.now()}_${index}`,
        size: file.size || 0,
        mimeType: file.type || 'image/jpeg',
        thumbnail: file.type?.startsWith('video') ? file.uri : undefined,
        duration: file.type?.startsWith('video') ? 30 : undefined,
        uploadedAt: new Date()
      }));
      
      const updatedFiles = [...mediaFiles, ...uploadedFiles];
      await saveMediaFiles(updatedFiles);
      
      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMedia = async (fileId: string) => {
    try {
      const updatedFiles = mediaFiles.filter(file => file.id !== fileId);
      await saveMediaFiles(updatedFiles);
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  };

  const getConnectedPlatforms = (): string[] => {
    return accounts.filter(acc => acc.isConnected).map(acc => acc.platform);
  };

  const isAccountConnected = (platform: string): boolean => {
    return accounts.some(acc => acc.platform === platform && acc.isConnected);
  };

  const generateWeeklyReview = async (): Promise<WeeklyReviewData> => {
    try {
      setIsLoading(true);
      
      // Simulate API call to fetch analytics data from connected platforms
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      
      // Generate mock weekly review data
      const mockReview: WeeklyReviewData = {
        id: Date.now().toString(),
        weekStart,
        weekEnd,
        totalReach: Math.floor(Math.random() * 50000) + 10000,
        totalEngagement: Math.floor(Math.random() * 5000) + 1000,
        newFollowers: Math.floor(Math.random() * 500) + 50,
        profileVisits: Math.floor(Math.random() * 2000) + 300,
        postsPublished: Math.floor(Math.random() * 10) + 3,
        topPerformingPosts: [
          {
            id: '1',
            platform: 'Instagram',
            content: 'Motivational Monday: Start your week strong! 💪',
            type: 'post',
            reach: 12500,
            engagement: 850,
            likes: 720,
            comments: 95,
            shares: 35,
            publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            thumbnail: 'https://picsum.photos/300/300?random=1'
          },
          {
            id: '2',
            platform: 'TikTok',
            content: 'Quick productivity hack that changed my life!',
            type: 'reel',
            reach: 25000,
            engagement: 1200,
            likes: 980,
            comments: 150,
            shares: 70,
            publishedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
            thumbnail: 'https://picsum.photos/300/300?random=2'
          },
          {
            id: '3',
            platform: 'LinkedIn',
            content: 'Industry insights: The future of remote work',
            type: 'post',
            reach: 8500,
            engagement: 420,
            likes: 350,
            comments: 45,
            shares: 25,
            publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            thumbnail: 'https://picsum.photos/300/300?random=3'
          }
        ],
        platformPerformance: [
          {
            platform: 'Instagram',
            reach: 28000,
            engagement: 1800,
            followers: 5420,
            posts: 4,
            averageEngagementRate: 6.4,
            color: '#E4405F'
          },
          {
            platform: 'TikTok',
            reach: 45000,
            engagement: 2200,
            followers: 8900,
            posts: 3,
            averageEngagementRate: 4.9,
            color: '#000000'
          },
          {
            platform: 'LinkedIn',
            reach: 12000,
            engagement: 680,
            followers: 2100,
            posts: 2,
            averageEngagementRate: 5.7,
            color: '#0077B5'
          }
        ],
        insights: [
          {
            type: 'performance',
            title: 'Video Content Outperforming',
            description: 'Your video posts are getting 40% more engagement than static images',
            value: '+40%',
            trend: 'up',
            color: '#10B981'
          },
          {
            type: 'timing',
            title: 'Peak Engagement Time',
            description: 'Your audience is most active between 2-4 PM on weekdays',
            value: '2-4 PM',
            trend: 'stable',
            color: '#3B82F6'
          },
          {
            type: 'content',
            title: 'Trending Topic',
            description: 'Posts about productivity are performing 25% better this week',
            value: '+25%',
            trend: 'up',
            color: '#8B5CF6'
          }
        ],
        recommendations: [
          {
            type: 'content',
            title: 'Create More Video Content',
            description: 'Video posts are your top performers. Create 2-3 more Reels this week.',
            action: 'Create Reels',
            priority: 'high',
            color: '#EF4444'
          },
          {
            type: 'timing',
            title: 'Optimize Posting Schedule',
            description: 'Schedule more posts between 2–4 PM for maximum visibility.',
            action: 'Schedule Posts',
            priority: 'medium',
            color: '#F59E0B'
          },
          {
            type: 'hashtag',
            title: 'Use Trending Hashtags',
            description: 'Include #productivity and #motivation in your next posts.',
            action: 'Add Hashtags',
            priority: 'medium',
            color: '#10B981'
          }
        ],
        comparisonToPreviousWeek: {
          reach: {
            current: 85000,
            previous: 62000,
            change: 23000,
            changePercent: 37.1
          },
          engagement: {
            current: 4680,
            previous: 3200,
            change: 1480,
            changePercent: 46.3
          },
          followers: {
            current: 16420,
            previous: 15920,
            change: 500,
            changePercent: 3.1
          },
          posts: {
            current: 9,
            previous: 7,
            change: 2,
            changePercent: 28.6
          }
        }
      };
      
      const updatedReviews = [mockReview, ...weeklyReviews];
      await saveWeeklyReviews(updatedReviews);
      
      return mockReview;
    } catch (error) {
      console.error('Error generating weekly review:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getLatestWeeklyReview = (): WeeklyReviewData | null => {
    if (weeklyReviews.length === 0) return null;
    return weeklyReviews[0];
  };

  const getAllWeeklyReviews = (): WeeklyReviewData[] => {
    return weeklyReviews;
  };

  return {
    accounts,
    mediaFiles,
    weeklyReviews,
    isLoading,
    connectAccount,
    disconnectAccount,
    uploadMedia,
    deleteMedia,
    getConnectedPlatforms,
    isAccountConnected,
    generateWeeklyReview,
    getLatestWeeklyReview,
    getAllWeeklyReviews
  };
});
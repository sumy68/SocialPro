import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

interface CompanyProfile {
  industry: string;
  companySize: string;
  goals: string[];
  targetAudience: string;
  currentPlatforms: string[];
  contentTypes: string[];
  postingFrequency: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'none';
  trialEndsAt?: Date;
  subscriptionType?: 'monthly' | 'yearly';
  companyProfile?: CompanyProfile;
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  startTrial: () => Promise<void>;
  subscribe: (type: 'monthly' | 'yearly') => Promise<void>;
  checkSubscriptionStatus: () => boolean;
  updateCompanyProfile: (profile: CompanyProfile) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook((): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData && typeof userData === 'string' && userData.trim()) {
        try {
          // Validate JSON format before parsing
          if (!userData.startsWith('{')) {
            console.warn('Invalid JSON format for user data, clearing storage');
            await AsyncStorage.removeItem('user');
            return;
          }
          
          const parsedUser = JSON.parse(userData);
          if (parsedUser && typeof parsedUser === 'object') {
            if (parsedUser.trialEndsAt) {
              parsedUser.trialEndsAt = new Date(parsedUser.trialEndsAt);
            }
            
            // Check if trial has expired
            if (parsedUser.subscriptionStatus === 'trial' && parsedUser.trialEndsAt) {
              if (new Date() > parsedUser.trialEndsAt) {
                const expiredUser = { ...parsedUser, subscriptionStatus: 'expired' as const };
                setUser(expiredUser);
                await AsyncStorage.setItem('user', JSON.stringify(expiredUser));
                return;
              }
            }
            
            setUser(parsedUser);
          } else {
            console.warn('Invalid user data format, clearing storage');
            await AsyncStorage.removeItem('user');
            setUser(null);
          }
        } catch (parseError) {
          console.error('Error parsing user data, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // Clear all corrupted data if there's a general error
      try {
        await AsyncStorage.removeItem('user');
      } catch (clearError) {
        console.error('Error clearing corrupted user data:', clearError);
      }
      setUser(null);
    } finally {
      // Set loading to false immediately to prevent hydration timeout
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        subscriptionStatus: 'none',
        onboardingCompleted: false
      };
      
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      router.replace('/onboarding');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: '1',
        email,
        name,
        subscriptionStatus: 'none',
        onboardingCompleted: false
      };
      
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      router.replace('/onboarding');
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      router.replace('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const startTrial = async () => {
    if (!user) return;
    
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 3); // 3 days trial
    
    const updatedUser: User = {
      ...user,
      subscriptionStatus: 'trial',
      trialEndsAt
    };
    
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const subscribe = async (type: 'monthly' | 'yearly') => {
    if (!user) return;
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedUser: User = {
      ...user,
      subscriptionStatus: 'active',
      subscriptionType: type,
      trialEndsAt: undefined
    };
    
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const updateCompanyProfile = async (profile: CompanyProfile) => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      companyProfile: profile
    };
    
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      onboardingCompleted: true
    };
    
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const checkSubscriptionStatus = (): boolean => {
    if (!user) return false;
    
    if (user.subscriptionStatus === 'active') return true;
    
    if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
      return new Date() <= user.trialEndsAt;
    }
    
    return false;
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    startTrial,
    subscribe,
    checkSubscriptionStatus,
    updateCompanyProfile,
    completeOnboarding
  };
});
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { router } from 'expo-router';

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: languageLoading } = useLanguage();
  const [hasNavigated, setHasNavigated] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      setTimeoutReached(true);
      if (!hasNavigated) {
        console.log('Fallback navigation triggered');
        setHasNavigated(true);
        router.replace('/auth');
      }
    }, 3000); // 3 second fallback
    
    return () => clearTimeout(fallbackTimeout);
  }, [hasNavigated]);

  useEffect(() => {
    // Prevent multiple navigation attempts
    if (hasNavigated || timeoutReached) return;
    
    // Wait for both contexts to finish loading
    if (!authLoading && !languageLoading) {
      // Use requestAnimationFrame for better hydration timing
      const frame = requestAnimationFrame(() => {
        try {
          setHasNavigated(true);
          
          if (!user) {
            router.replace('/auth');
          } else if (!user.onboardingCompleted) {
            router.replace('/onboarding');
          } else if (user.subscriptionStatus === 'expired' || user.subscriptionStatus === 'none') {
            router.replace('/subscription');
          } else {
            router.replace('/(tabs)/dashboard');
          }
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback navigation
          router.replace('/auth');
        }
      });
      
      return () => cancelAnimationFrame(frame);
    }
  }, [user, authLoading, languageLoading, hasNavigated, timeoutReached]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B5CF6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
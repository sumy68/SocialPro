import { useAuth } from '@clerk/clerk-expo';
import { useApp } from '@/contexts/AppContext';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_START_KEY = '@trial_start_date';
const TRIAL_DAYS = 3;

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { hasCompletedOnboarding, isLoading } = useApp();
  const [trialExpired, setTrialExpired] = useState(false);
  const [checkingTrial, setCheckingTrial] = useState(true);

  useEffect(() => {
    checkTrial();
  }, [isSignedIn, isLoaded]);

  const checkTrial = async () => {
    try {
      const trialStartDate = await AsyncStorage.getItem(TRIAL_START_KEY);
      
      if (trialStartDate) {
        const startDate = new Date(trialStartDate);
        const now = new Date();
        const daysPassed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysPassed >= TRIAL_DAYS) {
          setTrialExpired(true);
        }
      }
    } catch (error) {
      console.error('Error checking trial:', error);
    } finally {
      setCheckingTrial(false);
    }
  };

  if (!isLoaded || isLoading || checkingTrial) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (trialExpired) {
    return <Redirect href="/paywall" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding/welcome" />;
  }

  return <Redirect href="/(tabs)/(dashboard)" />;
}
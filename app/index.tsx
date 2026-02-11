import { useAuth } from '@clerk/clerk-expo';
import { useApp } from '@/contexts/AppContext';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_START_KEY = '@trial_start_date';
const TRIAL_DAYS = 3;
const LANGUAGE_SELECTED_KEY = '@socialpro:languageSelected';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { hasCompletedOnboarding, isLoading } = useApp();
  const [trialExpired, setTrialExpired] = useState(false);
  const [checkingTrial, setCheckingTrial] = useState(true);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [checkingLanguage, setCheckingLanguage] = useState(true);

  useEffect(() => {
    checkTrial();
    checkLanguageSelection();
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

  const checkLanguageSelection = async () => {
    try {
      const languageSelected = await AsyncStorage.getItem(LANGUAGE_SELECTED_KEY);
      setHasSelectedLanguage(languageSelected === 'true');
    } catch (error) {
      console.error('Error checking language selection:', error);
    } finally {
      setCheckingLanguage(false);
    }
  };

  if (!isLoaded || isLoading || checkingTrial || checkingLanguage) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // ✅ LANGUAGE SELECTION KOMMT ZUERST - VOR ALLEM!
  if (!hasSelectedLanguage) {
    return <Redirect href="/language-selection" />;
  }

  // ✅ DANN PAYWALL (Trial Check)
  if (trialExpired) {
    return <Redirect href="/paywall" />;
  }

  // ✅ DANN ONBOARDING
  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding/welcome" />;
  }

  // ✅ DANN DASHBOARD
  return <Redirect href="/(tabs)/(dashboard)" />;
}
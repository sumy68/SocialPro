import { useAuth } from '@clerk/clerk-expo';
import { useApp } from '@/contexts/AppContext';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_START_KEY = '@trial_start_date';
const TRIAL_DAYS = 3;
const LANGUAGE_SELECTED_KEY = '@socialpro:languageSelected';
const WELCOME_SEEN_KEY = '@socialpro:welcomeSeen';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { hasCompletedOnboarding, isLoading } = useApp();
  const [trialExpired, setTrialExpired] = useState(false);
  const [checkingTrial, setCheckingTrial] = useState(true);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [checkingLanguage, setCheckingLanguage] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [checkingWelcome, setCheckingWelcome] = useState(true);

  useEffect(() => {
    checkTrial();
    checkLanguageSelection();
    checkWelcomeSeen();
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

  const checkWelcomeSeen = async () => {
    try {
      const welcomeSeen = await AsyncStorage.getItem(WELCOME_SEEN_KEY);
      setHasSeenWelcome(welcomeSeen === 'true');
    } catch (error) {
      console.error('Error checking welcome seen:', error);
    } finally {
      setCheckingWelcome(false);
    }
  };

  if (!isLoaded || isLoading || checkingTrial || checkingLanguage || checkingWelcome) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  // ✅ 1. LANGUAGE SELECTION KOMMT ZUERST
  if (!hasSelectedLanguage) {
    return <Redirect href="/language-selection" />;
  }

  // ✅ 2. WELCOME SCREEN (in gewählter Sprache!)
  if (!hasSeenWelcome) {
    return <Redirect href="/onboarding/welcome" />;
  }

  // ✅ 3. SIGN IN / REGISTER
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // ✅ 4. PAYWALL (Trial Check)
  if (trialExpired) {
    return <Redirect href="/paywall" />;
  }

  // ✅ 5. ONBOARDING (Company Info)
  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding/company-info" />;
  }

  // ✅ 6. DASHBOARD
  return <Redirect href="/(tabs)/(dashboard)" />;
}
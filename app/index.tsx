import { useAuth } from '@clerk/clerk-expo';
import { useApp } from '@/contexts/AppContext';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { hasCompletedOnboarding, isLoading } = useApp();

  useEffect(() => {
    console.log('[Index] Auth status:', { isSignedIn, isLoaded, hasCompletedOnboarding, isLoading });
  }, [isSignedIn, isLoaded, hasCompletedOnboarding, isLoading]);

  // Show loading while checking auth + storage
  if (!isLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // Not signed in → Go to login
  if (!isSignedIn) {
    console.log('[Index] Redirecting to sign-in');
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Signed in but no onboarding → Go to onboarding
  if (!hasCompletedOnboarding) {
    console.log('[Index] Redirecting to onboarding');
    return <Redirect href="/onboarding/welcome" />;
  }

  // Signed in + onboarding done → Go to app
  console.log('[Index] Redirecting to dashboard');
  return <Redirect href="/(tabs)/(dashboard)" />;
}

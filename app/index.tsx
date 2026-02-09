import { useAuth } from '@clerk/clerk-expo';
import { useApp } from '@/contexts/AppContext';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { hasCompletedOnboarding, isLoading } = useApp();

  // Show loading while checking auth + storage
  if (!isLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // Not signed in → Go to login
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Signed in but no onboarding → Go to onboarding
  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding/welcome" />;
  }

  // Signed in + onboarding done → Go to app
  return <Redirect href="/(tabs)/(dashboard)" />;
}

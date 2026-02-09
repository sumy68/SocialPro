import { View, Text, StyleSheet } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { Link } from 'expo-router';

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>Welcome back to SocialPro</Text>
      
      {/* Sign-in Form wird hier hin */}
      
      <Link href="/(auth)/sign-up" style={styles.link}>
        <Text>Don't have an account? Sign up</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  link: {
    marginTop: 20,
    color: '#7C3AED',
  },
});

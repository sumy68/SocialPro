import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // Nur aktiv setzen, wenn die Anmeldung wirklich abgeschlossen ist.
      // Bei 2FA / weiterer Verifizierung ist createdSessionId undefined.
      if (completeSignIn.status === 'complete' && completeSignIn.createdSessionId) {
        await setActive({ session: completeSignIn.createdSessionId });
        router.replace('/');
      } else {
        Alert.alert('Hinweis', 'Anmeldung unvollständig. Bitte versuche es erneut.');
      }
    } catch (err: any) {
      // Clerk-Fehler tragen err.errors; Netzwerk-/Sonstige Fehler nicht.
      const clerkMsg = err?.errors?.[0]?.message;
      const isNetwork =
        !err?.errors &&
        (err?.message?.toLowerCase?.().includes('network') ||
          err?.message?.toLowerCase?.().includes('fetch'));
      Alert.alert(
        'Fehler',
        clerkMsg || (isNetwork ? 'Keine Internetverbindung. Bitte prüfe dein Netzwerk.' : 'Anmeldung fehlgeschlagen.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Sign in to SocialPro</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={emailAddress}
        onChangeText={setEmailAddress}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={onSignInPress}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Anmeldung läuft…' : 'Sign In'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/sign-up" style={styles.link}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#EF4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 20,
  },
  linkText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
  },
});
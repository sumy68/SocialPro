import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const { language } = useApp();
  const auth = ({
    de: { title: 'Konto erstellen', subtitle: 'Starte heute deine kostenlose Testversion', trial: '\u{1F381} 3 Tage kostenlos testen', email: 'E-Mail', password: 'Passwort (min. 8 Zeichen)', cta: '3 Tage kostenlos starten', terms: 'Kostenlose 3-Tage-Testversion. Danach automatische Verlaengerung fuer \u20AC29,99/Monat.', cancel: 'Jederzeit in den Einstellungen kuendbar.', login: 'Du hast bereits ein Konto? Anmelden', verify: 'E-Mail bestaetigen', verifyCta: 'Verifizieren & Testversion starten', error: 'Fehler', regFailed: 'Registrierung fehlgeschlagen', verifyFailed: 'Verifizierung fehlgeschlagen' },
    en: { title: 'Create Account', subtitle: 'Start your free trial today', trial: '\u{1F381} 3 days free trial', email: 'Email', password: 'Password (min. 8 characters)', cta: 'Start 3 days free', terms: 'Free 3-day trial. Then auto-renewal for \u20AC29.99/month.', cancel: 'Cancel anytime in settings.', login: 'Already have an account? Sign in', verify: 'Verify Email', verifyCta: 'Verify & start trial', error: 'Error', regFailed: 'Registration failed', verifyFailed: 'Verification failed' },
    es: { title: 'Crear cuenta', subtitle: 'Comienza tu prueba gratuita hoy', trial: '\u{1F381} 3 dias de prueba gratis', email: 'Correo', password: 'Contrasena (min. 8 caracteres)', cta: 'Empezar 3 dias gratis', terms: 'Prueba gratuita de 3 dias. Luego renovacion automatica por \u20AC29,99/mes.', cancel: 'Cancela en cualquier momento.', login: 'Ya tienes cuenta? Iniciar sesion', verify: 'Verificar correo', verifyCta: 'Verificar e iniciar prueba', error: 'Error', regFailed: 'Registro fallido', verifyFailed: 'Verificacion fallida' },
    tr: { title: 'Hesap Olustur', subtitle: 'Ucretsiz denemenize bugun baslayin', trial: '\u{1F381} 3 gun ucretsiz dene', email: 'E-posta', password: 'Sifre (min. 8 karakter)', cta: '3 gun ucretsiz basla', terms: '3 gunluk ucretsiz deneme. Sonra aylik \u20AC29,99 otomatik yenileme.', cancel: 'Istediginiz zaman iptal edin.', login: 'Zaten hesabiniz var mi? Giris yapin', verify: 'E-posta dogrula', verifyCta: 'Dogrula ve denemeyi basla', error: 'Hata', regFailed: 'Kayit basarisiz', verifyFailed: 'Dogrulama basarisiz' },
  } as any)[language] || { title: 'Create Account', subtitle: 'Start your free trial today', trial: '\u{1F381} 3 days free trial', email: 'Email', password: 'Password (min. 8 characters)', cta: 'Start 3 days free', terms: 'Free 3-day trial. Then auto-renewal for \u20AC29.99/month.', cancel: 'Cancel anytime in settings.', login: 'Already have an account? Sign in', verify: 'Verify Email', verifyCta: 'Verify & start trial', error: 'Error', regFailed: 'Registration failed', verifyFailed: 'Verification failed' };
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert(auth.error, err.errors?.[0]?.message || auth.regFailed);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      console.log("[SignUp] Verification status:", completeSignUp.status);
      console.log("[SignUp] Session ID:", completeSignUp.createdSessionId);
      if (completeSignUp.status === "complete" && completeSignUp.createdSessionId) {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/");
      } else {
        Alert.alert(auth.error, "Verification incomplete: " + completeSignUp.status);
      }
    } catch (err: any) {
      console.log("[SignUp] ERROR:", JSON.stringify(err));
      Alert.alert(auth.error, err.errors?.[0]?.message || auth.verifyFailed);
    }
  };

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{auth.verify}</Text>
        <Text style={styles.subtitle}>Code eingeben, den wir an {emailAddress} gesendet haben</Text>

        <TextInput
          style={styles.input}
          placeholder="Bestätigungscode"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />

        <TouchableOpacity style={styles.button} onPress={onVerifyPress}>
          <Text style={styles.buttonText}>{auth.verifyCta}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{auth.title}</Text>
      <Text style={styles.subtitle}>{auth.subtitle}</Text>

      <View style={styles.trialBadge}>
        <Text style={styles.trialText}>{auth.trial}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder={auth.email}
        value={emailAddress}
        onChangeText={setEmailAddress}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder={auth.password}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={onSignUpPress}>
        <Text style={styles.buttonText}>{auth.cta}</Text>
      </TouchableOpacity>

      <View style={styles.termsBox}>
        <Text style={styles.termsText}>
          {auth.terms}
          {'\n\n'}
          {auth.cancel}
        </Text>
      </View>

      <Link href="/(auth)/sign-in" style={styles.link}>
        <Text style={styles.linkText}>{auth.login}</Text>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  trialBadge: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: 30,
  },
  trialText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsBox: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
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
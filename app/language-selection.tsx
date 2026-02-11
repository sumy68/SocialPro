import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft } from 'lucide-react-native';

const LANGUAGE_SELECTED_KEY = '@socialpro:languageSelected';

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { setLanguage, hasCompletedOnboarding } = useApp();
  const [selected, setSelected] = useState<'de' | 'en' | 'es' | 'tr' | null>(null);

  const languages = [
    { code: 'de' as const, label: 'Deutsch', flag: '🇩🇪', subtitle: 'German' },
    { code: 'en' as const, label: 'English', flag: '🇬🇧', subtitle: 'English' },
    { code: 'es' as const, label: 'Español', flag: '🇪🇸', subtitle: 'Spanish' },
    { code: 'tr' as const, label: 'Türkçe', flag: '🇹🇷', subtitle: 'Turkish' },
  ];

  const handleSelect = async (lang: 'de' | 'en' | 'es' | 'tr') => {
    setSelected(lang);
    await setLanguage(lang);
    
    // ✅ Set flag that language has been selected
    await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, 'true');
    
    // Navigate based on onboarding status
    setTimeout(() => {
      if (hasCompletedOnboarding) {
        // If coming from settings, go back to settings
        router.back();
      } else {
        // If first time, go to onboarding
        router.replace('/onboarding/welcome');
      }
    }, 300);
  };

  const handleBack = () => {
    if (hasCompletedOnboarding) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ ZURÜCK BUTTON - nur wenn onboarding schon completed */}
      {hasCompletedOnboarding && (
        <TouchableOpacity 
          onPress={handleBack}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#EF4444" />
          <Text style={styles.backButtonText}>Zurück</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>Choose Your Language</Text>
        <Text style={styles.subtitle}>Select your preferred language</Text>

        <View style={styles.languageList}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                selected === lang.code && styles.languageButtonSelected,
              ]}
              onPress={() => handleSelect(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <View style={styles.languageTextContainer}>
                <Text style={styles.languageLabel}>{lang.label}</Text>
                <Text style={styles.languageSubtitle}>{lang.subtitle}</Text>
              </View>
              {selected === lang.code && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
    textAlign: 'center',
  },
  languageList: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  languageButtonSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  flag: {
    fontSize: 40,
    marginRight: 16,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  languageSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700',
  },
});
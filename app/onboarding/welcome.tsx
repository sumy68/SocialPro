import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Calendar, TrendingUp, Zap, Instagram, Linkedin, Music2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/contexts/AppContext';
import { onboardingTranslations } from '@/constants/translations';

const WELCOME_SEEN_KEY = '@socialpro:welcomeSeen';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const t = onboardingTranslations[language] ?? onboardingTranslations.de;

  const handleStart = async () => {
    await AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true');
    router.push('/(auth)/sign-in' as any);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={{
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🚀</Text>
            </View>
            <Text style={styles.title}>SocialPro</Text>
            <Text style={styles.subtitle}>
              {t.welcome?.subtitle || 'Deine All-in-One Social Media Management Plattform'}
            </Text>
          </View>

          {/* FEATURES */}
          <View style={styles.featuresContainer}>
            <FeatureCard 
              icon={<View style={styles.platformIcons}>
                <Instagram size={20} color="#E1306C" />
                <Linkedin size={20} color="#0A66C2" />
                <Music2 size={20} color="#000" />
              </View>}
              title={language === 'de' ? 'Multi-Plattform' : language === 'en' ? 'Multi-Platform' : language === 'es' ? 'Multi-Plataforma' : 'Çoklu Platform'}
              description={language === 'de' ? 'LinkedIn, Instagram & TikTok in einer App' : language === 'en' ? 'LinkedIn, Instagram & TikTok in one app' : language === 'es' ? 'LinkedIn, Instagram y TikTok en una app' : 'LinkedIn, Instagram ve TikTok tek uygulamada'}
            />
            
            <FeatureCard 
              icon={<Calendar size={24} color="#EF4444" />}
              title={language === 'de' ? 'Smart Scheduling' : language === 'en' ? 'Smart Scheduling' : language === 'es' ? 'Programación Inteligente' : 'Akıllı Planlama'}
              description={language === 'de' ? 'Plane Posts und veröffentliche automatisch' : language === 'en' ? 'Schedule posts and publish automatically' : language === 'es' ? 'Programa publicaciones y publica automáticamente' : 'Gönderileri planla ve otomatik yayınla'}
            />
            
            <FeatureCard 
              icon={<Sparkles size={24} color="#EF4444" />}
              title={language === 'de' ? 'KI Content Generator' : language === 'en' ? 'AI Content Generator' : language === 'es' ? 'Generador de Contenido IA' : 'Yapay Zeka İçerik Oluşturucu'}
              description={language === 'de' ? 'Automatische Captions & Hashtags per KI' : language === 'en' ? 'Automatic captions & hashtags with AI' : language === 'es' ? 'Subtítulos y hashtags automáticos con IA' : 'Yapay zeka ile otomatik altyazılar ve hashtag\'ler'}
            />
            
            <FeatureCard 
              icon={<TrendingUp size={24} color="#EF4444" />}
              title={language === 'de' ? 'Analytics Dashboard' : language === 'en' ? 'Analytics Dashboard' : language === 'es' ? 'Panel de Análisis' : 'Analitik Paneli'}
              description={language === 'de' ? 'Detaillierte Insights & Performance-Tracking' : language === 'en' ? 'Detailed insights & performance tracking' : language === 'es' ? 'Información detallada y seguimiento del rendimiento' : 'Detaylı içgörüler ve performans takibi'}
            />
          </View>

          {/* CTA BUTTON */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Zap size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {t.welcome?.getStarted || 'Jetzt starten'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconContainer}>
        {icon}
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#EF4444',
    paddingVertical: 18,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
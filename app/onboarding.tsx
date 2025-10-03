import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { ChevronRight, Building2, Target, Users, Zap } from 'lucide-react-native';

interface CompanyProfile {
  industry: string;
  companySize: string;
  goals: string[];
  targetAudience: string;
  currentPlatforms: string[];
  contentTypes: string[];
  postingFrequency: string;
}

const industries = [
  'E-Commerce',
  'Technologie',
  'Gesundheit & Wellness',
  'Bildung',
  'Immobilien',
  'Gastronomie',
  'Mode & Beauty',
  'Fitness & Sport',
  'Beratung',
  'Handwerk',
  'Andere'
];

const companySizes = [
  'Einzelunternehmer',
  '2-10 Mitarbeiter',
  '11-50 Mitarbeiter',
  '51-200 Mitarbeiter',
  '200+ Mitarbeiter'
];

const goalOptions = [
  'Markenbekanntheit steigern',
  'Leads generieren',
  'Verkäufe erhöhen',
  'Community aufbauen',
  'Kundenservice verbessern',
  'Recruiting',
  'Thought Leadership'
];

const platforms = [
  'Instagram',
  'Facebook',
  'LinkedIn',
  'TikTok',
  'YouTube',
  'Twitter/X',
  'Pinterest'
];

const contentTypes = [
  'Fotos',
  'Videos',
  'Stories',
  'Reels/TikToks',
  'Blog-Artikel',
  'Infografiken',
  'Live-Streams'
];

const frequencies = [
  'Täglich',
  '3-5x pro Woche',
  '1-2x pro Woche',
  'Wöchentlich',
  'Unregelmäßig'
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<CompanyProfile>({
    industry: '',
    companySize: '',
    goals: [],
    targetAudience: '',
    currentPlatforms: [],
    contentTypes: [],
    postingFrequency: ''
  });
  const { updateCompanyProfile, completeOnboarding } = useAuth();

  const steps = [
    {
      title: 'Ihre Branche',
      subtitle: 'In welcher Branche sind Sie tätig?',
      icon: Building2,
      content: 'industry'
    },
    {
      title: 'Unternehmensgröße',
      subtitle: 'Wie groß ist Ihr Unternehmen?',
      icon: Users,
      content: 'companySize'
    },
    {
      title: 'Ihre Ziele',
      subtitle: 'Was möchten Sie mit Social Media erreichen?',
      icon: Target,
      content: 'goals'
    },
    {
      title: 'Zielgruppe',
      subtitle: 'Beschreiben Sie Ihre Zielgruppe kurz',
      icon: Users,
      content: 'targetAudience'
    },
    {
      title: 'Aktuelle Plattformen',
      subtitle: 'Auf welchen Plattformen sind Sie bereits aktiv?',
      icon: Zap,
      content: 'currentPlatforms'
    },
    {
      title: 'Content-Arten',
      subtitle: 'Welche Inhalte erstellen Sie gerne?',
      icon: Zap,
      content: 'contentTypes'
    },
    {
      title: 'Posting-Häufigkeit',
      subtitle: 'Wie oft möchten Sie posten?',
      icon: Zap,
      content: 'postingFrequency'
    }
  ];

  const handleNext = () => {
    const currentStepData = steps[currentStep];
    
    // Validation
    if (currentStepData.content === 'industry' && !profile.industry) {
      Alert.alert('Fehler', 'Bitte wählen Sie eine Branche aus.');
      return;
    }
    if (currentStepData.content === 'companySize' && !profile.companySize) {
      Alert.alert('Fehler', 'Bitte wählen Sie eine Unternehmensgröße aus.');
      return;
    }
    if (currentStepData.content === 'goals' && profile.goals.length === 0) {
      Alert.alert('Fehler', 'Bitte wählen Sie mindestens ein Ziel aus.');
      return;
    }
    if (currentStepData.content === 'targetAudience' && !profile.targetAudience.trim()) {
      Alert.alert('Fehler', 'Bitte beschreiben Sie Ihre Zielgruppe.');
      return;
    }
    if (currentStepData.content === 'currentPlatforms' && profile.currentPlatforms.length === 0) {
      Alert.alert('Fehler', 'Bitte wählen Sie mindestens eine Plattform aus.');
      return;
    }
    if (currentStepData.content === 'contentTypes' && profile.contentTypes.length === 0) {
      Alert.alert('Fehler', 'Bitte wählen Sie mindestens eine Content-Art aus.');
      return;
    }
    if (currentStepData.content === 'postingFrequency' && !profile.postingFrequency) {
      Alert.alert('Fehler', 'Bitte wählen Sie eine Posting-Häufigkeit aus.');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await updateCompanyProfile(profile);
      await completeOnboarding();
      router.replace('/subscription');
    } catch (error) {
      Alert.alert('Fehler', 'Onboarding konnte nicht abgeschlossen werden.');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleArrayItem = (array: string[], item: string, setter: (items: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.content) {
      case 'industry':
        return (
          <View style={styles.optionsContainer}>
            {industries.map((industry) => (
              <TouchableOpacity
                key={industry}
                style={[
                  styles.optionButton,
                  profile.industry === industry && styles.optionButtonSelected
                ]}
                onPress={() => setProfile({ ...profile, industry })}
              >
                <Text style={[
                  styles.optionText,
                  profile.industry === industry && styles.optionTextSelected
                ]}>
                  {industry}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
        
      case 'companySize':
        return (
          <View style={styles.optionsContainer}>
            {companySizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.optionButton,
                  profile.companySize === size && styles.optionButtonSelected
                ]}
                onPress={() => setProfile({ ...profile, companySize: size })}
              >
                <Text style={[
                  styles.optionText,
                  profile.companySize === size && styles.optionTextSelected
                ]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
        
      case 'goals':
        return (
          <View style={styles.optionsContainer}>
            {goalOptions.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.optionButton,
                  profile.goals.includes(goal) && styles.optionButtonSelected
                ]}
                onPress={() => toggleArrayItem(profile.goals, goal, (goals) => setProfile({ ...profile, goals }))}
              >
                <Text style={[
                  styles.optionText,
                  profile.goals.includes(goal) && styles.optionTextSelected
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
        
      case 'targetAudience':
        return (
          <View style={styles.textInputContainer}>
            <Text style={styles.inputLabel}>Beschreiben Sie Ihre Zielgruppe:</Text>
            <View style={styles.textAreaContainer}>
              <Text
                style={styles.textArea}
                onPress={() => {
                  // Simple text input simulation
                  Alert.prompt(
                    'Zielgruppe',
                    'Beschreiben Sie Ihre Zielgruppe (z.B. "Junge Erwachsene 25-35, technikaffin, urban")',
                    (text) => {
                      if (text) {
                        setProfile({ ...profile, targetAudience: text });
                      }
                    },
                    'plain-text',
                    profile.targetAudience
                  );
                }}
              >
                {profile.targetAudience || 'Tippen Sie hier, um Ihre Zielgruppe zu beschreiben...'}
              </Text>
            </View>
          </View>
        );
        
      case 'currentPlatforms':
        return (
          <View style={styles.optionsContainer}>
            {platforms.map((platform) => (
              <TouchableOpacity
                key={platform}
                style={[
                  styles.optionButton,
                  profile.currentPlatforms.includes(platform) && styles.optionButtonSelected
                ]}
                onPress={() => toggleArrayItem(profile.currentPlatforms, platform, (platforms) => setProfile({ ...profile, currentPlatforms: platforms }))}
              >
                <Text style={[
                  styles.optionText,
                  profile.currentPlatforms.includes(platform) && styles.optionTextSelected
                ]}>
                  {platform}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
        
      case 'contentTypes':
        return (
          <View style={styles.optionsContainer}>
            {contentTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  profile.contentTypes.includes(type) && styles.optionButtonSelected
                ]}
                onPress={() => toggleArrayItem(profile.contentTypes, type, (types) => setProfile({ ...profile, contentTypes: types }))}
              >
                <Text style={[
                  styles.optionText,
                  profile.contentTypes.includes(type) && styles.optionTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
        
      case 'postingFrequency':
        return (
          <View style={styles.optionsContainer}>
            {frequencies.map((frequency) => (
              <TouchableOpacity
                key={frequency}
                style={[
                  styles.optionButton,
                  profile.postingFrequency === frequency && styles.optionButtonSelected
                ]}
                onPress={() => setProfile({ ...profile, postingFrequency: frequency })}
              >
                <Text style={[
                  styles.optionText,
                  profile.postingFrequency === frequency && styles.optionTextSelected
                ]}>
                  {frequency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
        
      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} von {steps.length}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <View style={styles.iconContainer}>
            <IconComponent color="#8B5CF6" size={32} />
          </View>
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
        </View>

        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Zurück</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Abschließen' : 'Weiter'}
          </Text>
          <ChevronRight color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  optionButtonSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  textInputContainer: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 120,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  textArea: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
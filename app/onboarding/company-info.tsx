import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { ChevronRight, Building2 } from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { useApp } from '@/contexts/AppContext';
import { CompanyInfo, TonePreference } from '@/constants/types';

export default function CompanyInfoScreen() {
  const router = useRouter();
  const t = useTranslation();
  const { completeOnboarding } = useApp();
  
  const [companyName, setCompanyName] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [contentGoals, setContentGoals] = useState<string>('');
  const [postingFrequency, setPostingFrequency] = useState<'daily' | 'weekly' | 'biweekly'>('weekly');
  const [tone, setTone] = useState<TonePreference>('casual');

  const handleContinue = async () => {
    const info: CompanyInfo = {
      companyName,
      industry,
      targetAudience,
      contentGoals,
      postingFrequency,
      tonePreference: tone,
    };
    
    await completeOnboarding(info);
    router.push('/onboarding/connect-platforms' as any);
  };

  const canContinue = companyName.trim().length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: t.onboarding.companyInfo.title,
          headerBackTitle: t.back,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Building2 size={32} color="#0A66C2" strokeWidth={2} />
          </View>
          <Text style={styles.title}>{t.onboarding.companyInfo.title}</Text>
          <Text style={styles.subtitle}>{t.onboarding.companyInfo.subtitle}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.onboarding.companyInfo.companyName}</Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder={t.onboarding.companyInfo.companyName}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.onboarding.companyInfo.industry}</Text>
            <TextInput
              style={styles.input}
              value={industry}
              onChangeText={setIndustry}
              placeholder={t.onboarding.companyInfo.industryPlaceholder}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.onboarding.companyInfo.targetAudience}</Text>
            <TextInput
              style={styles.input}
              value={targetAudience}
              onChangeText={setTargetAudience}
              placeholder={t.onboarding.companyInfo.targetAudiencePlaceholder}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.onboarding.companyInfo.contentGoals}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={contentGoals}
              onChangeText={setContentGoals}
              placeholder={t.onboarding.companyInfo.contentGoalsPlaceholder}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.onboarding.companyInfo.postingFrequency}</Text>
            <View style={styles.frequencyButtons}>
              <FrequencyButton
                label={t.onboarding.companyInfo.daily}
                selected={postingFrequency === 'daily'}
                onPress={() => setPostingFrequency('daily')}
              />
              <FrequencyButton
                label={t.onboarding.companyInfo.weekly}
                selected={postingFrequency === 'weekly'}
                onPress={() => setPostingFrequency('weekly')}
              />
              <FrequencyButton
                label={t.onboarding.companyInfo.biweekly}
                selected={postingFrequency === 'biweekly'}
                onPress={() => setPostingFrequency('biweekly')}
              />
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t.onboarding.companyInfo.tone}</Text>
          <View style={styles.toneButtons}>
            {(
              [
                'casual',
                'serious',
                'inspiring',
                'professional',
                'friendly',
                'educational',
                'authoritative',
                'playful',
                'empathetic',
              ] as TonePreference[]
            ).map((key) => (
              <TouchableOpacity
                key={key}
                testID={`tone-${key}`}
                style={[styles.toneButton, tone === key && styles.toneButtonSelected]}
                onPress={() => setTone(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toneButtonText, tone === key && styles.toneButtonTextSelected]}>
                  {t.onboarding.companyInfo.toneOptions?.[key] ?? key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{t.next}</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function FrequencyButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.frequencyButton, selected && styles.frequencyButtonSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.frequencyButtonText, selected && styles.frequencyButtonTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#0F1419',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0F1419',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F1419',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    paddingTop: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  toneButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  toneButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0A66C2',
  },
  toneButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    textAlign: 'center' as const,
  },
  toneButtonTextSelected: {
    color: '#0A66C2',
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  frequencyButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0A66C2',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    textAlign: 'center',
  },
  frequencyButtonTextSelected: {
    color: '#0A66C2',
  },
  button: {
    backgroundColor: '#0A66C2',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});

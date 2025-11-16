import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronRight, Building2 } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { translations } from '@/constants/translations';
import type { CompanyInfo, TonePreference } from '@/constants/types';

export default function CompanyInfoScreen() {
  const router = useRouter();
  const { language, completeOnboarding } = useApp();
  const t = translations[language] ?? translations.de;

  // extra: lokal alias, aber alles optional
  const c = t.onboarding?.companyInfo ?? ({} as any);

  const [companyName, setCompanyName] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [contentGoals, setContentGoals] = useState<string>('');
  const [postingFrequency, setPostingFrequency] = useState<
    'daily' | 'weekly' | 'biweekly'
  >('weekly');
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
    router.push('/subscription' as any);
  };

  const canContinue = companyName.trim().length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: c.title ?? 'Über Ihr Unternehmen',
          headerBackTitle: t.back ?? 'Zurück',
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Building2 size={32} color="#0A66C2" strokeWidth={2} />
          </View>
          <Text style={styles.title}>{c.title ?? 'Über Ihr Unternehmen'}</Text>
          <Text style={styles.subtitle}>
            {c.subtitle ??
              'Helfen Sie uns, Ihre perfekte Content-Strategie zu erstellen.'}
          </Text>
        </View>

        <View style={styles.form}>
          <View className="inputGroup" style={styles.inputGroup}>
            <Text style={styles.label}>
              {c.companyName ?? 'Firmenname'}
            </Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder={c.companyNamePlaceholder ?? 'Ihr Firmenname'}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{c.industry ?? 'Branche'}</Text>
            <TextInput
              style={styles.input}
              value={industry}
              onChangeText={setIndustry}
              placeholder={
                c.industryPlaceholder ?? 'z.B. Technologie, Mode, Gesundheit'
              }
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {c.targetAudience ?? 'Zielgruppe'}
            </Text>
            <TextInput
              style={styles.input}
              value={targetAudience}
              onChangeText={setTargetAudience}
              placeholder={
                c.targetAudiencePlaceholder ??
                'z.B. B2B Entscheider, Gen Z, Eltern'
              }
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {c.contentGoals ?? 'Content-Ziele'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={contentGoals}
              onChangeText={setContentGoals}
              placeholder={
                c.contentGoalsPlaceholder ??
                'z.B. Brand Awareness, Lead Generation'
              }
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {c.postingFrequency ?? 'Posting-Frequenz'}
            </Text>
            <View style={styles.frequencyButtons}>
              <FrequencyButton
                label={c.daily ?? 'Täglich'}
                selected={postingFrequency === 'daily'}
                onPress={() => setPostingFrequency('daily')}
              />
              <FrequencyButton
                label={c.weekly ?? '3–4x pro Woche'}
                selected={postingFrequency === 'weekly'}
                onPress={() => setPostingFrequency('weekly')}
              />
              <FrequencyButton
                label={c.biweekly ?? '1–2x pro Woche'}
                selected={postingFrequency === 'biweekly'}
                onPress={() => setPostingFrequency('biweekly')}
              />
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{c.tone ?? 'Tonalität'}</Text>
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
                style={[
                  styles.toneButton,
                  tone === key && styles.toneButtonSelected,
                ]}
                onPress={() => setTone(key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toneButtonText,
                    tone === key && styles.toneButtonTextSelected,
                  ]}
                >
                  {c.toneOptions?.[key] ?? key}
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
          <Text style={styles.buttonText}>{t.next ?? 'Weiter'}</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function FrequencyButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.frequencyButton,
        selected && styles.frequencyButtonSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.frequencyButtonText,
          selected && styles.frequencyButtonTextSelected,
        ]}
      >
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  frequencyButtonSelected: {
    borderColor: '#0A66C2',
    backgroundColor: '#E3F2FD',
  },
  frequencyButtonText: {
    fontSize: 13,
    color: '#4B5563',
  },
  frequencyButtonTextSelected: {
    color: '#0A66C2',
    fontWeight: '600',
  },
  toneButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toneButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  toneButtonSelected: {
    borderColor: '#0A66C2',
    backgroundColor: '#E3F2FD',
  },
  toneButtonText: {
    fontSize: 13,
    color: '#4B5563',
  },
  toneButtonTextSelected: {
    color: '#0A66C2',
    fontWeight: '600',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#0A66C2',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

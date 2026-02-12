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
import { ChevronRight, Building2, User, Users, ChevronLeft } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { onboardingTranslations } from '@/constants/translations';
import type { CompanyInfo, TonePreference } from '@/constants/types';

type AccountType = 'business' | 'creator' | 'both';

export default function CompanyInfoScreen() {
  const router = useRouter();
  const { language, completeOnboarding, updateAccountType, updateUserProfile } = useApp();
  const t = onboardingTranslations[language] ?? onboardingTranslations.de;
  const c = t.companyInfo ?? ({} as any);

  const [step, setStep] = useState<'type' | 'info'>('type');
  const [accountType, setAccountTypeState] = useState<AccountType | null>(null);
  
  const [name, setName] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [niche, setNiche] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [contentGoals, setContentGoals] = useState<string>('');
  const [postingFrequency, setPostingFrequency] = useState<'daily' | 'weekly' | 'biweekly'>('weekly');
  const [tone, setTone] = useState<TonePreference>('casual');

  const handleTypeSelect = (type: AccountType) => {
    setAccountTypeState(type);
    setStep('info');
  };

  const handleContinue = async () => {
    if (!accountType) return;

    await updateAccountType(accountType);
    
    await updateUserProfile({
      name,
      industry: accountType === 'business' || accountType === 'both' ? industry : '',
      niche: accountType === 'creator' || accountType === 'both' ? niche : '',
      targetAudience,
      contentGoals,
    });

    const info: CompanyInfo = {
      companyName: name,
      industry: accountType === 'business' || accountType === 'both' ? industry : niche,
      targetAudience,
      contentGoals,
      postingFrequency,
      tonePreference: tone,
    };

    await completeOnboarding(info);
    router.push('/onboarding/connect-platforms');
  };

  const canContinue = name.trim().length > 0 && 
    (accountType === 'business' ? industry.trim().length > 0 : 
     accountType === 'creator' ? niche.trim().length > 0 : 
     industry.trim().length > 0 && niche.trim().length > 0);

  if (step === 'type') {
    return (
      <>
        <Stack.Screen
          options={{
            title: c.accountTypeTitle || 'Account Typ',
            headerShown: false,
          }}
        />
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {/* ✅ ZURÜCK BUTTON */}
          <TouchableOpacity 
            onPress={() => router.replace('/(tabs)/(settings)')}
            style={styles.backButton}
          >
            <ChevronLeft size={20} color="#EF4444" />
            <Text style={styles.backButtonText}>{c.complete === 'Continue' ? 'Back' : c.complete === 'Continuar' ? 'Atras' : c.complete === 'Devam' ? 'Geri' : 'Zurueck'}</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{c.accountTypeTitle || 'Wähle deinen Account-Typ'}</Text>
            <Text style={styles.subtitle}>
              {c.accountTypeSubtitle || 'Wähle den Typ, der am besten zu dir passt'}
            </Text>
          </View>

          <View style={styles.typeCards}>
            <TouchableOpacity
              style={styles.typeCard}
              onPress={() => handleTypeSelect('business')}
              activeOpacity={0.7}
            >
              <View style={[styles.typeIcon, { backgroundColor: '#E3F2FD' }]}>
                <Building2 size={40} color="#0A66C2" strokeWidth={2} />
              </View>
              <Text style={styles.typeTitle}>{c.business || 'Unternehmen'}</Text>
              <Text style={styles.typeDescription}>
                {c.businessDesc || 'Für Firmen, Marken und Business-Accounts'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeCard}
              onPress={() => handleTypeSelect('creator')}
              activeOpacity={0.7}
            >
              <View style={[styles.typeIcon, { backgroundColor: '#FEE2E2' }]}>
                <User size={40} color="#EF4444" strokeWidth={2} />
              </View>
              <Text style={styles.typeTitle}>{c.creator || 'Creator'}</Text>
              <Text style={styles.typeDescription}>
                {c.creatorDesc || 'Für Influencer, Content Creator und Personal Brands'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeCard}
              onPress={() => handleTypeSelect('both')}
              activeOpacity={0.7}
            >
              <View style={[styles.typeIcon, { backgroundColor: '#F3E8FF' }]}>
                <Users size={40} color="#7C3AED" strokeWidth={2} />
              </View>
              <Text style={styles.typeTitle}>{c.both || 'Beides'}</Text>
              <Text style={styles.typeDescription}>
                {c.bothDesc || 'Für Unternehmer mit Personal Brand'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: accountType === 'business' ? (c.businessTitle || 'About your business') : accountType === 'creator' ? (c.creatorTitle || 'About you') : (c.bothTitle || 'Your Profile'),
          headerShown: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <TouchableOpacity 
          onPress={() => setStep('type')} 
          style={styles.backButton}
        >
          <ChevronLeft size={20} color="#EF4444" />
          <Text style={styles.backButtonText}>Typ ändern</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            {accountType === 'business' && <Building2 size={32} color="#0A66C2" strokeWidth={2} />}
            {accountType === 'creator' && <User size={32} color="#EF4444" strokeWidth={2} />}
            {accountType === 'both' && <Users size={32} color="#7C3AED" strokeWidth={2} />}
          </View>
          <Text style={styles.title}>
            {c.profileTitle || c.title || 'Complete your Profile'}
          </Text>
          <Text style={styles.subtitle}>
            {c.profileSubtitle || c.subtitle || 'Help us create your content strategy'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {accountType === 'business' ? 'Firmenname' : 
               accountType === 'creator' ? 'Dein Name / Creator Name' : 
               'Name / Firmenname'}
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={c.namePlaceholder || 'Dein Name'}
              placeholderTextColor="#999"
            />
          </View>

          {(accountType === 'business' || accountType === 'both') && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{c.industry || 'Branche'}</Text>
              <TextInput
                style={styles.input}
                value={industry}
                onChangeText={setIndustry}
                placeholder={c.industryPlaceholder || 'z.B. Marketing, Tech, E-Commerce'}
                placeholderTextColor="#999"
              />
            </View>
          )}

          {(accountType === 'creator' || accountType === 'both') && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{c.niche || 'Nische / Thema'}</Text>
              <TextInput
                style={styles.input}
                value={niche}
                onChangeText={setNiche}
                placeholder={c.nichePlaceholder || 'z.B. Fitness, Lifestyle, Business'}
                placeholderTextColor="#999"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{c.targetAudience || 'Zielgruppe'}</Text>
            <TextInput
              style={styles.input}
              value={targetAudience}
              onChangeText={setTargetAudience}
              placeholder={c.targetAudiencePlaceholder || 'z.B. Unternehmer, Gen Z, Fitness-Enthusiasten'}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{c.contentGoals || 'Content-Ziele'}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={contentGoals}
              onChangeText={setContentGoals}
              placeholder={c.contentGoalsPlaceholder || 'z.B. Mehr Reichweite, Kunden gewinnen, Community aufbauen'}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{c.postingFrequency || "Posting Frequency"}</Text>
            <View style={styles.frequencyButtons}>
              <FrequencyButton
                label={c.daily || "Daily"}
                selected={postingFrequency === 'daily'}
                onPress={() => setPostingFrequency('daily')}
              />
              <FrequencyButton
                label={c.weekly || "Weekly"}
                selected={postingFrequency === 'weekly'}
                onPress={() => setPostingFrequency('weekly')}
              />
              <FrequencyButton
                label={c.biweekly || "Bi-weekly"}
                selected={postingFrequency === 'biweekly'}
                onPress={() => setPostingFrequency('biweekly')}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{c.tone || "Tone / Writing Style"}</Text>
            <View style={styles.toneButtons}>
              {[
                { key: 'casual', label: c.toneOptions?.casual || 'Casual' },
                { key: 'professional', label: c.toneOptions?.professional || 'Professional' },
                { key: 'inspiring', label: c.toneOptions?.inspiring || 'Inspiring' },
                { key: 'friendly', label: c.toneOptions?.friendly || 'Friendly' },
                { key: 'educational', label: c.toneOptions?.educational || 'Educational' },
                { key: 'serious', label: c.toneOptions?.serious || 'Serious' },
                { key: 'playful', label: c.toneOptions?.playful || 'Playful' },
                { key: 'empathetic', label: c.toneOptions?.empathetic || 'Empathetic' },
                { key: 'authoritative', label: c.toneOptions?.authoritative || 'Authoritative' },
              ].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.toneButton, tone === key && styles.toneButtonSelected]}
                  onPress={() => setTone(key as TonePreference)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toneButtonText, tone === key && styles.toneButtonTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{c.complete || 'Speichern'}</Text>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    gap: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
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
    paddingHorizontal: 20,
  },
  typeCards: {
    gap: 16,
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  typeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  typeDescription: {
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
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  frequencyButtonText: {
    fontSize: 12,
    color: '#4B5563',
  },
  frequencyButtonTextSelected: {
    color: '#EF4444',
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
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  toneButtonText: {
    fontSize: 13,
    color: '#4B5563',
  },
  toneButtonTextSelected: {
    color: '#EF4444',
    fontWeight: '600',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#EF4444',
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
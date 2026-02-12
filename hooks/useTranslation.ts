import { useApp } from '@/contexts/AppContext';
import { translations, onboardingTranslations } from '@/constants/translations';
import type { Language } from '@/constants/translations';

export function useTranslation() {
  const { language } = useApp();

  const lang = language as Language;
  return translations[lang] ?? translations.de;
}

export function useOnboardingTranslation() {
  const { language } = useApp();

  return onboardingTranslations[language] ?? onboardingTranslations.de;
}
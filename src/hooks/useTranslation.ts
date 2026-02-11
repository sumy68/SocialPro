import { useApp } from '@/contexts/AppContext';
import { translations, onboardingTranslations } from '@/constants/translations';

export function useTranslation() {
  const { language } = useApp();
  
  return translations[language] ?? translations.de;
}

export function useOnboardingTranslation() {
  const { language } = useApp();
  
  return onboardingTranslations[language] ?? onboardingTranslations.de;
}

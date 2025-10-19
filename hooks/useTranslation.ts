import { useApp } from '@/contexts/AppContext';
import { translations, TranslationKeys } from '@/constants/translations';

export function useTranslation() {
  const { language } = useApp();
  
  return translations[language];
}

export type Translation = TranslationKeys;

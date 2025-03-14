import { Language } from '@/i18n/types';

export interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

export interface LanguageOption {
  code: Language;
  name: string;
  fullName: string;
  flag: string;
}
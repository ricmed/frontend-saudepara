import { useCallback } from 'react';
import { translations } from './translations';
import { Language, TranslationRecord } from './types';

type InterpolationValues = Record<string, string>;

export const useTranslation = (selectedLanguage: Language) => {
  const t = useCallback((key: string | keyof TranslationRecord, interpolationValues?: InterpolationValues) => {
    let translatedText = translations[selectedLanguage]?.[key as keyof TranslationRecord] || key;
    
    // Handle interpolation if values are provided
    if (interpolationValues) {
      Object.keys(interpolationValues).forEach(placeholder => {
        translatedText = translatedText.replace(
          new RegExp(`{${placeholder}}`, 'g'),
          interpolationValues[placeholder]
        );
      });
    }
    
    return translatedText;
  }, [selectedLanguage]);

  return { t };
};
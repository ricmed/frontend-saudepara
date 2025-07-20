import { useCallback } from 'react';
import { SupportedLanguage } from '../types';

export const useGoogleTranslate = (selectedLanguage: SupportedLanguage) => {
  const translateInstructions = useCallback(async (text: string) => {
    if (selectedLanguage === 'pt-BR') return text;

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        }`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            target: selectedLanguage.split('-')[0],
            source: 'pt',
          }),
        }
      );

      const data = await response.json();
      return data.data.translations[0].translatedText;
    } catch (error) {
      console.error('Erro na tradução:', error);
      return text;
    }
  }, [selectedLanguage]);

  return { translateInstructions };
};
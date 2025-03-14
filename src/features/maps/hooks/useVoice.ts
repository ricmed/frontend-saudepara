import { useCallback } from 'react';
import { mapsVoiceService } from '@/api/maps/services/voice/voice';
import { SupportedLanguage } from '@/api/maps/types';

export const useVoice = (selectedLanguage: SupportedLanguage) => {
  const speak = useCallback(
    async (text: string) => {
      const audioContent = await mapsVoiceService.synthesizeSpeech(text, selectedLanguage);
      
      if (audioContent) {
        const audio = new Audio(`data:audio/wav;base64,${audioContent}`);
        audio.play();
      }
    },
    [selectedLanguage]
  );

  return { speak };
};
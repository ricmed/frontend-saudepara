import { GOOGLE_MAPS_CONFIG } from '../../config';
import { SupportedLanguage } from '../../types';

export const mapsVoiceService = {
  async synthesizeSpeech(text: string, language: SupportedLanguage): Promise<string | null> {
    if (!GOOGLE_MAPS_CONFIG.apiKey) {
      console.error('Chave da API do Google Maps não encontrada.');
      return null;
    }

    try {
      const response = await fetch(
        `${GOOGLE_MAPS_CONFIG.voice.apiUrl}?key=${GOOGLE_MAPS_CONFIG.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: language,
              ssmlGender: GOOGLE_MAPS_CONFIG.voice.defaultOptions.ssmlGender,
            },
            audioConfig: {
              audioEncoding: GOOGLE_MAPS_CONFIG.voice.defaultOptions.audioEncoding,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na API de Text-to-Speech:', errorData);
        return null;
      }

      const data = await response.json();
      return data.audioContent;
    } catch (error) {
      console.error('Erro ao sintetizar fala:', error);
      return null;
    }
  }
};

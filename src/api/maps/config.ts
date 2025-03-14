import { Libraries } from '@react-google-maps/api';

export const GOOGLE_MAPS_CONFIG = {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    // Removemos o 'as const' e usamos 'as Libraries'
    libraries: ['places', 'geometry', 'drawing'] as Libraries,
    voice: {
      apiUrl: 'https://texttospeech.googleapis.com/v1/text:synthesize',
      defaultOptions: {
        ssmlGender: 'FEMALE' as const,
        audioEncoding: 'LINEAR16' as const
      }
    }
};
import { adminPt } from './admin.pt';
import { adminEn } from './admin.en';
import { adminEs } from './admin.es';

export const adminTranslations = {
  pt: adminPt,
  en: adminEn,
  es: adminEs,
  "pt-br": adminPt,
  "pt-BR": adminPt,
};


// uso:
// adminTranslations[language]?.admin.dashboard.title

// types.ts
export type Language = "pt-BR" | "en" | "es" | "zh" | "fr";

// Basic Translation Types
export interface CampaignTranslation {
  title: string;
  desc: string;
}

export type CampaignTranslations = Record<Language, Record<string, CampaignTranslation>>;

// Para as traduções gerais
export type TranslationRecord = {
  // Cabeçalho
  "search.placeholder": string;
  
  // Menu Grid
  "menu.locations": string;
  "menu.campaigns": string;
  "menu.materials": string;
  "menu.fale_conosco": string;
  
  // Seção de Pontos
  "section.locate": string;
  "points.vaccination": string;
  "points.vaccination.desc": string;
  "points.food": string;
  "points.food.desc": string;
  "points.parks": string;
  "points.parks.desc": string;
  "points.cultural": string;
  "points.cultural.desc": string;
  "points.health": string;
  "points.health.desc": string;
  "points.hospitals": string;
  "points.hospitals.desc": string;
  
  // Navegação
  "nav.home": string;
  "nav.map": string;
  "nav.campaigns": string;
  "nav.entrar": string;

  // Botão FAB
  "fab.notifique": string;
  
  // Menu Lateral
  "menu.qualify_establishments": string;
  "menu.notification": string;
  "menu.dashboard": string;
  "menu.educational": string;
  "menu.apps": string;
  "menu.security": string;
  "menu.version": string;
  "menu.bug": string;
  "menu.logout": string;
  
  // Seletor de Idiomas
  "language.select": string;

  // Departamentos
  "department.title": string;
  "department.health-surveillance": string;
  "department.accidents": string;
  "department.chronic": string;
  "department.mental-health": string;
  "department.infectious": string;
  "department.zoonoses": string;
  "department.medications": string;
  "department.maternal": string;
  "department.epidemiology": string;

  // Campaigns
  "campaigns.breastfeeding.title": string;
  "campaigns.breastfeeding.description1": string;
  "campaigns.breastfeeding.description2": string;
  "campaigns.redDecember.title": string;
  "campaigns.redDecember.description1": string;
  "campaigns.redDecember.description2": string;
  "campaigns.redDecember.description3": string;
  "campaigns.redDecember.downloadButton": string;
  "campaigns.blueNovember.title": string;
  "campaigns.blueNovember.description1": string;
  "campaigns.blueNovember.description2": string;
  "campaigns.blueNovember.description3": string;
  "campaigns.blueNovember.description4": string;
  "campaigns.blueNovember.downloadButton1": string;
  "campaigns.blueNovember.downloadButton2": string;
  "campaigns.greenSeptember.title": string;
  "campaigns.greenSeptember.description1": string;
  "campaigns.greenSeptember.description2": string;
  "campaigns.malariaZero.title": string;
  "campaigns.malariaZero.description1": string;
  "campaigns.malariaZero.description2": string;

  // Health Campaigns Page
  "healthCampaigns.title": string;
  "healthCampaigns.backButton": string;
  "healthCampaigns.listAriaLabel": string;
  "healthCampaigns.itemAriaLabel": string;
  "healthCampaigns.redDecember.cardTitle": string;
  "healthCampaigns.redDecember.cardDescription": string;
  "healthCampaigns.blueNovember.cardTitle": string;
  "healthCampaigns.blueNovember.cardDescription": string;
  "healthCampaigns.greenSeptember.cardTitle": string;
  "healthCampaigns.greenSeptember.cardDescription": string;
  "healthCampaigns.malariaZero.cardTitle": string;
  "healthCampaigns.malariaZero.cardDescription": string;
  "healthCampaigns.breastfeeding.cardTitle": string;
  "healthCampaigns.breastfeeding.cardDescription": string;

  // Campaign List Items
  "campaigns.list.redDecember": string;
  "campaigns.list.redDecemberDesc": string;
  "campaigns.list.blueNovember": string;
  "campaigns.list.blueNovemberDesc": string;
  "campaigns.list.greenSeptember": string;
  "campaigns.list.greenSeptemberDesc": string;
  "campaigns.list.malaria": string;
  "campaigns.list.malariaDesc": string;
  "campaigns.list.breastfeeding": string;
  "campaigns.list.breastfeedingDesc": string;
}

// Final Translation Type
export type TranslationsType = Record<Language, TranslationRecord>;

// Campaign Data Structure
export const campaignStructure = {
  "dezembro-vermelho": {
    translationKey: "redDecember",
    route: "/campanha-dezembro-vermelho"
  },
  "novembro-azul": {
    translationKey: "blueNovember",
    route: "/campanha-novembro-azul"
  },
  "setembro-verde": {
    translationKey: "greenSeptember",
    route: "/setembro-verde"
  },
  "malaria-zero": {
    translationKey: "malaria",
    route: "/malaria-zero"
  },
  "amamentacao": {
    translationKey: "breastfeeding",
    route: "/amamentacao"
  }
} as const;
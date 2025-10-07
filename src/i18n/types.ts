// types.ts
export type Language = "pt-BR" | "en" | "es" | "zh" | "fr" | "ar" | "ru";

// Basic Translation Types
export interface CampaignTranslation {
  title: string;
  desc: string;
}

export type CampaignTranslations = Record<Language, Record<string, CampaignTranslation>>;

// Para as traduções gerais
export type TranslationRecord = {
  // Search
  'search.placeholder': string;
  
  // Header
  'header.secretaryOf': string;
  'header.publicHealth': string;
  'notifications': string;
  
  // Navigation
  'nav.home': string;
  'nav.map': string;
  'nav.campaigns': string;
  'nav.entrar': string;
  
  // Menu Grid
  'menu.locations': string;
  'menu.emergencies': string;
  'menu.consultations': string;
  'menu.exams': string;
  'menu.campaigns': string;
  'menu.fale_conosco': string;
  'menu.faq': string;
  'menu.servicos': string;
  'menu.materials': string;
  
  // Localize Aqui
  'localize.title': string;
  'localize.viewMap': string;
  
  // Points of interest
  [key: `points.${string}`]: string;
  [key: `points.${string}.desc`]: string;
  [key: `pointsDesc.${string}`]: string;
  
  // Section
  'section.locate': string;
  
  // Carousel navigation
  'carousel.previousSlide': string;
  'carousel.nextSlide': string;
  'carousel.goToSlide': string;
  
  // Campaign actions
  'campaigns.saibaMais': string;
  
  // Banner
  'banner.welcome': string;
  'banner.subtitle': string;
  'banner.findService': string;
  
  // FAB Button
  'fab.notifique': string;
  

  //logout
  'logout.confirmation.title': string;
  'logout.confirmation.message': string;
  'logout.confirmation.confirm': string;
  'logout.confirmation.cancel': string;

  // Side Menu
  'menu.home': string;
  'menu.qualify_establishments': string;
  'menu.notification': string;
  'menu.notify_case': string;
  'menu.dashboard': string;
  'menu.offline_management': string;
  'menu.educational': string;
  'menu.apps': string;
  'menu.security': string;
  'menu.version': string;
  'menu.bug': string;
  'menu.logout': string;
  'menu.login': string;
  'menu.manage_users': string;

  // Auxiliary Apps
  'apps.components': string;
  'apps.establishments': string;
  'apps.qualifications': string;
  'apps.enablings': string;
  'apps.closure_types': string;
  'apps.public_types': string;
  'apps.event_types': string;
  'apps.trauma_types': string;
  'apps.care_types': string;
  'apps.diagnostic_hypothesis_types': string;
  'apps.symptom_types': string;
  'apps.shift': string;
  'apps.nature': string;
  'apps.race': string;
  'apps.education': string;
  'apps.cbo': string;
  'apps.countries': string;
  'apps.states': string;
  'apps.cities': string;
  'apps.gender': string;
  'apps.sexual_orientation': string;
  
  // Language Selector
  'language.select': string;
  
  // Departments
  'department.title': string;
  'department.health-surveillance': string;
  'department.accidents': string;
  'department.chronic': string;
  'department.mental-health': string;
  'department.infectious': string;
  'department.zoonoses': string;
  'department.medications': string;
  'department.maternal': string;
  'department.epidemiology': string;
  
  // Health Campaigns
  'healthCampaigns.title': string;
  'healthCampaigns.backButton': string;
  'healthCampaigns.listAriaLabel': string;
  'healthCampaigns.itemAriaLabel': string;
  'healthCampaigns.viewCampaignButton': string;
  'healthCampaigns.searchPlaceholder': string;
  'healthCampaigns.searchAriaLabel': string;
  'healthCampaigns.clearSearchButton': string;
  'healthCampaigns.openMenuButton': string;
  'healthCampaigns.newCampaignButton': string;
  'healthCampaigns.newButton': string;
  'healthCampaigns.closeErrorButton': string;
  'healthCampaigns.noResults': string;
  'healthCampaigns.noCampaigns': string;
  'healthCampaigns.errorLoading': string;
  'healthCampaigns.tabs.campanhas': string;
  'healthCampaigns.tabs.favoritos': string;
  'healthCampaigns.tabs.recentes': string;  'healthCampaigns.footerCopyright': string;
  'healthCampaigns.footer.about': string;
  'healthCampaigns.footer.contact': string;
  'healthCampaigns.footer.privacy': string;
  'healthCampaigns.footer.terms': string;
  'healthCampaigns.addToFavorites': string;
  'healthCampaigns.removeFromFavorites': string;
  [key: `healthCampaigns.${string}.cardTitle`]: string;
  [key: `healthCampaigns.${string}.cardDescription`]: string;
  
  // Campaign Lists
  [key: `campaigns.list.${string}`]: string;
  [key: `campaigns.list.${string}Desc`]: string;
  
  // Campaign Details
  [key: `campaigns.${string}.title`]: string;
  [key: `campaigns.${string}.description${number}`]: string;
  [key: `campaigns.${string}.downloadButton${string}`]: string;
  
  // Footer
  'footer.rights': string;
  'footer.contact': string;
  'footer.address': string;
  'footer.openingHours': string;
  'footer.weekdayHours': string;
  'footer.sespaBrief': string;
  'footer.ombudsman': string;
  'footer.feedbackQuestion': string;
  'footer.contactOmbudsman': string;
  'footer.portalTitle': string;
  'footer.portalDescription': string;
  'footer.developedBy': string;  'footer.copyright': string;
  
  // Fale Conosco, ASCOM, Ouvidoria
  'faleConosco.title': string;
  'faleConosco.ascom': string;
  'faleConosco.ouvitoria': string;
  'faleConosco.access': string;
  'ascom.title': string;
  'ascom.subTitle': string;
  'ascom.description': string;
  'ascom.emailLabel': string;
  'ascom.phoneLabel': string;
  'ouvitoria.title': string;
  'ouvitoria.description': string;
  'ouvitoria.inPersonLabel': string;
  'ouvitoria.address': string;
  'ouvitoria.phoneLabel': string;
  'ouvitoria.freeCallLabel': string;
  'ouvitoria.emailLabel': string;
  'ouvitoria.siteLabel': string;
  'ouvitoria.formButton': string;
  'voltar': string;
  'menu.open': string;
  
  // Other pages
  'campaigns.title': string;
  'campaigns.description': string;
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
  "janeiro-roxo": {
    translationKey: "purpleJanuary",
    route: "/janeiro-roxo"
  },
  "agosto-dourado": {
    translationKey: "goldenAugust",
    route: "/agosto-dourado"
  }
} as const;
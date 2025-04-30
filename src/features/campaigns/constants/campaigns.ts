import { Campaign } from '../types/campaign.types';

export const HEALTH_CAMPAIGNS: Campaign[] = [
  // Janeiro Roxo como primeira campanha
  {
    id: "5",
    titleKey: "campaigns.list.purpleJanuary",
    descriptionKey: "campaigns.list.purpleJanuaryDesc",
    imageUrl: "/images/campaigns/Janeiro Roxo.jpg",
    link: "/janeiro-roxo",
    status: 'active'
  },
  {
    id: "1",
    titleKey: "campaigns.list.redDecember",
    descriptionKey: "campaigns.list.redDecemberDesc",
    imageUrl: "/images/campaigns/Dezembro Vermelho.png",
    link: "/campanha-dezembro-vermelho",
    status: 'active'
  },
  {
    id: "2",
    titleKey: "campaigns.list.blueNovember",
    descriptionKey: "campaigns.list.blueNovemberDesc",
    imageUrl: "/images/campaigns/Novembro Azul.png",
    link: "/campanha-novembro-azul",
    status: 'active'
  },
  {
    id: "3",
    titleKey: "campaigns.list.greenSeptember",
    descriptionKey: "campaigns.list.greenSeptemberDesc",
    imageUrl: "/images/campaigns/Setembro Verde.png",
    link: "/setembro-verde",
    status: 'active'
  },
  {
    id: "4",
    titleKey: "campaigns.list.malaria",
    descriptionKey: "campaigns.list.malariaDesc",
    imageUrl: "/images/campaigns/Malária Zero.png",
    link: "/malaria-zero",
    status: 'active'
  }
];
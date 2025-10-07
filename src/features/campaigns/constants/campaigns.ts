import { Campaign } from '../types/campaign.types';

export const HEALTH_CAMPAIGNS: Campaign[] = [
  // Setembro Amarelo como primeira campanha
  {
    id: "7",
    titleKey: "campaigns.list.yellowSeptember",
    descriptionKey: "campaigns.list.yellowSeptemberDesc",
    imageUrl: "/images/campaigns/Setembro Amarelo.jpg",
    link: "/setembro-amarelo",
    status: 'active'
  },
  // Setembro Verde
  {
    id: "3",
    titleKey: "campaigns.list.greenSeptember",
    descriptionKey: "campaigns.list.greenSeptemberDesc",
    imageUrl: "/images/campaigns/Setembro Verde.jpg",
    link: "/setembro-verde",
    status: 'active'
  },
  // Agosto Dourado
  {
    id: "6",
    titleKey: "campaigns.list.goldenAugust",
    descriptionKey: "campaigns.list.goldenAugustDesc",
    imageUrl: "/images/campaigns/Agosto Dourado – Aleitamento Materno.jpg",
    link: "/agosto-dourado",
    status: 'active'
  },
  // Janeiro Roxo
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
  }
];
import { Campaign } from '../types/campaign.types';

export const HEALTH_CAMPAIGNS: Campaign[] = [
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
  },
  {
    id: "5",
    titleKey: "campaigns.list.breastfeeding",
    descriptionKey: "campaigns.list.breastfeedingDesc",
    imageUrl: "/images/campaigns/Amamentação.png",
    link: "/amamentacao",
    status: 'active'
  }
];

export const NAVIGATION_ITEMS = [
  {
    id: 'inicio',
    label: 'Início',
    icon: 'Home',
    path: '/',
    activeColor: 'text-blue-600',
    inactiveColor: 'text-gray-400'
  },
  {
    id: 'mapa',
    label: 'Mapa',
    icon: 'Map',
    path: '/mapa',
    activeColor: 'text-blue-600',
    inactiveColor: 'text-gray-400'
  },
  {
    id: 'campanhas',
    label: 'Campanhas',
    icon: 'Heart',
    path: '/campanhas',
    activeColor: 'text-blue-600',
    inactiveColor: 'text-gray-400'
  },
  {
    id: 'perfil',
    label: 'Perfil',
    icon: 'User',
    path: '/perfil',
    activeColor: 'text-blue-600',
    inactiveColor: 'text-gray-400'
  }
];

export const FAB_BUTTON = {
  path: '/materiais',
  icon: 'FileText',
  backgroundColor: 'bg-blue-600',
  iconColor: 'text-white',
  size: {
    width: 'w-14',
    height: 'h-14'
  }
};

export const HEADER = {
  title: 'Campanhas de Saúde',
  backgroundColor: 'bg-blue-600',
  textColor: 'text-white',
  iconColor: 'text-white'
};

export const LAYOUT = {
  maxWidth: 'max-w-md',
  border: {
    width: 'border-8',
    color: 'border-gray-800',
    radius: 'rounded-[2.5rem]'
  },
  height: 'h-[720px]',
  background: 'bg-gray-50',
  notch: {
    height: 'h-6',
    width: 'w-40',
    color: 'bg-gray-800',
    radius: 'rounded-b-xl'
  }
};

export const CARD_STYLES = {
  container: 'flex bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md cursor-pointer',
  image: {
    wrapper: 'w-20 h-20 flex-shrink-0',
    style: 'w-full h-full object-cover'
  },
  content: {
    wrapper: 'p-3 flex-1',
    title: 'font-medium text-gray-900 text-sm',
    description: 'text-xs text-gray-600 mt-1'
  }
};
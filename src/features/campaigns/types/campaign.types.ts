import { TranslationRecord } from '@/i18n/types';

export type TabType = "campanhas" | "locais" | "perfil";

export interface Campaign {
  id: string;
  titleKey: keyof TranslationRecord;
  descriptionKey: keyof TranslationRecord;
  imageUrl: string;
  link: string;
  status?: 'active' | 'completed' | 'upcoming';
}

export interface CampaignCardProps {
  campaign: Campaign;
  onClick: (link: string) => void;
}

export interface NavigationItem {
  id: TabType;
  label: string;
  icon: string;
  path: string;
  activeColor: string;
  inactiveColor: string;
}
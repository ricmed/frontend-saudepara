import { TranslationRecord } from '@/i18n/types';

export type TabType = "campanhas" | "favoritos" | "recentes";

export interface Campaign {
  id: string;
  titleKey: keyof TranslationRecord;
  descriptionKey: keyof TranslationRecord;
  imageUrl: string;
  link: string;
  status?: 'active' | 'completed' | 'upcoming';
  featured?: boolean;
  date?: string;
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
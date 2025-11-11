import { TranslationRecord } from '@/i18n/types';

export type TabType = "materiais" | "favoritos" | "recentes";

export interface PDFDocument {
  title: string;
  path: string;
}

export interface EducationalMaterial {
  id: string;
  titleKey: keyof TranslationRecord;
  descriptionKey: keyof TranslationRecord;
  imageUrl: string;
  link: string;
  pdfs: PDFDocument[];
  status?: 'active' | 'archived' | 'upcoming';
  featured?: boolean;
  date?: string;
}

export interface MaterialCardProps {
  material: EducationalMaterial;
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

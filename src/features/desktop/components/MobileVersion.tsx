import React from 'react';
import { CustomCarousel } from '@/features/desktop/components/CustomCarousel';
import { BottomNavigation } from '@/features/home/components/BottomNavigation';
import { CustomHeader } from './CustomHeader';
import { CustomMenuGrid } from './CustomMenuGrid';
import { CustomLocalizeAqui } from './CustomLocalizeAqui';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/i18n/types';

interface MobileVersionProps {
  onMenuToggle: () => void;
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedLanguage?: Language;
}

export const MobileVersion: React.FC<MobileVersionProps> = ({ 
  onMenuToggle, 
  currentTab, 
  onTabChange,
  selectedLanguage: propSelectedLanguage
}) => {
  // Fallback to context language if not provided by props
  const languageContext = useLanguage();
  const selectedLanguage = propSelectedLanguage || languageContext.selectedLanguage;
  
  return (
    <div className="relative bg-blue-600 min-h-screen pb-16">
      {/* Header */}
      <CustomHeader onMenuToggle={onMenuToggle} selectedLanguage={selectedLanguage} />
      
      {/* Carrossel */}
      <div className="px-4 pb-4">
        <CustomCarousel />
      </div>
      
      {/* Menu Grid com espaçamento azul acima */}
      <CustomMenuGrid selectedLanguage={selectedLanguage} />
      
      {/* Localize Aqui com linha azul separadora */}
      <CustomLocalizeAqui selectedLanguage={selectedLanguage} />
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        currentTab={currentTab}
        onTabChange={onTabChange}
      />
    </div>
  );
};

export default MobileVersion;
import React from 'react';
import { CustomCarousel } from '@/features/desktop/components/CustomCarousel';
import { BottomNavigation } from '@/features/home/components/BottomNavigation';
import Header from './Header';
import { MenuGrid } from './MenuGrid';
import { LocalizeAqui } from './LocalizeAqui';
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
      <Header onMenuToggle={onMenuToggle} isMobile={true} selectedLanguage={selectedLanguage} />
      
      {/* Carrossel */}
      <div className="mt-6 px-4">
        <CustomCarousel />
      </div>
      
      {/* Menu Grid */}
      <MenuGrid isMobile={true} selectedLanguage={selectedLanguage} />
      
      {/* Localize Aqui */}
      <LocalizeAqui isMobile={true} selectedLanguage={selectedLanguage} />
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        currentTab={currentTab}
        onTabChange={onTabChange}
      />
    </div>
  );
};

export default MobileVersion;
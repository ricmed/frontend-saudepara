import React from 'react';
import Header from './Header';
import { BannerCarousel } from '@/features/desktop/components/BannerCarousel';
import { MenuGrid } from './MenuGrid';
import { ObservaSusHighlightBanner } from '@/features/observasus/components/ObservaSusHighlightBanner';
import { LocalizeAqui } from './LocalizeAqui';
import Footer from '@/features/desktop/components/Footer';
import { Language } from '@/i18n/types';

interface DesktopVersionProps {
  onMenuToggle: () => void;
  selectedLanguage?: Language; // Propriedade para o idioma selecionado
}

export const DesktopVersion: React.FC<DesktopVersionProps> = ({ 
  onMenuToggle, 
  selectedLanguage 
}) => {
  return (
    <div>
      {/* Header Desktop */}
      <Header onMenuToggle={onMenuToggle} isMobile={false} selectedLanguage={selectedLanguage} />
      
      {/* Banner carousel adaptado para desktop */}
      <BannerCarousel selectedLanguage={selectedLanguage} />
      
      {/* Destaque ObservaSUS */}
      <ObservaSusHighlightBanner selectedLanguage={selectedLanguage} />

      {/* Menu Cards */}
      <MenuGrid isMobile={false} selectedLanguage={selectedLanguage} />
      
      {/* Localize Aqui (pontos de interesse) */}
      <LocalizeAqui isMobile={false} selectedLanguage={selectedLanguage!} />
      
      {/* Footer */}
      <Footer selectedLanguage={selectedLanguage} />
    </div>
  );
};

export default DesktopVersion;
import React from 'react';
import { Header } from './Header';
import { BannerCarousel } from '@/features/desktop/components/BannerCarousel';
import { MenuGrid } from './MenuGrid';
import { LocalizeAqui } from './LocalizeAqui';
import Footer from '@/features/desktop/components/Footer';

interface DesktopVersionProps {
  onMenuToggle: () => void;
}

export const DesktopVersion: React.FC<DesktopVersionProps> = ({ onMenuToggle }) => {
  return (
    <div>
      {/* Header Desktop */}
      <Header onMenuToggle={onMenuToggle} isMobile={false} />
      
      {/* Banner carousel adaptado para desktop */}
      <BannerCarousel />
      
      {/* Menu Cards */}
      <MenuGrid isMobile={false} />
      
      {/* Localize Aqui (pontos de interesse) */}
      <LocalizeAqui isMobile={false} />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default DesktopVersion;
import React from 'react';
import { CustomCarousel } from '@/features/desktop/components/CustomCarousel';
import { BottomNavigation } from '@/features/home/components/BottomNavigation';
import { Header } from './Header';
import { MenuGrid } from './MenuGrid';
import { LocalizeAqui } from './LocalizeAqui';

interface MobileVersionProps {
    isMenuOpen: boolean;
    onMenuToggle: () => void;
    currentTab: string;
    onTabChange: (tab: string) => void;
  }
  
  export const MobileVersion: React.FC<MobileVersionProps> = ({ 
    isMenuOpen, 
    onMenuToggle, 
    currentTab, 
    onTabChange 
  }) => {
    return (
      <div className="relative bg-blue-600 min-h-screen pb-16">
        {/* Header */}
        <Header onMenuToggle={onMenuToggle} isMobile={true} />
        
        {/* Carrossel */}
        <div className="mt-6 px-4">
          <CustomCarousel />
        </div>
        
        {/* Menu Grid */}
        <MenuGrid isMobile={true} />
        
        {/* Localize Aqui */}
        <LocalizeAqui isMobile={true} />
        
        {/* Bottom Navigation */}
        <BottomNavigation 
          currentTab={currentTab}
          onTabChange={onTabChange}
        />
      </div>
    );
  };
  
  export default MobileVersion;
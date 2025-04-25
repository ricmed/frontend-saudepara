import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Importações dos componentes
import { MobileVersion } from './components/MobileVersion';
import { DesktopVersion } from './components/DesktopVersion';
import { SideMenu } from '@/features/home/components/SideMenu';

interface PortalSaudeParaProps {
  initialTab?: string;
}

const PortalSaudePara: React.FC<PortalSaudeParaProps> = ({ initialTab = "inicio" }) => {
  // Estados
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(initialTab);
  
  // Hooks
  const { selectedLanguage, setSelectedLanguage } = useLanguage();

  // Handlers
  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  return (
    <div>
      {/* Versão Mobile (visível apenas em telas pequenas) */}
      <div className="md:hidden">
        <MobileVersion 
          onMenuToggle={handleMenuToggle}
          currentTab={currentTab}
          onTabChange={handleTabChange}
        />
      </div>
      
      {/* Versão Desktop (visível apenas em telas maiores) */}
      <div className="hidden md:block">
        <DesktopVersion 
          onMenuToggle={handleMenuToggle} 
          selectedLanguage={selectedLanguage} 
        />
      </div>
      
      {/* Menu Lateral */}
      <SideMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />
    </div>
  );
};

export default PortalSaudePara;
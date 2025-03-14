import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/useTranslations';
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
  const navigate = useNavigate();
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);

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
          isMenuOpen={isMenuOpen}
          onMenuToggle={handleMenuToggle}
          currentTab={currentTab}
          onTabChange={handleTabChange}
        />
      </div>
      
      {/* Versão Desktop (visível apenas em telas maiores) */}
      <div className="hidden md:block">
        <DesktopVersion onMenuToggle={handleMenuToggle} />
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
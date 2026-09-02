import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppHeaderLogos } from '@/features/desktop/components/AppHeaderLogos';

interface HeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  currentSlide: number;
  onSlideChange: (slide: number) => void;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  children
}) => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);

  return (
    <header className="bg-blue-600 p-4">
      {/* Menu e Notificações */}
      <div className="flex justify-between items-center">
        <Menu
          className="h-6 w-6 text-white cursor-pointer"
          onClick={onMenuToggle}
        />
        <Bell className="h-6 w-6 text-white" />
      </div>

      {/* Logos */}
      <div className="mt-4 flex justify-center">
        <AppHeaderLogos compact />
      </div>

      {/* Barra de Busca */}
      <div className="bg-blue-500/40 rounded-full p-3 flex items-center mt-4">
        <Search className="h-5 w-5 text-white mr-2" />
        <input
          placeholder={t('search.placeholder')}
          className="bg-transparent text-white placeholder-white/70 outline-none w-full text-sm"
        />
      </div>

      {/* Carrossel */}
      <div className="mt-3">
        {children}
      </div>
    </header>
  );
};
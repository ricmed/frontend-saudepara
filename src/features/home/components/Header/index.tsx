import React from 'react';
import { Menu, Bell } from 'lucide-react';
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

      {/* Carrossel */}
      <div className="mt-3">
        {children}
      </div>
    </header>
  );
};
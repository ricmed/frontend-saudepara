import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Heart, Book, MessageCircle, FileText, Plus } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslations';
import { Language } from '@/i18n/types';
import { useAuth } from '@/keycloak/AuthProvider';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface MenuGridProps {
  isMobile?: boolean;
  selectedLanguage?: Language;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ 
  isMobile = true, 
  selectedLanguage 
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation(selectedLanguage || 'pt-BR');
  const { user } = useAuth();
  const permissions = useUserPermissions();

  const menuItems = [
    {
      icon: <Building className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[#3B5FFF] mb-${isMobile ? '2' : '3'}`} />,
      label: 'menu.locations',
      onClick: () => navigate('/mapa')
    },
    {
      icon: <Heart className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[#3B5FFF] mb-${isMobile ? '2' : '3'}`} />,
      label: 'menu.campaigns',
      onClick: () => navigate('/campanhas')
    },
    {
      icon: <Book className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[#3B5FFF] mb-${isMobile ? '2' : '3'}`} />,
      label: 'menu.materials',
      onClick: () => navigate('/materiais-educativos')
    },
    {
      icon: <MessageCircle className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[#3B5FFF] mb-${isMobile ? '2' : '3'}`} />,
      label: 'menu.fale_conosco',
      onClick: () => navigate('/fale-conosco')
    }
  ];

  // Botão especial para comunicação DAE (apenas para notificadores e apenas na versão desktop)
  const notificationButton = user && permissions.isNotificador && !isMobile ? {
    icon: (
      <div className="relative">
        <FileText className="h-10 w-10 text-white" />
        <Plus className="h-4 w-4 text-white absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5" />
      </div>
    ),
    onClick: () => navigate('/private/comunicacao-dae/nova'),
    isSpecial: true
  } : null;

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-t-3xl">
        {menuItems.map((item, index) => (
          <div 
            key={index}
            onClick={item.onClick}
            className="bg-white flex flex-col items-center p-6 rounded-xl shadow-sm cursor-pointer"
          >
            {item.icon}
            <span className="text-sm font-medium">{t(item.label)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-12 max-w-6xl mx-auto px-6">
      {/* Botão especial de comunicação DAE - destaque superior */}
      {notificationButton && (
        <div className="mb-8 flex justify-center">
          <div 
            onClick={notificationButton.onClick}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex flex-col items-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 min-w-[220px]"
          >
            <div className="mb-3">
              {notificationButton.icon}
            </div>
            <span className="text-lg font-semibold mb-1">{t('menu.reportDAE')}</span>
            <span className="text-xs text-blue-100 text-center">
              {t('menu.reportDAEDesc')}
            </span>
          </div>
        </div>
      )}
      
      {/* Grid de menus principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item, index) => (
          <div 
            key={index}
            onClick={item.onClick}
            className="bg-white flex flex-col items-center p-8 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
          >
            {item.icon}
            <span className="text-lg font-medium">{t(item.label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuGrid;
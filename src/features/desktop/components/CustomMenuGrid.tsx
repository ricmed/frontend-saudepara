import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Heart, Book, MessageCircle } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslations';
import { Language } from '@/i18n/types';

interface CustomMenuGridProps {
  selectedLanguage?: Language;
}

export const CustomMenuGrid: React.FC<CustomMenuGridProps> = ({ 
  selectedLanguage 
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation(selectedLanguage || 'pt-BR');

  const menuItems = [
    {
      icon: <Building className="h-8 w-8 text-[#4A6CF7] mb-3" />,
      label: t('menu.locations'),
      onClick: () => navigate('/mapa')
    },
    {
      icon: <Heart className="h-8 w-8 text-[#4A6CF7] mb-3" />,
      label: t('menu.campaigns'),
      onClick: () => navigate('/campanhas')
    },
    {
      icon: <Book className="h-8 w-8 text-[#4A6CF7] mb-3" />,
      label: t('menu.materials'),
      onClick: () => navigate('/materiais')
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-[#4A6CF7] mb-3" />,
      label: t('menu.fale_conosco'),
      onClick: () => navigate('/fale-conosco')
    }
  ];

  return (
    <div className="bg-white mt-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item, index) => (
          <div 
            key={index}
            onClick={item.onClick}
            className="bg-white flex flex-col items-center justify-center p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            {item.icon}
            <span className="text-sm font-medium text-gray-800 text-center leading-tight">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomMenuGrid;
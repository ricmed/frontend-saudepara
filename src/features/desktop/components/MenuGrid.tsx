import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Heart, Book, MessageCircle } from 'lucide-react';

interface MenuGridProps {
  isMobile?: boolean;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ isMobile = true }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: <Building className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[#3B5FFF] mb-${isMobile ? '2' : '3'}`} />,
      label: 'Locais',
      onClick: () => navigate('/mapa')
    },
    {
      icon: <Heart className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[#3B5FFF] mb-${isMobile ? '2' : '3'}`} />,
      label: 'Campanhas de Saúde',
      onClick: () => navigate('/campanhas')
    },
    {
      icon: <Book className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[#3B5FFF] mb-${isMobile ? '2' : '3'}`} />,
      label: 'Materiais Educativos',
      onClick: () => navigate('/materiais')
    },
    {
      icon: <MessageCircle className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[#3B5FFF] mb-${isMobile ? '2' : '3'}`} />,
      label: 'Fale Conosco',
      onClick: () => navigate('/contato')
    }
  ];

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
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-12 max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item, index) => (
          <div 
            key={index}
            onClick={item.onClick}
            className="bg-white flex flex-col items-center p-8 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
          >
            {item.icon}
            <span className="text-lg font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuGrid;
// src/features/notifications/components/MenuGrid/index.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Heart, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/i18n/useTranslations';

export const MenuGrid: React.FC = () => {
 const navigate = useNavigate();
 const { selectedLanguage } = useLanguage();
 const { t } = useTranslation(selectedLanguage);

 // WhatsApp SVG como componente
 const WhatsAppIcon = () => (
   <svg
     xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     className="h-6 w-6 text-blue-600 mb-2"
     strokeWidth="1"
   >
     <path
       d="M20.3226 3.69685C18.1911 1.56045 15.3269 0.367493 12.2796 0.365723C5.96028 0.365723 0.812128 5.51327 0.809766 11.8332C0.808581 13.8748 1.35115 15.8687 2.38535 17.6272L0.705078 23.3657L6.58303 21.7218C8.27391 22.6611 10.1612 23.1516 12.0872 23.1522H12.0913C18.4095 23.1522 23.5583 18.0035 23.5607 11.6842C23.5624 8.6416 22.3734 5.77854 20.3226 3.69685ZM12.0913 21.1939H12.0878C10.3711 21.1933 8.69245 20.7244 7.22894 19.8432L6.85791 19.6239L3.37723 20.6192L4.38977 17.2337L4.14882 16.8471C3.18313 15.3271 2.66739 13.6034 2.66858 11.8338C2.67094 6.59478 6.85319 2.41361 12.0937 2.41361C14.6454 2.41538 17.0456 3.41161 18.8457 5.24013C20.6458 7.06925 21.604 9.48722 21.6028 12.0389C21.5999 17.2791 17.4182 21.1939 12.0913 21.1939Z"
       fill="currentColor"
     />
     <path
       d="M17.3554 14.3261C17.0746 14.1857 15.6294 13.4728 15.3722 13.3791C15.115 13.2853 14.9264 13.2384 14.7379 13.5192C14.5493 13.8 13.9838 14.4661 13.8186 14.6546C13.6534 14.8432 13.4882 14.8667 13.2074 14.7263C12.9266 14.5859 11.9789 14.2815 10.8611 13.2853C9.98904 12.5084 9.39471 11.5489 9.22954 11.2681C9.06436 10.9873 9.21127 10.8339 9.35229 10.6923C9.47982 10.5647 9.63674 10.3583 9.77837 10.1931C9.92001 10.0279 9.96571 9.91074 10.0595 9.72163C10.1532 9.53311 10.1075 9.36793 10.0366 9.22748C9.96571 9.08762 9.37434 7.64125 9.1391 7.07979C8.91033 6.53362 8.67805 6.61216 8.5035 6.60326C8.33832 6.59495 8.14981 6.59318 7.96129 6.59318C7.77277 6.59318 7.46902 6.66402 7.21183 6.94482C6.95464 7.22561 6.19491 7.93908 6.19491 9.38545C6.19491 10.8318 7.23486 12.2314 7.37649 12.4199C7.51812 12.6085 9.39116 15.5146 12.2733 16.7859C13.0084 17.1017 13.5845 17.2892 14.0326 17.4284C14.7665 17.6583 15.4359 17.6241 15.9664 17.5514C16.5558 17.471 17.7424 16.8408 17.9777 16.1856C18.2129 15.5305 18.2129 14.9694 18.142 14.8555C18.0711 14.741 17.8826 14.6777 17.6018 14.5373L17.3554 14.3261Z"
       fill="currentColor"
     />
   </svg>
 );

 const menuItems = [
   {
     icon: <Building2 className="h-6 w-6 text-blue-600 mb-2" />,
     label: t('menu.locations'),
     onClick: () => navigate('/mapa')
   },
   {
     icon: <Heart className="h-6 w-6 text-blue-600 mb-2" />,
     label: t('menu.campaigns'),
     onClick: () => navigate('/campanhas')
   },
   {
     icon: <FileText className="h-6 w-6 text-blue-600 mb-2" />,
     label: t('menu.materials'),
     onClick: () => navigate('/materiais')
   },
   {
     icon: <WhatsAppIcon />,
     label: t('menu.fale_conosco'),
     onClick: () => window.open('/fale-conosco', '_blank')
   }
 ];

 return (
   <div className="grid grid-cols-2 gap-4 p-4">
     {menuItems.map((item, index) => (
       <div
         key={index}
         className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200"
         onClick={item.onClick}
       >
         {item.icon}
         <span className="text-sm text-center">{item.label}</span>
       </div>
     ))}
   </div>
 );
};

export default MenuGrid;
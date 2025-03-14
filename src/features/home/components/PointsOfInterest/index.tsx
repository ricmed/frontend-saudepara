// src/features/notifications/components/PointsOfInterest/index.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/i18n/useTranslations';
import { 
 Syringe, 
 Utensils, 
 Trees, 
 Building, 
 BriefcaseMedical, 
 Hospital 
} from 'lucide-react';

export const PointsOfInterest: React.FC = () => {
 const navigate = useNavigate();
 const { selectedLanguage } = useLanguage();
 const { t } = useTranslation(selectedLanguage);

 const pontosPrincipais = [
   {
     nome: "vaccination",
     icone: <Syringe className="h-8 w-8 text-white" />,
     link: "/mapa?tipo=vacinacao",
   },
   {
     nome: "food",
     icone: <Utensils className="h-8 w-8 text-white" />,
     link: "/mapa?tipo=alimentacao",
   },
   {
     nome: "parks",
     icone: <Trees className="h-8 w-8 text-white" />,
     link: "/mapa?tipo=lazer",
   },
   {
     nome: "cultural",
     icone: <Building className="h-8 w-8 text-white" />,
     link: "/mapa?tipo=cultura",
   },
   {
     nome: "health",
     icone: <BriefcaseMedical className="h-8 w-8 text-white" />,
     link: "/mapa?tipo=saude",
   },
   {
     nome: "hospitals",
     icone: <Hospital className="h-8 w-8 text-white" />,
     link: "/mapa?tipo=hospitais",
   },
 ] as const;

 return (
   <div className="px-4 mb-6">
     <h2 className="text-lg font-semibold mb-4 text-center">
       {t('section.locate')}
     </h2>
     
     <div className="grid grid-cols-3 gap-4">
       {pontosPrincipais.map((ponto, index) => (
         <div
           key={index}
           className="flex flex-col items-center cursor-pointer"
           onClick={() => navigate(ponto.link)}
         >
           <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-2 hover:bg-blue-700 transition-colors">
             {ponto.icone}
           </div>
           <span className="text-xs text-center font-medium">
             {t(`points.${ponto.nome}`)}
           </span>
           <p className="text-xs text-center text-gray-500 mt-1">
             {t(`points.${ponto.nome}.desc`)}
           </p>
         </div>
       ))}
     </div>
   </div>
 );
};

export default PointsOfInterest;
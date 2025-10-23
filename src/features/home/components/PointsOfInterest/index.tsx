// src/features/notifications/components/PointsOfInterest/index.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/i18n/useTranslations';
import { 
 MapPin,
 Users,
 Tent,
 Home,
 Ambulance,
 Heart,
 BedDouble,
 Syringe
} from 'lucide-react';

export const PointsOfInterest: React.FC = () => {
 const navigate = useNavigate();
 const { selectedLanguage } = useLanguage();
 const { t } = useTranslation(selectedLanguage);

 return (
   <div className="px-4 mb-6">
     <h2 className="text-lg font-semibold mb-4 text-center">
       {t('section.locate')}
     </h2>
     
     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-6 max-w-6xl mx-auto">
       <div
         className="flex flex-col items-center cursor-pointer group"
         onClick={() => navigate("/mapa?qualificacao=Postos de atendimento - COP 30")}
       >
         <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-700 group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
           <MapPin className="h-8 w-8 text-white" />
         </div>
         <span className="text-xs md:text-sm text-center font-medium leading-tight">
           {t('pointsOfInterest.servicePoints')}
         </span>
       </div>

       <div
         className="flex flex-col items-center cursor-pointer group"
         onClick={() => navigate("/mapa?qualificacao=Alojamentos - Cúpula dos Povos - COP 30")}
       >
         <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-700 group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
           <Users className="h-8 w-8 text-white" />
         </div>
         <span className="text-xs md:text-sm text-center font-medium leading-tight">
           {t('pointsOfInterest.peoplesSummit')}
         </span>
       </div>

       <div
         className="flex flex-col items-center cursor-pointer group"
         onClick={() => navigate("/mapa?qualificacao=Posto fixo de atendimento - Aldeia COP 30")}
       >
         <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-700 group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
           <Tent className="h-8 w-8 text-white" />
         </div>
         <span className="text-xs md:text-sm text-center font-medium leading-tight">
           {t('pointsOfInterest.cop30Village')}
         </span>
       </div>

       <div
         className="flex flex-col items-center cursor-pointer group"
         onClick={() => navigate("/mapa?qualificacao=Usinas da Paz - COP 30")}
       >
         <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-700 group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
           <Home className="h-8 w-8 text-white" />
         </div>
         <span className="text-xs md:text-sm text-center font-medium leading-tight">
           {t('pointsOfInterest.peacePlants')}
         </span>
       </div>

       <div
         className="flex flex-col items-center cursor-pointer group"
         onClick={() => navigate("/mapa?qualificacao=Unidades de Pronto Atendimento - COP 30")}
       >
         <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-700 group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
           <Ambulance className="h-8 w-8 text-white" />
         </div>
         <span className="text-xs md:text-sm text-center font-medium leading-tight">
           {t('pointsOfInterest.upa')}
         </span>
       </div>

       <div
         className="flex flex-col items-center cursor-pointer group"
         onClick={() => navigate("/mapa?qualificacao=Centros de Atenção Psicossocial - COP 30")}
       >
         <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-700 group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
           <Heart className="h-8 w-8 text-white" />
         </div>
         <span className="text-xs md:text-sm text-center font-medium leading-tight">
           {t('pointsOfInterest.caps')}
         </span>
       </div>

       <div
         className="flex flex-col items-center cursor-pointer group"
         onClick={() => navigate("/mapa?qualificacao=Vacinação - COP 30")}
       >
         <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-700 group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
           <Syringe className="h-8 w-8 text-white" />
         </div>
         <span className="text-xs md:text-sm text-center font-medium leading-tight">
           {t('pointsOfInterest.vaccination')}
         </span>
       </div>
     </div>
   </div>
 );
};

export default PointsOfInterest;
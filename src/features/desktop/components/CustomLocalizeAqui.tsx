import React from 'react';
import { MapPin, Users, Tent, Home, Ambulance, Heart, BedDouble, Syringe } from 'lucide-react';
import { Language } from "@/i18n/types";
import { useMapaNavigation } from '@/features/maps/hooks/useMapaNavigation';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomLocalizeAquiProps {
  selectedLanguage?: Language;
}

export const CustomLocalizeAqui: React.FC<CustomLocalizeAquiProps> = ({ selectedLanguage: propSelectedLanguage }) => {
  const { navigateToMapa } = useMapaNavigation();
  const { selectedLanguage: contextLanguage } = useLanguage();
  const selectedLanguage = propSelectedLanguage || contextLanguage;
  const { t } = useTranslation(selectedLanguage);

  return (
    <div className="bg-white p-4">
      <h2 className="text-lg font-bold text-gray-800 text-center mb-6">
        {t('section.locate')}
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div
          className="flex flex-col items-center cursor-pointer group"
          onClick={() => navigateToMapa({ qualificacao: "Postos de atendimento - COP 30" })}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#4A6CF7] flex items-center justify-center mb-2 group-hover:bg-[#5A7CFF] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs md:text-sm text-center font-medium leading-tight">
            {t('pointsOfInterest.servicePoints')}
          </span>
        </div>

        <div
          className="flex flex-col items-center cursor-pointer group"
          onClick={() => navigateToMapa({ qualificacao: "Postos fixos de atendimento - Cúpula dos povos - COP 30" })}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#4A6CF7] flex items-center justify-center mb-2 group-hover:bg-[#5A7CFF] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs md:text-sm text-center font-medium leading-tight">
            {t('pointsOfInterest.peoplesSummit')}
          </span>
        </div>

        <div
          className="flex flex-col items-center cursor-pointer group"
          onClick={() => navigateToMapa({ qualificacao: "Posto fixo de atendimento - Aldeia COP 30" })}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#4A6CF7] flex items-center justify-center mb-2 group-hover:bg-[#5A7CFF] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
            <Tent className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs md:text-sm text-center font-medium leading-tight">
            {t('pointsOfInterest.cop30Village')}
          </span>
        </div>

        <div
          className="flex flex-col items-center cursor-pointer group"
          onClick={() => navigateToMapa({ qualificacao: "Usinas da Paz - COP 30" })}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#4A6CF7] flex items-center justify-center mb-2 group-hover:bg-[#5A7CFF] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
            <Home className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs md:text-sm text-center font-medium leading-tight">
            {t('pointsOfInterest.peacePlants')}
          </span>
        </div>

        <div
          className="flex flex-col items-center cursor-pointer group"
          onClick={() => navigateToMapa({ qualificacao: "Unidades de Pronto Atendimento - COP 30" })}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#4A6CF7] flex items-center justify-center mb-2 group-hover:bg-[#5A7CFF] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
            <Ambulance className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs md:text-sm text-center font-medium leading-tight">
            {t('pointsOfInterest.upa')}
          </span>
        </div>

        <div
          className="flex flex-col items-center cursor-pointer group"
          onClick={() => navigateToMapa({ qualificacao: "Centros de Atenção Psicossocial - COP 30" })}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#4A6CF7] flex items-center justify-center mb-2 group-hover:bg-[#5A7CFF] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs md:text-sm text-center font-medium leading-tight">
            {t('pointsOfInterest.caps')}
          </span>
        </div>

        <div
          className="flex flex-col items-center cursor-pointer group"
          onClick={() => navigateToMapa({ qualificacao: "Alojamentos - COP 30" })}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#4A6CF7] flex items-center justify-center mb-2 group-hover:bg-[#5A7CFF] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
            <BedDouble className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs md:text-sm text-center font-medium leading-tight">
            {t('pointsOfInterest.accommodations')}
          </span>
        </div>

        <div
          className="flex flex-col items-center cursor-pointer group"
          onClick={() => navigateToMapa({ qualificacao: "Vacinação - COP 30" })}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#4A6CF7] flex items-center justify-center mb-2 group-hover:bg-[#5A7CFF] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
            <Syringe className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs md:text-sm text-center font-medium leading-tight">
            {t('pointsOfInterest.vaccination')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomLocalizeAqui;
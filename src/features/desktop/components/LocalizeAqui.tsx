import React from 'react';
import { MapPin, Users, Tent, Home, Ambulance, Heart, BedDouble, Syringe } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslations';
import { Language } from "@/i18n/types";
import { useMapaNavigation } from '@/features/maps/hooks/useMapaNavigation';

interface LocalizeAquiProps {
  isMobile?: boolean;
  selectedLanguage: Language;
}

export const LocalizeAqui: React.FC<LocalizeAquiProps> = ({ isMobile = true, selectedLanguage }) => {
  const { navigateToMapa } = useMapaNavigation();
  const { t } = useTranslation(selectedLanguage);

  if (isMobile) {
    return (
      <div className="p-4 bg-white">
        <h2 className="text-xl font-bold text-center mb-6">{t('localize.title')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Postos de atendimento - COP 30" })}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-2 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-center font-medium leading-tight">
              {t('pointsOfInterest.servicePoints')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Alojamentos - Cúpula dos Povos - COP 30" })}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-2 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-center font-medium leading-tight">
              {t('pointsOfInterest.peoplesSummit')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Posto fixo de atendimento - Aldeia COP 30" })}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-2 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Tent className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-center font-medium leading-tight">
              {t('pointsOfInterest.cop30Village')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Usinas da Paz - COP 30" })}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-2 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Home className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-center font-medium leading-tight">
              {t('pointsOfInterest.peacePlants')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Unidades de Pronto Atendimento - COP 30" })}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-2 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Ambulance className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-center font-medium leading-tight">
              {t('pointsOfInterest.upa')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Centros de Atenção Psicossocial - COP 30" })}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-2 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-center font-medium leading-tight">
              {t('pointsOfInterest.caps')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Vacinação - COP 30" })}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-2 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Syringe className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-center font-medium leading-tight">
              {t('pointsOfInterest.vaccination')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">{t('localize.title')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 max-w-7xl mx-auto">
          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Postos de atendimento - COP 30" })}
          >
            <div className="w-20 h-20 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-3 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium text-center leading-tight">
              {t('pointsOfInterest.servicePoints')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Alojamentos - Cúpula dos Povos - COP 30" })}
          >
            <div className="w-20 h-20 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-3 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium text-center leading-tight">
              {t('pointsOfInterest.peoplesSummit')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Posto fixo de atendimento - Aldeia COP 30" })}
          >
            <div className="w-20 h-20 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-3 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Tent className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium text-center leading-tight">
              {t('pointsOfInterest.cop30Village')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Usinas da Paz - COP 30" })}
          >
            <div className="w-20 h-20 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-3 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Home className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium text-center leading-tight">
              {t('pointsOfInterest.peacePlants')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Unidades de Pronto Atendimento - COP 30" })}
          >
            <div className="w-20 h-20 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-3 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Ambulance className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium text-center leading-tight">
              {t('pointsOfInterest.upa')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Centros de Atenção Psicossocial - COP 30" })}
          >
            <div className="w-20 h-20 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-3 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium text-center leading-tight">
              {t('pointsOfInterest.caps')}
            </span>
          </div>

          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigateToMapa({ qualificacao: "Vacinação - COP 30" })}
          >
            <div className="w-20 h-20 rounded-full bg-[var(--sp-accent)] flex items-center justify-center mb-3 group-hover:bg-[var(--sp-accent-hover)] group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
              <Syringe className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium text-center leading-tight">
              {t('pointsOfInterest.vaccination')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocalizeAqui;
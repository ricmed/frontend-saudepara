import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Syringe, Utensils, Trees, Building, BriefcaseMedical, Hospital } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslations';
import { Language } from "@/i18n/types";

interface LocalizeAquiProps {
  isMobile?: boolean;
  selectedLanguage: Language;
}

export const LocalizeAqui: React.FC<LocalizeAquiProps> = ({ isMobile = true, selectedLanguage }) => {
  const navigate = useNavigate();
  const { t } = useTranslation(selectedLanguage);

  const pontosDeInteresse = [
    {
      nome: "vaccination",
      icone: <Syringe className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />,
      link: "/mapa?tipo=vacinacao",
      descricao: "Postos de vacinação",
    },
    {
      nome: "food",
      icone: <Utensils className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />,
      link: "/mapa?tipo=alimentacao",
      descricao: "Restaurantes",
    },
    {
      nome: "parks",
      icone: <Trees className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />,
      link: "/mapa?tipo=lazer",
      descricao: "Parques e áreas",
    },
    {
      nome: "cultural",
      icone: <Building className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />,
      link: "/mapa?tipo=cultura",
      descricao: "Museus e eventos",
    },
    {
      nome: "health",
      icone: <BriefcaseMedical className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />,
      link: "/mapa?tipo=saude",
      descricao: "Postos de Saúde",
    },
    {
      nome: "hospitals",
      icone: <Hospital className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />,
      link: "/mapa?tipo=hospitais",
      descricao: "Unidades de saúde",
    },
  ];

  if (isMobile) {
    return (
      <div className="p-4 bg-white">
        <h2 className="text-xl font-bold text-center mb-6">{t('localize.title')}</h2>
        <div className="grid grid-cols-3 gap-4">
          {pontosDeInteresse.map((ponto, index) => (
            <div
              key={index}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => navigate(ponto.link)}
            >
              <div className="w-14 h-14 rounded-full bg-[#3B5FFF] flex items-center justify-center mb-2 hover:bg-[#4D6FFF] transition-colors">
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
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">{t('localize.title')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {pontosDeInteresse.map((ponto, index) => (
            <div
              key={index}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => navigate(ponto.link)}
            >
              <div className="w-20 h-20 rounded-full bg-[#3B5FFF] flex items-center justify-center mb-3 hover:bg-[#4D6FFF] transition-colors">
                {ponto.icone}
              </div>
              <span className="font-medium">
                {t(`points.${ponto.nome}`)}
              </span>
              <p className="text-sm text-center text-gray-500 mt-1">
                {t(`points.${ponto.nome}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LocalizeAqui;
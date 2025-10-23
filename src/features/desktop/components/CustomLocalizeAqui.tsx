import React from 'react';
import { Syringe, Utensils, Trees, Building, BriefcaseMedical, Hospital } from 'lucide-react';
import { Language } from "@/i18n/types";
import { useMapaNavigation } from '@/features/maps/hooks/useMapaNavigation';

interface CustomLocalizeAquiProps {
  selectedLanguage?: Language;
}

export const CustomLocalizeAqui: React.FC<CustomLocalizeAquiProps> = () => {
  const { navigateToMapa } = useMapaNavigation();

  const pontosDeInteresse = [
    {
      nome: "Pontos de Vacinação",
      icone: <Syringe className="h-6 w-6 text-white" />,
      tipo: "vacinacao",
      descricao: "Locais para vacinação",
    },
    {
      nome: "Praças de Alimentação",
      icone: <Utensils className="h-6 w-6 text-white" />,
      tipo: "alimentacao",
      descricao: "Locais para refeições",
    },
    {
      nome: "Áreas Verdes",
      icone: <Trees className="h-6 w-6 text-white" />,
      link: "/mapa?tipo=lazer",
      descricao: "Parques e praças",
    },
    {
      nome: "Centros Culturais",
      icone: <Building className="h-6 w-6 text-white" />,
      link: "/mapa?tipo=cultura",
      descricao: "Museus e teatros",
    },
    {
      nome: "Postos de Saúde",
      icone: <BriefcaseMedical className="h-6 w-6 text-white" />,
      link: "/mapa?tipo=saude",
      descricao: "Atendimento médico",
    },
    {
      nome: "Hospitais de Referência",
      icone: <Hospital className="h-6 w-6 text-white" />,
      link: "/mapa?tipo=hospitais",
      descricao: "Hospitais principais",
    },
  ];

  return (
    <div className="bg-white p-4">
      <h2 className="text-lg font-bold text-gray-800 text-center mb-6">
        Localize aqui
      </h2>
      
      <div className="grid grid-cols-3 gap-4">
        {pontosDeInteresse.map((ponto, index) => (
          <div
            key={index}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => navigateToMapa({ tipo: ponto.tipo })}
          >
            <div className="w-12 h-12 rounded-full bg-[#4A6CF7] flex items-center justify-center mb-2 hover:bg-[#5A7CFF] transition-colors shadow-sm">
              {ponto.icone}
            </div>
            <span className="text-xs text-center font-medium text-gray-800 leading-tight">
              {ponto.nome}
            </span>
            <p className="text-xs text-center text-gray-500 mt-1 leading-tight">
              {ponto.descricao}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomLocalizeAqui;
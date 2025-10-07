import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Material } from '../../types';

interface CarouselProps {
  materials?: Material[];
}

export const Carousel: React.FC<CarouselProps> = ({ materials: propMaterials }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  
  // Dados padrão de campanhas
  const defaultMaterials: Material[] = [
    {
      id: "setembro-verde",
      title: "Campanha Setembro Verde 2025",
      desc: "Conscientização sobre a doação de órgãos e tecidos",
      image: "./images/campaigns/Setembro Verde.jpg",
      link: "/setembro-verde",
    },
    {
      id: "agosto-dourado",
      title: "Campanha Agosto Dourado 2025",
      desc: "Campanha de incentivo ao Aleitamento Materno",
      image: "./images/campaigns/Agosto Dourado – Aleitamento Materno.jpg",
      link: "/agosto-dourado",
    },
    {
      id: "janeiro-roxo",
      title: "Campanha Janeiro Roxo 2025",
      desc: "Campanha de conscientização sobre a Hanseníase",
      image: "./images/campaigns/Janeiro Roxo.jpg",
      link: "/janeiro-roxo",
    },
    {
      id: "dezembro-vermelho",
      title: "Campanha Dezembro Vermelho 2024",
      desc: "Conscientização e combate ao HIV/AIDS em todo o Pará",
      image: "./images/campaigns/Dezembro Vermelho.png",
      link: "/campanha-dezembro-vermelho",
    },
    {
      id: "novembro-azul",
      title: "Campanha Novembro Azul 2024",
      desc: "Conscientização sobre a saúde do homem e prevenção ao câncer de próstata",
      image: "./images/campaigns/Novembro Azul.png",
      link: "/campanha-novembro-azul",
    }
  ];

  // Mapear as campanhas para o idioma selecionado
  const translatedMaterials = defaultMaterials.map(material => {
    // Se forem fornecidos materiais como props, usá-los primeiro
    if (propMaterials) {
      const propMaterial = propMaterials.find(pm => pm.id === material.id);
      if (propMaterial) return propMaterial;
    }

    let translationKey = '';
    
    // Mapear ID da campanha para chave de tradução
    switch(material.id) {
      case 'setembro-verde':
        translationKey = 'greenSeptember';
        break;
      case 'agosto-dourado':
        translationKey = 'goldenAugust';
        break;
      case 'dezembro-vermelho':
        translationKey = 'redDecember';
        break;
      case 'novembro-azul':
        translationKey = 'blueNovember';
        break;
      case 'janeiro-roxo':
        translationKey = 'purpleJanuary';
        break;
      default:
        return material;
    }
    
    // Se estiver usando um idioma diferente do português, aplicar traduções
    if (selectedLanguage !== 'pt-BR') {
      return {
        ...material,
        title: t(`campaigns.list.${translationKey}`),
        desc: t(`campaigns.list.${translationKey}Desc`),
      };
    }
    
    return material;
  });

  const materials = translatedMaterials;

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev === materials.length - 1 ? 0 : prev + 1));
    }

    if (isRightSwipe) {
      setCurrentSlide((prev) => (prev === 0 ? materials.length - 1 : prev - 1));
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === materials.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [materials.length]);

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
          onTouchMove={(e) => setTouchEnd(e.touches[0].clientX)}
          onTouchEnd={() => {
            handleSwipe();
            setTouchStart(null);
            setTouchEnd(null);
          }}
        >
          {materials.map((material, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <div
                className="relative cursor-pointer transition-transform hover:scale-[0.98] active:scale-95"
                onClick={() => navigate(material.link)}
              >
                <div className="relative pt-[45%]">
                  <img
                    src={material.image}
                    alt={material.title}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-medium text-white text-sm">
                      {material.title}
                    </h3>
                    <p className="text-xs text-white/90 mt-1 line-clamp-2">
                      {material.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-4 left-0 right-0 flex justify-center space-x-1">
        {materials.map((_, index) => (
          <button
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              currentSlide === index ? 'bg-white' : 'bg-white/50'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
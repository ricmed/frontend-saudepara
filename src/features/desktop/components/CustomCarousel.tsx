import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { campaignStructure } from '@/i18n/types';

interface CarouselMaterial {
  id: string;
  title: string;
  desc: string;
  image: string;
  link: string;
}

interface CustomCarouselProps {
  materials?: CarouselMaterial[];
}

export const CustomCarousel: React.FC<CustomCarouselProps> = ({ materials: propMaterials }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragEndX, setDragEndX] = useState<number | null>(null);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);

  // Materiais padrão
  const defaultMaterials: CarouselMaterial[] = [
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
      title: "Novembro Azul",
      desc: "Conscientização sobre a saúde do homem e prevenção ao câncer de próstata",
      image: "./images/campaigns/Novembro Azul.png",
      link: "/campanha-novembro-azul",
    },
    {
      id: "setembro-verde",
      title: "Setembro Verde",
      desc: "Mês de conscientização sobre a doação de órgãos",
      image: "./images/campaigns/Setembro Verde.png",
      link: "/setembro-verde",
    },
    {
      id: "malaria-zero",
      title: "Malária Zero",
      desc: "Iniciativa para erradicação da malária na região amazônica",
      image: "./images/campaigns/Malária Zero.png",
      link: "/malaria-zero",
    },
  ];

  // Aplicar traduções se necessário
  const getTranslatedMaterials = () => {
    // Se houver materiais específicos nas props, priorize-os
    if (propMaterials && propMaterials.length > 0) {
      return propMaterials;
    }

    // Se o idioma for português, use os materiais padrão
    if (selectedLanguage === 'pt-BR') {
      return defaultMaterials;
    }

    // Para outros idiomas, traduza os materiais
    return defaultMaterials.map(material => {
      // Encontre a chave de tradução correspondente usando o mapeamento em campaignStructure
      const campaignKey = Object.keys(campaignStructure).find(key => key === material.id);
      
      if (campaignKey) {
        const translationKey = campaignStructure[campaignKey as keyof typeof campaignStructure].translationKey;
        
        return {
          ...material,
          title: t(`campaigns.list.${translationKey}`),
          desc: t(`campaigns.list.${translationKey}Desc`)
        };
      }
      
      return material;
    });
  };

  const materials = getTranslatedMaterials();

  // Gerencia o deslizar para eventos de toque
  const handleSwipe = () => {
    // Para eventos de toque
    if (touchStart !== null && touchEnd !== null) {
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe) {
        setCurrentSlide((prev) => (prev === materials.length - 1 ? 0 : prev + 1));
      }

      if (isRightSwipe) {
        setCurrentSlide((prev) => (prev === 0 ? materials.length - 1 : prev - 1));
      }
    }
    
    // Para eventos de mouse
    if (dragStartX !== null && dragEndX !== null) {
      const distance = dragStartX - dragEndX;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe) {
        setCurrentSlide((prev) => (prev === materials.length - 1 ? 0 : prev + 1));
      }

      if (isRightSwipe) {
        setCurrentSlide((prev) => (prev === 0 ? materials.length - 1 : prev - 1));
      }
    }
  };

  // Manipuladores de eventos de mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragEndX(null);
    setAutoplayPaused(true);
    
    // Prevenir seleção de texto durante o arrasto
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setDragEndX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      handleSwipe();
      setIsDragging(false);
      setDragStartX(null);
      setDragEndX(null);
      
      // Retomar autoplay após um breve período
      setTimeout(() => setAutoplayPaused(false), 1000);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleSwipe();
      setIsDragging(false);
      setDragStartX(null);
      setDragEndX(null);
      
      // Retomar autoplay após um breve período
      setTimeout(() => setAutoplayPaused(false), 1000);
    }
  };

  // Avança o slide automaticamente
  useEffect(() => {
    if (autoplayPaused) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === materials.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [materials.length, autoplayPaused]);

  // Estilo para o cursor quando estiver arrastando
  const cursorStyle = isDragging ? { cursor: 'grabbing' } : { cursor: 'grab' };

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ 
            transform: `translateX(-${currentSlide * 100}%)`,
            ...cursorStyle 
          }}
          onTouchStart={(e) => {
            setTouchStart(e.touches[0].clientX);
            setAutoplayPaused(true);
          }}
          onTouchMove={(e) => setTouchEnd(e.touches[0].clientX)}
          onTouchEnd={() => {
            handleSwipe();
            setTouchStart(null);
            setTouchEnd(null);
            setTimeout(() => setAutoplayPaused(false), 1000);
          }}
          // Adicionando eventos de mouse para desktop
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {materials.map((material, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <div
                className="relative cursor-pointer transition-transform hover:scale-[0.98] active:scale-95"
                onClick={() => {
                  // Só navega se não estiver arrastando
                  if (!isDragging || (dragStartX === dragEndX)) {
                    navigate(material.link);
                  }
                }}
              >
                <div className="relative pt-[45%]">
                  <img
                    src={material.image}
                    alt={material.title}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    draggable="false" // Impede o comportamento de arrasto padrão da imagem
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
            aria-label={`${t('carousel.goToSlide')} ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CustomCarousel;
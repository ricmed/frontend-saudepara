import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/useTranslations';
import { Language } from '@/i18n/types';

interface CampanhaItem {
  imagem: string;
  titulo: string;
  descricao: string;
  link: string;
}

interface BannerCarouselProps {
  campanhas?: CampanhaItem[];
  selectedLanguage?: Language;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ 
  campanhas,
  selectedLanguage 
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation(selectedLanguage || 'pt-BR');
  
  // Dados padrão de campanhas com traduções
  const defaultCampanhas: CampanhaItem[] = [
    {
      imagem: "./images/campaigns/Setembro Amarelo.jpg",
      titulo: t('campaignTitles.yellowSeptember'),
      descricao: t('campaignDescriptions.yellowSeptember'),
      link: "/setembro-amarelo"
    },
    {
      imagem: "./images/campaigns/Setembro Verde.jpg",
      titulo: t('campaignTitles.greenSeptember'),
      descricao: t('campaignDescriptions.greenSeptember'),
      link: "/setembro-verde"
    },
    {
      imagem: "./images/campaigns/Agosto Dourado – Aleitamento Materno.jpg",
      titulo: t('campaignTitles.goldenAugust'),
      descricao: t('campaignDescriptions.goldenAugust'),
      link: "/agosto-dourado"
    },
    {
      imagem: "./images/campaigns/Janeiro Roxo.jpg",
      titulo: t('campaignTitles.purpleJanuary'),
      descricao: t('campaignDescriptions.purpleJanuary'),
      link: "/janeiro-roxo"
    },
    {
      imagem: "./images/campaigns/Dezembro Vermelho.png",
      titulo: t('campaignTitles.redDecember'),
      descricao: t('campaignDescriptions.redDecember'),
      link: "/campanha-dezembro-vermelho"
    },
    {
      imagem: "./images/campaigns/Novembro Azul.png",
      titulo: t('campaignTitles.blueNovember'),
      descricao: t('campaignDescriptions.blueNovember'),
      link: "/campanha-novembro-azul"
    }
  ];

  // Map default campaigns to translated content
  const translatedCampanhas = defaultCampanhas.map((campanha) => {
    let translationKey = '';
    
    // Match campaign URL path to translation key
    switch(campanha.link) {
      case '/setembro-verde':
        translationKey = 'greenSeptember';
        break;
      case '/setembro-amarelo':
        translationKey = 'yellowSeptember';
        break;
      case '/agosto-dourado':
        translationKey = 'goldenAugust';
        break;
      case '/campanha-dezembro-vermelho':
        translationKey = 'redDecember';
        break;
      case '/campanha-novembro-azul':
        translationKey = 'blueNovember';
        break;
      case '/janeiro-roxo':
        translationKey = 'purpleJanuary';
        break;
      default:
        return campanha;
    }
    
    return {
      ...campanha,
      titulo: t(`campaigns.list.${translationKey}`),
      descricao: t(`campaigns.list.${translationKey}Desc`),
    };
  });

  const items = campanhas || translatedCampanhas;

  // Gerencia o autoplay do carrossel
  useEffect(() => {
    if (autoplayPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [items.length, autoplayPaused]);

  // Funções para navegar entre slides
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToNextSlide = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const goToPrevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  // Handlers para eventos de mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setAutoplayPaused(true);
    e.preventDefault(); // Evita seleção de texto
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging || startX === null || currentX === null) return;
    
    const diff = startX - currentX;
    
    // Se o movimento foi significativo (mais de 50px), mude o slide
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextSlide();
      } else {
        goToPrevSlide();
      }
    }
    
    setIsDragging(false);
    setStartX(null);
    setCurrentX(null);
    
    // Retoma o autoplay após um período
    setTimeout(() => setAutoplayPaused(false), 1000);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  // Handlers para eventos de toque
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setAutoplayPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (startX === null || currentX === null) return;
    
    const diff = startX - currentX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextSlide();
      } else {
        goToPrevSlide();
      }
    }
    
    setStartX(null);
    setCurrentX(null);
    
    // Retoma o autoplay após um período
    setTimeout(() => setAutoplayPaused(false), 1000);
  };

  // Estilo para o cursor quando estiver arrastando
  const cursorStyle = isDragging ? { cursor: 'grabbing' } : { cursor: 'grab' };

  return (
    <div className="bg-blue-600 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        <div 
          className="bg-white/10 rounded-xl overflow-hidden relative" 
          ref={carouselRef}
          style={cursorStyle}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {items.map((item, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <div className="relative h-80 md:h-96 bg-gradient-to-br from-gray-800 to-gray-900">
                  {/* Imagem de fundo desfocada para preencher espaços */}
                  <img
                    src={item.imagem}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30"
                    draggable="false"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  {/* Imagem principal */}
                  <img
                    src={item.imagem}
                    alt={item.titulo}
                    className="relative w-full h-full object-contain"
                    draggable="false"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    {...(index === 0
                      ? ({ fetchpriority: "high" } as React.ImgHTMLAttributes<HTMLImageElement>)
                      : {})}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 max-w-lg">
                    <h2 className="text-3xl font-bold text-white mb-2">{item.titulo}</h2>
                    <p className="text-lg text-white/90">{item.descricao}</p>
                    <button 
                      className="mt-4 bg-white text-[var(--sp-accent)] px-6 py-2 rounded-md font-medium hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDragging) {
                          navigate(item.link);
                        }
                      }}
                    >
                      {t('campaigns.saibaMais')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls for larger screens */}
          <button 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white hidden md:block"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevSlide();
            }}
            aria-label={t('carousel.previousSlide')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white hidden md:block"
            onClick={(e) => {
              e.stopPropagation();
              goToNextSlide();
            }}
            aria-label={t('carousel.nextSlide')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-4 right-4 flex space-x-2">
            {items.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentIndex === index ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                aria-label={`${t('carousel.goToSlide')} ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerCarousel;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Settings, Monitor, Circle } from 'lucide-react';

interface TVSlideshowDashboardProps {
  slides: React.ReactNode[];
  autoPlayInterval?: number; // em segundos
  enableAutoScroll?: boolean;
  scrollSpeed?: number; // pixels por segundo
}

const TVSlideshowDashboard: React.FC<TVSlideshowDashboardProps> = ({
  slides,
  autoPlayInterval = 15,
  enableAutoScroll = true,
  scrollSpeed = 80, // Aumentado de 50 para 80 para rolagem mais rápida
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [settings, setSettings] = useState({
    interval: autoPlayInterval,
    scrollSpeed: scrollSpeed,
    enableScroll: enableAutoScroll,
  });
  const [showSettings, setShowSettings] = useState(false);
  
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls após 3 segundos
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Função para rolar o conteúdo
  const startScrolling = useCallback(() => {
    if (!settings.enableScroll || !slideContainerRef.current) return;

    setIsScrolling(true);
    const container = slideContainerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;

    scrollIntervalRef.current = setInterval(() => {
      setScrollPosition(prev => {
        const newPosition = prev + (settings.scrollSpeed / 10);
        
        if (newPosition >= maxScroll) {
          // Volta ao topo e vai para o próximo slide
          if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
          }
          setIsScrolling(false);
          goToNextSlide();
          return 0;
        }
        
        return newPosition;
      });
    }, 100);
  }, [settings.enableScroll, settings.scrollSpeed]);

  // Limpar scroll
  const stopScrolling = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    setIsScrolling(false);
  }, []);

  // Navegar para próximo slide
  const goToNextSlide = useCallback(() => {
    stopScrolling();
    setScrollPosition(0);
    setCurrentSlide(prev => (prev + 1) % slides.length);
  }, [slides.length, stopScrolling]);

  // Navegar para slide anterior
  const goToPrevSlide = useCallback(() => {
    stopScrolling();
    setScrollPosition(0);
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length, stopScrolling]);

  // Ir para um slide específico
  const goToSlide = useCallback((index: number) => {
    stopScrolling();
    setScrollPosition(0);
    setCurrentSlide(index);
  }, [stopScrolling]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Aplicar scroll position com transição suave
  useEffect(() => {
    if (slideContainerRef.current) {
      slideContainerRef.current.style.scrollBehavior = 'smooth';
      slideContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  // Controlar auto-play e scroll
  useEffect(() => {
    if (!isPlaying) {
      stopScrolling();
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
        slideIntervalRef.current = null;
      }
      return;
    }

    // Iniciar scroll imediatamente
    if (settings.enableScroll) {
      startScrolling();
    } else {
      // Se scroll desabilitado, apenas trocar slides no intervalo
      slideIntervalRef.current = setInterval(() => {
        goToNextSlide();
      }, settings.interval * 1000);
    }

    return () => {
      stopScrolling();
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [isPlaying, settings.enableScroll, settings.interval, startScrolling, stopScrolling, goToNextSlide]);

  // Mouse movement detection
  useEffect(() => {
    const handleMouseMove = () => {
      resetControlsTimeout();
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Conteúdo do Slide */}
      <div
        ref={slideContainerRef}
        className="w-full h-full overflow-hidden"
        style={{ 
          scrollBehavior: 'smooth',
          transition: 'scroll 0.3s ease-out' // Transição suave na rolagem
        }}
      >
        {slides[currentSlide]}
      </div>

      {/* Barra Superior - Título e Logo com Fundo Mais Visível */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/95 via-black/85 to-black/60 p-6 transition-opacity duration-300 backdrop-blur-md ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-xl backdrop-blur-sm border border-white/20">
            <Monitor className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">Dashboard Círio de Nazaré 2025</h1>
              <p className="text-sm text-blue-200 drop-shadow-md">Monitoramento em Tempo Real - Saúde Pará</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
            <Circle className={`h-3 w-3 ${isPlaying ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} fill="currentColor" />
            <span className={`text-sm font-semibold ${isPlaying ? 'text-red-400' : 'text-gray-300'}`}>
              {isPlaying ? 'AO VIVO' : 'PAUSADO'}
            </span>
          </div>
        </div>
      </div>

      {/* Controles Principais com Fundo Mais Visível */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/85 to-black/60 p-6 transition-opacity duration-300 backdrop-blur-md ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Indicadores de Slides com Fundo */}
          <div className="flex justify-center gap-3 mb-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 shadow-lg ${
                  index === currentSlide
                    ? 'w-16 bg-blue-500 shadow-blue-500/50'
                    : 'w-3 bg-gray-400 hover:bg-gray-300 hover:w-6'
                }`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Botões de Controle com Fundos Sólidos */}
          <div className="flex items-center justify-center gap-5">
            {/* Anterior */}
            <button
              onClick={goToPrevSlide}
              className="p-4 bg-gray-800 hover:bg-gray-700 rounded-full transition-all transform hover:scale-110 shadow-2xl border-2 border-white/30"
              aria-label="Slide anterior"
            >
              <SkipBack className="h-7 w-7 text-white" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className={`p-5 rounded-full transition-all transform hover:scale-110 shadow-2xl border-2 ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-700 border-red-400 shadow-red-500/50'
                  : 'bg-green-600 hover:bg-green-700 border-green-400 shadow-green-500/50'
              }`}
              aria-label={isPlaying ? 'Pausar apresentação' : 'Iniciar apresentação'}
            >
              {isPlaying ? (
                <Pause className="h-9 w-9 text-white" fill="currentColor" />
              ) : (
                <Play className="h-9 w-9 text-white" fill="currentColor" />
              )}
            </button>

            {/* Próximo */}
            <button
              onClick={goToNextSlide}
              className="p-4 bg-gray-800 hover:bg-gray-700 rounded-full transition-all transform hover:scale-110 shadow-2xl border-2 border-white/30"
              aria-label="Próximo slide"
            >
              <SkipForward className="h-7 w-7 text-white" />
            </button>

            {/* Configurações */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-4 bg-blue-800 hover:bg-blue-700 rounded-full transition-all transform hover:scale-110 shadow-2xl border-2 border-blue-400 ml-4"
              aria-label="Configurações"
            >
              <Settings className="h-7 w-7 text-white" />
            </button>
          </div>

          {/* Informações com Fundo */}
          <div className="text-center mt-5">
            <div className="inline-block bg-black/60 px-6 py-3 rounded-full backdrop-blur-sm border border-white/20">
              <p className="text-base font-semibold text-white">
                Slide {currentSlide + 1} de {slides.length}
                {isScrolling && ' • 📜 Rolando automaticamente'}
                {!isPlaying && ' • ⏸️ Pausado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Configurações */}
      {showSettings && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg shadow-2xl p-6 z-50 w-96">
          <h3 className="text-xl font-bold text-white mb-4">Configurações da Apresentação</h3>
          
          <div className="space-y-4">
            {/* Intervalo entre slides */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Intervalo entre slides: {settings.interval}s
              </label>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={settings.interval}
                onChange={(e) => setSettings({ ...settings, interval: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Velocidade de rolagem */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Velocidade de rolagem: {settings.scrollSpeed}px/s
              </label>
              <input
                type="range"
                min="40"
                max="150"
                step="10"
                value={settings.scrollSpeed}
                onChange={(e) => setSettings({ ...settings, scrollSpeed: Number(e.target.value) })}
                className="w-full"
                disabled={!settings.enableScroll}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Lenta</span>
                <span>Rápida</span>
              </div>
            </div>

            {/* Toggle rolagem automática */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Rolagem automática
              </label>
              <button
                onClick={() => setSettings({ ...settings, enableScroll: !settings.enableScroll })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableScroll ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableScroll ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(false)}
            className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Overlay escuro quando configurações abertas */}
      {showSettings && (
        <div
          className="absolute inset-0 bg-black/50 z-40"
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default TVSlideshowDashboard;

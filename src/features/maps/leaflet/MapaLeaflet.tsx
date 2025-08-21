import React, { useState, useCallback, useEffect, useRef } from "react";
import { PainelLateral } from "./components/PainelLateral";
import { MapaContainer } from "./components/MapaContainer";
import { BotoesControle } from "./components/BotoesControle";
import { useGeolocation } from "./hooks/useGeolocation";
import { useEstabelecimentos } from "./hooks/useEstabelecimentos";
import { useRouting } from "./hooks/useRouting";
import { useMapProvider } from "./hooks/useMapProvider";
import { RoutingServiceOSRM } from "./services/routingServiceOSRM";

// Componentes do desktop
import type { Language } from "@/i18n/types";
import { SideMenu } from "@/features/home/components/SideMenu";

import {
  DEFAULT_CENTER,
  DEFAULT_RADIUS,
  SUPPORTED_LANGUAGES,
} from "./utils/constants";
import { Local, LatLngLiteral, TempoViagem } from "./types";
// Import Leaflet types
import L from 'leaflet';

/**
 * Componente principal que usa Leaflet + OpenStreetMap + API backend
 * Versão corrigida sem loops infinitos
 */
const MapaLeaflet: React.FC = () => {
  // Hook de Geolocalização
  const {
    userLocation,
    error: locationError,
    isLoading: geoIsLoading,
    obterLocalizacao,
  } = useGeolocation();

  // Hook de Estabelecimentos (agora consome API)
  const {
    filteredPlaces,
    tiposHabilitacoes,
    tiposQualificacoes,
    isLoading,
    carregarEstabelecimentos,
  } = useEstabelecimentos();

  // Hook de Roteamento
  const { routeState, calculateRoute, clearRoute } = useRouting();

  // Hook para gerenciar provedor de mapa
  const {
    currentProvider,
    setCurrentProvider,
    isAvailable,
    mapboxApiKey
  } = useMapProvider({
    defaultProvider: 'openstreetmap'
  });

  // Estado do Mapa
  const [mapCenter, setMapCenter] = useState<LatLngLiteral>(DEFAULT_CENTER);
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Função auxiliar para calcular distância (em metros)
  const calcularDistancia = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Exibição lateral e seleção de marcadores
  const [menuAberto, setMenuAberto] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Local | null>(null);

  // Rota e informações relacionadas
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);

  // Fala/Voice e tradução
  const [voiceGuidanceActive, setVoiceGuidanceActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("pt-BR");

  // Informações de viagem (apenas para exibição, rota será no Google Maps)
  // const [temposViagem, setTemposViagem] = useState<TempoViagem[]>([]);
  // const [modoTransporteSelecionado, setModoTransporteSelecionado] = useState("DRIVING");

  // Controla quantos resultados aparecem
  const [visibleCount, setVisibleCount] = useState(20);

  // Filtros
  const [searchRadius, setSearchRadius] = useState(DEFAULT_RADIUS);
  const [habilitacaoSelecionada, setHabilitacaoSelecionada] = useState("todas");
  const [qualificacaoSelecionada, setQualificacaoSelecionada] = useState("todas");
  const [naturezaSelecionada, setNaturezaSelecionada] = useState("todos");

  // Estados para controle de carregamento e erros
  const [inicializando, setInicializando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Refs para evitar re-renders desnecessários
  const lastUserLocationRef = useRef<LatLngLiteral | null>(null);
  const lastFilteredPlacesRef = useRef<Local[]>([]);
  const centerUpdateTimeoutRef = useRef<NodeJS.Timeout>();

  // Hook de tradução (desabilitado para compatibilidade de tipos)
  // const { translateInstructions } = useGoogleTranslate(selectedLanguage);

  // Hook de voz (desabilitado para compatibilidade de tipos)
  // const { speak } = useVoice(selectedLanguage);

  /**
   * Função para configurar API key do Mapbox
   */
  const handleMapboxConfig = useCallback((apiKey: string) => {
    localStorage.setItem('mapbox-api-key', apiKey);
    // Forçar reload da página para aplicar a nova configuração
    window.location.reload();
  }, []);

  /**
   * Callback para quando o mapa estiver carregado
   */
  const handleMapLoad = useCallback((loadedMap: L.Map) => {
    console.log('✅ Mapa carregado e definido no estado');
    setMap(loadedMap);
    setMapReady(true);
  }, []);

  /**
   * Inicialização do componente (apenas uma vez)
   */
  useEffect(() => {
    const inicializar = async () => {
      try {
        setInicializando(true);
        setErro(null);
        
        console.log('🚀 Iniciando MapaLeaflet...');
        
        // 1. Carregar estabelecimentos iniciais
        console.log('📊 Carregando estabelecimentos iniciais...');
        await carregarEstabelecimentos();
        
        // 2. Obter localização do usuário (não bloquear se falhar)
        console.log('📍 Obtendo localização do usuário...');
        try {
          await obterLocalizacao();
        } catch (locError) {
          console.log('⚠️ Não foi possível obter localização, continuando com localização padrão');
        }
        
        console.log('✅ Inicialização concluída com sucesso!');
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        setErro('Erro ao carregar dados. Tente recarregar a página.');
      } finally {
        setInicializando(false);
      }
    };
    
    inicializar();
  }, []); // Dependências vazias - executar apenas uma vez

  /**
   * Aplicar filtros locais quando filtros mudarem
   */
  useEffect(() => {
    // Os filtros já são aplicados no hook useEstabelecimentos
    // Este effect pode ser removido ou usado para lógica adicional
  }, [habilitacaoSelecionada, qualificacaoSelecionada, naturezaSelecionada, searchRadius, userLocation]);

  /**
   * Centralizar mapa no usuário quando localização estiver disponível
   * Apenas se a localização mudou significativamente
   */
  useEffect(() => {
    if (!userLocation || !map || !mapReady) return;

    // Verificar se a localização mudou significativamente
    if (lastUserLocationRef.current) {
      const distance = calcularDistancia(
        lastUserLocationRef.current.lat,
        lastUserLocationRef.current.lng,
        userLocation.lat,
        userLocation.lng
      );
      
      // Se a mudança for menor que 100m, não atualizar
      if (distance < 100) return;
    }

    console.log('🗺️ Centralizando mapa na localização do usuário...', userLocation);

    // Limpar timeout anterior
    if (centerUpdateTimeoutRef.current) {
      clearTimeout(centerUpdateTimeoutRef.current);
    }

    // Agendar atualização do centro com debounce
    centerUpdateTimeoutRef.current = setTimeout(() => {
      try {
        if (!map || !mapReady) return;

        if (filteredPlaces.length > 0 && 
            JSON.stringify(filteredPlaces) !== JSON.stringify(lastFilteredPlacesRef.current)) {
          // Se há estabelecimentos e a lista mudou, incluir tudo nos bounds
          const bounds = L.latLngBounds([
            [userLocation.lat, userLocation.lng],
            ...filteredPlaces.map(place => [place.lat, place.lng] as [number, number])
          ]);
          
          map.fitBounds(bounds, { 
            padding: [20, 20],
            maxZoom: 16
          });
          
          lastFilteredPlacesRef.current = [...filteredPlaces];
        } else if (filteredPlaces.length === 0) {
          // Se não há estabelecimentos, centralizar no usuário
          map.setView([userLocation.lat, userLocation.lng], 14);
        }

        setMapCenter(userLocation);
        lastUserLocationRef.current = userLocation;
        
        console.log('✅ Mapa centralizado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao centralizar mapa:', error);
      }
    }, 500);

    return () => {
      if (centerUpdateTimeoutRef.current) {
        clearTimeout(centerUpdateTimeoutRef.current);
      }
    };
  }, [userLocation?.lat, userLocation?.lng, mapReady, filteredPlaces.length, map, calcularDistancia]);

  /**
   * Calcular estimativas de tempo (apenas para exibição)
   */
  const calcularEstimativasViagem = useCallback(
    (destino: Local) => {
      if (!userLocation) return;

      console.log('⏱️ Calculando estimativas de viagem para:', destino.nome);

      try {
        const distanceMeters = calcularDistancia(userLocation.lat, userLocation.lng, destino.lat, destino.lng);
        const distanceKm = distanceMeters / 1000;

        console.log('📏 Distância calculada:', `${distanceKm.toFixed(1)} km`);

        const estimativas: TempoViagem[] = [
          {
            modo: "DRIVING",
            duracao: `${Math.max(Math.round(distanceKm * 2.5), 5)} min`,
            distancia: `${distanceKm.toFixed(1)} km`,
          },
          {
            modo: "TRANSIT",
            duracao: `${Math.max(Math.round(distanceKm * 4), 10)} min`,
            distancia: `${distanceKm.toFixed(1)} km`,
          },
          {
            modo: "WALKING",
            duracao: `${Math.max(Math.round(distanceKm * 12), 2)} min`,
            distancia: `${distanceKm.toFixed(1)} km`,
          },
          {
            modo: "BICYCLING",
            duracao: `${Math.max(Math.round(distanceKm * 4.5), 3)} min`,
            distancia: `${distanceKm.toFixed(1)} km`,
          },
        ];

        // setTemposViagem(estimativas);
        console.log('✅ Estimativas calculadas:', estimativas);
      } catch (error) {
        console.error('❌ Erro ao calcular estimativas:', error);
      }
    },
    [userLocation, calcularDistancia]
  );

  /**
   * Traçar rota usando serviço gratuito de roteamento
   */
  const tracarRota = useCallback(
    async (destino: Local, transportType: string = 'driving-car') => {
      if (!map) {
        console.warn('❌ Mapa não está inicializado ainda');
        return;
      }

      if (!userLocation) {
        alert("Permita o acesso à sua localização para calcular a rota");
        obterLocalizacao();
        return;
      }

      console.log('🎯 Traçando rota para:', destino.nome, 'usando:', transportType);

      try {
        setSelectedLocal(destino);
        setMenuAberto(false);

        // Calcular rota usando o serviço gratuito
        console.log('🚗 Chamando calculateRoute com:', {
          map: !!map,
          userLocation,
          destino: { nome: destino.nome, lat: destino.lat, lng: destino.lng },
          profile: transportType
        });
        
        await calculateRoute(map, userLocation, destino, transportType as any, limparRota);
        
        console.log('✅ calculateRoute executado, estado da rota:', routeState);

        // Manter estimativas locais também
        calcularEstimativasViagem(destino);

        if (voiceGuidanceActive) {
          // const distanceKm = (calcularDistancia(userLocation.lat, userLocation.lng, destino.lat, destino.lng) / 1000).toFixed(1);
          // let instruction = `Rota calculada para ${destino.nome}. Distância aproximada: ${distanceKm} quilômetros.`;
          
          // Adicionar informações da rota se disponível
          if (routeState.route) {
            // const routeDistance = (routeState.route.distance / 1000).toFixed(1);
            // const routeDuration = Math.round(routeState.route.duration / 60);
            // instruction = `Rota calculada para ${destino.nome}. Distância: ${routeDistance} quilômetros. Tempo estimado: ${routeDuration} minutos.`;
          }
          
          // Funcionalidade de voz desabilitada temporariamente
          /*
          try {
            if (selectedLanguage !== "pt-BR") {
              const translatedText = await translateInstructions(instruction);
              speak(translatedText);
            } else {
              speak(instruction);
            }
          } catch (error) {
            console.error('❌ Erro ao falar instrução:', error);
          }
          */
        }

        console.log('✅ Rota traçada com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao traçar rota:', error);
        alert('Erro ao calcular rota. Tente novamente.');
      }
    },
    [map, userLocation, calculateRoute, voiceGuidanceActive, selectedLanguage, calcularEstimativasViagem, calcularDistancia, obterLocalizacao, routeState.route]
  );

  /**
   * Outras funções de controle
   */
  const limparRota = useCallback(() => {
    console.log('🧹 Limpando rota...');
    console.log('🔍 Estado antes da limpeza:', {
      selectedLocal: !!selectedLocal,
      selectedMarker: !!selectedMarker,
      map: !!map,
      routeState: routeState
    });
    
    setSelectedLocal(null);
    setSelectedMarker(null);
    if (map) {
      clearRoute(map);
    }
    // setTemposViagem([]);
    
    console.log('✅ Rota limpa com sucesso');
  }, [map, clearRoute, selectedLocal, selectedMarker, routeState]);

  const centralizarNoUsuario = useCallback(() => {
    console.log('📍 Centralizando no usuário...');
    
    if (userLocation && map && mapReady) {
      try {
        map.setView([userLocation.lat, userLocation.lng], 15);
        console.log('✅ Mapa centralizado no usuário');
      } catch (error) {
        console.error('❌ Erro ao centralizar no usuário:', error);
      }
    } else {
      console.log('🔄 Obtendo localização do usuário...');
      obterLocalizacao();
    }
  }, [userLocation, map, mapReady, obterLocalizacao]);

  const buscarNovamente = useCallback(async () => {
    console.log('🔄 Recarregando dados...');
    
    try {
      await carregarEstabelecimentos();
      console.log('✅ Dados recarregados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao recarregar dados:', error);
      alert('Erro ao recarregar dados. Verifique sua conexão.');
    }
  }, [carregarEstabelecimentos]);

  const onSearch = useCallback(async () => {
    console.log('🔍 Executando busca com filtros...');
    await buscarNovamente();
  }, [buscarNovamente]);

  // Log dos dados para debug
  console.log('🗺️ MapaLeaflet - Estado atual:', {
    isLoading,
    filteredPlaces: filteredPlaces.length,
    userLocation,
    inicializando,
    erro
  });

  // Loading durante inicialização
  if (inicializando) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Inicializando mapa...</p>
          <p className="text-sm text-gray-500">Obtendo localização e carregando dados</p>
        </div>
      </div>
    );
  }

  // Erro durante inicialização
  if (erro) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600 mb-4">{erro}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header do Governo do Pará */}
      <header className="bg-blue-600 shadow-lg" role="banner">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Seção esquerda: Menu + Logos */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setMenuAberto(!menuAberto)}
                className="p-2 rounded-lg hover:bg-blue-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label="Abrir menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {menuAberto ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>

              {/* Logos com melhor espaçamento */}
              <div className="flex items-center space-x-3">
                <img
                  src="./images/logos/Logo Topo Sespa.png"
                  alt="Secretaria de Estado de Saúde Pública do Pará"
                  className="h-12 w-auto"
                />
                <div className="h-10 w-px bg-white/20 hidden md:block"></div>
                <img
                  src="./images/logos/Logo Topo Saude Para.png"
                  alt="Saúde Pará"
                  className="h-11 w-auto"
                />
                <img
                  src="./images/logos/Logo Topo Bandeira.png"
                  alt="Governo do Estado do Pará"
                  className="h-9 w-auto"
                />
              </div>
            </div>

            {/* Navegação principal centralizada - Desktop */}
            <nav className="hidden lg:flex items-center space-x-8" role="navigation">
              <a
                href="/"
                className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Início
              </a>
              <a
                href="/unidades"
                className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Locais
              </a>
              <a
                href="/campanhas"
                className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Campanhas
              </a>
              <a
                href="/fale-conosco"
                className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Fale Conosco
              </a>
            </nav>

            {/* Seção direita: Seletor de idiomas + Controles */}
            <div className="flex items-center space-x-4">
              {/* Seletor de idiomas */}
              <select
                value={selectedLanguage}
                onChange={(e) =>
                  setSelectedLanguage(e.target.value as Language)
                }
                className="w-32 p-2 bg-[#4D6FFF]/40 border border-white/10 rounded-full text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-[#4D6FFF]/60 focus:border-white/20 transition-all"
              >
                {SUPPORTED_LANGUAGES.map(({ code, label, flag }) => (
                  <option key={code} value={code} className="text-gray-900">
                    {flag} {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navegação mobile (tablet) */}
          <nav className="lg:hidden mt-4 pt-4 border-t border-white/10" role="navigation">
            <div className="flex flex-wrap justify-center gap-6">
              <a
                href="/"
                className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Início
              </a>
              <a
                href="/unidades"
                className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Locais
              </a>
              <a
                href="/campanhas"
                className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Campanhas
              </a>
              <a
                href="/fale-conosco"
                className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Fale Conosco
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Container do mapa com altura flexível */}
      <div className="flex-1 relative">
        {geoIsLoading && (
          <div className="absolute top-4 right-4 z-50 bg-white p-3 rounded-lg shadow-lg border">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <p className="text-sm">Obtendo sua localização...</p>
            </div>
          </div>
        )}

        {!geoIsLoading && !userLocation && (
          <div className="absolute top-4 right-4 z-50 bg-yellow-50 p-3 rounded-lg shadow-lg border border-yellow-200">
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-yellow-800">📍 Localização necessária</p>
              <button
                onClick={obterLocalizacao}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Permitir Localização
              </button>
            </div>
          </div>
        )}

        {userLocation && (
          <div className="absolute top-4 right-4 z-50 bg-green-50 p-2 rounded-lg shadow border border-green-200 hidden md:block">
            <p className="text-xs text-green-800">✅ Localização ativa</p>
          </div>
        )}

        {/* Botão para abrir filtros no mobile/tablet */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="absolute top-4 left-4 z-50 lg:hidden p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Abrir filtros"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.172a1 1 0 01-.447.894l-2 1A1 1 0 0111 18.828v-5.172a1 1 0 00-.293-.707L4.293 7.535A1 1 0 014 6.828V4z" />
          </svg>
        </button>

        {/* Layout com painel lateral no desktop */}
        <div className="flex flex-1 overflow-hidden">
        {/* Painel lateral (sempre visível no desktop, deslizante no mobile) */}
        <PainelLateral
          menuAberto={menuAberto}
          tiposHabilitacoes={tiposHabilitacoes}
          tiposQualificacoes={tiposQualificacoes}
          habilitacaoSelecionada={habilitacaoSelecionada}
          qualificacaoSelecionada={qualificacaoSelecionada}
          naturezaSelecionada={naturezaSelecionada}
          searchRadius={searchRadius}
          filteredPlaces={filteredPlaces}
          visibleCount={visibleCount}
          onHabilitacaoChange={setHabilitacaoSelecionada}
          onQualificacaoChange={setQualificacaoSelecionada}
          onNaturezaChange={setNaturezaSelecionada}
          onRadiusChange={setSearchRadius}
          onTracarRota={tracarRota}
          onLoadMore={() => setVisibleCount((prev) => prev + 20)}
          onSearch={onSearch}
          onClose={() => setMenuAberto(false)}
          currentMapProvider={currentProvider}
          onMapProviderChange={setCurrentProvider}
          isMapboxAvailable={isAvailable('mapbox')}
          onMapboxConfig={handleMapboxConfig}
          mapboxApiKey={mapboxApiKey}
        />

        {/* Container do mapa que se adapta ao painel lateral */}
        <div className="flex-1 relative">
          {/* O mapa em si, com marcadores */}
          <MapaContainer
            center={mapCenter}
            userLocation={userLocation}
            filteredPlaces={filteredPlaces}
            selectedMarker={selectedMarker}
            visibleCount={visibleCount}
            onMapLoad={handleMapLoad}
            onMapIdle={() => {}}
            onMarkerClick={setSelectedMarker}
            onInfoWindowClose={() => setSelectedMarker(null)}
            onTracarRota={tracarRota}
            mapboxApiKey={mapboxApiKey}
          />

          {/* Botões de controle */}
          <BotoesControle
            directions={selectedLocal ? {} as any : null}
            voiceGuidanceActive={voiceGuidanceActive}
            routeInfo={{
              hasRoute: !!routeState.route,
              isCalculating: routeState.isCalculating,
              distance: routeState.route ? RoutingServiceOSRM.formatDistance(routeState.route.distance) : undefined,
              duration: routeState.route ? RoutingServiceOSRM.formatDuration(routeState.route.duration) : undefined,
            }}
            onCentralizarUsuario={centralizarNoUsuario}
            onCarregarDados={buscarNovamente}
            onLimparRota={limparRota}
            onToggleVoiceGuidance={() => setVoiceGuidanceActive(!voiceGuidanceActive)}
          />
        </div>
      </div>

      {/* Tela de carregamento caso dados ainda estejam sendo lidos */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
          <div className="text-xl">Carregando...</div>
        </div>
      )}

      {/* Mensagem de erro de localização, se existir */}
      {locationError && (
        <div
          className="fixed top-20 left-4 right-4 bg-red-100 border border-red-400 
          text-red-700 px-4 py-3 rounded-lg z-50 md:absolute"
        >
          {locationError}
        </div>
      )}
      </div>

      {/* SideMenu da Home */}
      <SideMenu 
        isOpen={menuAberto}
        onClose={() => setMenuAberto(false)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />

      {/* Footer do Governo do Pará */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Contato</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="mr-2 text-pink-500">📍</span>
                  <span>Rua Boaventura da Silva, 883 - Nazaré, Belém - PA</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-red-500">📞</span>
                  <span>(91) 4006-4200</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-400">✉️</span>
                  <span>http://www.saude.pa.gov.br</span>
                </li>
              </ul>
              <div className="flex space-x-4 mt-4">
                <a
                  href="https://www.facebook.com/sespaPARA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-[#3B5998] flex items-center justify-center hover:opacity-90 transition"
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/sespapara"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-[#C13584] flex items-center justify-center hover:opacity-90 transition"
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.611-3.132-1.551-.684-.94-.684-2.284 0-3.224.684-.94 1.835-1.551 3.132-1.551s2.448.611 3.132 1.551c.684.94.684 2.284 0 3.224-.684.94-1.835 1.551-3.132 1.551z"/>
                  </svg>
                </a>
                <a
                  href="https://x.com/SespaPara"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-black flex items-center justify-center hover:opacity-90 transition"
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/sespapara"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-[#FF0000] flex items-center justify-center hover:opacity-90 transition"
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Horário de Funcionamento</h3>
              <p>Segunda a Sexta: 8h às 18h</p>
              <p className="mt-4">A SESPA é o órgão responsável pela gestão da saúde pública no Estado do Pará.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Ouvidoria</h3>
              <p>Dúvidas, críticas ou sugestões?</p>
              <p className="mt-2">Entre em contato com nossa ouvidoria:</p>
              <p className="mt-2">📞 0800-280-9209</p>
              <p className="mt-2">✉️ ouvidoria@saude.pa.gov.br</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Portal Saúde Pará</h3>
              <p>Sistema integrado de informações de saúde do Estado do Pará.</p>
              <p className="mt-2">Desenvolvido pela SESPA</p>
            </div>
          </div>
          <div className="text-center text-sm border-t border-white/20 pt-6">
            <p>© {new Date().getFullYear()} Secretaria de Estado de Saúde Pública do Pará - SESPA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MapaLeaflet;
import React, { useState, useCallback, useEffect, useRef } from "react";
import { PainelLateral } from "./components/PainelLateral";
import { MapaContainer } from "./components/MapaContainer";
import { BotoesControle } from "./components/BotoesControle";
import { MapProviderOverlay } from "./components/MapProviderOverlay";
import { useGeolocation } from "./hooks/useGeolocation";
import { useEstabelecimentos, useEstabelecimentosFiltrados } from "./hooks/useEstabelecimentos";
import { useRouting } from "./hooks/useRouting";
import { MapProviderProvider } from "./contexts/MapProviderContext";
import { RoutingServiceOSRM } from "./services/routingServiceOSRM";

// Componentes do desktop
import { SideMenu } from "@/features/home/components/SideMenu";
import { Home, Map, Heart, User, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  DEFAULT_CENTER,
  DEFAULT_RADIUS,
} from "./utils/constants";
import { Local, LatLngLiteral } from "./types";
// Import Leaflet types
import L from 'leaflet';

/**
 * Componente principal que usa Leaflet + OpenStreetMap + API backend
 * Versão corrigida sem loops infinitos
 */
const MapaLeaflet: React.FC = () => {
  const navigate = useNavigate();
  
  // Hook de Geolocalização
  const {
    userLocation,
    error: locationError,
    isLoading: geoIsLoading,
    obterLocalizacao,
  } = useGeolocation();

  // Filtros - Declarar ANTES de usar no hook
  const [searchRadius, setSearchRadius] = useState(DEFAULT_RADIUS);
  const [habilitacaoSelecionada, setHabilitacaoSelecionada] = useState("todas");
  const [qualificacaoSelecionada, setQualificacaoSelecionada] = useState("todas");
  const [naturezaSelecionada, setNaturezaSelecionada] = useState("todos");
  const [tipoEstabelecimentoSelecionado, setTipoEstabelecimentoSelecionado] = useState("todos");

  // Hook de Estabelecimentos (agora consome API)
  const {
    allPlaces,
    tiposHabilitacoes,
    tiposQualificacoes,
    tiposEstabelecimentos,
    isLoading,
    carregarEstabelecimentos,
  } = useEstabelecimentos();

  // Aplicar filtros adicionais aos estabelecimentos
  const filteredPlaces = useEstabelecimentosFiltrados(
    allPlaces,
    tipoEstabelecimentoSelecionado,
    naturezaSelecionada
  );

  // Hook de Roteamento
  const { routeState, clearRoute } = useRouting();

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
  const [menuAberto, setMenuAberto] = useState(false);  // Para o SideMenu principal
  
  // Para o painel de estabelecimentos - aberto por padrão no desktop, fechado no mobile
  const [painelEstabelecimentosAberto, setPainelEstabelecimentosAberto] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint do Tailwind
    }
    return false;
  });
  
  const [selectedMarker, setSelectedMarker] = useState<Local | null>(null);

  // Rota e informações relacionadas
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);

  // Fala/Voice e tradução
  const [voiceGuidanceActive, setVoiceGuidanceActive] = useState(false);

  // Informações de viagem (apenas para exibição, rota será no Google Maps)
  // const [temposViagem, setTemposViagem] = useState<TempoViagem[]>([]);
  // const [modoTransporteSelecionado, setModoTransporteSelecionado] = useState("DRIVING");

  // Controla quantos resultados aparecem
  const [visibleCount, setVisibleCount] = useState(100);

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
   * Pré-selecionar "ESTABELECIMENTOS COP 30" quando os tipos estiverem carregados
   */
  useEffect(() => {
    if (tiposEstabelecimentos.length > 0 && tipoEstabelecimentoSelecionado === "todos") {
      const cop30 = tiposEstabelecimentos.find(
        tipo => tipo.nome.toUpperCase().includes("ESTABELECIMENTOS COP 30") || 
                tipo.nome.toUpperCase().includes("COP 30") ||
                tipo.nome.toUpperCase().includes("COP30")
      );
      
      if (cop30) {
        console.log('🎯 Pré-selecionando "ESTABELECIMENTOS COP 30"');
        setTipoEstabelecimentoSelecionado(cop30.nome);
      } else {
        console.warn('⚠️ Tipo "ESTABELECIMENTOS COP 30" não encontrado. Tipos disponíveis:', 
          tiposEstabelecimentos.map(t => t.nome));
      }
    }
  }, [tiposEstabelecimentos.length]); // Executar quando os tipos forem carregados

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
    <MapProviderProvider defaultProvider="openstreetmap">
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Header do Governo do Pará */}
        <header className="bg-blue-600 shadow-lg flex-shrink-0" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Seção esquerda: Menu + Logos */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              <button
                onClick={() => setMenuAberto(!menuAberto)}
                className="p-2 rounded-lg hover:bg-blue-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label="Abrir menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6 text-white"
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

              {/* Logos com melhor espaçamento responsivo */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <img
                  src="./images/logos/Logo Topo Sespa.png"
                  alt="Secretaria de Estado de Saúde Pública do Pará"
                  className="h-8 sm:h-10 lg:h-12 w-auto"
                />
                <div className="h-6 sm:h-8 lg:h-10 w-px bg-white/20 hidden sm:block"></div>
                <img
                  src="./images/logos/Logo Topo Saude Para.png"
                  alt="Saúde Pará"
                  className="h-7 sm:h-9 lg:h-11 w-auto"
                />
                <img
                  src="./images/logos/Logo Topo Bandeira.png"
                  alt="Governo do Estado do Pará"
                  className="h-6 sm:h-7 lg:h-9 w-auto"
                />
              </div>
            </div>

            {/* Seção direita: Navegação para desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <nav className="flex items-center space-x-6">
                <a
                  href="/"
                  className="text-white hover:text-blue-200 transition-colors text-sm font-medium"
                >
                  Início
                </a>
                <a
                  href="/mapa"
                  className="text-blue-200 font-medium text-sm"
                >
                  Mapa
                </a>
                <a
                  href="/campanhas"
                  className="text-white hover:text-blue-200 transition-colors text-sm font-medium"
                >
                  Campanhas
                </a>
                <a
                  href="/private/comunicacao-de-caso/nova"
                  className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Nova Notificação
                </a>
                <a
                  href="/login"
                  className="text-white hover:text-blue-200 transition-colors text-sm font-medium"
                >
                  Entrar
                </a>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Container do mapa - LAYOUT RESPONSIVO SEM FOOTER */}
      <div className="flex-1 relative overflow-hidden">{/* Sem padding bottom - footer removido */}
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

        {/* Botão para abrir filtros no mobile/tablet APENAS */}
        <button
          onClick={() => setPainelEstabelecimentosAberto(!painelEstabelecimentosAberto)}
          className="absolute top-4 left-4 z-[800] md:hidden p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Abrir filtros"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.172a1 1 0 01-.447.894l-2 1A1 1 0 0111 18.828v-5.172a1 1 0 00-.293-.707L4.293 7.535A1 1 0 014 6.828V4z" />
          </svg>
        </button>

        {/* Layout com painel lateral no desktop - SIMPLIFICADO */}
        <div className="absolute inset-0 flex">
        {/* Painel lateral - agora fica acima do footer no desktop */}
        <PainelLateral
          menuAberto={painelEstabelecimentosAberto}
          tiposHabilitacoes={tiposHabilitacoes}
          tiposQualificacoes={tiposQualificacoes}
          tiposEstabelecimentos={tiposEstabelecimentos}
          habilitacaoSelecionada={habilitacaoSelecionada}
          qualificacaoSelecionada={qualificacaoSelecionada}
          naturezaSelecionada={naturezaSelecionada}
          tipoEstabelecimentoSelecionado={tipoEstabelecimentoSelecionado}
          searchRadius={searchRadius}
          filteredPlaces={filteredPlaces}
          visibleCount={visibleCount}
          onHabilitacaoChange={setHabilitacaoSelecionada}
          onQualificacaoChange={setQualificacaoSelecionada}
          onNaturezaChange={setNaturezaSelecionada}
          onTipoEstabelecimentoChange={setTipoEstabelecimentoSelecionado}
          onRadiusChange={setSearchRadius}
          onLoadMore={() => setVisibleCount((prev) => prev + 100)}
          onSearch={onSearch}
          onClose={() => setPainelEstabelecimentosAberto(false)}
        />

        {/* Container do mapa - ajustado para mobile com bottom padding */}
        <div className="flex-1 relative pb-16 md:pb-0">{/* Padding bottom apenas no mobile para não sobrepor bottom nav */}
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
            />

            {/* Overlay para seleção de servidor de mapa */}
            <MapProviderOverlay />

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
          <div className="absolute top-20 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg z-50 md:relative">
            {locationError}
          </div>
        )}
      </div>

      {/* SideMenu da Home */}
      <SideMenu 
        isOpen={menuAberto}
        onClose={() => setMenuAberto(false)}
      />

      {/* Botões FAB - Bottom Navigation - APENAS MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-[1300] flex-shrink-0">
        <div className="flex items-center h-16 relative px-2">
          <div className="flex-1 flex justify-around items-center">
            <button
              className="flex flex-col items-center"
              onClick={() => navigate("/")}
            >
              <Home className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Início</span>
            </button>
            
            <button
              className="flex flex-col items-center"
              onClick={() => navigate("/mapa")}
            >
              <Map className="w-6 h-6 text-blue-600" />
              <span className="text-xs text-blue-600">Mapa</span>
            </button>
          </div>

          {/* FAB Button Central */}
          <div className="w-12"></div>
          <button 
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-blue-600 rounded-full flex flex-col items-center justify-center shadow-lg"
            onClick={() => navigate("/private/comunicacao-de-caso/nova")}
          >
            <FileText className="w-6 h-6 text-white" />
          </button>

          <div className="flex-1 flex justify-around items-center">
            <button
              className="flex flex-col items-center"
              onClick={() => navigate("/campanhas")}
            >
              <Heart className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Campanhas</span>
            </button>

            <button
              className="flex flex-col items-center"
              onClick={() => navigate("/login")}
            >
              <User className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Entrar</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer do Governo do Pará - OCULTO na página do mapa (não é relevante) */}
      {/* Footer comentado para não interferir no layout do mapa
      <footer className="hidden bg-blue-900 text-white py-4 mt-auto">
        ...conteúdo do footer...
      </footer>
      */}
      </div>
    </MapProviderProvider>
  );
};

export default MapaLeaflet;
import React, { useState, useCallback, useEffect, useRef } from "react";
import { PainelLateral } from "./components/PainelLateral";
import { MapaContainer } from "./components/MapaContainer";
import { BotoesControle } from "./components/BotoesControle";
import { InfoTemposViagem } from "./components/InfoTemposViagem";
import { useGeolocation } from "./hooks/useGeolocation";
import { useEstabelecimentos } from "./hooks/useEstabelecimentos";

// Hook de tradução
import { useGoogleTranslate } from "./hooks/useGoogleTranslate";
// Hook de voz
import { useVoice } from "./hooks/useVoice";

import {
  DEFAULT_CENTER,
  DEFAULT_RADIUS,
  MODOS_TRANSPORTE,
  SUPPORTED_LANGUAGES,
} from "./utils/constants";
import { Local, LatLngLiteral, TempoViagem, SupportedLanguage } from "./types";
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
    tiposEstabelecimentos,
    isLoading,
    carregarEstabelecimentos,
    carregarTiposEstabelecimentos,
    buscarEstabelecimentosProximos,
    aplicarFiltrosLocais,
    recarregarDados,
    calcularDistancia,
  } = useEstabelecimentos();

  // Estado do Mapa
  const [mapCenter, setMapCenter] = useState<LatLngLiteral>(DEFAULT_CENTER);
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Exibição lateral e seleção de marcadores
  const [menuAberto, setMenuAberto] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Local | null>(null);

  // Rota e informações relacionadas
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);

  // Fala/Voice e tradução
  const [voiceGuidanceActive, setVoiceGuidanceActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>("pt-BR");

  // Informações de viagem (apenas para exibição, rota será no Google Maps)
  const [temposViagem, setTemposViagem] = useState<TempoViagem[]>([]);
  const [modoTransporteSelecionado, setModoTransporteSelecionado] = useState("DRIVING");

  // Controla quantos resultados aparecem
  const [visibleCount, setVisibleCount] = useState(20);

  // Filtros
  const [searchRadius, setSearchRadius] = useState(DEFAULT_RADIUS);
  const [tipoSelecionado, setTipoSelecionado] = useState("todos");
  const [naturezaSelecionada, setNaturezaSelecionada] = useState("todos");

  // Estados para controle de carregamento e erros
  const [inicializando, setInicializando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Refs para evitar re-renders desnecessários
  const lastUserLocationRef = useRef<LatLngLiteral | null>(null);
  const lastFilteredPlacesRef = useRef<Local[]>([]);
  const centerUpdateTimeoutRef = useRef<NodeJS.Timeout>();

  // Hook de tradução
  const { translateInstructions } = useGoogleTranslate(selectedLanguage);

  // Hook de voz
  const { speak } = useVoice(selectedLanguage);

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
        
        // 1. Carregar tipos de estabelecimentos primeiro
        console.log('🏥 Carregando tipos de estabelecimentos...');
        await carregarTiposEstabelecimentos();
        
        // 2. Carregar estabelecimentos iniciais
        console.log('📊 Carregando estabelecimentos iniciais...');
        await carregarEstabelecimentos({ 
          limit: 500, 
          ativo: 'S'
        });
        
        // 3. Obter localização do usuário (não bloquear se falhar)
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
   * Quando a localização do usuário mudar, buscar estabelecimentos próximos
   * Agora carrega mais dados quando tem localização
   */
  useEffect(() => {
    const buscarEstabelecimentosFiltrados = async () => {
      if (!userLocation) return;

      console.log('📍 Usuário localizado! Carregando mais estabelecimentos próximos...');

      try {
        await buscarEstabelecimentosProximos(
          userLocation.lat,
          userLocation.lng,
          searchRadius * 3, // ✅ OTIMIZADO: Buscar em raio maior apenas quando tem localização
          {
            limit: 300 // ✅ OTIMIZADO: Mais estabelecimentos próximos, mas não todos
          }
        );
      } catch (error) {
        console.error('Erro ao buscar estabelecimentos próximos:', error);
      }
    };

    // ✅ OTIMIZADO: Só busca mais dados quando tem localização
    if (userLocation) {
      buscarEstabelecimentosFiltrados();
    }
  }, [userLocation?.lat, userLocation?.lng, searchRadius, buscarEstabelecimentosProximos]);

  /**
   * Aplicar filtros locais quando filtros mudarem
   * Debounced para evitar muitas execuções
   */
  useEffect(() => {
    const applyFilters = () => {
      console.log('🔍 Aplicando filtros locais...', {
        tipo: tipoSelecionado,
        natureza: naturezaSelecionada,
        raio: searchRadius,
        userLocation: userLocation ? 'disponível' : 'não disponível'
      });

      aplicarFiltrosLocais(
        tipoSelecionado,
        naturezaSelecionada,
        userLocation?.lat,
        userLocation?.lng,
        searchRadius
      );
    };

    // Debounce de 300ms
    const timer = setTimeout(applyFilters, 300);
    return () => clearTimeout(timer);
  }, [tipoSelecionado, naturezaSelecionada, searchRadius, userLocation?.lat, userLocation?.lng, aplicarFiltrosLocais]);

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

        setTemposViagem(estimativas);
        console.log('✅ Estimativas calculadas:', estimativas);
      } catch (error) {
        console.error('❌ Erro ao calcular estimativas:', error);
      }
    },
    [userLocation, calcularDistancia]
  );

  /**
   * Traçar rota
   */
  const tracarRota = useCallback(
    async (destino: Local) => {
      if (!userLocation) {
        alert("Permita o acesso à sua localização para calcular a rota");
        return;
      }

      console.log('🎯 Traçando rota para:', destino.nome);

      try {
        setSelectedLocal(destino);
        setMenuAberto(false);

        calcularEstimativasViagem(destino);

        if (voiceGuidanceActive) {
          const distanceKm = (calcularDistancia(userLocation.lat, userLocation.lng, destino.lat, destino.lng) / 1000).toFixed(1);
          const instruction = `Rota calculada para ${destino.nome}. Distância aproximada: ${distanceKm} quilômetros.`;
          
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
        }

        console.log('✅ Rota traçada com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao traçar rota:', error);
        alert('Erro ao calcular rota. Tente novamente.');
      }
    },
    [userLocation, voiceGuidanceActive, selectedLanguage, translateInstructions, speak, calcularEstimativasViagem, calcularDistancia]
  );

  /**
   * Abrir no Google Maps com modo de transporte
   */
  const abrirNoGoogleMapsComModo = useCallback((local: Local, modo: string) => {
    if (!userLocation) {
      alert("Localização necessária para traçar rota");
      return;
    }

    console.log('🗺️ Abrindo no Google Maps:', { local: local.nome, modo });

    try {
      const baseUrl = 'https://www.google.com/maps/dir/';
      const origin = `${userLocation.lat},${userLocation.lng}`;
      const destination = `${local.lat},${local.lng}`;
      const params = new URLSearchParams({
        api: '1',
        origin: origin,
        destination: destination,
        travelmode: modo.toLowerCase()
      });

      const url = `${baseUrl}?${params.toString()}`;
      
      console.log('🔗 URL gerada:', url);
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        const appUrl = `googlemaps://directions?api=1&origin=${origin}&destination=${destination}&travelmode=${modo.toLowerCase()}`;
        
        // Tentar app nativo primeiro, com fallback para web
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = appUrl;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.open(url, '_blank');
        }, 1000);
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('❌ Erro ao abrir Google Maps:', error);
      alert('Erro ao abrir Google Maps. Tente novamente.');
    }
  }, [userLocation]);

  /**
   * Outras funções de controle
   */
  const limparRota = useCallback(() => {
    console.log('🧹 Limpando rota...');
    setSelectedLocal(null);
    setSelectedMarker(null);
    setTemposViagem([]);
  }, []);

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
      if (userLocation) {
        await buscarEstabelecimentosProximos(
          userLocation.lat,
          userLocation.lng,
          searchRadius * 2,
          {
            ativo: 'S',
            limit: 500
          }
        );
      } else {
        await recarregarDados();
      }
      console.log('✅ Dados recarregados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao recarregar dados:', error);
      alert('Erro ao recarregar dados. Verifique sua conexão.');
    }
  }, [userLocation, searchRadius, buscarEstabelecimentosProximos, recarregarDados]);

  const onSearch = useCallback(async () => {
    console.log('🔍 Executando busca com filtros...');
    await buscarNovamente();
  }, [buscarNovamente]);

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
    <div className="w-full h-screen relative">
      {/* Seletor de idiomas */}
      <div className="absolute top-4 left-4 z-[99999] md:left-96" style={{ zIndex: 99999 }}>
        <select
          value={selectedLanguage}
          onChange={(e) =>
            setSelectedLanguage(e.target.value as SupportedLanguage)
          }
          className="w-full p-2 bg-white rounded-lg shadow-lg border border-gray-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          style={{ position: 'relative', zIndex: 99999 }}
        >
          {SUPPORTED_LANGUAGES.map(({ code, label, flag }) => (
            <option key={code} value={code}>
              {flag} {label}
            </option>
          ))}
        </select>
      </div>

      {/* Botão menu mobile */}
      <div className="absolute top-4 left-4 z-[99999] md:hidden" style={{ zIndex: 99999 }}>
        <button
          onClick={() => setMenuAberto(true)}
          className="p-2 text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Abrir menu"
          style={{ position: 'relative', zIndex: 99999 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Loading de geolocalização */}
      {geoIsLoading && (
        <div className="absolute top-4 right-4 z-[99999] bg-white p-3 rounded-lg shadow-lg border" style={{ zIndex: 99999 }}>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <p className="text-sm">Obtendo sua localização...</p>
          </div>
        </div>
      )}

      {/* Painel lateral */}
      <div className="z-[10000]">
        <PainelLateral
          menuAberto={menuAberto}
          tiposEstabelecimentos={tiposEstabelecimentos}
          tipoSelecionado={tipoSelecionado}
          naturezaSelecionada={naturezaSelecionada}
          searchRadius={searchRadius}
          filteredPlaces={filteredPlaces}
          visibleCount={visibleCount}
          onTipoChange={setTipoSelecionado}
          onNaturezaChange={setNaturezaSelecionada}
          onRadiusChange={setSearchRadius}
          onTracarRota={tracarRota}
          onLoadMore={() => setVisibleCount((prev) => prev + 20)}
          onSearch={onSearch}
          onClose={() => setMenuAberto(false)}
        />
      </div>

      {/* Mapa com Leaflet */}
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
      />

      {/* Botões de controle */}
      <div className="absolute bottom-4 right-4 z-[9999]">
        <BotoesControle
          directions={selectedLocal ? {} as any : null} // Mock para manter interface
          voiceGuidanceActive={voiceGuidanceActive}
          onCentralizarUsuario={centralizarNoUsuario}
          onCarregarDados={buscarNovamente}
          onLimparRota={limparRota}
          onToggleVoiceGuidance={() => setVoiceGuidanceActive(!voiceGuidanceActive)}
        />
      </div>

      {/* Info de tempos de viagem */}
      {selectedLocal && temposViagem.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-24 md:w-80 
          bg-white p-4 rounded-lg shadow-lg z-[9999] border">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-800 text-sm">
              Rota para: <span className="text-blue-600">{selectedLocal.nome}</span>
            </h3>
            <button 
              onClick={limparRota}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Clique em um modo de transporte para abrir no Google Maps:
          </p>
          <div className="space-y-2">
            {temposViagem.map(({ modo, duracao, distancia }) => {
              const modoInfo = MODOS_TRANSPORTE.find((m) => m.modo === modo);
              return (
                <button
                  key={modo}
                  onClick={() => abrirNoGoogleMapsComModo(selectedLocal, modo)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg
                    border transition-all focus:outline-none focus:ring-2 
                    focus:ring-blue-500 focus:ring-offset-1 ${
                      modoTransporteSelecionado === modo
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  onMouseEnter={() => setModoTransporteSelecionado(modo)}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{modoInfo?.icone}</span>
                    <span className="font-medium">{modoInfo?.label}</span>
                  </span>
                  <span className="text-sm text-gray-600">
                    {duracao} • {distancia}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            * Tempos estimados. Valores reais serão calculados no Google Maps.
          </p>
        </div>
      )}

      {/* Loading de dados */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-[9998]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-lg text-gray-700">Carregando estabelecimentos...</div>
          </div>
        </div>
      )}

      {/* Erro de localização */}
      {locationError && (
        <div
          className="fixed top-4 left-4 right-4 bg-red-100 border border-red-400 
          text-red-700 px-4 py-3 rounded-lg z-[9999] md:absolute md:max-w-md"
        >
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-sm">{locationError}</span>
          </div>
        </div>
      )}

      {/* Contador de estabelecimentos encontrados */}
      {filteredPlaces.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg z-[9999] text-sm text-gray-600 border mr-20">
          {filteredPlaces.length} estabelecimento{filteredPlaces.length !== 1 ? 's' : ''} encontrado{filteredPlaces.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default MapaLeaflet;
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLoadScript } from '@react-google-maps/api';
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
import { Local, LatLngLiteral, TempoViagem } from "./types";
import { SupportedLanguage } from '@/api/maps/types';
import { GOOGLE_MAPS_CONFIG } from '@/api/maps';

interface MapaFilters {
  tipo: string;
  natureza: string;
  radius: number;
}

interface MapaLocaisProps {
  initialFilters?: MapaFilters;
}

/**
 * Componente principal que reúne todo o fluxo de:
 * - Carregar dados de estabelecimentos
 * - Obter localização do usuário
 * - Filtrar e exibir marcadores
 * - Traçar rota + falar instruções
 * - Traduzir instruções se necessário
 */
const MapaLocais: React.FC<MapaLocaisProps> = ({ initialFilters }) => {
  // Carregamento da API do Google Maps
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.apiKey,
    libraries: GOOGLE_MAPS_CONFIG.libraries,
  });

  // Hook de Geolocalização (posição do usuário)
  const {
    userLocation,
    error: locationError,
    isLoading: geoIsLoading,
    hasPermission,
    obterLocalizacao,
  } = useGeolocation();

  // Hook de Estabelecimentos (carrega e filtra dados do Excel)
  const {
    allPlaces,
    filteredPlaces,
    setFilteredPlaces,
    tiposEstabelecimentos,
    isLoading,
    carregarDadosExcel,
  } = useEstabelecimentos();

  // Estado do Mapa (centro, objeto google.maps.Map, etc.)
  const [mapCenter, setMapCenter] = useState<LatLngLiteral>(DEFAULT_CENTER);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Exibição lateral e seleção de marcadores
  const [menuAberto, setMenuAberto] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Local | null>(null);

  // Rota e informações relacionadas
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);

  // Fala/Voice e tradução
  const [voiceGuidanceActive, setVoiceGuidanceActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>("pt-BR");

  // Informações de viagem (distância e duração, para cada modo)
  const [temposViagem, setTemposViagem] = useState<TempoViagem[]>([]);
  const [modoTransporteSelecionado, setModoTransporteSelecionado] =
    useState("DRIVING");

  // Controla quantos resultados de estabelecimentos aparecem de cada vez
  const [visibleCount, setVisibleCount] = useState(20);

  // Índice do passo atual de fala (instruções)
  const [stepIndex, setStepIndex] = useState(0);

  // ID do "watchPosition" para geolocalização contínua
  const [watchId, setWatchId] = useState<number | null>(null);

  // Filtros
  const [searchRadius, setSearchRadius] = useState(initialFilters?.radius || DEFAULT_RADIUS);
  const [tipoSelecionado, setTipoSelecionado] = useState(initialFilters?.tipo || "todos");
  const [naturezaSelecionada, setNaturezaSelecionada] = useState(initialFilters?.natureza || "todos");

  // Referência para DirectionsRenderer
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null
  );

  // Hook de tradução (Google Translate)
  const { translateInstructions } = useGoogleTranslate(selectedLanguage);

  // Hook de voz (Google Cloud TTS)
  const { speak } = useVoice(selectedLanguage);

  /**
   * Effect de inicialização:
   * - Carrega dados do Excel
   * - A geolocalização é iniciada automaticamente pelo useGeolocation
   */
  useEffect(() => {
    const inicializar = async () => {
      try {
        console.log('Carregando dados do Excel...');
        await carregarDadosExcel();
        console.log('Dados do Excel carregados com sucesso');
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    inicializar();
  }, [carregarDadosExcel]);

  /**
   * Effect que filtra estabelecimentos com base em:
   * - Posição do usuário ou centro default
   * - Tipo selecionado
   * - Natureza selecionada
   * - Raio de busca
   */
  useEffect(() => {
    if (!allPlaces.length || !isLoaded || !google?.maps?.geometry?.spherical) return;

    const center = userLocation || mapCenter;
    const estabelecimentosFiltrados = allPlaces.filter((local) => {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(local.lat, local.lng),
        new google.maps.LatLng(center.lat, center.lng)
      );

      const tipoMatch =
        tipoSelecionado === "todos" || local.tipo === tipoSelecionado;
      const naturezaMatch =
        naturezaSelecionada === "todos" ||
        local.natureza === naturezaSelecionada;
      const distanceMatch = distance <= searchRadius;

      return tipoMatch && naturezaMatch && distanceMatch;
    });

    setFilteredPlaces(estabelecimentosFiltrados);
  }, [
    allPlaces,
    userLocation,
    mapCenter,
    tipoSelecionado,
    naturezaSelecionada,
    searchRadius,
    setFilteredPlaces,
    isLoaded,
  ]);

  /**
   * Effect que recentraliza o mapa no usuário assim que userLocation e map estão definidos.
   */
  useEffect(() => {
    console.log('Effect recentralizar - userLocation:', userLocation, 'map:', !!map, 'isLoaded:', isLoaded);
    
    if (userLocation && map && isLoaded && google?.maps?.LatLngBounds) {
      console.log('Recentralizando mapa na localização do usuário:', userLocation);
      
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(userLocation);

      // Se tivermos lugares filtrados, inclui eles nos bounds
      if (filteredPlaces.length > 0) {
        filteredPlaces.forEach((place) => {
          bounds.extend({ lat: place.lat, lng: place.lng });
        });
        console.log('Incluindo', filteredPlaces.length, 'lugares nos bounds');
      }

      map.fitBounds(bounds);

      // Se só tiver a localização do usuário, dá um zoom mais próximo
      if (filteredPlaces.length === 0) {
        setTimeout(() => map.setZoom(15), 100); // Pequeno delay para garantir que fitBounds execute primeiro
      }

      setMapCenter(userLocation);
    }
  }, [userLocation, map, filteredPlaces, isLoaded]);

  /**
   * Função para falar as direções (Text-to-Speech).
   * - stepIndex indica qual passo estamos falando.
   * - Quando terminar de falar um passo, incrementa stepIndex.
   * - Se selectedLanguage != pt-BR, traduz as instruções.
   */
  const speakDirections = useCallback(
    async (result: google.maps.DirectionsResult) => {
      const steps = result.routes[0].legs[0].steps;
      if (stepIndex < steps.length) {
        // Remove tags HTML das instruções
        let instructions = steps[stepIndex].instructions.replace(
          /<[^>]*>/g,
          ""
        );

        // Traduz se não estiver em pt-BR
        if (selectedLanguage !== "pt-BR") {
          instructions = await translateInstructions(instructions);
        }

        // Falar via hook useVoice
        speak(instructions);

        // Incrementa após falar (estimativa simples)
        const estimatedSpeechDuration = instructions.split(" ").length * 60; // em ms
        setTimeout(() => {
          setStepIndex((prevIndex) => prevIndex + 1);
        }, estimatedSpeechDuration);
      }
    },
    [stepIndex, selectedLanguage, translateInstructions, speak]
  );

  /**
   * Atualiza a rota quando a posição do usuário mudar, se já tivermos um destino.
   */
  const updateRoute = useCallback(
    (newLocation: LatLngLiteral) => {
      if (!selectedLocal || !isLoaded || !google?.maps?.DirectionsService) return;

      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: newLocation,
          destination: { lat: selectedLocal.lat, lng: selectedLocal.lng },
          travelMode: modoTransporteSelecionado as google.maps.TravelMode,
        },
        async (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            if (voiceGuidanceActive) {
              // Fala novamente
              await speakDirections(result);
            }
          }
        }
      );
    },
    [
      selectedLocal,
      modoTransporteSelecionado,
      voiceGuidanceActive,
      speakDirections,
      setDirections,
      isLoaded,
    ]
  );

  /**
   * Monitora a posição do usuário continuamente.
   * A cada atualização, se já tivermos rota e destino, recalculamos.
   */
  const startWatchingPosition = useCallback(() => {
    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (directions && selectedLocal) {
            updateRoute(newLocation);
          }
        },
        (error) => {
          console.error("Erro ao monitorar posição:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        }
      );
      setWatchId(id);
    }
  }, [directions, selectedLocal, updateRoute]);

  /**
   * Calcula tempos de viagem (distância e duração) para vários modos de transporte.
   */
  const calcularTemposViagem = useCallback(
    async (destino: Local) => {
      if (!userLocation || !isLoaded || !google?.maps?.DirectionsService) return;

      const tempos: TempoViagem[] = [];
      const directionsService = new google.maps.DirectionsService();

      for (const { modo } of MODOS_TRANSPORTE) {
        try {
          const result = await new Promise<google.maps.DirectionsResult>(
            (resolve, reject) => {
              directionsService.route(
                {
                  origin: userLocation,
                  destination: { lat: destino.lat, lng: destino.lng },
                  travelMode: modo as google.maps.TravelMode,
                },
                (res, status) => {
                  if (status === google.maps.DirectionsStatus.OK && res) {
                    resolve(res);
                  } else {
                    reject(status);
                  }
                }
              );
            }
          );

          const rota = result.routes[0].legs[0];
          tempos.push({
            modo,
            duracao: rota.duration?.text || "",
            distancia: rota.distance?.text || "",
          });
        } catch (error) {
          console.error(`Erro ao calcular rota para ${modo}:`, error);
        }
      }

      setTemposViagem(tempos);
    },
    [userLocation, isLoaded]
  );

  /**
   * Função para traçar rota a partir da userLocation até o Local selecionado.
   */
  const tracarRota = useCallback(
    async (destino: Local) => {
      if (!userLocation) {
        alert("Permita o acesso à sua localização para traçar a rota");
        return;
      }

      if (!isLoaded || !google?.maps?.DirectionsService) {
        alert("Google Maps ainda está carregando. Tente novamente em alguns segundos.");
        return;
      }

      // Reseta a rota anterior
      setDirections(null);
      setSelectedLocal(destino);
      setStepIndex(0);
      await calcularTemposViagem(destino);

      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: userLocation,
          destination: { lat: destino.lat, lng: destino.lng },
          travelMode: modoTransporteSelecionado as google.maps.TravelMode,
        },
        async (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            setMenuAberto(false);

            if (voiceGuidanceActive) {
              // Falar a rota desde o passo 0
              setStepIndex(0);
              await speakDirections(result);
            }
            startWatchingPosition();
          } else {
            alert("Não foi possível calcular a rota");
          }
        }
      );
    },
    [
      userLocation,
      modoTransporteSelecionado,
      voiceGuidanceActive,
      calcularTemposViagem,
      speakDirections,
      startWatchingPosition,
      isLoaded,
    ]
  );

  /**
   * Função para limpar rota e cancelar monitoramento.
   */
  const limparRota = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    setDirections(null);
    setSelectedLocal(null);
    setSelectedMarker(null);
    setStepIndex(0);

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  /**
   * Centraliza o mapa no usuário (zoom 15) ou solicita localização caso indisponível.
   */
  const centralizarNoUsuario = useCallback(() => {
    if (userLocation && map) {
      map.panTo(userLocation);
      map.setZoom(15);
    } else {
      obterLocalizacao();
    }
  }, [userLocation, map, obterLocalizacao]);

  // Se a API do Google Maps não estiver carregada, mostrar loading
  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-lg">Carregando Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      {/* Seletor de idiomas */}
      <div className="absolute top-4 left-4 z-50 md:left-96">
        <select
          value={selectedLanguage}
          onChange={(e) =>
            setSelectedLanguage(e.target.value as SupportedLanguage)
          }
          className="w-full p-2 bg-white rounded-lg shadow-lg border border-gray-200
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SUPPORTED_LANGUAGES.map(({ code, label, flag }) => (
            <option key={code} value={code}>
              {flag} {label}
            </option>
          ))}
        </select>
      </div>

      {/* Botão “abrir menu” que só aparece no mobile (MD para cima fica oculto) */}
      <div className="absolute top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setMenuAberto(true)}
          className="p-2 text-gray-600 bg-blue-600 rounded shadow"
        >
          {/* Ícone de menu hambúrguer */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="white"
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

      {geoIsLoading && (
        <div className="absolute top-4 right-4 z-50 bg-white p-3 rounded-lg shadow-lg border">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <p className="text-sm">Obtendo sua localização...</p>
          </div>
        </div>
      )}

      {!hasPermission && !geoIsLoading && !userLocation && (
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
        <div className="absolute top-4 right-4 z-50 bg-green-50 p-2 rounded-lg shadow border border-green-200">
          <p className="text-xs text-green-800">✅ Localização ativa</p>
        </div>
      )}

      {/* Layout com painel lateral no desktop */}
      <div className="flex h-full">
        {/* Painel lateral (sempre visível no desktop, deslizante no mobile) */}
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
          onSearch={() => {}}
          onClose={() => setMenuAberto(false)}
        />

        {/* Container do mapa que se adapta ao painel lateral */}
        <div className="flex-1 relative">
          {/* O mapa em si, com marcadores, rota (DirectionsRenderer), etc. */}
          <MapaContainer
            center={mapCenter}
            userLocation={userLocation}
            filteredPlaces={filteredPlaces}
            directions={directions}
            selectedMarker={selectedMarker}
            visibleCount={visibleCount}
            isLoaded={isLoaded}
            onMapLoad={setMap}
            onMapIdle={() => {}}
            onMarkerClick={setSelectedMarker}
            onInfoWindowClose={() => setSelectedMarker(null)}
            onTracarRota={tracarRota}
          />

          {/* Botões de controle (centralizar no usuário, limpar rota, etc.) */}
          <BotoesControle
            directions={directions}
            voiceGuidanceActive={voiceGuidanceActive}
            onCentralizarUsuario={centralizarNoUsuario}
            onCarregarDados={carregarDadosExcel}
            onLimparRota={limparRota}
            onToggleVoiceGuidance={() => {
              setVoiceGuidanceActive(!voiceGuidanceActive);
              if (!voiceGuidanceActive && directions) {
                // Se acabamos de ativar a voz e já temos uma rota
                setStepIndex(0);
                speakDirections(directions);
                startWatchingPosition();
              }
            }}
          />

          {/* Exibe tempos de viagem + seletor de modo de transporte, SE houver rota */}
          {directions && temposViagem.length > 0 && (
            <InfoTemposViagem
              temposViagem={temposViagem}
              modoTransporteSelecionado={modoTransporteSelecionado}
              onModoSelect={(modo) => {
                setModoTransporteSelecionado(modo);
                // Ao trocar de modo, recalcula rota
                if (selectedLocal) tracarRota(selectedLocal);
              }}
            />
          )}
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
          className="fixed top-4 left-4 right-4 bg-red-100 border border-red-400 
          text-red-700 px-4 py-3 rounded-lg z-50 md:absolute"
        >
          {locationError}
        </div>
      )}
    </div>
  );
};

export default MapaLocais;

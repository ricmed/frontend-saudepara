import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Local, LatLngLiteral } from '../types';
import { TILE_OPTIONS } from '../config/tileProviders';
import { useMapProvider } from '../hooks/useMapProvider';

// Fix para ícones do Leaflet no Webpack/Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Configurar ícones padrão do Leaflet
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapaContainerProps {
  center: LatLngLiteral;
  userLocation: LatLngLiteral | null;
  filteredPlaces: Local[];
  selectedMarker: Local | null;
  visibleCount: number;
  onMapLoad: (map: L.Map) => void;
  onMapIdle: () => void;
  onMarkerClick: (local: Local) => void;
  onInfoWindowClose: () => void;
  onTracarRota: (local: Local, transportType?: string) => void;
  mapboxApiKey?: string; // Nova prop para API key do Mapbox
}

export const MapaContainer: React.FC<MapaContainerProps> = ({
  center,
  userLocation,
  filteredPlaces,
  selectedMarker,
  visibleCount,
  onMapLoad,
  onMapIdle,
  onMarkerClick,
  onInfoWindowClose,
  onTracarRota,
  mapboxApiKey,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Hook para gerenciar provedor de mapa
  const { tileProvider } = useMapProvider({
    defaultProvider: 'openstreetmap',
    mapboxApiKey
  });

  // Inicializar mapa uma única vez
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    console.log('🗺️ Inicializando mapa Leaflet...');

    try {
      // Configurações otimizadas para COP 30 - 60k usuários
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: 6,
        zoomControl: false,  // Removido para reposicionar
        attributionControl: true,
        // OTIMIZAÇÃO 1: Performance melhorada para eventos grandes
        preferCanvas: true,        // Usa Canvas ao invés de SVG - muito mais rápido
        maxZoom: 18,              // Limita zoom máximo para reduzir tiles
        zoomSnap: 0.5,            // Zoom mais suave
        worldCopyJump: false,     // Desabilita duplicação de mundo
        maxBounds: [              // Limita área para o Brasil
          [-35, -75],             // Sudoeste
          [10, -30]               // Nordeste
        ],
        maxBoundsViscosity: 0.8,  // Resistência para sair dos limites
      });

      // Adicionar controle de zoom no canto inferior direito
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      // OTIMIZAÇÃO 2 & 3: Tile provider otimizado para COP 30 no Brasil
      const tileLayer = L.tileLayer(tileProvider.url, {
        attribution: tileProvider.attribution,
        maxZoom: tileProvider.maxZoom,
        minZoom: 3,
        ...TILE_OPTIONS, // Configurações de cache agressivo
      });
      
      tileLayer.addTo(map);
      
      // Listener para recarregar marcadores quando o mapa se move (lazy loading)
      map.on('moveend', () => {
        if (isMapLoaded) {
          onMapIdle();
          // Força atualização dos marcadores baseado nos novos bounds
          // Os marcadores serão atualizados automaticamente pelo useEffect dos filteredPlaces
        }
      });

      // Event listeners otimizados para COP 30
      map.on('zoomend', () => {
        if (isMapLoaded) onMapIdle();
      });
      
      map.on('click', () => {
        if (popupRef.current) {
          map.closePopup(popupRef.current);
          onInfoWindowClose();
        }
      });

      // Aguardar o mapa estar completamente carregado
      map.whenReady(() => {
        console.log('✅ Mapa Leaflet carregado e pronto');
        setIsMapReady(true);
        setIsMapLoaded(true);
        onMapLoad(map);
      });

      mapRef.current = map;
    } catch (error) {
      console.error('❌ Erro ao inicializar mapa:', error);
    }

    return () => {
      if (mapRef.current) {
        console.log('🧹 Limpando mapa Leaflet...');
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapReady(false);
        setIsMapLoaded(false);
      }
    };
  }, []); // Dependências vazias - inicializar apenas uma vez

  // Atualizar centro do mapa (com segurança)
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    try {
      const currentCenter = mapRef.current.getCenter();
      const newCenter = L.latLng(center.lat, center.lng);
      
      // Só atualizar se o centro mudou significativamente (mais de 1km)
      if (currentCenter.distanceTo(newCenter) > 1000) {
        console.log('📍 Atualizando centro do mapa:', center);
        mapRef.current.setView([center.lat, center.lng], mapRef.current.getZoom());
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar centro do mapa:', error);
    }
  }, [center.lat, center.lng, isMapReady]); // Dependências específicas

  // Atualizar tile layer quando o provedor de mapa mudar
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    try {
      console.log('🔄 Atualizando tile layer para:', tileProvider.url);
      
      // Remover todas as camadas de tile existentes
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          mapRef.current!.removeLayer(layer);
        }
      });

      // Adicionar nova camada de tile
      const newTileLayer = L.tileLayer(tileProvider.url, {
        attribution: tileProvider.attribution,
        maxZoom: tileProvider.maxZoom,
        minZoom: 3,
        ...TILE_OPTIONS, // Configurações de cache agressivo
      });
      
      newTileLayer.addTo(mapRef.current);
    } catch (error) {
      console.error('❌ Erro ao atualizar tile layer:', error);
    }
  }, [tileProvider, isMapReady]); // Monitora mudanças no tileProvider

  // Gerenciar marcador do usuário
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    try {
      // Remover marcador anterior
      if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }

      // Adicionar novo marcador do usuário
      if (userLocation) {
        const userIcon = L.divIcon({
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background: #4285f4;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          className: 'user-location-marker'
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(mapRef.current);

        userMarkerRef.current.bindTooltip('Você está aqui', {
          permanent: false,
          direction: 'top',
          offset: [0, -25],
          className: 'user-location-tooltip'
        });

        console.log('📍 Marcador do usuário adicionado:', userLocation);
      }
    } catch (error) {
      console.error('❌ Erro ao gerenciar marcador do usuário:', error);
    }
  }, [userLocation?.lat, userLocation?.lng, isMapReady]); // Dependências específicas

  // Gerenciar marcadores dos estabelecimentos
  // OTIMIZAÇÃO 4: Lazy loading de marcadores baseado nos bounds do mapa
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    try {
      console.log('🏥 Atualizando marcadores dos estabelecimentos:', filteredPlaces.length);

      // Limpar marcadores existentes
      markersRef.current.forEach(marker => {
        mapRef.current!.removeLayer(marker);
      });
      markersRef.current = [];

      // OTIMIZAÇÃO: Carregar apenas estabelecimentos visíveis na tela
      const mapBounds = mapRef.current.getBounds();
      const visiblePlacesInBounds = filteredPlaces.filter(local => {
        // Verificar se o estabelecimento tem coordenadas válidas
        if (!local.lat || !local.lng || local.lat === 0 || local.lng === 0) {
          return false;
        }
        
        // Verificar se está dentro dos bounds visíveis do mapa
        return mapBounds.contains([local.lat, local.lng]);
      });

      // Limitar também pelo visibleCount para performance
      const visiblePlaces = visiblePlacesInBounds.slice(0, Math.min(visibleCount, 100)); // Máximo 100 marcadores simultâneos
      
      console.log(`🔍 Debug: ${filteredPlaces.length} total, ${visiblePlacesInBounds.length} nos bounds, ${visiblePlaces.length} renderizados`);
      
      visiblePlaces.forEach((local, index) => {
        console.log(`🏥 Estabelecimento ${index}:`, {
          nome: local.nome,
          lat: local.lat,
          lng: local.lng,
        });

        // Definir cor baseada na natureza
        const naturezaLower = local.natureza?.toLowerCase() || '';
        const isPublic = naturezaLower.includes('público') || 
                         naturezaLower.includes('publico') ||
                         naturezaLower.includes('pública') ||
                         naturezaLower.includes('publica') ||
                         naturezaLower.includes('municipal') ||
                         naturezaLower.includes('estadual') ||
                         naturezaLower.includes('federal') ||
                         naturezaLower.includes('governo') ||
                         naturezaLower.includes('sus');
        
        // Debug para primeiro item
        if (index === 0) {
          console.log(`🏛️ Detecção de natureza - ${local.nome}:`, {
            natureza: local.natureza,
            naturezaLower,
            isPublic
          });
        }
        
        const markerColor = isPublic ? '#dc3545' : '#ffc107';
        const textColor = isPublic ? 'white' : '#000';
        
        const markerIcon = L.divIcon({
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background: ${markerColor};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              color: ${textColor};
              cursor: pointer;
            ">
              ${isPublic ? 'P' : 'V'}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          className: `estabelecimento-marker ${isPublic ? 'public' : 'private'}`
        });

        const marker = L.marker([local.lat, local.lng], {
          icon: markerIcon,
          riseOnHover: true
        }).addTo(mapRef.current!);

        // Tooltip no hover
        marker.bindTooltip(local.nome, {
          direction: 'top',
          offset: [0, -20],
          opacity: 0.9
        });

        // Click handler
        marker.on('click', (e) => {
          e.originalEvent?.stopPropagation();
          onMarkerClick(local);
        });

        markersRef.current.push(marker);
      });

      console.log('✅ Marcadores dos estabelecimentos atualizados:', markersRef.current.length);
    } catch (error) {
      console.error('❌ Erro ao gerenciar marcadores dos estabelecimentos:', error);
    }
  }, [filteredPlaces, visibleCount, isMapReady]); // Sem onMarkerClick nas dependências

  // Gerenciar popup do marcador selecionado
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    try {
      // Fechar popup anterior
      if (popupRef.current) {
        mapRef.current.closePopup(popupRef.current);
        popupRef.current = null;
      }

      // Abrir novo popup se houver marcador selecionado
      if (selectedMarker) {
        console.log('📍 Abrindo popup para:', selectedMarker.nome);

        const popupContent = createPopupContent(selectedMarker, onTracarRota);
        
        popupRef.current = L.popup({
          maxWidth: 300,
          minWidth: 250,
          closeButton: true,
          autoClose: false,
          closeOnClick: false,
          className: 'estabelecimento-popup'
        })
          .setLatLng([selectedMarker.lat, selectedMarker.lng])
          .setContent(popupContent)
          .openOn(mapRef.current);

        // Event listener para fechar popup
        popupRef.current.on('remove', onInfoWindowClose);
      }
    } catch (error) {
      console.error('❌ Erro ao gerenciar popup:', error);
    }
  }, [selectedMarker?.id, isMapReady]); // Dependência específica no ID

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* Loading indicator */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando mapa...</p>
          </div>
        </div>
      )}
      
      {/* Legenda - z-index baixo para não sobrepor painel lateral */}
      {isMapReady && (
        <div className="absolute bottom-4 left-4 bg-white p-2 sm:p-3 rounded-lg shadow-lg z-[500] max-w-[180px] sm:max-w-xs">
          <h4 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-800">Legenda</h4>
          <div className="space-y-1 sm:space-y-2 text-xs">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full border-2 border-white shadow flex items-center justify-center">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-gray-700 text-xs">Sua localização</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
                P
              </div>
              <span className="text-gray-700 text-xs">Estabelecimento Público</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded-full border-2 border-white shadow flex items-center justify-center text-black text-xs font-bold">
                V
              </div>
              <span className="text-gray-700 text-xs">Estabelecimento Privado</span>
            </div>
          </div>
        </div>
      )}

      {/* Estilo CSS adicional */}
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        .leaflet-popup-content {
          margin: 8px 12px;
          line-height: 1.4;
        }
        .estabelecimento-popup .leaflet-popup-close-button {
          font-size: 18px;
          padding: 4px;
        }
        .user-location-tooltip {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          padding: 4px 8px;
        }
        .estabelecimento-marker:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
};

// Função para criar conteúdo do popup
const createPopupContent = (
  local: Local, 
  onTracarRota: (local: Local, transportType?: string) => void
): HTMLElement => {
  const container = document.createElement('div');
  container.className = 'estabelecimento-popup-content';
  
  // Debug: log dos dados do local
  console.log('🔍 Criando popup para estabelecimento:', {
    nome: local.nome,
    endereco: local.endereco,
    natureza: local.natureza,
    turno: local.turno,
    habilitacoes: local.habilitacoes,
    qualificacoes: local.qualificacoes,
    cnes: local.cnes
  });
  
  const naturezaLower = local.natureza?.toLowerCase() || '';
  const isPublic = naturezaLower.includes('público') || 
                   naturezaLower.includes('publico') ||
                   naturezaLower.includes('municipal') ||
                   naturezaLower.includes('estadual') ||
                   naturezaLower.includes('federal');
  
  // Limitar habilitações e qualificações mostradas no popup
  const maxItems = 3;
  const habilitacoesLimitadas = local.habilitacoes.slice(0, maxItems);
  const qualificacoesLimitadas = local.qualificacoes.slice(0, maxItems);
  
  container.innerHTML = `
    <div class="space-y-3">
      <div>
        <h3 class="text-base font-semibold text-gray-900 mb-1 leading-tight">${local.nome}</h3>
        ${local.endereco ? `<p class="text-sm text-gray-600 mb-2">📍 ${local.endereco}</p>` : ''}
      </div>
      
      <div class="space-y-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${
            isPublic 
              ? 'bg-red-100 text-red-800' 
              : 'bg-yellow-100 text-yellow-800'
          }">
            ${local.natureza || 'Não informado'}
          </span>
          ${local.turno && local.turno !== 'Não informado' ? `
            <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              ${local.turno}
            </span>
          ` : ''}
        </div>
        
        ${habilitacoesLimitadas.length > 0 ? `
          <div class="text-sm">
            <div class="font-medium text-gray-700 mb-1">Habilitações:</div>
            <div class="space-y-1">
              ${habilitacoesLimitadas.map(hab => 
                `<div class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">• ${hab}</div>`
              ).join('')}
              ${local.habilitacoes.length > maxItems ? 
                `<div class="text-xs text-gray-500">+ ${local.habilitacoes.length - maxItems} mais...</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        ${qualificacoesLimitadas.length > 0 ? `
          <div class="text-sm">
            <div class="font-medium text-gray-700 mb-1">Qualificações:</div>
            <div class="space-y-1">
              ${qualificacoesLimitadas.map(qual => 
                `<div class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">• ${qual}</div>`
              ).join('')}
              ${local.qualificacoes.length > maxItems ? 
                `<div class="text-xs text-gray-500">+ ${local.qualificacoes.length - maxItems} mais...</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        ${local.cnes ? `
          <div class="text-xs text-gray-600">
            <strong>CNES:</strong> ${local.cnes}
          </div>
        ` : ''}
        
        ${local.cnes ? `
          <div class="text-sm text-gray-600">
            <strong>CNES:</strong> ${local.cnes}
          </div>
        ` : ''}
      </div>
      
      <div class="flex gap-2 mt-3 pt-2 border-t border-gray-200">
        <div class="flex-1">
          <label class="block text-xs text-gray-600 mb-1">Tipo de Transporte:</label>
          <select 
            id="transport-select-${local.id}" 
            class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="driving-car">🚗 Carro</option>
            <option value="foot-walking">🚶 A pé</option>
            <option value="cycling-regular">🚴 Bicicleta</option>
            <option value="motorcycle">🏍️ Motocicleta</option>
            <option value="public-transport">🚌 Transporte Público</option>
          </select>
        </div>
        <button
          id="btn-rota-${local.id}"
          class="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          📍 Traçar Rota
        </button>
      </div>
      
      <div class="flex gap-2 mt-2">
        <button
          id="btn-google-maps-${local.id}"
          class="flex-1 px-3 py-1.5 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
        >
          🗺️ Google Maps
        </button>
        <button
          id="btn-waze-${local.id}"
          class="flex-1 px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-md hover:bg-indigo-600 transition-colors font-medium"
        >
          🚗 Waze
        </button>
        <button
          id="btn-apple-maps-${local.id}"
          class="flex-1 px-3 py-1.5 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 transition-colors font-medium"
        >
          🍎 Apple Maps
        </button>
      </div>
    </div>
  `;

  // Event listeners para os botões (com timeout para garantir que DOM esteja pronto)
  setTimeout(() => {
    const btnRota = container.querySelector(`#btn-rota-${local.id}`) as HTMLButtonElement;
    const transportSelect = container.querySelector(`#transport-select-${local.id}`) as HTMLSelectElement;
    const btnGoogleMaps = container.querySelector(`#btn-google-maps-${local.id}`) as HTMLButtonElement;
    const btnWaze = container.querySelector(`#btn-waze-${local.id}`) as HTMLButtonElement;
    const btnAppleMaps = container.querySelector(`#btn-apple-maps-${local.id}`) as HTMLButtonElement;

    if (btnRota) {
      btnRota.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedTransport = transportSelect?.value || 'driving-car';
        onTracarRota(local, selectedTransport);
      });
    }

    if (btnGoogleMaps) {
      btnGoogleMaps.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirNoGoogleMaps(local);
      });
    }

    if (btnWaze) {
      btnWaze.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirNoWaze(local);
      });
    }

    if (btnAppleMaps) {
      btnAppleMaps.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirNoAppleMaps(local);
      });
    }
  }, 100);

  return container;
};

// Funções para abrir em diferentes apps de navegação
const abrirNoGoogleMaps = (local: Local) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${local.lat},${local.lng}&destination_place_id=${encodeURIComponent(local.nome)}`;
  
  if (isMobile) {
    window.open(url, '_system');
  } else {
    window.open(url, '_blank');
  }
};

const abrirNoWaze = (local: Local) => {
  const url = `https://waze.com/ul?ll=${local.lat},${local.lng}&navigate=yes&zoom=17`;
  window.open(url, '_blank');
};

const abrirNoAppleMaps = (local: Local) => {
  const url = `http://maps.apple.com/?daddr=${local.lat},${local.lng}&dirflg=d`;
  window.open(url, '_blank');
};

export default MapaContainer;
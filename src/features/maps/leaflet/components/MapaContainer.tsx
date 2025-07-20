import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Local, LatLngLiteral } from '../types';

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
  onTracarRota: (local: Local) => void;
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Inicializar mapa uma única vez
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    console.log('🗺️ Inicializando mapa Leaflet...');

    try {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: 6,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false,
      });

      // Adicionar camada de tiles do OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 3,
      }).addTo(map);

      // Event listeners
      map.on('moveend', () => {
        if (isMapLoaded) onMapIdle();
      });
      
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
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    try {
      console.log('🏥 Atualizando marcadores dos estabelecimentos:', filteredPlaces.length);

      // Limpar marcadores existentes
      markersRef.current.forEach(marker => {
        mapRef.current!.removeLayer(marker);
      });
      markersRef.current = [];

      // Adicionar novos marcadores
      const visiblePlaces = filteredPlaces.slice(0, visibleCount);
      
      visiblePlaces.forEach((local) => {
        if (!local.lat || !local.lng || local.lat === 0 || local.lng === 0) return;

        // Definir cor baseada na natureza
        const isPublic = local.natureza?.toLowerCase().includes('público') || 
                         local.natureza?.toLowerCase().includes('publico') ||
                         local.natureza?.toLowerCase().includes('pública') ||
                         local.natureza?.toLowerCase().includes('publica');
        
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
      
      {/* Legenda */}
      {isMapReady && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000] max-w-xs">
          <h4 className="text-sm font-semibold mb-2 text-gray-800">Legenda</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-gray-700">Sua localização</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
                P
              </div>
              <span className="text-gray-700">Estabelecimento Público</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-500 rounded-full border-2 border-white shadow flex items-center justify-center text-black text-xs font-bold">
                V
              </div>
              <span className="text-gray-700">Estabelecimento Privado</span>
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
  onTracarRota: (local: Local) => void
): HTMLElement => {
  const container = document.createElement('div');
  container.className = 'estabelecimento-popup-content';
  
  const isPublic = local.natureza?.toLowerCase().includes('público') || 
                   local.natureza?.toLowerCase().includes('publico') ||
                   local.natureza?.toLowerCase().includes('pública') ||
                   local.natureza?.toLowerCase().includes('publica');
  
  container.innerHTML = `
    <div class="space-y-2">
      <div>
        <h3 class="text-base font-semibold text-gray-900 mb-1 leading-tight">${local.nome}</h3>
        <p class="text-sm text-gray-600 mb-2">${local.endereco || 'Endereço não informado'}</p>
      </div>
      
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${
            isPublic 
              ? 'bg-red-100 text-red-800' 
              : 'bg-yellow-100 text-yellow-800'
          }">
            ${local.natureza || 'Não informado'}
          </span>
        </div>
        
        ${local.tipo ? `
          <div class="text-sm text-gray-700">
            <strong>Tipo:</strong> ${local.tipo}
          </div>
        ` : ''}
        
        ${local.turno ? `
          <div class="text-sm text-gray-600">
            <strong>Turno:</strong> ${local.turno}
          </div>
        ` : ''}
        
        ${local.cnes ? `
          <div class="text-sm text-gray-600">
            <strong>CNES:</strong> ${local.cnes}
          </div>
        ` : ''}
      </div>
      
      <div class="flex gap-2 mt-3 pt-2 border-t border-gray-200">
        <button
          id="btn-rota-${local.id}"
          class="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          📍 Traçar Rota
        </button>
        <button
          id="btn-google-maps-${local.id}"
          class="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
        >
          🗺️ Google Maps
        </button>
      </div>
      
      <div class="flex gap-2">
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
    const btnGoogleMaps = container.querySelector(`#btn-google-maps-${local.id}`) as HTMLButtonElement;
    const btnWaze = container.querySelector(`#btn-waze-${local.id}`) as HTMLButtonElement;
    const btnAppleMaps = container.querySelector(`#btn-apple-maps-${local.id}`) as HTMLButtonElement;

    if (btnRota) {
      btnRota.addEventListener('click', (e) => {
        e.stopPropagation();
        onTracarRota(local);
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
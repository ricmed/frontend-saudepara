import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CompactMapProviderSelector } from '../../maps/leaflet/components/CompactMapProviderSelector';
import { useMapProvider } from '../../maps/leaflet/contexts/MapProviderContext';

// Tipos para o componente
export type LocalizacaoTipo = 'NHE' | 'CIEVS' | 'CRS';

// Extensão do HTMLDivElement para incluir propriedade do Leaflet
interface LeafletContainer extends HTMLDivElement {
  _leaflet_id?: number;
}

export interface LocalizacaoMapa {
  id: string;
  nome: string;
  tipo: LocalizacaoTipo;
  lat: number;
  lng: number;
  endereco?: string;
  fichasCount?: number;
}

interface MapaDashboardDAEProps {
  localizacoes: LocalizacaoMapa[];
  center?: { lat: number; lng: number };
  onLocalizacaoClick?: (localizacao: LocalizacaoMapa) => void;
}

const MapaDashboardDAE: React.FC<MapaDashboardDAEProps> = memo(({
  localizacoes,
  center = { lat: -1.4558, lng: -48.4902 }, // Belém, PA
  onLocalizacaoClick
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<LeafletContainer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const [initialBoundsSet, setInitialBoundsSet] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const { tileProvider } = useMapProvider();

  // Função para obter cor baseada no tipo
  const getTipoColor = useCallback((tipo: LocalizacaoTipo) => {
    switch (tipo) {
      case 'NHE': return '#16a34a';      // green-600
      case 'CIEVS': return '#9333ea';    // purple-600
      case 'CRS': return '#ea580c';      // orange-600
      default: return '#6b7280';         // gray
    }
  }, []);

  // Função para criar ícone customizado
  const createCustomIcon = useCallback((localizacao: LocalizacaoMapa) => {
    const color = getTipoColor(localizacao.tipo);
    const fichas = localizacao.fichasCount || 0;

    return L.divIcon({
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: ${color};
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${fichas > 0 ? `
              <span style="
                color: white;
                font-size: 11px;
                font-weight: bold;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
              ">${fichas}</span>
            ` : ''}
          </div>
        </div>
      `,
      className: 'custom-marker-dae',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }, [getTipoColor]);

  // Inicializar mapa
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Prevenir inicialização dupla
    if (mapRef.current) return;

    // Verificar se o tileProvider tem as propriedades necessárias
    if (!tileProvider || !tileProvider.url) {
      console.error('Tile provider inválido:', tileProvider);
      return;
    }

    try {
      // Limpar qualquer conteúdo anterior do container
      const container = containerRef.current;
      container.innerHTML = '';
      container._leaflet_id = undefined;

      const map = L.map(container, {
        center: [center.lat, center.lng],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      });

      // Adicionar camada de tiles inicial
      const tileLayer = L.tileLayer(tileProvider.url, {
        attribution: tileProvider.attribution,
        maxZoom: tileProvider.maxZoom || 19,
      });
      tileLayer.addTo(map);
      currentTileLayerRef.current = tileLayer;

      mapRef.current = map;
      setIsMapReady(true);

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          setIsMapReady(false);
          currentTileLayerRef.current = null;
        }
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current._leaflet_id = undefined;
        }
      };
    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
      // Limpar referências em caso de erro
      mapRef.current = null;
      setIsMapReady(false);
    }
  }, [center.lat, center.lng, tileProvider]);

  // Atualizar tile provider quando mudar
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Verificar se o tileProvider tem as propriedades necessárias
    if (!tileProvider || !tileProvider.url) {
      console.error('Tile provider inválido:', tileProvider);
      return;
    }

    try {
      if (currentTileLayerRef.current) {
        mapRef.current.removeLayer(currentTileLayerRef.current);
      }

      const newTileLayer = L.tileLayer(tileProvider.url, {
        attribution: tileProvider.attribution,
        maxZoom: tileProvider.maxZoom || 19,
      });
      newTileLayer.addTo(mapRef.current);
      currentTileLayerRef.current = newTileLayer;
    } catch (error) {
      console.error('Erro ao atualizar tile provider:', error);
    }
  }, [tileProvider, isMapReady]);

  // Atualizar marcadores
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Limpar marcadores existentes
    markersRef.current.forEach(marker => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Adicionar novos marcadores
    const bounds = L.latLngBounds([]);
    let hasValidMarkers = false;

    localizacoes.forEach(localizacao => {
      if (!localizacao.lat || !localizacao.lng) return;

      const marker = L.marker([localizacao.lat, localizacao.lng], {
        icon: createCustomIcon(localizacao),
      });

      // Criar popup
      const popupContent = `
        <div style="min-width: 200px;">
          <div style="
            padding: 8px;
            background: linear-gradient(135deg, ${getTipoColor(localizacao.tipo)} 0%, ${getTipoColor(localizacao.tipo)}dd 100%);
            color: white;
            font-weight: bold;
            border-radius: 4px 4px 0 0;
            margin: -10px -10px 8px -10px;
          ">
            ${localizacao.tipo}
          </div>
          <div style="padding: 4px 0;">
            <strong>${localizacao.nome}</strong>
          </div>
          ${localizacao.endereco ? `
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              ${localizacao.endereco}
            </div>
          ` : ''}
          ${localizacao.fichasCount ? `
            <div style="
              margin-top: 8px;
              padding: 6px;
              background-color: #f3f4f6;
              border-radius: 4px;
              font-size: 12px;
            ">
              <strong>${localizacao.fichasCount}</strong> ficha(s) relacionada(s)
            </div>
          ` : ''}
          <div style="
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            font-size: 11px;
            color: #6b7280;
          ">
            Clique na bolinha para ver detalhes
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup-dae',
      });

      // Evento de clique
      marker.on('click', () => {
        if (onLocalizacaoClick) {
          onLocalizacaoClick(localizacao);
        }
      });

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);

      bounds.extend([localizacao.lat, localizacao.lng]);
      hasValidMarkers = true;
    });

    // Ajustar zoom para mostrar todos os marcadores
    if (hasValidMarkers && !initialBoundsSet && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      setInitialBoundsSet(true);
    }
  }, [localizacoes, isMapReady, createCustomIcon, getTipoColor, onLocalizacaoClick, initialBoundsSet]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
      {/* Container do mapa */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Seletor de provedor de mapas */}
      <div className="absolute top-4 right-4 z-[1000]">
        <CompactMapProviderSelector />
      </div>

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h4 className="font-semibold text-sm mb-3 text-gray-800">Legenda</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow"></div>
            <span className="text-xs text-gray-700">NHE - Núcleo Hospitalar de Epidemiologia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow"></div>
            <span className="text-xs text-gray-700">CIEVS - Centro de Informações Estratégicas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-600 border-2 border-white shadow"></div>
            <span className="text-xs text-gray-700">CRS - Centro Regional de Saúde</span>
          </div>
        </div>
        {localizacoes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Total: <strong>{localizacoes.length}</strong> localização(ões)
            </p>
          </div>
        )}
      </div>

      {/* Mensagem quando não há dados */}
      {localizacoes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-[999]">
          <div className="text-center p-6">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Nenhuma localização disponível</p>
            <p className="text-gray-500 text-sm mt-1">
              Configure o CNES dos NHE, CIEVS e CRS para visualizar no mapa
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

MapaDashboardDAE.displayName = 'MapaDashboardDAE';

export default MapaDashboardDAE;

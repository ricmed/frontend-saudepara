import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CompactMapProviderSelectorView } from '@/features/maps/leaflet/components/CompactMapProviderSelector';
import { useMapProvider } from '@/features/maps/leaflet/hooks/useMapProvider';
import { TILE_OPTIONS } from '@/features/maps/leaflet/config/tileProviders';
import {
  EventLocalityAggregate,
  getEventLocalityMarkerRadius,
  getMappableEventLocalities
} from '../../utils/eventLocalities';

interface EventLocalitiesMiniMapProps {
  data: EventLocalityAggregate[];
  selectedLocalityIds: number[];
  granularityEnabled: boolean;
  onLocalityClick?: (localityId: number) => void;
}

const DEFAULT_CENTER: L.LatLngExpression = [-2.4385, -54.6996];

const createTooltipContent = (item: EventLocalityAggregate): HTMLElement => {
  const container = document.createElement('div');
  const title = document.createElement('strong');
  const count = document.createElement('div');

  title.textContent = item.label;
  count.textContent = `${item.count.toLocaleString('pt-BR')} ${
    item.count === 1 ? 'notificação' : 'notificações'
  }`;
  container.append(title, count);

  return container;
};

const EventLocalitiesMiniMap: React.FC<EventLocalitiesMiniMapProps> = ({
  data,
  selectedLocalityIds,
  granularityEnabled,
  onLocalityClick
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const fittedBoundsKeyRef = useRef<string>('');
  const forcedMapboxRef = useRef(false);
  const { tileProvider, currentProvider, setCurrentProvider, isAvailable } = useMapProvider({
    defaultProvider: 'mapbox'
  });
  const mappableData = useMemo(
    () => getMappableEventLocalities(data),
    [data]
  );
  const selectedIds = useMemo(
    () => new Set(selectedLocalityIds),
    [selectedLocalityIds]
  );
  const boundsKey = useMemo(
    () => mappableData.map((item) => item.id).sort((left, right) => left - right).join(','),
    [mappableData]
  );

  useEffect(() => {
    if (forcedMapboxRef.current) {
      return;
    }
    forcedMapboxRef.current = true;
    if (currentProvider !== 'mapbox' && isAvailable('mapbox')) {
      setCurrentProvider('mapbox');
    }
  }, [currentProvider, isAvailable, setCurrentProvider]);

  useEffect(() => {
    if (!granularityEnabled || !containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 11,
      minZoom: 6,
      maxZoom: 22,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: true,
      dragging: true,
      keyboard: true
    });

    const tileLayer = L.tileLayer(tileProvider.url, {
      attribution: tileProvider.attribution,
      maxZoom: tileProvider.maxZoom,
      minZoom: 6,
      ...TILE_OPTIONS
    }).addTo(map);

    currentTileLayerRef.current = tileLayer;
    const markersLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = markersLayer;
    map.scrollWheelZoom.enable();

    const animationFrame = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      currentTileLayerRef.current = null;
      fittedBoundsKeyRef.current = '';
    };
    // O mapa não pode depender do tile: recriar zera o zoom do usuário.
  }, [granularityEnabled]);

  useEffect(() => {
    const map = mapRef.current;
    if (!granularityEnabled || !map) {
      return;
    }

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
      currentTileLayerRef.current = null;
    }

    currentTileLayerRef.current = L.tileLayer(tileProvider.url, {
      attribution: tileProvider.attribution,
      maxZoom: tileProvider.maxZoom,
      minZoom: 6,
      ...TILE_OPTIONS
    }).addTo(map);
  }, [granularityEnabled, tileProvider.attribution, tileProvider.maxZoom, tileProvider.url]);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!granularityEnabled || !map || !markersLayer) {
      return;
    }

    markersLayer.clearLayers();
    const counts = mappableData.map((item) => item.count);
    const maximumCount = Math.max(...counts, 0);
    const minimumCount = counts.length > 0 ? Math.min(...counts) : 0;
    const bounds = L.latLngBounds([]);

    mappableData.forEach((item) => {
      if (item.latitude === null || item.longitude === null) {
        return;
      }

      const selected = selectedIds.has(item.id);
      const marker = L.circleMarker([item.latitude, item.longitude], {
        radius: getEventLocalityMarkerRadius(item.count, maximumCount, minimumCount),
        color: selected ? '#111827' : '#1d4ed8',
        weight: selected ? 4 : 2,
        fillColor: selected ? '#f59e0b' : '#3b82f6',
        fillOpacity: selected ? 0.88 : 0.68
      });

      marker.bindTooltip(createTooltipContent(item), {
        direction: 'top',
        opacity: 0.95
      });
      marker.on('click', () => onLocalityClick?.(item.id));
      marker.addTo(markersLayer);
      bounds.extend([item.latitude, item.longitude]);
    });

    const shouldFitBounds = bounds.isValid() && fittedBoundsKeyRef.current !== boundsKey;
    if (shouldFitBounds) {
      fittedBoundsKeyRef.current = boundsKey;
      if (mappableData.length === 1) {
        const onlyItem = mappableData[0];
        if (onlyItem.latitude !== null && onlyItem.longitude !== null) {
          map.setView([onlyItem.latitude, onlyItem.longitude], 13);
        }
      } else {
        map.fitBounds(bounds.pad(0.1));
      }
    }

    const animationFrame = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [
    boundsKey,
    granularityEnabled,
    mappableData,
    onLocalityClick,
    selectedIds
  ]);

  if (!granularityEnabled) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">
        Minimapa indisponível sem limiar agregado configurado.
      </div>
    );
  }

  return (
    <div className="relative min-h-96 rounded-lg border border-gray-200 bg-gray-100">
      <div
        ref={containerRef}
        className="h-96 w-full"
        aria-label="Minimapa agregado de localidades do evento"
      />
      <div className="absolute top-4 right-4 z-[1000]">
        <CompactMapProviderSelectorView
          currentProvider={currentProvider}
          setCurrentProvider={setCurrentProvider}
          isAvailable={isAvailable}
        />
      </div>
      {mappableData.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-white/85 p-6 text-center text-sm text-gray-600">
          Nenhuma localidade cartográfica atende aos filtros atuais.
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 left-2 z-[500] max-w-sm rounded bg-white/90 px-2 py-1 text-[11px] text-gray-700 shadow">
        {mappableData.length} de {data.length} localidades com centroide no
        catálogo. Outro e Não informado não entram no mapa.
      </div>
    </div>
  );
};

export default React.memo(EventLocalitiesMiniMap);

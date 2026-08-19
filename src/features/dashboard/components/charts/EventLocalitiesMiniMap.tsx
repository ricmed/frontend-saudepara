import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getOptimalTileProvider } from '@/features/maps/leaflet/config/tileProviders';
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
  const mappableData = useMemo(
    () => getMappableEventLocalities(data),
    [data]
  );
  const selectedIds = useMemo(
    () => new Set(selectedLocalityIds),
    [selectedLocalityIds]
  );

  useEffect(() => {
    if (!granularityEnabled || !containerRef.current || mapRef.current) {
      return;
    }

    const tileProvider = getOptimalTileProvider('openstreetmap');
    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 11,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer(tileProvider.url, {
      attribution: tileProvider.attribution,
      maxZoom: tileProvider.maxZoom
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    const animationFrame = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [granularityEnabled]);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!granularityEnabled || !map || !markersLayer) {
      return;
    }

    markersLayer.clearLayers();
    const maximumCount = Math.max(...mappableData.map((item) => item.count), 0);
    const bounds = L.latLngBounds([]);

    mappableData.forEach((item) => {
      if (item.latitude === null || item.longitude === null) {
        return;
      }

      const selected = selectedIds.has(item.id);
      const marker = L.circleMarker([item.latitude, item.longitude], {
        radius: getEventLocalityMarkerRadius(item.count, maximumCount),
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

    if (mappableData.length === 1) {
      const onlyItem = mappableData[0];
      if (onlyItem.latitude !== null && onlyItem.longitude !== null) {
        map.setView([onlyItem.latitude, onlyItem.longitude], 13);
      }
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [28, 28],
        maxZoom: 14
      });
    }

    const animationFrame = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [
    granularityEnabled,
    mappableData,
    onLocalityClick,
    selectedIds
  ]);

  if (!granularityEnabled) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">
        Minimapa indisponível sem limiar agregado configurado.
      </div>
    );
  }

  return (
    <div className="relative min-h-80 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
      <div
        ref={containerRef}
        className="h-80 w-full"
        aria-label="Minimapa agregado de localidades do evento"
      />
      {mappableData.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-white/85 p-6 text-center text-sm text-gray-600">
          Nenhuma localidade cartográfica atende aos filtros e ao limiar atual.
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 left-2 z-[500] max-w-xs rounded bg-white/90 px-2 py-1 text-[11px] text-gray-700 shadow">
        Círculos representam totais agregados em centroides de localidades.
      </div>
    </div>
  );
};

export default React.memo(EventLocalitiesMiniMap);

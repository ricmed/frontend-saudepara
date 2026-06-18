import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CompactMapProviderSelector } from '@/features/maps/leaflet/components/CompactMapProviderSelector';
import { useMapProvider } from '@/features/maps/leaflet/contexts/MapProviderContext';
import type { HepatiteMapaPonto } from '../types';

interface LeafletContainer extends HTMLDivElement {
  _leaflet_id?: number;
}

type Props = {
  pontos: HepatiteMapaPonto[];
  center?: { lat: number; lng: number };
};

const HepatiteCriancaMapaFicha: React.FC<Props> = memo(({ pontos, center = { lat: -1.4558, lng: -48.4902 } }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<LeafletContainer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const { tileProvider } = useMapProvider();

  const createIcon = useCallback((count: number) => {
    const size = count > 9 ? 36 : count > 1 ? 32 : 28;
    return L.divIcon({
      html: `
        <div style="width:${size}px;height:${size}px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          ${count > 1 ? `<span style="color:white;font-size:11px;font-weight:bold;">${count}</span>` : ''}
        </div>
      `,
      className: 'hepatite-crianca-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!tileProvider?.url) return;

    const container = containerRef.current;
    container.innerHTML = '';
    container._leaflet_id = undefined;

    const map = L.map(container, {
      center: [center.lat, center.lng],
      zoom: 7,
      zoomControl: true,
    });

    const tileLayer = L.tileLayer(tileProvider.url, {
      attribution: tileProvider.attribution,
      maxZoom: tileProvider.maxZoom || 19,
    });
    tileLayer.addTo(map);
    currentTileLayerRef.current = tileLayer;
    mapRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      currentTileLayerRef.current = null;
      setIsMapReady(false);
      container.innerHTML = '';
      container._leaflet_id = undefined;
    };
  }, [center.lat, center.lng, tileProvider]);

  useEffect(() => {
    if (!mapRef.current || !isMapReady || !tileProvider?.url) return;
    if (currentTileLayerRef.current) {
      mapRef.current.removeLayer(currentTileLayerRef.current);
    }
    const newLayer = L.tileLayer(tileProvider.url, {
      attribution: tileProvider.attribution,
      maxZoom: tileProvider.maxZoom || 19,
    });
    newLayer.addTo(mapRef.current);
    currentTileLayerRef.current = newLayer;
  }, [tileProvider, isMapReady]);

  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    markersRef.current.forEach((m) => mapRef.current?.removeLayer(m));
    markersRef.current = [];

    const bounds = L.latLngBounds([]);
    let hasMarkers = false;

    for (const ponto of pontos) {
      const marker = L.marker([ponto.lat, ponto.lng], { icon: createIcon(ponto.fichasCount) });
      marker.bindPopup(
        `<strong>Residência</strong><br/>${ponto.fichasCount} ficha(s) neste ponto`,
      );
      marker.addTo(mapRef.current);
      markersRef.current.push(marker);
      bounds.extend([ponto.lat, ponto.lng]);
      hasMarkers = true;
    }

    if (hasMarkers && bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [pontos, isMapReady, createIcon]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200">
      <div ref={containerRef} className="h-[320px] w-full bg-emerald-50" />
      <div className="absolute bottom-3 right-3 z-[1000]">
        <CompactMapProviderSelector />
      </div>
    </div>
  );
});

HepatiteCriancaMapaFicha.displayName = 'HepatiteCriancaMapaFicha';

export default HepatiteCriancaMapaFicha;

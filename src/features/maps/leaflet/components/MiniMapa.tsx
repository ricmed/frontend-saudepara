import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MiniMapaProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: string;
  initialLng?: string;
  className?: string;
}

const MiniMapa: React.FC<MiniMapaProps> = ({
  onLocationSelect,
  initialLat,
  initialLng,
  className = "h-[300px] w-full"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const parseCoordinate = (value: string | undefined, defaultValue: number): number => {
      if (!value) return defaultValue;
      const cleaned = value.replace(/\s/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    // Coordenadas iniciais (Belém, PA como padrão)
    const initialPosition: [number, number] = [
      parseCoordinate(initialLat, -1.4558),
      parseCoordinate(initialLng, -48.4902)
    ];

    // Limpar mapa anterior se existe
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    // Criar o mapa
    const map = L.map(mapRef.current, {
      center: initialPosition,
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      dragging: true
    });

    // Adicionar camada de tiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Criar marcador arrastável
    const customIcon = L.divIcon({
      html: `<div style="
        background-color: #DC2626;
        width: 20px;
        height: 20px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 20]
    });

    const marker = L.marker(initialPosition, {
      icon: customIcon,
      draggable: true
    }).addTo(map);

    markerRef.current = marker;

    // Event listeners
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onLocationSelect(position.lat, position.lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onLocationSelect(lat, lng);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [initialLat, initialLng, onLocationSelect]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className={className}
        style={{ minHeight: '300px' }}
      />      <div className="absolute top-2 left-2 bg-white p-2 rounded shadow text-xs z-[1000]">
        Clique ou arraste o marcador para selecionar a localização
      </div>
    </div>
  );
};

export default MiniMapa;

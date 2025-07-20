import React, { useEffect, useRef } from 'react';
import { useGoogleMapsLoader } from '../hooks/useGoogleMapsLoader';

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
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { isLoaded, loadError } = useGoogleMapsLoader();

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    try {
      const parseCoordinate = (value: string | undefined, defaultValue: number): number => {
        if (!value) return defaultValue;
        const cleaned = value.replace(/\s/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? defaultValue : parsed;
      };

      const initialPosition = {
        lat: parseCoordinate(initialLat, -1.4557),
        lng: parseCoordinate(initialLng, -48.4902)
      };

      // Criar ou atualizar o mapa
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: initialPosition,
          zoom: 15, // Aumentado para melhor visualização do endereço
          streetViewControl: false,
          mapTypeControl: true, // Habilitado para melhor navegação
          fullscreenControl: true, // Habilitado para melhor usabilidade
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });
      } else {
        // Atualizar a posição do mapa quando as coordenadas iniciais mudam
        mapInstanceRef.current.setCenter(initialPosition);
      }

      // Sempre remover o marcador antigo antes de criar um novo
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // Criar um novo marcador
      markerRef.current = new google.maps.Marker({
        position: initialPosition,
        map: mapInstanceRef.current,
        draggable: true,
        title: 'Arraste para definir a localização'
      });

      // Configurar os listeners do marcador
      markerRef.current.addListener('dragend', () => {
        const position = markerRef.current?.getPosition();
        if (position) {
          onLocationSelect(position.lat(), position.lng());
        }
      });

      // Listener para cliques no mapa
      mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
        const position = e.latLng;
        if (position && markerRef.current) {
          markerRef.current.setPosition(position);
          onLocationSelect(position.lat(), position.lng());
        }
      });

      // Criar e configurar a caixa de busca
      const searchContainer = document.createElement("div");
      searchContainer.className = "bg-white rounded-lg shadow-md m-2 w-[calc(100%-16px)]";

      const searchWrapper = document.createElement("div");
      searchWrapper.className = "flex items-center p-2";

      const searchIcon = document.createElement("div");
      searchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>`;
      searchWrapper.appendChild(searchIcon);

      const input = document.createElement("input");
      input.className = "w-full px-2 py-1.5 text-sm border-none focus:ring-0 focus:outline-none";
      input.placeholder = "Buscar endereço...";

      searchWrapper.appendChild(input);
      searchContainer.appendChild(searchWrapper);

      // Adicionar a caixa de busca ao mapa apenas se ainda não existir
      const existingControls = mapInstanceRef.current.controls[google.maps.ControlPosition.TOP_CENTER];
      if (existingControls.getLength() === 0) {
        mapInstanceRef.current.controls[google.maps.ControlPosition.TOP_CENTER].push(searchContainer);
      }

      const searchBoxInstance = new google.maps.places.SearchBox(input);

      // Listener para a caixa de busca
      searchBoxInstance.addListener('places_changed', () => {
        const places = searchBoxInstance.getPlaces();
        if (places?.length && markerRef.current && mapInstanceRef.current) {
          const place = places[0];
          const location = place.geometry?.location;
          if (location) {
            // Forçar a atualização do centro do mapa e zoom
            mapInstanceRef.current.setCenter(location);
            mapInstanceRef.current.setZoom(16);
            setTimeout(() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.panTo(location);
              }
            }, 100);
            markerRef.current.setPosition(location);
            onLocationSelect(location.lat(), location.lng());
          }
        }
      });

      // Cleanup
      return () => {
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
      };
    } catch (error) {
      console.error('Erro ao inicializar o mapa:', error);
    }
  }, [isLoaded, onLocationSelect, initialLat, initialLng]);

  if (loadError) {
    return <div className="p-4 text-red-600">Erro ao carregar o mapa</div>;
  }

  if (!isLoaded) {
    return <div className="p-4">Carregando mapa...</div>;
  }

  return <div ref={mapRef} className={className} />;
};

export default MiniMapa;

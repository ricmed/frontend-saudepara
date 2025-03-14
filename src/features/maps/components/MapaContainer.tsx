import React from 'react';
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
  InfoWindow,
} from '@react-google-maps/api';
import { Local, LatLngLiteral } from '../types';
import { GOOGLE_MAPS_CONFIG, MAP_CONFIG } from '@/api/maps';

interface MapaContainerProps {
  center: LatLngLiteral;
  userLocation: LatLngLiteral | null;
  filteredPlaces: Local[];
  directions: google.maps.DirectionsResult | null;
  selectedMarker: Local | null;
  visibleCount: number;
  onMapLoad: (map: google.maps.Map) => void;
  onMapIdle: () => void;
  onMarkerClick: (local: Local) => void;
  onInfoWindowClose: () => void;
  onTracarRota: (local: Local) => void;
}

export const MapaContainer: React.FC<MapaContainerProps> = ({
  center,
  userLocation,
  filteredPlaces,
  directions,
  selectedMarker,
  visibleCount,
  onMapLoad,
  onMapIdle,
  onMarkerClick,
  onInfoWindowClose,
  onTracarRota,
}) => {
  // Não use spread operator aqui - use a referência direta
  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_CONFIG.apiKey}
      libraries={GOOGLE_MAPS_CONFIG.libraries}
    >
      <GoogleMap
        mapContainerStyle={MAP_CONFIG.containerStyle}
        center={center}
        zoom={MAP_CONFIG.defaultOptions.zoom}
        onLoad={onMapLoad}
        onIdle={onMapIdle}
        options={MAP_CONFIG.defaultOptions}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={MAP_CONFIG.directionsOptions}
          />
        )}

        {userLocation && (
          <Marker
            position={userLocation}
            title={directions ? 'Seu destino' : 'Você está aqui'}
            icon={{
              url: directions 
                ? MAP_CONFIG.markerIcons.user.destination 
                : MAP_CONFIG.markerIcons.user.normal,
              scaledSize: new google.maps.Size(
                MAP_CONFIG.markerIcons.user.size, 
                MAP_CONFIG.markerIcons.user.size
              ),
              anchor: new google.maps.Point(
                MAP_CONFIG.markerIcons.user.size / 2, 
                MAP_CONFIG.markerIcons.user.size
              ),
            }}
          />
        )}

        {filteredPlaces.slice(0, visibleCount).map((local) => (
          <Marker
            key={local.id}
            position={{ lat: local.lat, lng: local.lng }}
            title={local.nome}
            onClick={() => onMarkerClick(local)}
            icon={{
              url: local.natureza === 'PÚBLICO'
                ? MAP_CONFIG.markerIcons.places.public
                : MAP_CONFIG.markerIcons.places.private,
            }}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={onInfoWindowClose}
          >
            <div className="p-2 max-w-[200px]">
              <h3 className="text-sm font-medium mb-1">{selectedMarker.nome}</h3>
              <p className="text-xs text-gray-600 mb-2">
                {selectedMarker.endereco}
              </p>
              <button
                onClick={() => onTracarRota(selectedMarker)}
                className="w-full px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                Traçar Rota
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapaContainer;
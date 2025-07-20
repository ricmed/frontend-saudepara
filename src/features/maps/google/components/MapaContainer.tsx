import React from 'react';
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  InfoWindow,
} from '@react-google-maps/api';
import { Local, LatLngLiteral } from '../types';
import { MAP_CONFIG } from '@/api/maps';
import { UserLocationMarker } from './UserLocationMarker';

interface MapaContainerProps {
  center: LatLngLiteral;
  userLocation: LatLngLiteral | null;
  filteredPlaces: Local[];
  directions: google.maps.DirectionsResult | null;
  selectedMarker: Local | null;
  visibleCount: number;
  isLoaded: boolean;
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
  isLoaded,
  onMapLoad,
  onMapIdle,
  onMarkerClick,
  onInfoWindowClose,
  onTracarRota,
}) => {
  // Container style que se adapta ao painel lateral
  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    position: 'relative' as const
  };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
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
          <UserLocationMarker
            userLocation={userLocation}
            hasRoute={!!directions}
            isApiLoaded={isLoaded}
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
  );
};

export default MapaContainer;
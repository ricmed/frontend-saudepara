import React, { useState } from 'react';
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
  onTracarRota: (local: Local, transportType?: string) => void;
  onLimparRota: () => void;
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
  onLimparRota,
}) => {
  const [routeInfoWindow, setRouteInfoWindow] = useState<{
    position: google.maps.LatLng | null;
    show: boolean;
  }>({ position: null, show: false });

  // Container style que se adapta ao painel lateral
  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    position: 'relative' as const
  };

  const handleDirectionsClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng && directions) {
      setRouteInfoWindow({
        position: e.latLng,
        show: true
      });
    }
  };

  const handleRouteInfoWindowClose = () => {
    setRouteInfoWindow({ position: null, show: false });
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
            options={{
              ...MAP_CONFIG.directionsOptions,
              suppressMarkers: false,
            }}
            onLoad={(directionsRenderer) => {
              // Adicionar evento de clique na rota
              if (directionsRenderer.getDirections()) {
                directionsRenderer.addListener('click', handleDirectionsClick);
              }
            }}
          />
        )}

        {/* InfoWindow para a rota */}
        {routeInfoWindow.show && routeInfoWindow.position && directions && (
          <InfoWindow
            position={routeInfoWindow.position}
            onCloseClick={handleRouteInfoWindowClose}
          >
            <div className="p-3 max-w-[200px]">
              <h4 className="text-sm font-medium mb-2">🛣️ Rota Ativa</h4>
              <div className="text-xs space-y-1 mb-3">
                {directions.routes[0]?.legs[0] && (
                  <>
                    <div>📏 <strong>Distância:</strong> {directions.routes[0].legs[0].distance?.text}</div>
                    <div>⏱️ <strong>Tempo:</strong> {directions.routes[0].legs[0].duration?.text}</div>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  onLimparRota();
                  handleRouteInfoWindowClose();
                }}
                className="w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                🗑️ Limpar Rota
              </button>
            </div>
          </InfoWindow>
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
            <div className="p-3 max-w-[250px]">
              <h3 className="text-sm font-medium mb-1">{selectedMarker.nome}</h3>
              <p className="text-xs text-gray-600 mb-2">
                {selectedMarker.endereco}
              </p>
              
              {/* Seleção de tipo de transporte */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tipo de transporte:
                </label>
                <select 
                  id="transport-select"
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  defaultValue="DRIVING"
                >
                  <option value="DRIVING">🚗 Carro</option>
                  <option value="WALKING">🚶 A pé</option>
                  <option value="BICYCLING">🚲 Bicicleta</option>
                  <option value="TRANSIT">🚌 Ônibus</option>
                </select>
              </div>
              
              <button
                onClick={() => {
                  const select = document.getElementById('transport-select') as HTMLSelectElement;
                  const selectedTransport = select ? select.value : 'DRIVING';
                  onTracarRota(selectedMarker, selectedTransport);
                }}
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
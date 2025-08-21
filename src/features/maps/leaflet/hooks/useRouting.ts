import { useState, useCallback } from 'react';
import L from 'leaflet';
import { LatLngLiteral, Local } from '../types';
import { RoutingServiceOSRM, RouteResult, RoutingError } from '../services/routingServiceOSRM';

export interface RouteState {
  isCalculating: boolean;
  route: RouteResult | null;
  error: string | null;
  routeLayer: L.Polyline | null;
}

export const useRouting = () => {
  const [routeState, setRouteState] = useState<RouteState>({
    isCalculating: false,
    route: null,
    error: null,
    routeLayer: null
  });

  /**
   * Calcula e desenha rota no mapa
   */
  const calculateRoute = useCallback(async (
    map: L.Map,
    userLocation: LatLngLiteral,
    destination: Local,
    profile: 'driving-car' | 'cycling-regular' | 'foot-walking' | 'motorcycle' | 'public-transport' = 'driving-car',
    onClearRoute?: () => void
  ) => {
    console.log('🚗 useRouting.calculateRoute - Iniciando cálculo de rota:', {
      from: userLocation,
      to: { lat: destination.lat, lng: destination.lng },
      destination: destination.nome,
      profile,
      hasMap: !!map,
      currentRouteState: routeState
    });

    // Limpar rota anterior
    if (routeState.routeLayer) {
      map.removeLayer(routeState.routeLayer);
    }

    setRouteState(prev => ({
      ...prev,
      isCalculating: true,
      error: null,
      routeLayer: null
    }));

    try {
      const route = await RoutingServiceOSRM.calculateRoute(
        userLocation,
        { lat: destination.lat, lng: destination.lng },
        profile
      );

      // OSRM já retorna coordenadas como [lat, lng], então usamos diretamente
      const latlngs: L.LatLngExpression[] = route.coordinates;

      // Criar polyline da rota
      const routeLayer = L.polyline(latlngs, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Adicionar popup com informações da rota e botão de limpar
      const createRoutePopup = () => {
        const popupDiv = document.createElement('div');
        popupDiv.className = 'route-popup';
        popupDiv.innerHTML = `
          <h4 class="font-semibold text-sm mb-2">🛣️ Rota para ${destination.nome}</h4>
          <div class="text-xs space-y-1">
            <div>📏 <strong>Distância:</strong> ${RoutingServiceOSRM.formatDistance(route.distance)}</div>
            <div>⏱️ <strong>Tempo:</strong> ${RoutingServiceOSRM.formatDuration(route.duration)}</div>
            <div class="text-gray-500 mt-2">
              ${getProfileIcon(profile)} ${getProfileName(profile)}
            </div>
          </div>
          <div class="mt-3 pt-2 border-t border-gray-200">
            <button 
              class="w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors clear-route-button"
            >
              🗑️ Limpar Rota
            </button>
          </div>
        `;

        // Adicionar evento ao botão
        const clearButton = popupDiv.querySelector('.clear-route-button');
        if (clearButton && onClearRoute) {
          clearButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🗑️ Botão de limpar rota clicado');
            onClearRoute();
            routeLayer.closePopup();
          });
        }

        return popupDiv;
      };

      // Adicionar popup no meio da rota
      const midPoint = Math.floor(latlngs.length / 2);
      if (midPoint < latlngs.length) {
        const popupContent = createRoutePopup();
        const popup = L.popup().setContent(popupContent);
        routeLayer.bindPopup(popup);
      }

      // Ajustar zoom para mostrar toda a rota
      const bounds = L.latLngBounds([userLocation, { lat: destination.lat, lng: destination.lng }]);
      map.fitBounds(bounds, { padding: [20, 20] });

      setRouteState({
        isCalculating: false,
        route,
        error: null,
        routeLayer
      });

      console.log('✅ Rota calculada e desenhada no mapa');

    } catch (error) {
      const routingError = error as RoutingError;
      console.error('❌ Erro ao calcular rota:', routingError);
      
      setRouteState(prev => ({
        ...prev,
        isCalculating: false,
        error: routingError.message || 'Erro ao calcular rota',
        route: null
      }));
    }
  }, [routeState.routeLayer]);

  /**
   * Limpa rota do mapa
   */
  const clearRoute = useCallback((map: L.Map) => {
    console.log('🧹 clearRoute chamado:', {
      hasRouteLayer: !!routeState.routeLayer,
      routeLayerType: routeState.routeLayer ? typeof routeState.routeLayer : 'null'
    });
    
    if (routeState.routeLayer) {
      console.log('🗑️ Removendo layer da rota do mapa...');
      map.removeLayer(routeState.routeLayer);
      console.log('✅ Layer removido com sucesso');
    } else {
      console.log('⚠️ Nenhuma rota para remover');
    }
    
    setRouteState({
      isCalculating: false,
      route: null,
      error: null,
      routeLayer: null
    });

    console.log('🧹 Estado da rota resetado');
  }, [routeState.routeLayer]);

  return {
    routeState,
    calculateRoute,
    clearRoute
  };
};

// Funções auxiliares
function getProfileIcon(profile: string): string {
  switch (profile) {
    case 'driving-car': return '🚗';
    case 'cycling-regular': return '🚴';
    case 'foot-walking': return '🚶';
    default: return '🛣️';
  }
}

function getProfileName(profile: string): string {
  switch (profile) {
    case 'driving-car': return 'De carro';
    case 'cycling-regular': return 'De bicicleta';
    case 'foot-walking': return 'A pé';
    default: return 'Rota';
  }
}

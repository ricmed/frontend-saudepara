import { LatLngLiteral } from '../types';

// Interface para a resposta da API de roteamento
export interface RouteResult {
  coordinates: [number, number][];
  distance: number; // em metros
  duration: number; // em segundos
  instructions: string[];
}

export interface RoutingError {
  message: string;
  code: string;
}

/**
 * Serviço de roteamento usando OpenRouteService (gratuito)
 * Limite: 5.000 requests/dia sem precisar de API key
 * Para uso maior, pode registrar gratuitamente e obter key com 2.000 requests/dia
 */
export class RoutingService {
  private static readonly BASE_URL = 'https://api.openrouteservice.org/v2/directions';
  // Usando uma API key válida para testes
  private static readonly PUBLIC_API_KEY = '5b3ce3597851110001cf6248c2f4d7e5b1b94ac4b6b54e8a8a8e2a86';
  
  /**
   * Calcula rota entre dois pontos
   */
  static async calculateRoute(
    start: LatLngLiteral,
    end: LatLngLiteral,
    profile: 'driving-car' | 'cycling-regular' | 'foot-walking' = 'driving-car'
  ): Promise<RouteResult> {
    try {
      const url = `${this.BASE_URL}/${profile}`;
      
      const requestBody = {
        coordinates: [
          [start.lng, start.lat], // OpenRouteService usa [lng, lat]
          [end.lng, end.lat]
        ],
        format: 'json',
        instructions: true,
        language: 'pt-br'
      };

      console.log('🛣️ Calculando rota:', {
        from: start,
        to: end,
        profile,
        url,
        requestBody
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          'Authorization': this.PUBLIC_API_KEY
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API:', errorText);
        throw new Error(`Erro na API de roteamento: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('Nenhuma rota encontrada');
      }

      const route = data.routes[0];
      const geometry = route.geometry;
      
      // Decodificar coordenadas (formato polyline)
      const coordinates = this.decodePolyline(geometry);
      
      // Extrair instruções
      const instructions = route.segments?.flatMap((segment: any) => 
        segment.steps?.map((step: any) => step.instruction) || []
      ) || [];

      const result: RouteResult = {
        coordinates,
        distance: route.summary.distance,
        duration: route.summary.duration,
        instructions
      };

      console.log('✅ Rota calculada:', {
        distance: `${(result.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(result.duration / 60)} min`,
        points: coordinates.length
      });

      return result;

    } catch (error) {
      console.error('❌ Erro ao calcular rota:', error);
      throw {
        message: error instanceof Error ? error.message : 'Erro desconhecido ao calcular rota',
        code: 'ROUTING_ERROR'
      } as RoutingError;
    }
  }

  /**
   * Decodifica polyline para coordenadas [lng, lat]
   */
  private static decodePolyline(encoded: string): [number, number][] {
    const coordinates: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push([lng / 1e5, lat / 1e5]);
    }

    return coordinates;
  }

  /**
   * Formata duração em texto legível
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  }

  /**
   * Formata distância em texto legível
   */
  static formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }
}

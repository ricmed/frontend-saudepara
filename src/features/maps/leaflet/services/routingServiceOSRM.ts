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
 * Serviço de roteamento híbrido
 * - OSRM para carros (geometria real da rota)
 * - Estimativas baseadas em cálculos para outros transportes
 */
export class RoutingServiceOSRM {
  private static readonly OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';
  
  /**
   * Velocidades médias por tipo de transporte (km/h)
   */
  private static readonly VELOCIDADES = {
    'driving-car': 50,      // Carro na cidade
    'foot-walking': 4,      // Caminhada
    'cycling-regular': 15,  // Bicicleta
    'motorcycle': 45,       // Motocicleta
    'public-transport': 25  // Transporte público
  };

  /**
   * Fatores de correção para distância em linha reta vs real
   */
  private static readonly FATORES_DISTANCIA = {
    'driving-car': 1.3,     // Ruas e curvas
    'foot-walking': 1.15,   // Caminhos mais diretos
    'cycling-regular': 1.2, // Ciclovias e ruas
    'motorcycle': 1.3,      // Mesmas ruas que carros
    'public-transport': 1.4 // Rotas de ônibus indiretas
  };

  /**
   * Calcula rota entre dois pontos
   */
  static async calculateRoute(
    start: LatLngLiteral,
    end: LatLngLiteral,
    profile: 'driving-car' | 'cycling-regular' | 'foot-walking' | 'motorcycle' | 'public-transport' = 'driving-car'
  ): Promise<RouteResult> {
    try {
      if (profile === 'driving-car') {
        // Para carros, usar OSRM que fornece rota real
        return await this.calculateOSRMRoute(start, end);
      } else {
        // Para outros transportes, calcular estimativa baseada em distância
        return await this.calculateEstimatedRoute(start, end, profile);
      }
    } catch (error) {
      console.error('❌ Erro ao calcular rota:', error);
      throw {
        message: error instanceof Error ? error.message : 'Erro desconhecido ao calcular rota',
        code: 'ROUTING_ERROR'
      } as RoutingError;
    }
  }

  /**
   * Calcula rota real usando OSRM (apenas para carros)
   */
  private static async calculateOSRMRoute(
    start: LatLngLiteral,
    end: LatLngLiteral
  ): Promise<RouteResult> {
    const url = `${this.OSRM_BASE_URL}/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
    
    console.log('🛣️ Calculando rota com OSRM (carro):', {
      from: start,
      to: end,
      url
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log('📡 Resposta da API OSRM:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API OSRM:', errorText);
      throw new Error(`Erro na API de roteamento: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 Dados recebidos do OSRM:', data);
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('Nenhuma rota encontrada pelo OSRM');
    }

    const route = data.routes[0];
    
    if (!route.geometry || !route.geometry.coordinates) {
      throw new Error('Geometria da rota não encontrada');
    }

    // OSRM retorna coordenadas como [lng, lat], mas precisamos de [lat, lng] para Leaflet
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]] // Inverter lng,lat para lat,lng
    );

    // Extrair instruções dos steps
    const instructions: string[] = [];
    if (route.legs && route.legs[0] && route.legs[0].steps) {
      route.legs[0].steps.forEach((step: any) => {
        if (step.maneuver && step.maneuver.instruction) {
          instructions.push(step.maneuver.instruction);
        }
      });
    }

    const result: RouteResult = {
      coordinates,
      distance: route.distance || 0,
      duration: route.duration || 0,
      instructions
    };

    console.log('✅ Rota OSRM processada com sucesso:', {
      coordenadas: coordinates.length,
      distancia: `${(result.distance / 1000).toFixed(1)} km`,
      duracao: `${Math.round(result.duration / 60)} min`,
      instrucoes: instructions.length
    });

    return result;
  }

  /**
   * Calcula rota estimada para outros tipos de transporte
   * Usa OSRM para obter uma rota de carro como base e depois ajusta
   */
  private static async calculateEstimatedRoute(
    start: LatLngLiteral,
    end: LatLngLiteral,
    profile: 'cycling-regular' | 'foot-walking' | 'motorcycle' | 'public-transport'
  ): Promise<RouteResult> {
    console.log(`🚶 Calculando rota estimada (${profile}):`, {
      from: start,
      to: end
    });

    try {
      // Tentar obter rota real do OSRM como base
      const baseRoute = await this.calculateOSRMRoute(start, end);
      
      // Ajustar distância e tempo para o tipo de transporte específico
      const baseDistance = baseRoute.distance;
      const velocidadeKmH = this.VELOCIDADES[profile];
      
      // Calcular novo tempo baseado na velocidade do transporte
      const tempoHoras = (baseDistance / 1000) / velocidadeKmH;
      const tempoSegundos = tempoHoras * 3600;
      
      // Para alguns transportes, ajustar a distância também
      let distanciaAjustada = baseDistance;
      if (profile === 'foot-walking' || profile === 'cycling-regular') {
        // Pedestres e ciclistas podem usar caminhos mais diretos
        distanciaAjustada = baseDistance * 0.9;
      } else if (profile === 'public-transport') {
        // Transporte público pode ter rotas indiretas
        distanciaAjustada = baseDistance * 1.2;
      }

      // Usar as coordenadas da rota real do OSRM
      const result: RouteResult = {
        coordinates: baseRoute.coordinates,
        distance: distanciaAjustada,
        duration: tempoSegundos,
        instructions: [
          `Siga a rota usando ${this.getTransportName(profile)}`,
          `Distância: ${this.formatDistance(distanciaAjustada)}`,
          `Tempo estimado: ${this.formatDuration(tempoSegundos)}`,
          ...baseRoute.instructions
        ]
      };

      console.log(`✅ Rota estimada (${profile}) calculada usando rota real:`, {
        distanciaOriginal: `${(baseDistance / 1000).toFixed(1)} km`,
        distanciaAjustada: `${(distanciaAjustada / 1000).toFixed(1)} km`,
        velocidade: `${velocidadeKmH} km/h`,
        tempo: `${Math.round(tempoSegundos / 60)} min`,
        coordenadas: result.coordinates.length
      });

      return result;

    } catch (error) {
      console.warn(`⚠️ Não foi possível obter rota real, usando estimativa em linha reta para ${profile}:`, error);
      
      // Fallback para linha reta se OSRM falhar
      return this.calculateStraightLineRoute(start, end, profile);
    }
  }

  /**
   * Fallback: calcula rota em linha reta (usado apenas se OSRM falhar)
   */
  private static calculateStraightLineRoute(
    start: LatLngLiteral,
    end: LatLngLiteral,
    profile: 'cycling-regular' | 'foot-walking' | 'motorcycle' | 'public-transport'
  ): RouteResult {
    console.log(`🚶 Calculando rota estimada (${profile}):`, {
      from: start,
      to: end
    });

    // Calcular distância em linha reta usando fórmula de Haversine
    const distanciaLinhaReta = this.calculateHaversineDistance(start, end);
    
    // Aplicar fator de correção para obter distância real estimada
    const fatorCorrecao = this.FATORES_DISTANCIA[profile];
    const distanciaReal = distanciaLinhaReta * fatorCorrecao;
    
    // Calcular tempo baseado na velocidade média
    const velocidadeKmH = this.VELOCIDADES[profile];
    const tempoHoras = (distanciaReal / 1000) / velocidadeKmH;
    const tempoSegundos = tempoHoras * 3600;

    // Criar linha reta simples entre os pontos (para visualização)
    const coordinates: [number, number][] = [
      [start.lat, start.lng],
      [end.lat, end.lng]
    ];

    // Instruções básicas
    const instructions = [
      `Siga em direção ao destino usando ${this.getTransportName(profile)}`,
      `Distância estimada: ${this.formatDistance(distanciaReal)}`,
      `Tempo estimado: ${this.formatDuration(tempoSegundos)}`
    ];

    const result: RouteResult = {
      coordinates,
      distance: distanciaReal,
      duration: tempoSegundos,
      instructions
    };

    console.log(`✅ Rota estimada (${profile}) calculada:`, {
      distanciaLinhaReta: `${(distanciaLinhaReta / 1000).toFixed(1)} km`,
      fatorCorrecao,
      distanciaReal: `${(distanciaReal / 1000).toFixed(1)} km`,
      velocidade: `${velocidadeKmH} km/h`,
      tempo: `${Math.round(tempoSegundos / 60)} min`
    });

    return result;
  }

  /**
   * Calcula distância usando fórmula de Haversine
   */
  private static calculateHaversineDistance(start: LatLngLiteral, end: LatLngLiteral): number {
    const R = 6371000; // Raio da Terra em metros
    const lat1Rad = (start.lat * Math.PI) / 180;
    const lat2Rad = (end.lat * Math.PI) / 180;
    const deltaLatRad = ((end.lat - start.lat) * Math.PI) / 180;
    const deltaLngRad = ((end.lng - start.lng) * Math.PI) / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Retorna nome amigável do tipo de transporte
   */
  private static getTransportName(profile: string): string {
    const nomes = {
      'foot-walking': 'caminhada',
      'cycling-regular': 'bicicleta',
      'motorcycle': 'motocicleta',
      'public-transport': 'transporte público'
    };
    return nomes[profile as keyof typeof nomes] || profile;
  }

  /**
   * Formata duração em formato legível
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
   * Formata distância em formato legível
   */
  static formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }
}

// Componente de mapa de estabelecimentos usando Leaflet
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Building, AlertTriangle, Info, Layers } from 'lucide-react';
import { useEstabelecimentosMapa } from '../hooks/useEstabelecimentosMapa';

// Declaração global para Leaflet
declare global {
  interface Window {
    L: any;
  }
}

interface EstabelecimentosMapaProps {
  notificacoes: any[];
  className?: string;
}

/**
 * Componente de mapa para visualizar estabelecimentos e concentração de atendimentos
 * Usa Leaflet com tiles do Mapbox para exibir agravos de notificação imediata
 */
export const EstabelecimentosMapa: React.FC<EstabelecimentosMapaProps> = ({
  notificacoes,
  className = ''
}) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const { estabelecimentosComCoordenadas, estatisticas } = useEstabelecimentosMapa({
    notificacoes
  });

  // Configuração do mapa
  const mapConfig = {
    center: [-1.4558, -48.4902] as [number, number], // Belém, PA
    zoom: 11,
    minZoom: 8,
    maxZoom: 18
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      // Verificar se Leaflet está disponível
      if (typeof window === 'undefined' || !window.L) {
        setMapError('Leaflet não está carregado');
        return;
      }

      const L = window.L;
      const container = mapContainerRef.current;

      // Limpar qualquer inicialização anterior
      const containerWithLeaflet = container as any;
      if (containerWithLeaflet._leaflet_id) {
        console.warn('Container já inicializado, limpando...');
        container.innerHTML = '';
        delete containerWithLeaflet._leaflet_id;
      }

      // Criar mapa
      const map = L.map(container, {
        center: mapConfig.center,
        zoom: mapConfig.zoom,
        minZoom: mapConfig.minZoom,
        maxZoom: mapConfig.maxZoom,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // Usar OpenStreetMap diretamente para evitar problemas com tokens
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      });

      tileLayer.addTo(map);
      mapRef.current = map;
      setMapLoaded(true);

    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
      setMapError('Erro ao carregar o mapa');
    }

    // Cleanup: destruir mapa quando componente for desmontado
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // Atualizar marcadores quando dados mudarem
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !window.L) return;

    const L = window.L;
    const map = mapRef.current;

    // Limpar marcadores existentes
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Adicionar marcadores para estabelecimentos
    estabelecimentosComCoordenadas.forEach((estabelecimento) => {
      try {
        // Calcular tamanho do marcador baseado no volume de atendimentos
        const maxAtendimentos = Math.max(...estabelecimentosComCoordenadas.map(e => e.totalAtendimentos));
        const tamanhoBase = 10;
        const tamanhoMax = 40;
        const raio = tamanhoBase + (estabelecimento.totalAtendimentos / maxAtendimentos) * (tamanhoMax - tamanhoBase);

        // Cor baseada no percentual de urgência
        let cor = '#3b82f6'; // Azul padrão
        if (estabelecimento.percentualUrgencia > 50) {
          cor = '#ef4444'; // Vermelho para alto percentual de urgência
        } else if (estabelecimento.percentualUrgencia > 25) {
          cor = '#f59e0b'; // Amarelo para médio percentual
        }

        // Criar marcador circular
        const marker = L.circleMarker([estabelecimento.latitude!, estabelecimento.longitude!], {
          radius: raio,
          fillColor: cor,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.7
        });

        // Popup com informações
        const popupContent = `
          <div class="p-3 min-w-64">
            <div class="flex items-center gap-2 mb-2">
              <div class="p-1 bg-blue-100 rounded">
                <div class="w-3 h-3 bg-blue-600 rounded-full"></div>
              </div>
              <h3 class="font-medium text-gray-900">${estabelecimento.nome}</h3>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-gray-600">Total:</span>
                  <span class="font-medium ml-1">${estabelecimento.totalAtendimentos}</span>
                </div>
                <div>
                  <span class="text-gray-600">Urgentes:</span>
                  <span class="font-medium ml-1 text-red-600">${estabelecimento.atendimentosUrgentes}</span>
                </div>
              </div>
              
              <div>
                <span class="text-gray-600">Urgência:</span>
                <span class="font-medium ml-1" style="color: ${cor}">${estabelecimento.percentualUrgencia}%</span>
              </div>
              
              ${estabelecimento.cnes ? `
                <div>
                  <span class="text-gray-600">CNES:</span>
                  <span class="font-medium ml-1">${estabelecimento.cnes}</span>
                </div>
              ` : ''}
              
              ${estabelecimento.endereco ? `
                <div>
                  <span class="text-gray-600">Endereço:</span>
                  <span class="ml-1">${estabelecimento.endereco}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);

      } catch (error) {
        console.warn('Erro ao adicionar marcador:', error);
      }
    });

    // Ajustar zoom se houver estabelecimentos
    if (estabelecimentosComCoordenadas.length > 0) {
      const group = new L.featureGroup(
        estabelecimentosComCoordenadas.map(e => 
          L.marker([e.latitude!, e.longitude!])
        )
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [estabelecimentosComCoordenadas, mapLoaded]);

  if (mapError) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-sm ${className}`}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro no Mapa</h3>
          <p className="text-gray-600">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 text-green-700 rounded-lg">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Mapa de Estabelecimentos
            </h3>
            <p className="text-sm text-gray-600">
              Concentração de atendimentos e agravos de notificação imediata
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Info className="h-4 w-4" />
          <span>{estabelecimentosComCoordenadas.length} estabelecimentos</span>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Estabelecimentos</span>
          </div>
          <p className="text-xl font-bold text-blue-700 mt-1">
            {estatisticas.totalEstabelecimentos}
          </p>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Maior Volume</span>
          </div>
          <p className="text-sm font-bold text-green-700 mt-1">
            {estatisticas.estabelecimentoMaiorVolume?.nome.substring(0, 15) || '—'}
          </p>
          <p className="text-xs text-green-600">
            {estatisticas.estabelecimentoMaiorVolume?.totalAtendimentos || 0} atendimentos
          </p>
        </div>

        <div className="bg-red-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">Maior % Urgência</span>
          </div>
          <p className="text-lg font-bold text-red-700 mt-1">
            {estatisticas.estabelecimentoMaiorPercentualUrgencia?.percentualUrgencia || 0}%
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Média</span>
          </div>
          <p className="text-lg font-bold text-gray-700 mt-1">
            {estatisticas.mediaAtendimentosPorEstabelecimento}
          </p>
          <p className="text-xs text-gray-600">atend./estabelecimento</p>
        </div>
      </div>

      {/* Mapa */}
      <div className="relative">
        <div 
          ref={mapContainerRef}
          className="h-96 w-full rounded-lg border border-gray-200"
          style={{ zIndex: 0 }}
        />
        
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-700">Carregando mapa...</p>
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Legenda</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Baixa urgência (&lt;25%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>Média urgência (25-50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Alta urgência (&gt;50%)</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 O tamanho do círculo representa o volume de atendimentos. Clique nos marcadores para mais detalhes.
        </p>
      </div>
    </div>
  );
};

export default EstabelecimentosMapa;

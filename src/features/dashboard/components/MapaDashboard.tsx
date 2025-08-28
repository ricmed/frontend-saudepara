import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CompactMapProviderSelector } from '../../maps/leaflet/components/CompactMapProviderSelector';
import { useMapProvider } from '../../maps/leaflet/contexts/MapProviderContext';
import { TILE_OPTIONS } from '../../maps/leaflet/config/tileProviders';

// Tipos para o componente
interface EstabelecimentoMapa {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  notificacoes: number;
  urgencia: 'baixa' | 'media' | 'alta' | 'critica';
  tipo: string;
  endereco?: string;
}

interface MapaDashboardProps {
  estabelecimentos: EstabelecimentoMapa[];
  center: { lat: number; lng: number };
  onEstabelecimentoClick?: (estabelecimento: EstabelecimentoMapa) => void;
}

const MapaDashboard: React.FC<MapaDashboardProps> = memo(({
  estabelecimentos,
  center,
  onEstabelecimentoClick
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null); // REF para controlar tile layer atual
  const [initialBoundsSet, setInitialBoundsSet] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Hook do provedor de mapas - usando contexto como no MapaContainer
  const { tileProvider } = useMapProvider(); // REMOVIDO currentProvider daqui

  // Função para obter cor baseada na urgência
  const getUrgenciaColor = useCallback((urgencia: EstabelecimentoMapa['urgencia']) => {
    switch (urgencia) {
      case 'critica': return '#ef4444'; // Vermelho
      case 'alta': return '#f97316';     // Laranja
      case 'media': return '#eab308';    // Amarelo
      case 'baixa': return '#22c55e';    // Verde
      default: return '#6b7280';         // Cinza
    }
  }, []);

  // Função para criar ícone customizado
  const createCustomIcon = useCallback((estabelecimento: EstabelecimentoMapa) => {
    const color = getUrgenciaColor(estabelecimento.urgencia);
    const textColor = estabelecimento.urgencia === 'media' ? '#000' : '#fff';
    const hasRadar = estabelecimento.urgencia === 'critica';

    return L.divIcon({
      html: `
        <div class="marker-container">
          <div class="marker-main" style="
            width: 32px;
            height: 32px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: ${textColor};
            cursor: pointer;
            position: relative;
            z-index: 1000;
          ">
            ${estabelecimento.notificacoes}
          </div>
          ${hasRadar ? `
            <div class="radar-pulse" style="
              position: absolute;
              top: -3px;
              left: -3px;
              width: 38px;
              height: 38px;
              border: 2px solid ${color};
              border-radius: 50%;
              opacity: 0.6;
              pointer-events: none;
            "></div>
          ` : ''}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: `dashboard-marker urgencia-${estabelecimento.urgencia}`
    });
  }, [getUrgenciaColor]);

  // Função para criar popup com informações detalhadas
  const createPopupContent = useCallback((estabelecimento: EstabelecimentoMapa) => {
    const urgenciaTexto = {
      'critica': 'Crítica',
      'alta': 'Alta',
      'media': 'Média',
      'baixa': 'Baixa'
    }[estabelecimento.urgencia];

    const urgenciaColor = getUrgenciaColor(estabelecimento.urgencia);

    return `
      <div class="popup-dashboard-content">
        <div class="popup-header">
          <div class="urgencia-indicator" style="background: ${urgenciaColor};"></div>
          <h3 class="estabelecimento-nome">${estabelecimento.nome}</h3>
        </div>
        
        <div class="popup-body">
          <div class="badges-container">
            <span class="badge badge-notificacoes" style="
              background: ${urgenciaColor}; 
              color: ${estabelecimento.urgencia === 'media' ? '#000' : '#fff'};
            ">
              ${estabelecimento.notificacoes} notificações
            </span>
            <span class="badge badge-urgencia">
              Urgência ${urgenciaTexto}
            </span>
          </div>

          ${estabelecimento.endereco ? `
            <p class="endereco-info">📍 ${estabelecimento.endereco}</p>
          ` : ''}

          <p class="tipo-info">🏥 ${estabelecimento.tipo}</p>
        </div>

        <div class="popup-footer">
          Clique no ✕ para fechar
        </div>
      </div>
    `;
  }, [getUrgenciaColor]);

  // Memoizar a função de clique
  const handleEstabelecimentoClick = useCallback((estabelecimento: EstabelecimentoMapa) => {
    console.log('🎯 Clique no marcador:', estabelecimento.nome);
    onEstabelecimentoClick?.(estabelecimento);
  }, [onEstabelecimentoClick]);

  // ✅ Função de radar corrigida - recebe o mapa e adiciona ao mapa
  const createRadarAnimation = useCallback((
    map: L.Map,
    latlng: [number, number],
    color: string,
    severity: 'low' | 'medium' | 'high'
  ) => {
    const radiusConfig = {
      low: { maxRadius: 20, duration: 3000 },
      medium: { maxRadius: 30, duration: 2000 },
      high: { maxRadius: 40, duration: 1500 }
    };
    const config = radiusConfig[severity];
    const waves: L.Circle[] = [];

    for (let i = 0; i < 3; i++) {
      const wave = L.circle(latlng, {
        radius: 0,
        fillColor: color,
        color,
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.2
      }).addTo(map); // 👈 agora adiciona ao mapa
      waves.push(wave);

      setTimeout(() => {
        let currentRadius = 0;
        let opacity = 0.8;
        const animate = () => {
          currentRadius += config.maxRadius / 60;
          opacity -= 0.8 / 60;
          if (currentRadius < config.maxRadius && opacity > 0) {
            wave.setRadius(currentRadius);
            wave.setStyle({ opacity, fillOpacity: opacity * 0.25 });
            requestAnimationFrame(animate);
          } else {
            currentRadius = 0;
            opacity = 0.8;
            setTimeout(animate, 500);
          }
        };
        animate();
      }, i * 500);
    }

    // retorno para permitir cleanup
    return () => waves.forEach(w => map.removeLayer(w));
  }, []);

  // Inicializar mapa apenas uma vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current || isMapReady) return;

    console.log('🗺️ Inicializando MapaDashboard...');

    // Criar mapa
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
      closePopupOnClick: false
    });

    // Adicionar tile layer inicial
    const initialTileLayer = L.tileLayer(tileProvider.url, {
      attribution: tileProvider.attribution,
      maxZoom: tileProvider.maxZoom,
      minZoom: 3,
      ...TILE_OPTIONS,
    });
    
    initialTileLayer.addTo(map);
    currentTileLayerRef.current = initialTileLayer; // GUARDAR REFERÊNCIA

    // Aguardar o mapa estar completamente carregado
    map.whenReady(() => {
      console.log('✅ MapaDashboard carregado e pronto');
      setIsMapReady(true);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        currentTileLayerRef.current = null; // LIMPAR REF
        setIsMapReady(false);
        setInitialBoundsSet(false);
      }
    };
  }, []); // Dependências vazias - só inicializa uma vez

  // VERSÃO CORRIGIDA - Atualizar tile layer quando o provedor mudar 
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    console.log('🔄 Dashboard: Atualizando tile layer para:', tileProvider.url);

    try {
      // MÉTODO MAIS DIRETO: Remover tile layer atual se existir
      if (currentTileLayerRef.current) {
        console.log('🗑️ Dashboard: Removendo tile layer atual');
        mapRef.current.removeLayer(currentTileLayerRef.current);
        currentTileLayerRef.current = null;
      }

      // Criar e adicionar novo tile layer IMEDIATAMENTE
      const newTileLayer = L.tileLayer(tileProvider.url, {
        attribution: tileProvider.attribution,
        maxZoom: tileProvider.maxZoom,
        minZoom: 3,
        ...TILE_OPTIONS,
      });
      
      console.log('✅ Dashboard: Adicionando novo tile layer');
      newTileLayer.addTo(mapRef.current);
      currentTileLayerRef.current = newTileLayer; // GUARDAR NOVA REFERÊNCIA
      
      // Forçar redraw - método simplificado igual ao MapaContainer
      mapRef.current.invalidateSize();
      
    } catch (error) {
      console.error('❌ Dashboard: Erro ao atualizar tile layer:', error);
    }
  }, [tileProvider.url, tileProvider.attribution, tileProvider.maxZoom, isMapReady]); // DEPENDÊNCIAS SIMPLIFICADAS

  // Gerenciar marcadores - apenas quando estabelecimentos mudam ou mapa é inicializado
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    console.log('🏥 Atualizando marcadores do dashboard:', estabelecimentos.length);

    // Limpar marcadores existentes
    markersRef.current.forEach(marker => {
      mapRef.current!.removeLayer(marker);
    });
    markersRef.current = [];

    // Array para cleanup das ondas de radar
    const cleanupWaves: Array<() => void> = [];

    // Adicionar novos marcadores
    estabelecimentos.forEach((estabelecimento) => {
      const icon = createCustomIcon(estabelecimento);
      
      const marker = L.marker([estabelecimento.lat, estabelecimento.lng], {
        icon,
        riseOnHover: true
      }).addTo(mapRef.current!);

      // ✅ Adicionar radar para casos críticos
      if (estabelecimento.urgencia === 'critica') {
        const color = getUrgenciaColor(estabelecimento.urgencia);
        const severity = estabelecimento.notificacoes > 10 ? 'high' : 
                        estabelecimento.notificacoes > 5 ? 'medium' : 'low';
        
        const stopRadar = createRadarAnimation(
          mapRef.current!, 
          [estabelecimento.lat, estabelecimento.lng], 
          color, 
          severity
        );
        cleanupWaves.push(stopRadar);
      }

      // Tooltip simples no hover
      marker.bindTooltip(estabelecimento.nome, {
        direction: 'top',
        offset: [0, -20],
        opacity: 0.9,
        sticky: true
      });

      // Criar popup
      const popupContent = createPopupContent(estabelecimento);
      const popup = L.popup({
        maxWidth: 350,
        minWidth: 300,
        closeButton: true,
        autoClose: false,
        closeOnClick: false,
        closeOnEscapeKey: true,
        keepInView: true,
        autoPan: true,
        className: 'dashboard-popup-fixed'
      }).setContent(popupContent);

      marker.bindPopup(popup);

      // Handler de clique otimizado
      marker.on('click', function(e) {
        // Prevenir propagação
        L.DomEvent.stopPropagation(e);
        
        // Fechar outros popups
        mapRef.current!.eachLayer(function(layer) {
          if (layer instanceof L.Marker && layer !== marker) {
            layer.closePopup();
          }
        });
        
        // Abrir popup
        marker.openPopup();
        handleEstabelecimentoClick(estabelecimento);
      });

      // Prevenir fechamento do popup quando clicar nele
      popup.on('add', function() {
        const popupElement = popup.getElement();
        if (popupElement) {
          L.DomEvent.disableClickPropagation(popupElement);
        }
      });

      markersRef.current.push(marker);
    });

    // Ajustar bounds apenas na primeira carga
    if (estabelecimentos.length > 0 && !initialBoundsSet && mapRef.current) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
      setInitialBoundsSet(true);
    }

    console.log('✅ Marcadores do dashboard atualizados:', markersRef.current.length);

    // ✅ Cleanup das ondas quando o componente desmontar ou marcadores mudarem
    return () => cleanupWaves.forEach(fn => fn());
  }, [estabelecimentos, createCustomIcon, createPopupContent, handleEstabelecimentoClick, isMapReady, createRadarAnimation, getUrgenciaColor]);

  return (
    <>
      <div className="relative w-full h-full">
        {/* Mapa */}
        <div
          ref={containerRef}
          className="w-full h-full relative"
          style={{ minHeight: '400px' }}
        />
        
        {/* Seletor de provedor de mapas */}
        <div className="absolute top-4 right-4 z-[1000]">
          <CompactMapProviderSelector />
        </div>
      </div>
      
      {/* CSS otimizado para popups */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes radar-pulse {
            0% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.2); opacity: 0.3; }
            100% { transform: scale(1.4); opacity: 0; }
          }

          .marker-container {
            position: relative;
          }

          .radar-pulse {
            animation: radar-pulse 2s infinite;
          }

          .dashboard-marker {
            transition: transform 0.2s ease;
            z-index: 1000 !important;
          }

          .dashboard-marker:hover {
            transform: scale(1.1);
            z-index: 1001 !important;
          }

          /* Popup fixo - CSS otimizado */
          .dashboard-popup-fixed {
            z-index: 2000 !important;
          }

          .dashboard-popup-fixed .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            background: white;
            padding: 0;
            border: 1px solid #e5e7eb;
          }

          .dashboard-popup-fixed .leaflet-popup-content {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            width: 300px !important;
            max-width: 350px;
            line-height: 1.5;
          }

          .dashboard-popup-fixed .leaflet-popup-tip {
            background: white;
            border: 1px solid #e5e7eb;
          }

          .dashboard-popup-fixed .leaflet-popup-close-button {
            color: #6b7280;
            font-size: 20px;
            font-weight: bold;
            padding: 8px;
            right: 8px;
            top: 8px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: all 0.2s;
          }

          .dashboard-popup-fixed .leaflet-popup-close-button:hover {
            color: #374151;
            background-color: #f3f4f6;
          }

          /* Conteúdo do popup */
          .popup-dashboard-content {
            padding: 20px;
            font-size: 14px;
            color: #374151;
          }

          .popup-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
          }

          .urgencia-indicator {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            flex-shrink: 0;
          }

          .estabelecimento-nome {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.3;
            word-wrap: break-word;
            flex: 1;
          }

          .popup-body {
            margin-bottom: 16px;
          }

          .badges-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
          }

          .badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
          }

          .badge-urgencia {
            background: #f3f4f6;
            color: #374151;
          }

          .endereco-info, .tipo-info {
            margin: 8px 0;
            font-size: 13px;
            color: #6b7280;
            line-height: 1.4;
            word-wrap: break-word;
          }

          .popup-footer {
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            font-size: 11px;
            color: #9ca3af;
            text-align: center;
          }

          /* Sombras por urgência */
          .urgencia-critica .marker-main {
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          }

          .urgencia-alta .marker-main {
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
          }

          .urgencia-media .marker-main {
            box-shadow: 0 4px 12px rgba(234, 179, 8, 0.4);
          }

          .urgencia-baixa .marker-main {
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
          }
        `
      }} />
    </>
  );
});

MapaDashboard.displayName = 'MapaDashboard';

export { MapaDashboard };
export default MapaDashboard;
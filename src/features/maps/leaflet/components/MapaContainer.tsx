import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Local, LatLngLiteral } from '../types';
import { TILE_OPTIONS } from '../config/tileProviders';
import { useMapProvider } from '../contexts/MapProviderContext';
import { getPrimeiraQualificacaoCOP30 } from '../utils/qualificacoesCOP30';

// Fix para ícones do Leaflet no Webpack/Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Configurar ícones padrão do Leaflet
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapaContainerProps {
  center: LatLngLiteral;
  userLocation: LatLngLiteral | null;
  filteredPlaces: Local[];
  selectedMarker: Local | null;
  visibleCount: number;
  qualificacaoSelecionada?: string;
  onMapLoad: (map: L.Map) => void;
  onMapIdle: () => void;
  onMarkerClick: (local: Local) => void;
  onInfoWindowClose: () => void;
}

export const MapaContainer: React.FC<MapaContainerProps> = ({
  center,
  userLocation,
  filteredPlaces,
  selectedMarker,
  visibleCount,
  qualificacaoSelecionada,
  onMapLoad,
  onMapIdle,
  onMarkerClick,
  onInfoWindowClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(6);

  // Hook para gerenciar provedor de mapa
  const { tileProvider } = useMapProvider();

  // Função para abreviar nomes longos
  const abreviarNome = (nome: string, maxLength: number = 25): string => {
    if (nome.length <= maxLength) return nome;
    
    // Tentar abreviar por palavras
    const palavras = nome.split(' ');
    if (palavras.length > 3) {
      // Pegar primeira palavra + iniciais das do meio + última
      const primeira = palavras[0];
      const ultima = palavras[palavras.length - 1];
      const meio = palavras.slice(1, -1).map(p => p[0]).join('.');
      return `${primeira} ${meio}. ${ultima}`;
    }
    
    // Se ainda for longo, truncar com reticências
    return nome.substring(0, maxLength) + '...';
  };

  // Inicializar mapa uma única vez
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    console.log('🗺️ Inicializando mapa Leaflet...');

    try {
      // Configurações otimizadas para COP 30 - 60k usuários
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: 6,
        zoomControl: false,  // Removido para reposicionar
        attributionControl: true,
        // OTIMIZAÇÃO 1: Performance melhorada para eventos grandes
        preferCanvas: true,        // Usa Canvas ao invés de SVG - muito mais rápido
        maxZoom: 18,              // Limita zoom máximo para reduzir tiles
        zoomSnap: 0.5,            // Zoom mais suave
        worldCopyJump: false,     // Desabilita duplicação de mundo
        maxBounds: [              // Limita área para o Brasil
          [-35, -75],             // Sudoeste
          [10, -30]               // Nordeste
        ],
        maxBoundsViscosity: 0.8,  // Resistência para sair dos limites
      });

      // Adicionar controle de zoom no canto inferior direito
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      // OTIMIZAÇÃO 2 & 3: Tile provider inicial (será atualizado pelo useEffect separado)
      const initialTileLayer = L.tileLayer(tileProvider.url, {
        attribution: tileProvider.attribution,
        maxZoom: tileProvider.maxZoom,
        minZoom: 3,
        ...TILE_OPTIONS, // Configurações de cache agressivo
      });
      
      initialTileLayer.addTo(map);
      
      // Listener para recarregar marcadores quando o mapa se move (lazy loading)
      map.on('moveend', () => {
        if (isMapLoaded) {
          onMapIdle();
          // Força atualização dos marcadores baseado nos novos bounds
          // Os marcadores serão atualizados automaticamente pelo useEffect dos filteredPlaces
        }
      });

      // Event listeners otimizados para COP 30
      map.on('zoomend', () => {
        if (isMapLoaded) {
          setCurrentZoom(map.getZoom());
          onMapIdle();
        }
      });
      
      map.on('click', () => {
        if (popupRef.current) {
          map.closePopup(popupRef.current);
          onInfoWindowClose();
        }
      });

      // Aguardar o mapa estar completamente carregado
      map.whenReady(() => {
        console.log('✅ Mapa Leaflet carregado e pronto');
        setIsMapReady(true);
        setIsMapLoaded(true);
        onMapLoad(map);
      });

      mapRef.current = map;
    } catch (error) {
      console.error('❌ Erro ao inicializar mapa:', error);
    }

    return () => {
      if (mapRef.current) {
        console.log('🧹 Limpando mapa Leaflet...');
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapReady(false);
        setIsMapLoaded(false);
      }
    };
  }, []); // Dependências vazias - inicializar apenas uma vez

  // Atualizar centro do mapa (com segurança)
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    try {
      const currentCenter = mapRef.current.getCenter();
      const newCenter = L.latLng(center.lat, center.lng);
      
      // Só atualizar se o centro mudou significativamente (mais de 1km)
      if (currentCenter.distanceTo(newCenter) > 1000) {
        console.log('📍 Atualizando centro do mapa:', center);
        mapRef.current.setView([center.lat, center.lng], mapRef.current.getZoom());
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar centro do mapa:', error);
    }
  }, [center.lat, center.lng, isMapReady]); // Dependências específicas

  // Atualizar tile layer quando o provedor de mapa mudar - FORÇA ATUALIZAÇÃO INSTANTÂNEA
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    try {
      console.log('🔄 Atualizando tile layer para:', tileProvider.url);
      console.log('📍 Provider atual:', tileProvider);
      
      // Remover todas as camadas de tile existentes
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          console.log('🗑️ Removendo tile layer existente');
          mapRef.current!.removeLayer(layer);
        }
      });

      // Aguardar um tick para garantir que as camadas foram removidas
      setTimeout(() => {
        if (!mapRef.current) return;
        
        // Adicionar nova camada de tile
        const newTileLayer = L.tileLayer(tileProvider.url, {
          attribution: tileProvider.attribution,
          maxZoom: tileProvider.maxZoom,
          minZoom: 3,
          ...TILE_OPTIONS, // Configurações de cache agressivo
        });
        
        console.log('✅ Adicionando novo tile layer:', newTileLayer);
        newTileLayer.addTo(mapRef.current);
        
        // Forçar redraw do mapa
        mapRef.current.invalidateSize();
        
      }, 50); // Pequeno delay para garantir limpeza
      
    } catch (error) {
      console.error('❌ Erro ao atualizar tile layer:', error);
    }
  }, [tileProvider.url, tileProvider.attribution, tileProvider.maxZoom, isMapReady]); // Dependências mais específicas

  // Gerenciar marcador do usuário e centralizar mapa na primeira vez
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    try {
      // Remover marcador anterior
      if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }

      // Adicionar novo marcador do usuário
      if (userLocation) {
        const userIcon = L.divIcon({
          html: `
            <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
              <!-- Pin vermelho estilo Google Maps -->
              <path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.7 23.3 0 15 0z" 
                    fill="#EA4335" 
                    stroke="white" 
                    stroke-width="2"/>
              <!-- Círculo branco interno -->
              <circle cx="15" cy="15" r="7" fill="white"/>
              <!-- Ponto vermelho central -->
              <circle cx="15" cy="15" r="4" fill="#EA4335"/>
            </svg>
          `,
          iconSize: [30, 42],
          iconAnchor: [15, 42],
          popupAnchor: [0, -42],
          className: 'user-location-marker'
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 10000  // Z-index muito alto para garantir que fique acima de tudo
        }).addTo(mapRef.current);

        userMarkerRef.current.bindTooltip('Você está aqui', {
          permanent: false,
          direction: 'top',
          offset: [0, -45],
          className: 'user-location-tooltip'
        });

        // Centralizar o mapa na localização do usuário com zoom adequado (13 para ver os rótulos)
        mapRef.current.setView([userLocation.lat, userLocation.lng], 13, {
          animate: true,
          duration: 1
        });
        
        setCurrentZoom(13); // Atualizar o zoom atual

        console.log('📍 Marcador do usuário adicionado e mapa centralizado:', userLocation);
      }
    } catch (error) {
      console.error('❌ Erro ao gerenciar marcador do usuário:', error);
    }
  }, [userLocation?.lat, userLocation?.lng, isMapReady]); // Dependências específicas

  // Gerenciar marcadores dos estabelecimentos
  // OTIMIZAÇÃO: Carregar todos os estabelecimentos filtrados (sem limitação por bounds)
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    try {
      console.log('🏥 Atualizando marcadores dos estabelecimentos:', filteredPlaces.length);

      // Limpar marcadores existentes
      markersRef.current.forEach(marker => {
        mapRef.current!.removeLayer(marker);
      });
      markersRef.current = [];

      // ALTERAÇÃO: Carregar TODOS os estabelecimentos filtrados (não apenas os no bounds)
      // Filtrar apenas estabelecimentos com coordenadas válidas
      const validPlaces = filteredPlaces.filter(local => {
        // Verificar se o estabelecimento tem coordenadas válidas
        if (!local.lat || !local.lng || local.lat === 0 || local.lng === 0) {
          return false;
        }
        return true;
      });

      // Limitar apenas pelo visibleCount para performance
      const visiblePlaces = validPlaces.slice(0, visibleCount);
      
      console.log(`🔍 Debug: ${filteredPlaces.length} total, ${validPlaces.length} com coordenadas válidas, ${visiblePlaces.length} renderizados`);
      
      visiblePlaces.forEach((local, index) => {
        console.log(`🏥 Estabelecimento ${index}:`, {
          nome: local.nome,
          lat: local.lat,
          lng: local.lng,
          qualificacoes: local.qualificacoes
        });

        // Buscar configuração da qualificação COP 30
        // Se uma qualificação específica está selecionada, usar ela
        // Senão, usar a primeira qualificação COP 30 do estabelecimento
        let qualConfig;
        
        if (qualificacaoSelecionada && 
            qualificacaoSelecionada !== "todas" && 
            qualificacaoSelecionada !== "Todas as Qualificações") {
          // Buscar a configuração da qualificação selecionada
          qualConfig = getPrimeiraQualificacaoCOP30([qualificacaoSelecionada]);
        } else {
          // Usar a primeira qualificação do estabelecimento
          qualConfig = getPrimeiraQualificacaoCOP30(local.qualificacoes);
        }
        
        // Se encontrou qualificação COP 30, usar suas cores e letra
        // Senão, usar configuração padrão
        const markerColor = qualConfig?.cor || '#999999';
        const textColor = qualConfig?.textColor || '#FFFFFF';
        const markerLetra = qualConfig?.letra || '?';
        
        // Debug para primeiro item
        if (index === 0) {
          console.log(`🎨 Configuração do marcador - ${local.nome}:`, {
            qualificacoes: local.qualificacoes,
            qualificacaoSelecionada,
            qualConfig,
            cor: markerColor,
            letra: markerLetra
          });
        }
        
        const markerIcon = L.divIcon({
          html: `
            <div style="
              width: 30px;
              height: 30px;
              background: ${markerColor};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              font-weight: bold;
              color: ${textColor};
              cursor: pointer;
            ">
              ${markerLetra}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          className: `estabelecimento-marker qualificacao-cop30`
        });

        const marker = L.marker([local.lat, local.lng], {
          icon: markerIcon,
          riseOnHover: true
        }).addTo(mapRef.current!);

        // Rótulo permanente que aparece em zoom >= 13
        const nomeAbreviado = abreviarNome(local.nome, 20);
        const labelHtml = `
          <div style="
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(4px);
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 500;
            color: #1a1a1a;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1);
            border: 0.5px solid rgba(0,0,0,0.08);
            letter-spacing: 0.2px;
            line-height: 1.2;
            z-index: 500;
            position: relative;
          ">${nomeAbreviado}</div>
        `;
        
        marker.bindTooltip(labelHtml, {
          permanent: currentZoom >= 13, // Mostrar permanente apenas em zoom alto
          direction: 'top',
          offset: [0, -30],
          opacity: 1,
          className: 'label-tooltip-modern'
        });

        // Tooltip completo no hover (sempre disponível)
        marker.on('mouseover', () => {
          // Elevar z-index do marcador para ficar acima de tudo (exceto pin do usuário)
          marker.setZIndexOffset(9900);
          
          marker.unbindTooltip();
          marker.bindTooltip(local.nome, {
            permanent: false,
            direction: 'top',
            offset: [0, -20],
            opacity: 0.9,
            className: 'tooltip-hover-active'
          }).openTooltip();
        });

        marker.on('mouseout', () => {
          // Voltar z-index normal
          marker.setZIndexOffset(0);
          
          marker.unbindTooltip();
          marker.bindTooltip(labelHtml, {
            permanent: currentZoom >= 13,
            direction: 'top',
            offset: [0, -30],
            opacity: 1,
            className: 'label-tooltip-modern'
          });
        });

        // Click handler
        marker.on('click', (e) => {
          e.originalEvent?.stopPropagation();
          onMarkerClick(local);
        });

        markersRef.current.push(marker);
      });

      console.log('✅ Marcadores dos estabelecimentos atualizados:', markersRef.current.length);
    } catch (error) {
      console.error('❌ Erro ao gerenciar marcadores dos estabelecimentos:', error);
    }
  }, [filteredPlaces, visibleCount, qualificacaoSelecionada, currentZoom, isMapReady]); // Adiciona currentZoom

  // Gerenciar popup do marcador selecionado
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    try {
      // Fechar popup anterior
      if (popupRef.current) {
        mapRef.current.closePopup(popupRef.current);
        popupRef.current = null;
      }

      // Abrir novo popup se houver marcador selecionado
      if (selectedMarker) {
        console.log('📍 Abrindo popup para:', selectedMarker.nome);

        const popupContent = createPopupContent(selectedMarker);
        
        popupRef.current = L.popup({
          maxWidth: 300,
          minWidth: 250,
          closeButton: true,
          autoClose: false,
          closeOnClick: false,
          className: 'estabelecimento-popup'
        })
          .setLatLng([selectedMarker.lat, selectedMarker.lng])
          .setContent(popupContent)
          .openOn(mapRef.current);

        // Event listener para fechar popup
        popupRef.current.on('remove', onInfoWindowClose);
      }
    } catch (error) {
      console.error('❌ Erro ao gerenciar popup:', error);
    }
  }, [selectedMarker?.id, isMapReady]); // Dependência específica no ID

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* Loading indicator */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando mapa...</p>
          </div>
        </div>
      )}
      
      {/* Legenda antiga público/privado - TEMPORARIAMENTE DESABILITADA (será reativada após COP30) */}
      {/* {isMapReady && (
        <div className="absolute bottom-4 left-4 bg-white p-2 sm:p-3 rounded-lg shadow-lg z-[500] max-w-[180px] sm:max-w-xs">
          <h4 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-800">Legenda</h4>
          <div className="space-y-1 sm:space-y-2 text-xs">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full border-2 border-white shadow flex items-center justify-center">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-gray-700 text-xs">Sua localização</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
                P
              </div>
              <span className="text-gray-700 text-xs">Estabelecimento Público</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded-full border-2 border-white shadow flex items-center justify-center text-black text-xs font-bold">
                V
              </div>
              <span className="text-gray-700 text-xs">Estabelecimento Privado</span>
            </div>
          </div>
        </div>
      )} */}

      {/* Estilo CSS adicional */}
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        .leaflet-popup-content {
          margin: 8px 12px;
          line-height: 1.4;
        }
        .estabelecimento-popup .leaflet-popup-close-button {
          font-size: 18px;
          padding: 4px;
        }
        .user-location-tooltip {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          padding: 4px 8px;
        }
        .estabelecimento-marker:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
};

// Função para criar conteúdo do popup - SIMPLIFICADO (somente navegação)
const createPopupContent = (local: Local): HTMLElement => {
  const container = document.createElement('div');
  container.className = 'estabelecimento-popup-content';
  
  // Debug: log dos dados do local
  console.log('🔍 Criando popup para estabelecimento:', {
    nome: local.nome,
    endereco: local.endereco,
    natureza: local.natureza,
    turno: local.turno,
    habilitacoes: local.habilitacoes,
    qualificacoes: local.qualificacoes,
    cnes: local.cnes
  });
  
  
  // CÓDIGO DE DETECÇÃO PÚBLICO/PRIVADO - TEMPORARIAMENTE DESABILITADO (será reativado após COP30)
  // const naturezaLower = local.natureza?.toLowerCase() || '';
  // const isPublic = naturezaLower.includes('público') || 
  //                  naturezaLower.includes('publico') ||
  //                  naturezaLower.includes('municipal') ||
  //                  naturezaLower.includes('estadual') ||
  //                  naturezaLower.includes('federal');
  
  // Limitar habilitações e qualificações mostradas no popup
  const maxItems = 3;
  const habilitacoesLimitadas = local.habilitacoes.slice(0, maxItems);
  const qualificacoesLimitadas = local.qualificacoes.slice(0, maxItems);
  
  container.innerHTML = `
    <div class="space-y-3">
      <div>
        <h3 class="text-base font-semibold text-gray-900 mb-1 leading-tight">${local.nome}</h3>
        ${local.endereco ? `<p class="text-sm text-gray-600 mb-2">📍 ${local.endereco}</p>` : ''}
      </div>
      
      <div class="space-y-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ${local.natureza || 'Não informado'}
          </span>
          ${local.turno && local.turno !== 'Não informado' ? `
            <span class="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              ${local.turno}
            </span>
          ` : ''}
        </div>
        
        ${habilitacoesLimitadas.length > 0 ? `
          <div class="text-sm">
            <div class="font-medium text-gray-700 mb-1">Habilitações:</div>
            <div class="space-y-1">
              ${habilitacoesLimitadas.map(hab => 
                `<div class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">• ${hab}</div>`
              ).join('')}
              ${local.habilitacoes.length > maxItems ? 
                `<div class="text-xs text-gray-500">+ ${local.habilitacoes.length - maxItems} mais...</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        ${qualificacoesLimitadas.length > 0 ? `
          <div class="text-sm">
            <div class="font-medium text-gray-700 mb-1">Qualificações:</div>
            <div class="space-y-1">
              ${qualificacoesLimitadas.map(qual => 
                `<div class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">• ${qual}</div>`
              ).join('')}
              ${local.qualificacoes.length > maxItems ? 
                `<div class="text-xs text-gray-500">+ ${local.qualificacoes.length - maxItems} mais...</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        ${local.cnes ? `
          <div class="text-xs text-gray-600">
            <strong>CNES:</strong> ${local.cnes}
          </div>
        ` : ''}
        
        ${local.cnes ? `
          <div class="text-sm text-gray-600">
            <strong>CNES:</strong> ${local.cnes}
          </div>
        ` : ''}
      </div>
      
      <div class="mt-3 pt-3 border-t border-gray-200">
        <h4 class="text-sm font-medium text-gray-800 mb-2">Navegue até aqui:</h4>
        <div class="flex gap-2">
          <button
            id="btn-google-maps-${local.id}"
            class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle fill="#fff" cx="12" cy="9" r="2.5"/>
            </svg>
            Google
          </button>
          <button
            id="btn-waze-${local.id}"
            class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-cyan-500 text-white text-xs rounded-md hover:bg-cyan-600 transition-colors font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 10.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5-.7-1.5-1.5-1.5-1.5.7-1.5 1.5zm3 0c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5-.7-1.5-1.5-1.5-1.5.7-1.5 1.5z"/>
            </svg>
            Waze
          </button>
          <button
            id="btn-apple-maps-${local.id}"
            class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 text-white text-xs rounded-md hover:bg-gray-800 transition-colors font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              <circle fill="#fff" cx="12" cy="9" r="1.5"/>
            </svg>
            Apple
          </button>
        </div>
      </div>
    </div>
  `;

  // Event listeners para os botões (com timeout para garantir que DOM esteja pronto)
  setTimeout(() => {
    const btnGoogleMaps = container.querySelector(`#btn-google-maps-${local.id}`) as HTMLButtonElement;
    const btnWaze = container.querySelector(`#btn-waze-${local.id}`) as HTMLButtonElement;
    const btnAppleMaps = container.querySelector(`#btn-apple-maps-${local.id}`) as HTMLButtonElement;

    if (btnGoogleMaps) {
      btnGoogleMaps.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirNoGoogleMaps(local);
      });
    }

    if (btnWaze) {
      btnWaze.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirNoWaze(local);
      });
    }

    if (btnAppleMaps) {
      btnAppleMaps.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirNoAppleMaps(local);
      });
    }
  }, 100);

  return container;
};

// Funções para abrir em diferentes apps de navegação
const abrirNoGoogleMaps = (local: Local) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${local.lat},${local.lng}&destination_place_id=${encodeURIComponent(local.nome)}`;
  
  if (isMobile) {
    window.open(url, '_system');
  } else {
    window.open(url, '_blank');
  }
};

const abrirNoWaze = (local: Local) => {
  const url = `https://waze.com/ul?ll=${local.lat},${local.lng}&navigate=yes&zoom=17`;
  window.open(url, '_blank');
};

const abrirNoAppleMaps = (local: Local) => {
  const url = `http://maps.apple.com/?daddr=${local.lat},${local.lng}&dirflg=d`;
  window.open(url, '_blank');
};

export default MapaContainer;
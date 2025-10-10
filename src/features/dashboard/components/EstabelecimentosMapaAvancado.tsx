import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  MapPin, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info,
  AlertTriangle,
  Activity,
  Building
} from 'lucide-react';

// Importar componentes do sistema de mapas existente
import MapaDashboard from './MapaDashboard';
import { useEstabelecimentos } from '../../maps/leaflet/hooks/useEstabelecimentos';
import { MapProviderProvider } from '../../maps/leaflet/contexts/MapProviderContext';
import { Local } from '../../maps/leaflet/types';
// 🚨 Importar função para verificar hipóteses alarmantes (compulsórias)
import { findRuleByHypothesis } from '../config/vigilancia.config';
// 🆕 Importar modal de detalhes
import EstabelecimentoDetailModal from './EstabelecimentoDetailModal';

interface EstabelecimentoInfo {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  notificacoes: number;
  urgencia: 'baixa' | 'media' | 'alta' | 'critica';
  tipo: string;
  endereco?: string;
  originalLocal: Local;
  temNotificacaoCompulsoria?: boolean; // 🚨 Flag para notificação compulsória
}

interface EstabelecimentosMapaAvancadoProps {
  notificacoes: any[];
  exportOptions?: any; // 🆕 Adicionar exportOptions para acessar hipóteses
}

const EstabelecimentosMapaAvancado: React.FC<EstabelecimentosMapaAvancadoProps> = memo(({ 
  notificacoes = [],
  exportOptions = {} // 🆕 Receber exportOptions
}) => {
  const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoInfo[]>([]);
  const [selectedEstabelecimento, setSelectedEstabelecimento] = useState<EstabelecimentoInfo | null>(null);
  const [showLayers, setShowLayers] = useState(true);
  
  // Usar o hook do sistema de mapas existente
  const { allPlaces, isLoading, carregarEstabelecimentos } = useEstabelecimentos();

  // Debug logs reduzidos - apenas quando necessário
  const debugInfo = useMemo(() => ({
    allPlaces: allPlaces.length,
    isLoading,
    estabelecimentos: estabelecimentos.length,
    notificacoes: notificacoes.length
  }), [allPlaces.length, isLoading, estabelecimentos.length, notificacoes.length]);

  // Carregar estabelecimentos apenas uma vez
  useEffect(() => {
    if (allPlaces.length === 0 && !isLoading) {
      console.log('🔄 Carregando estabelecimentos para o mapa...');
      carregarEstabelecimentos();
    }
  }, []); // Dependências vazias - carrega apenas uma vez

  // ⏰ AUTO-REFRESH: Recarregar dados a cada 30 segundos
  useEffect(() => {
    console.log('⏰ Configurando auto-refresh do mapa (30s)...');
    
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refresh do mapa ativado');
      carregarEstabelecimentos();
    }, 30000); // 30 segundos

    return () => {
      console.log('⏹️ Limpando auto-refresh do mapa');
      clearInterval(intervalId);
    };
  }, [carregarEstabelecimentos]);

  // Memoizar o mapa de estabelecimentos para evitar recriações
  const allPlacesMap = useMemo(() => {
    if (!allPlaces || allPlaces.length === 0) return new Map();
    
    const placesMap = new Map<string, typeof allPlaces[0]>();
    
    allPlaces.forEach(lugar => {
      placesMap.set(String(lugar.id), lugar);
      if (lugar.cnes && lugar.cnes !== String(lugar.id)) {
        placesMap.set(lugar.cnes, lugar);
      }
      if ((lugar as any).idestabelecimento) {
        placesMap.set(String((lugar as any).idestabelecimento), lugar);
      }
    });
    
    return placesMap;
  }, [allPlaces]);

  // Memoizar IDs das notificações
  const idsNotificacoes = useMemo(() => {
    return notificacoes
      .map(n => n?.original?.estabelecimento_idestabelecimento || n?.estabelecimentoId)
      .filter(Boolean);
  }, [notificacoes]);

  // Processar estabelecimentos de forma memoizada
  const estabelecimentosProcessados = useMemo(() => {
    if (allPlacesMap.size === 0 || notificacoes.length === 0) {
      return [];
    }

    const estabelecimentosMap = new Map<string, EstabelecimentoInfo>();
    
    notificacoes.forEach((notificacao) => {
      const estabelecimentoId = notificacao?.original?.estabelecimento_idestabelecimento ||
                               notificacao?.estabelecimentoId;
      
      // 🚨 Verificar se é notificação compulsória (hipótese diagnóstica alarmante)
      let isCompulsoria = false;
      
      // Método 1: Verificar se já vem marcado como alarmante
      if (notificacao?.isAlarmante === true || notificacao?.original?.isAlarmante === true) {
        isCompulsoria = true;
      }
      
      // Método 2: Verificar a hipótese diagnóstica usando GVS rules
      if (!isCompulsoria && exportOptions?.hipoteseDiagOptions?.length > 0) {
        const hipoteseId = notificacao?.original?.tipo_hipotese_diag_idtipo_hipotese_diag;
        if (hipoteseId) {
          const hipotese = exportOptions.hipoteseDiagOptions.find(
            (h: any) => String(h.idtipo_hipotese_diag) === String(hipoteseId)
          );
          if (hipotese?.descricao) {
            const match = findRuleByHypothesis(hipotese.descricao);
            isCompulsoria = !!match && match.rule.priority === 'critical';
            
            if (isCompulsoria) {
              console.log(`🚨 NOTIFICAÇÃO COMPULSÓRIA DETECTADA: ${hipotese.descricao} no estabelecimento ID ${estabelecimentoId}`);
            }
          }
        }
      }
      
      if (estabelecimentoId) {
        const idStr = String(estabelecimentoId);
        const lugarInfo = allPlacesMap.get(idStr);
        
        if (lugarInfo) {
          if (estabelecimentosMap.has(idStr)) {
            const est = estabelecimentosMap.get(idStr)!;
            est.notificacoes += 1;
            // Marcar se tem pelo menos uma compulsória
            if (isCompulsoria) {
              est.temNotificacaoCompulsoria = true;
            }
          } else {
            const estabelecimentoInfo: EstabelecimentoInfo = {
              id: idStr,
              nome: lugarInfo.nome,
              latitude: lugarInfo.lat,
              longitude: lugarInfo.lng,
              notificacoes: 1,
              urgencia: 'baixa',
              tipo: lugarInfo.natureza || 'hospital',
              endereco: lugarInfo.endereco,
              originalLocal: lugarInfo,
              temNotificacaoCompulsoria: isCompulsoria
            };
            estabelecimentosMap.set(idStr, estabelecimentoInfo);
          }
          
          // 🎯 Recalcular urgência - THRESHOLDS AJUSTADOS PARA CÍRIO DE NAZARÉ
          const est = estabelecimentosMap.get(idStr)!;
          
          // 🚨 PRIORIDADE: Se tem notificação compulsória, É SEMPRE CRÍTICO
          if (est.temNotificacaoCompulsoria) {
            est.urgencia = 'critica';
            console.log(`🔴 Estabelecimento ${est.nome} marcado como CRÍTICO por notificação compulsória`);
          } 
          // Senão, avaliar por quantidade (thresholds maiores para o Círio)
          else if (est.notificacoes >= 100) {
            est.urgencia = 'critica';
          } else if (est.notificacoes >= 50) {
            est.urgencia = 'alta';
          } else if (est.notificacoes >= 30) {
            est.urgencia = 'media';
          } else if (est.notificacoes >= 10) {
            est.urgencia = 'baixa';
          } else {
            est.urgencia = 'baixa';
          }
        }
      }
    });

    return Array.from(estabelecimentosMap.values());
  }, [allPlacesMap, notificacoes]);

  // Atualizar estado apenas quando dados processados mudarem
  useEffect(() => {
    if (JSON.stringify(estabelecimentos) !== JSON.stringify(estabelecimentosProcessados)) {
      setEstabelecimentos(estabelecimentosProcessados);
      console.log(`✅ Estabelecimentos atualizados: ${estabelecimentosProcessados.length}`);
    }
  }, [estabelecimentosProcessados, estabelecimentos]);

  // Converter para formato do mapa de forma memoizada
  const estabelecimentosParaMapa = useMemo(() => {
    return estabelecimentos.map(est => ({
      id: est.id,
      nome: est.nome,
      lat: est.latitude,
      lng: est.longitude,
      notificacoes: est.notificacoes,
      urgencia: est.urgencia,
      tipo: est.tipo,
      endereco: est.endereco,
      temNotificacaoCompulsoria: est.temNotificacaoCompulsoria // 🚨 Passar flag de compulsória
    }));
  }, [estabelecimentos]);

  // Funções memoizadas
  const getUrgenciaColor = useCallback((urgencia: EstabelecimentoInfo['urgencia']) => {
    switch (urgencia) {
      case 'critica': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const getUrgenciaText = useCallback((urgencia: EstabelecimentoInfo['urgencia']) => {
    switch (urgencia) {
      case 'critica': return 'Crítica';
      case 'alta': return 'Alta';
      case 'media': return 'Média';
      case 'baixa': return 'Baixa';
      default: return 'Indefinida';
    }
  }, []);

  // Handler de clique memoizado - 🆕 Abre o modal de detalhes
  const handleEstabelecimentoClick = useCallback((estabelecimentoMapa: any) => {
    const estInfo = estabelecimentos.find(e => e.id === estabelecimentoMapa.id);
    if (estInfo) {
      console.log('🏥 Estabelecimento clicado:', estInfo.nome);
      setSelectedEstabelecimento(estInfo);
    }
  }, [estabelecimentos]);

  // Handlers de UI memoizados
  const toggleLayers = useCallback(() => {
    setShowLayers(prev => !prev);
  }, []);

  const closeSelectedEstabelecimento = useCallback(() => {
    setSelectedEstabelecimento(null);
  }, []);

  // Estatísticas memoizadas
  const estatisticas = useMemo(() => ({
    baixa: estabelecimentos.filter(e => e.urgencia === 'baixa').length,
    media: estabelecimentos.filter(e => e.urgencia === 'media').length,
    alta: estabelecimentos.filter(e => e.urgencia === 'alta').length,
    critica: estabelecimentos.filter(e => e.urgencia === 'critica').length
  }), [estabelecimentos]);

  return (
    <MapProviderProvider defaultProvider="openstreetmap">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Mapa de Estabelecimentos
              </h2>
              <p className="text-sm text-gray-600">
                {estabelecimentos.length} estabelecimentos com notificações • {allPlaces.length} total no sistema
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLayers}
              className={`p-2 rounded transition-colors ${
                showLayers ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              title="Alternar legenda"
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Área do Mapa Dashboard Customizado */}
        <div className="h-96 relative" style={{ minHeight: '400px' }}>
          <MapaDashboard
            estabelecimentos={estabelecimentosParaMapa}
            center={{ lat: -1.4558, lng: -48.4902 }}
            onEstabelecimentoClick={handleEstabelecimentoClick}
          />
        </div>

        {/* Legenda */}
        {showLayers && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-4 z-20 border">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">Legenda de Urgência</span>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-md"></div>
                <span className="text-gray-700">Baixa (1-2 casos)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow-md"></div>
                <span className="text-gray-700">Média (3-4 casos)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-md"></div>
                <span className="text-gray-700">Alta (5-9 casos)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md"></div>
                <span className="text-gray-700">Crítica (10+ casos)</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
              Clique nos marcadores para mais informações
            </div>
          </div>
        )}

        {/* Painel de informações do estabelecimento selecionado */}
        {selectedEstabelecimento && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-xl p-5 z-20 max-w-sm border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getUrgenciaColor(selectedEstabelecimento.urgencia)}`}></div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  {selectedEstabelecimento.nome}
                </h3>
              </div>
              <button
                onClick={closeSelectedEstabelecimento}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{selectedEstabelecimento.notificacoes} notificações registradas</span>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <AlertTriangle className="h-4 w-4 text-gray-600" />
                <span className="flex items-center gap-2">
                  Nível de urgência: 
                  <span className={`px-2 py-0.5 rounded-full text-xs text-white font-medium
                                   ${getUrgenciaColor(selectedEstabelecimento.urgencia)}`}>
                    {getUrgenciaText(selectedEstabelecimento.urgencia)}
                  </span>
                </span>
              </div>
              
              {selectedEstabelecimento.endereco && (
                <div className="flex items-start gap-3 p-2 bg-green-50 rounded">
                  <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-gray-700 text-xs">
                    {selectedEstabelecimento.endereco}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200 text-center">
              <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                Ver detalhes completos →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resumo estatístico */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {estatisticas.baixa}
            </div>
            <div className="text-xs text-gray-600">Baixa Urgência</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {estatisticas.media}
            </div>
            <div className="text-xs text-gray-600">Média Urgência</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {estatisticas.alta}
            </div>
            <div className="text-xs text-gray-600">Alta Urgência</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {estatisticas.critica}
            </div>
            <div className="text-xs text-gray-600">Urgência Crítica</div>
          </div>
        </div>
      </div>
    </div>
    
    {/* 🆕 Modal de Detalhes do Estabelecimento */}
    {selectedEstabelecimento && (
      <EstabelecimentoDetailModal
        estabelecimento={{
          id: selectedEstabelecimento.id,
          nome: selectedEstabelecimento.nome,
          notificacoes: selectedEstabelecimento.notificacoes,
          urgencia: selectedEstabelecimento.urgencia,
          endereco: selectedEstabelecimento.endereco,
          tipo: selectedEstabelecimento.tipo,
          temNotificacaoCompulsoria: selectedEstabelecimento.temNotificacaoCompulsoria
        }}
        notificacoes={notificacoes}
        exportOptions={exportOptions}
        onClose={closeSelectedEstabelecimento}
      />
    )}
    </MapProviderProvider>
  );
});

EstabelecimentosMapaAvancado.displayName = 'EstabelecimentosMapaAvancado';

export { EstabelecimentosMapaAvancado };
export default EstabelecimentosMapaAvancado;
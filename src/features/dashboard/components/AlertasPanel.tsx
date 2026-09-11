import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  X, 
  Bell, 
  CheckCircle,
  Info,
  ExternalLink,
  RotateCcw,
  Calendar
} from 'lucide-react';

// Configuração de vigilância epidemiológica conforme diretrizes do MS
import { 
  detectarAlertas
} from '../config/vigilancia.config';
import { getNotificacaoHipoteseNomes } from '../utils/hipotesesNotificacao';
import { STORAGE_KEYS, readJsonWithLegacy, removeWithLegacy } from '@/utils/storageKeys';

interface AlertaItem {
  id: string;
  tipo: 'critico' | 'alerta' | 'info';
  titulo: string;
  descricao: string;
  timestamp: Date;
  notificacaoId?: string;
  hipotese?: string;
  pacienteInfo?: string;
  estabelecimento?: string;
  requiresNotification?: boolean; // Notificação compulsória imediata
  legalBasis?: string; // Base legal (Portaria, etc.)
  // 🆕 NOVOS CAMPOS: Para múltiplos casos
  totalCasos?: number;
  casos?: Array<{
    id: string;
    pacienteNome?: string;
    pacienteIdade?: number;
    estabelecimento?: string;
    dataNotificacao?: Date;
    hipotese?: string;
    notificacaoId?: string; // 🆕 ID real da notificação para navegação
  }>;
  // 🆕 NOVO CAMPO: Recomendações específicas
  recomendacoes?: {
    prazoNotificacao?: string;
    orgaoNotificar?: string;
    acaoRecomendada?: string;
    acaoCampo?: string;
  };
}

interface AlertasPanelProps {
  notificacoes: any[];
  isGlobalFilterActive?: () => boolean;
}

export const AlertasPanel: React.FC<AlertasPanelProps> = ({ 
  notificacoes = [], 
  isGlobalFilterActive = () => false 
}) => {
  const SHOW_DISMISSED_LEGACY_KEY = 'alertas-show-dismissed';
  const DISMISSED_IDS_LEGACY_KEY = 'alertas-dismissed-ids';
  const FILTER_TYPES_LEGACY_KEY = 'alertas-filtros-tipos';
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [alertasAtivos, setAlertasAtivos] = useState<AlertaItem[]>([]);

  // 🆕 NOVO: Seletor de data (padrão: primeira data disponível)
  const [dataSelecionada, setDataSelecionada] = useState<string>('');

  // 🆕 NOVO: Extrair datas disponíveis das notificações
  const datasDisponiveis = useMemo(() => {
    if (!notificacoes || notificacoes.length === 0) return [];

    const datas = new Set<string>();
    notificacoes.forEach((notif) => {
      const dataCreated = notif?.created_at || notif?.original?.created_at;
      if (dataCreated) {
        try {
          const dataLocal = new Date(dataCreated);
          const ano = dataLocal.getFullYear();
          const mes = (dataLocal.getMonth() + 1).toString().padStart(2, '0');
          const dia = dataLocal.getDate().toString().padStart(2, '0');
          const dataFormatada = `${ano}-${mes}-${dia}`;
          datas.add(dataFormatada);
        } catch (error) {
          console.warn('Erro ao processar data:', error);
        }
      }
    });

    return Array.from(datas).sort().reverse(); // Mais recente primeiro
  }, [notificacoes]);

  // 🆕 EFEITO: Pré-selecionar a data mais recente quando as datas estiverem disponíveis
  // 🔒 REGRA: Não pré-selecionar data se o filtro global estiver ativo
  useEffect(() => {
    if (isGlobalFilterActive && isGlobalFilterActive()) {
      // Filtro global ativo - limpar seleção de data individual
      if (dataSelecionada && dataSelecionada !== 'todas') {
        console.log('🔒 Filtro global ativo - limpando filtro de data individual do AlertasPanel');
        setDataSelecionada('todas');
      }
    } else {
      // Filtro global inativo - pode pré-selecionar data
      if (datasDisponiveis.length > 0 && !dataSelecionada) {
        setDataSelecionada(datasDisponiveis[0]); // Pré-selecionar a primeira (mais recente)
      }
    }
  }, [datasDisponiveis, dataSelecionada, isGlobalFilterActive]);

  // 🆕 NOVO: Filtrar notificações por data
  // 🔒 REGRA: Se o filtro global estiver ativo, ignorar filtro de data individual
  const notificacoesFiltradas = useMemo(() => {
    if (!notificacoes || notificacoes.length === 0) return [];
    
    // 🔒 PRIORIDADE 1: Se o filtro global estiver ativo, retornar todas as notificações recebidas
    // (elas já vêm filtradas pelo filtro global)
    if (isGlobalFilterActive && isGlobalFilterActive()) {
      console.log('🔒 Filtro global ativo - AlertasPanel usando notificações pré-filtradas:', notificacoes.length);
      return notificacoes;
    }
    
    // 🔓 PRIORIDADE 2: Filtro global inativo - aplicar filtro de data individual
    // Se for "todas", retornar todas as notificações
    if (dataSelecionada === 'todas' || !dataSelecionada) {
      console.log('📅 Nenhum filtro de data - AlertasPanel usando todas as notificações:', notificacoes.length);
      return notificacoes;
    }
    
    // Filtrar por data selecionada
    const filtradas = notificacoes.filter((notif) => {
      const dataCreated = notif?.created_at || notif?.original?.created_at;
      if (!dataCreated) return false;

      try {
        const dataLocal = new Date(dataCreated);
        const ano = dataLocal.getFullYear();
        const mes = (dataLocal.getMonth() + 1).toString().padStart(2, '0');
        const dia = dataLocal.getDate().toString().padStart(2, '0');
        const dataNotificacao = `${ano}-${mes}-${dia}`;
        
        return dataNotificacao === dataSelecionada;
      } catch (error) {
        return false;
      }
    });
    
    console.log(`📅 Filtro de data individual aplicado (${dataSelecionada}): ${notificacoes.length} → ${filtradas.length}`);
    return filtradas;
  }, [notificacoes, dataSelecionada, isGlobalFilterActive]);

  // Função para formatar data para exibição
  const formatarDataParaExibicao = useCallback((dataISO: string) => {
    if (!dataISO) return '';
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  // 🆕 FUNÇÃO: Converter idade de meses para anos (formatação correta)
  const formatarIdade = useCallback((idadeMeses: number | null | undefined): string => {
    if (idadeMeses === null || idadeMeses === undefined || idadeMeses < 0) {
      return 'Não informada';
    }

    // Se for menor que 12 meses, mostrar em meses
    if (idadeMeses < 12) {
      return `${idadeMeses} mês${idadeMeses !== 1 ? 'es' : ''}`;
    }

    // Para 12 meses ou mais, converter para anos (desconsiderando meses restantes)
    const anos = Math.floor(idadeMeses / 12);
    return `${anos} ano${anos !== 1 ? 's' : ''}`;
  }, []);
  
  // 🆕 ESTADO: Persistir se está mostrando dispensados ou ativos
  const [showDismissed, setShowDismissed] = useState<boolean>(() => {
    try {
      return readJsonWithLegacy<boolean>(
        STORAGE_KEYS.ui.alertsShowDismissed,
        false,
        [SHOW_DISMISSED_LEGACY_KEY]
      );
    } catch (error) {
      console.warn('Erro ao carregar estado show-dismissed:', error);
      return false;
    }
  });
  
  const [alertasDismissed, setAlertasDismissed] = useState<Set<string>>(() => {
    try {
      const dismissedIds = readJsonWithLegacy<string[]>(
        STORAGE_KEYS.ui.alertsDismissedIds,
        [],
        [DISMISSED_IDS_LEGACY_KEY]
      );
      return new Set(dismissedIds);
    } catch (error) {
      console.warn('Erro ao carregar alertas dispensados:', error);
      return new Set();
    }
  });

  // 🆕 EFEITO: Salvar estado showDismissed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ui.alertsShowDismissed, JSON.stringify(showDismissed));
    } catch (error) {
      console.warn('Erro ao salvar estado show-dismissed:', error);
    }
  }, [showDismissed]);

  // 🆕 EFEITO: Salvar alertas dispensados
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ui.alertsDismissedIds, JSON.stringify([...alertasDismissed]));
    } catch (error) {
      console.warn('Erro ao salvar alertas dispensados:', error);
    }
  }, [alertasDismissed]);
  
  // 🆕 NOVO: Sistema de filtros por tipo de alerta (com persistência)
  const [filtrosTipos, setFiltrosTipos] = useState<{
    critico: boolean;
    alerta: boolean;
    info: boolean;
  }>(() => {
    // Carregar filtros salvos do localStorage
    try {
      return readJsonWithLegacy(
        STORAGE_KEYS.ui.alertsFilterTypes,
        { critico: true, alerta: true, info: true },
        [FILTER_TYPES_LEGACY_KEY]
      );
    } catch (error) {
      console.warn('Erro ao carregar filtros salvos:', error);
    }
    // Estado padrão se não houver filtros salvos
    return {
      critico: true,
      alerta: true,
      info: true
    };
  });

  // 🆕 EFEITO: Salvar filtros no localStorage sempre que mudarem
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ui.alertsFilterTypes, JSON.stringify(filtrosTipos));
    } catch (error) {
      console.warn('Erro ao salvar filtros:', error);
    }
  }, [filtrosTipos]);

  // 🆕 ESTADOS: Modal de detalhes dos casos
  const [modalAberto, setModalAberto] = useState(false);
  const [alertaSelecionado, setAlertaSelecionado] = useState<AlertaItem | null>(null);

  // 🆕 FUNÇÃO: Alternar filtros por tipo
  const toggleFiltroTipo = useCallback((tipo: 'critico' | 'alerta' | 'info') => {
    setFiltrosTipos(prev => ({
      ...prev,
      [tipo]: !prev[tipo]
    }));
  }, []);

  // 🆕 FUNÇÃO: Ativar apenas um tipo de filtro
  const mostrarApenas = useCallback((tipo: 'critico' | 'alerta' | 'info') => {
    setFiltrosTipos({
      critico: tipo === 'critico',
      alerta: tipo === 'alerta', 
      info: tipo === 'info'
    });
  }, []);

  // 🆕 FUNÇÃO: Mostrar todos os tipos
  const mostrarTodos = useCallback(() => {
    setFiltrosTipos({
      critico: true,
      alerta: true,
      info: true
    });
  }, []);

  // 🆕 FUNÇÃO: Resetar todas as configurações dos alertas
  const resetarConfiguracoes = useCallback(() => {
    // Resetar filtros
    setFiltrosTipos({
      critico: true,
      alerta: true,
      info: true
    });
    // Resetar vista
    setShowDismissed(false);
    // Limpar alertas dispensados
    setAlertasDismissed(new Set());
    
    // Limpar localStorage
    try {
      removeWithLegacy(STORAGE_KEYS.ui.alertsFilterTypes, [FILTER_TYPES_LEGACY_KEY]);
      removeWithLegacy(STORAGE_KEYS.ui.alertsShowDismissed, [SHOW_DISMISSED_LEGACY_KEY]);
      removeWithLegacy(STORAGE_KEYS.ui.alertsDismissedIds, [DISMISSED_IDS_LEGACY_KEY]);
    } catch (error) {
      console.warn('Erro ao limpar configurações salvas:', error);
    }
  }, []);

  // 🆕 FUNÇÕES: Gerenciar modal de detalhes
  const abrirDetalhesAlerta = useCallback((alerta: AlertaItem) => {
    setAlertaSelecionado(alerta);
    setModalAberto(true);
  }, []);

  const fecharModal = useCallback(() => {
    setModalAberto(false);
    setAlertaSelecionado(null);
  }, []);

  const navegarParaFicha = useCallback((caso: any) => {
    console.log('🔍 DEBUG - Dados do caso para navegação:', caso);
    
    // 🔧 CORREÇÃO: Extrair ID corretamente do objeto caso
    let idNotificacao = null;
    
    // Tentar diferentes formas de obter o ID
    if (caso.notificacaoId) {
      idNotificacao = caso.notificacaoId;
    } else if (caso.id) {
      // Se o ID vier como string "caso-123", extrair apenas o número
      if (typeof caso.id === 'string' && caso.id.startsWith('caso-')) {
        idNotificacao = caso.id.replace('caso-', '');
      } else {
        idNotificacao = caso.id;
      }
    }
    
    console.log('🔍 DEBUG - ID extraído:', idNotificacao);
    
    // Garantir que temos um ID válido
    if (idNotificacao && !isNaN(Number(idNotificacao))) {
      const url = `/private/comunicacao-de-caso/editar/${idNotificacao}`;
      console.log('🚀 Navegando para:', url);
      navigate(url);
    } else {
      console.error('❌ ID da notificação inválido:', { caso, idNotificacao });
      alert('Erro: ID da notificação não encontrado ou inválido. Não é possível navegar para a ficha.');
    }
  }, [navigate]);

  // Processar alertas baseado nas notificações (FILTRADAS POR DATA)
  const processarAlertas = useCallback(() => {
    if (!notificacoesFiltradas || notificacoesFiltradas.length === 0) {
      setAlertas([]);
      return;
    }

    const novosAlertas: AlertaItem[] = [];

    // 🆕 AGRUPAMENTO: Agrupar casos por hipótese diagnóstica
    const casosAgrupados = new Map<string, Array<any>>();
    
    notificacoesFiltradas.forEach((notif) => {
      const hipoteseNome = getNotificacaoHipoteseNomes(notif)[0] || 'Não informado';

      if (!casosAgrupados.has(hipoteseNome)) {
        casosAgrupados.set(hipoteseNome, []);
      }
      casosAgrupados.get(hipoteseNome)!.push(notif);
    });

    // Usar o sistema de detecção configurado para identificar hipóteses críticas
    const alertasDetectados = detectarAlertas(notificacoesFiltradas);

    // 🆕 CRIAR ALERTAS AGRUPADOS POR HIPÓTESE
    casosAgrupados.forEach((casos, hipotese) => {
      if (casos.length === 0) return;
      
      // 🔧 IGNORAR hipóteses vazias ou inválidas
      if (!hipotese || hipotese === 'Não informado' || hipotese.trim() === '') return;

      // Verificar se há match nas regras GVS para determinar prioridade real
      const primeiroAlertaDetectado = detectarAlertas([casos[0]]).find(a => 
        a.dados?.doenca === hipotese || a.dados?.hipotese === hipotese
      );

      // 🔧 NOVO: Mostrar TODAS as hipóteses, independente de estarem no GVS
      let tipoAlerta: 'critico' | 'alerta' | 'info' = 'info'; // Padrão: info para hipóteses não catalogadas
      
      if (primeiroAlertaDetectado) {
        // Se estiver no GVS, usar a prioridade configurada
        tipoAlerta = primeiroAlertaDetectado.tipo === 'critico' ? 'critico' : 
                     primeiroAlertaDetectado.tipo === 'urgente' ? 'alerta' : 
                     primeiroAlertaDetectado.tipo === 'atencao' ? 'alerta' : 'info';
      }

      // 🔧 NOVO: Criar alerta para TODAS as hipóteses (não filtrar mais)
      if (casos.length > 0) {
        const casosDetalhados = casos.map((caso, index) => ({
          id: caso.idnotificacao || `caso-${index}`,
          pacienteNome: caso.paciente?.nome || 
                       caso.original?.paciente?.nome || 
                       `Paciente ${index + 1}`,
          pacienteIdade: caso.paciente?.idade || caso.original?.paciente?.idade,
          estabelecimento: caso.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento?.nome ||
                          caso.original?.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento?.nome ||
                          'Não informado',
          dataNotificacao: new Date(caso.created_at || caso.original?.created_at || Date.now()),
          hipotese: hipotese,
          // 🔧 CORREÇÃO: Garantir que temos o ID real da notificação
          notificacaoId: caso.idnotificacao || caso.id || caso.original?.idnotificacao || caso.original?.id
        }));

        const emojiPorTipo = {
          critico: '🚨',
          alerta: '⚠️',
          info: '📋'
        };

        const alertaItem: AlertaItem = {
          id: `agrupado-${hipotese.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          tipo: tipoAlerta,
          titulo: `${emojiPorTipo[tipoAlerta]} ${casos.length} CASO${casos.length > 1 ? 'S' : ''} DE ${hipotese.toUpperCase()}`,
          descricao: `Detectado${casos.length > 1 ? 's' : ''} ${casos.length} caso${casos.length > 1 ? 's' : ''} de ${hipotese}. ${
            casos.length > 1 ? 'Clique para ver detalhes de cada paciente.' : 'Caso único identificado.'
          }`,
          timestamp: new Date(),
          hipotese: hipotese,
          requiresNotification: tipoAlerta === 'critico',
          legalBasis: primeiroAlertaDetectado?.dados?.criterioLegal || (tipoAlerta === 'info' ? 'Monitoramento geral' : 'Portaria GM/MS nº 264/2020'),
          totalCasos: casos.length,
          casos: casosDetalhados,
          // 🆕 ADICIONAR: Dados das recomendações
          recomendacoes: {
            prazoNotificacao: primeiroAlertaDetectado?.dados?.prazoNotificacao || (tipoAlerta === 'info' ? 'Monitoramento contínuo' : undefined),
            orgaoNotificar: primeiroAlertaDetectado?.dados?.orgaoNotificar,
            acaoRecomendada: primeiroAlertaDetectado?.dados?.acaoRecomendada,
            acaoCampo: primeiroAlertaDetectado?.dados?.acaoCampo
          }
        };

        novosAlertas.push(alertaItem);
      }
    });

    // Adicionar outros alertas do sistema original (volume, concentração, etc.)
    alertasDetectados.forEach((alerta, index) => {
      // Pular alertas de hipóteses que já foram agrupados
      if (alerta.dados?.doenca && casosAgrupados.has(alerta.dados.doenca)) {
        return;
      }

      const alertaItem: AlertaItem = {
        id: `alerta-${index}-${Date.now()}`,
        tipo: alerta.tipo === 'critico' ? 'critico' : 
              alerta.tipo === 'urgente' ? 'alerta' : 'info',
        titulo: alerta.titulo,
        descricao: alerta.descricao,
        timestamp: new Date(),
        hipotese: alerta.dados?.hipotese,
        pacienteInfo: alerta.dados?.paciente,
        estabelecimento: alerta.dados?.estabelecimento,
        requiresNotification: alerta.dados?.criterioLegal?.includes('imediata'),
        legalBasis: alerta.dados?.criterioLegal || 'Portaria GM/MS nº 264/2020',
        // 🆕 ADICIONAR: Recomendações para alertas individuais
        recomendacoes: {
          prazoNotificacao: alerta.dados?.prazoNotificacao,
          orgaoNotificar: alerta.dados?.orgaoNotificar,
          acaoRecomendada: alerta.dados?.acaoRecomendada,
          acaoCampo: alerta.dados?.acaoCampo
        }
      };

      novosAlertas.push(alertaItem);
    });

    // Adicionar alertas de volume se houver muitos casos
    const totalNotificacoes = notificacoesFiltradas.length;
    if (totalNotificacoes > 50) {
      novosAlertas.push({
        id: `volume-${Date.now()}`,
        tipo: 'alerta',
        titulo: 'Volume Elevado de Notificações',
        descricao: `Detectadas ${totalNotificacoes} notificações. Monitoramento intensificado recomendado.`,
        timestamp: new Date(),
        legalBasis: 'Portaria GM/MS nº 264/2020'
      });
    }

    setAlertas(novosAlertas);
  }, [notificacoesFiltradas]);

  // Filtrar alertas ativos (não dismissed)
  useEffect(() => {
    const ativos = alertas.filter(alerta => !alertasDismissed.has(alerta.id));
    setAlertasAtivos(ativos);
  }, [alertas, alertasDismissed]);

  // Executar processamento quando notificações mudarem
  useEffect(() => {
    processarAlertas();
  }, [processarAlertas]);

  const dismissAlert = useCallback((alertaId: string) => {
    setAlertasDismissed(prev => new Set([...prev, alertaId]));
  }, []);

  const restoreAlert = useCallback((alertaId: string) => {
    setAlertasDismissed(prev => {
      const newSet = new Set(prev);
      newSet.delete(alertaId);
      return newSet;
    });
  }, []);

  const getAlertIcon = (tipo: AlertaItem['tipo']) => {
    switch (tipo) {
      case 'critico':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'alerta':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertBgColor = (tipo: AlertaItem['tipo']) => {
    switch (tipo) {
      case 'critico':
        return 'bg-red-50 border-red-200';
      case 'alerta':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const alertasParaExibir = showDismissed 
    ? alertas.filter(alerta => 
        alertasDismissed.has(alerta.id) && 
        filtrosTipos[alerta.tipo]
      )
    : alertasAtivos.filter(alerta => filtrosTipos[alerta.tipo]);

  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Sistema de Alertas Epidemiológicos
              </h2>
              {alertasAtivos.length > 0 && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  {alertasAtivos.filter(alerta => filtrosTipos[alerta.tipo]).length} ativo{alertasAtivos.filter(alerta => filtrosTipos[alerta.tipo]).length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDismissed(!showDismissed)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {showDismissed ? 'Ver Ativos' : 'Ver Dispensados'}
              </button>
              
              {/* 🆕 BOTÃO: Resetar Configurações */}
              <button
                onClick={resetarConfiguracoes}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors text-gray-600"
                title="Resetar todas as configurações dos alertas"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 🆕 NOVO: Seletor de Data */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            {/* 🔒 AVISO: Filtro Global Ativo */}
            {isGlobalFilterActive() && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <strong>Filtro Global de Período Ativo:</strong> Os alertas estão sendo filtrados pelo intervalo de datas definido no seletor de período do dashboard. O filtro de data individual está desabilitado.
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filtrar por data:</span>
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                  disabled={isGlobalFilterActive()}
                  className={`px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isGlobalFilterActive() 
                      ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                      : ''
                  }`}
                  title={isGlobalFilterActive() ? 'Seletor desabilitado: filtro global ativo no dashboard' : ''}
                >
                  <option value="todas">
                    {isGlobalFilterActive() ? '🔒 Filtro Global Ativo' : '📊 Todas as datas'}
                  </option>
                  {!isGlobalFilterActive() && datasDisponiveis.map((data) => (
                    <option key={data} value={data}>
                      📅 {formatarDataParaExibicao(data)}
                    </option>
                  ))}
                </select>
                
                {dataSelecionada && dataSelecionada !== 'todas' && !isGlobalFilterActive() && (
                  <span className="text-xs text-gray-600">
                    Mostrando: {formatarDataParaExibicao(dataSelecionada)}
                  </span>
                )}

                {!isGlobalFilterActive() && dataSelecionada === 'todas' && (
                  <span className="text-xs text-gray-600">
                    {notificacoes.length} notificações no total
                  </span>
                )}
                
                {isGlobalFilterActive() && (
                  <span className="text-xs text-blue-700 font-medium">
                    🔒 {notificacoes.length} notificações no período
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 🆕 SISTEMA DE FILTROS POR TIPO DE ALERTA */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Filtrar por tipo:</span>
                
                {/* Botão: Apenas Críticos */}
                <button
                  onClick={() => mostrarApenas('critico')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                    filtrosTipos.critico && !filtrosTipos.alerta && !filtrosTipos.info
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  <AlertCircle className="h-3 w-3" />
                  Apenas Críticos
                </button>

                {/* Botão: Apenas Alertas */}
                <button
                  onClick={() => mostrarApenas('alerta')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                    !filtrosTipos.critico && filtrosTipos.alerta && !filtrosTipos.info
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Apenas Alertas
                </button>

                {/* Botão: Apenas Informativos */}
                <button
                  onClick={() => mostrarApenas('info')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                    !filtrosTipos.critico && !filtrosTipos.alerta && filtrosTipos.info
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Info className="h-3 w-3" />
                  Apenas Informativos
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggles individuais */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFiltroTipo('critico')}
                    className={`p-1.5 rounded-md transition-colors ${
                      filtrosTipos.critico 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    title="Toggle alertas críticos"
                  >
                    <AlertCircle className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => toggleFiltroTipo('alerta')}
                    className={`p-1.5 rounded-md transition-colors ${
                      filtrosTipos.alerta 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    title="Toggle alertas de atenção"
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => toggleFiltroTipo('info')}
                    className={`p-1.5 rounded-md transition-colors ${
                      filtrosTipos.info 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    title="Toggle alertas informativos"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>

                {/* Botão: Mostrar Todos */}
                <button
                  onClick={mostrarTodos}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    filtrosTipos.critico && filtrosTipos.alerta && filtrosTipos.info
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  Todos
                </button>
              </div>
            </div>

            {/* Contador de alertas por tipo + indicador de persistência */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span>{alertasAtivos.filter(a => a.tipo === 'critico').length} críticos</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span>{alertasAtivos.filter(a => a.tipo === 'alerta').length} alertas</span>
                </div>
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3 text-blue-500" />
                  <span>{alertasAtivos.filter(a => a.tipo === 'info').length} informativos</span>
                </div>
              </div>
              
              {/* 🆕 INDICADOR: Configurações salvas */}
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Filtros salvos automaticamente</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {alertasParaExibir.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500">
                {showDismissed 
                  ? 'Nenhum alerta dispensado encontrado com os filtros atuais' 
                  : (alertasAtivos.length === 0 
                      ? 'Nenhum alerta ativo no momento'
                      : 'Nenhum alerta encontrado com os filtros selecionados'
                    )
                }
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {alertasAtivos.length > 0 && alertasParaExibir.length === 0 && !showDismissed
                  ? 'Tente ajustar os filtros para ver mais alertas'
                  : 'Sistema monitorando conforme Portaria GM/MS nº 264/2020'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertasParaExibir.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-4 rounded-lg border ${getAlertBgColor(alerta.tipo)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alerta.tipo)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">
                            {alerta.titulo}
                          </h3>
                          {alerta.requiresNotification && (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                              Notificação Compulsória
                            </span>
                          )}
                          {alerta.totalCasos && alerta.totalCasos > 1 && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                              {alerta.totalCasos} casos
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-2">
                          {alerta.descricao}
                        </p>

                        {/* 🆕 BOTÃO: Ver detalhes dos casos */}
                        {alerta.casos && alerta.casos.length > 0 && (
                          <button
                            onClick={() => abrirDetalhesAlerta(alerta)}
                            className="mb-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <Info className="h-3 w-3" />
                            Ver {alerta.casos.length} paciente{alerta.casos.length > 1 ? 's' : ''}
                          </button>
                        )}
                        
                        {(alerta.hipotese || alerta.pacienteInfo || alerta.estabelecimento) && (
                          <div className="bg-white/50 p-2 rounded text-xs space-y-1">
                            {alerta.hipotese && (
                              <div><strong>Hipótese:</strong> {alerta.hipotese}</div>
                            )}
                            {alerta.pacienteInfo && (
                              <div><strong>Paciente:</strong> {alerta.pacienteInfo}</div>
                            )}
                            {alerta.estabelecimento && (
                              <div><strong>Estabelecimento:</strong> {alerta.estabelecimento}</div>
                            )}
                          </div>
                        )}

                        {/* 🆕 SEÇÃO: Recomendações rápidas */}
                        {alerta.recomendacoes && (alerta.recomendacoes.acaoRecomendada || alerta.recomendacoes.prazoNotificacao) && (
                          <div className="bg-blue-50/50 border border-blue-200/30 p-2 rounded text-xs space-y-1 mt-2">
                            {alerta.recomendacoes.prazoNotificacao && (
                              <div className="text-blue-800">
                                <strong>📅 Prazo:</strong> {alerta.recomendacoes.prazoNotificacao}
                              </div>
                            )}
                            {alerta.recomendacoes.acaoRecomendada && (
                              <div className="text-blue-800">
                                <strong>⚕️ Ação:</strong> {alerta.recomendacoes.acaoRecomendada.length > 60 
                                  ? `${alerta.recomendacoes.acaoRecomendada.substring(0, 60)}...` 
                                  : alerta.recomendacoes.acaoRecomendada}
                              </div>
                            )}
                            {alerta.casos && alerta.casos.length > 0 && (
                              <div className="text-blue-600 text-xs mt-1">
                                ↗️ <em>Clique no botão "Ver pacientes" para mais detalhes</em>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alerta.timestamp.toLocaleString()}
                          </div>
                          {alerta.legalBasis && (
                            <div className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {alerta.legalBasis}
                            </div>
          )}
        </div>
      </div>

      {/* 🆕 MODAL: Detalhes dos múltiplos casos */}
      {modalAberto && alertaSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getAlertIcon(alertaSelecionado.tipo)}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Detalhes do Alerta
                    </h2>
                    <p className="text-sm text-gray-600">
                      {alertaSelecionado.hipotese} - {alertaSelecionado.totalCasos} caso{alertaSelecionado.totalCasos !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={fecharModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <p className="text-gray-700 mb-4">{alertaSelecionado.descricao}</p>
                
                {/* 🆕 INDICADOR: Tipo de alerta com cor correta */}
                <div className={`rounded-lg p-3 mb-4 ${
                  alertaSelecionado.tipo === 'critico' 
                    ? 'bg-red-50 border border-red-200' 
                    : alertaSelecionado.tipo === 'alerta'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className={`flex items-center gap-2 ${
                    alertaSelecionado.tipo === 'critico'
                      ? 'text-red-800'
                      : alertaSelecionado.tipo === 'alerta'
                        ? 'text-yellow-800'
                        : 'text-blue-800'
                  }`}>
                    {getAlertIcon(alertaSelecionado.tipo)}
                    <span className="font-medium">
                      {alertaSelecionado.tipo === 'critico' && 'Alerta Crítico - Notificação Imediata'}
                      {alertaSelecionado.tipo === 'alerta' && 'Alerta de Vigilância - Notificar em 24h'}
                      {alertaSelecionado.tipo === 'info' && 'Informativo - Monitoramento Contínuo'}
                    </span>
                  </div>
                  {alertaSelecionado.tipo === 'critico' && (
                    <p className="text-red-700 text-sm mt-1">
                      Doença de notificação compulsória imediata conforme Portaria GM/MS nº 264/2020
                    </p>
                  )}
                </div>
                
                {alertaSelecionado.requiresNotification && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Notificação Compulsória Imediata</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">
                      Base legal: {alertaSelecionado.legalBasis}
                    </p>
                  </div>
                )}

                {/* 🆕 SEÇÃO: Recomendações Específicas */}
                {alertaSelecionado.recomendacoes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Recomendações de Vigilância Epidemiológica
                    </h4>
                    
                    <div className="space-y-3 text-sm">
                      {alertaSelecionado.recomendacoes.prazoNotificacao && (
                        <div className="flex flex-col">
                          <span className="font-medium text-blue-800">📅 Prazo de Notificação:</span>
                          <span className="text-blue-700 ml-4">{alertaSelecionado.recomendacoes.prazoNotificacao}</span>
                        </div>
                      )}

                      {alertaSelecionado.recomendacoes.orgaoNotificar && (
                        <div className="flex flex-col">
                          <span className="font-medium text-blue-800">🏢 Órgãos a Notificar:</span>
                          <span className="text-blue-700 ml-4">{alertaSelecionado.recomendacoes.orgaoNotificar}</span>
                        </div>
                      )}

                      {alertaSelecionado.recomendacoes.acaoRecomendada && (
                        <div className="flex flex-col">
                          <span className="font-medium text-blue-800">⚕️ Ações Clínicas:</span>
                          <span className="text-blue-700 ml-4">{alertaSelecionado.recomendacoes.acaoRecomendada}</span>
                        </div>
                      )}

                      {alertaSelecionado.recomendacoes.acaoCampo && (
                        <div className="flex flex-col">
                          <span className="font-medium text-blue-800">🔍 Ações de Campo:</span>
                          <span className="text-blue-700 ml-4">{alertaSelecionado.recomendacoes.acaoCampo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de Casos */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Pacientes Identificados ({alertaSelecionado.casos?.length || 0})
                </h3>
                
                {alertaSelecionado.casos?.map((caso) => (
                  <div
                    key={caso.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {caso.pacienteNome}
                          </h4>
                          {caso.pacienteIdade !== null && caso.pacienteIdade !== undefined && (
                            <span className="text-sm text-gray-600">
                              {formatarIdade(caso.pacienteIdade)}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <strong>Estabelecimento:</strong> {caso.estabelecimento}
                          </div>
                          <div>
                            <strong>Data Notificação:</strong> {caso.dataNotificacao?.toLocaleDateString('pt-BR')}
                          </div>
                          <div className="md:col-span-2">
                            <strong>Hipótese:</strong> {caso.hipotese}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => navegarParaFicha(caso)}
                        className="ml-4 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                        title={`Navegar para ficha da notificação ${caso.notificacaoId || caso.id}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver Ficha
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {(!alertaSelecionado.casos || alertaSelecionado.casos.length === 0) && (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum detalhe de caso disponível</p>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Alerta gerado em: {alertaSelecionado.timestamp.toLocaleString('pt-BR')}
                </div>
                <button
                  onClick={fecharModal}
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>                    <div className="flex items-center gap-1 ml-2">
                      {showDismissed ? (
                        <button
                          onClick={() => restoreAlert(alerta.id)}
                          className="p-1 hover:bg-white/50 rounded transition-colors"
                          title="Restaurar alerta"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => dismissAlert(alerta.id)}
                          className="p-1 hover:bg-white/50 rounded transition-colors"
                          title="Dispensar alerta"
                        >
                          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {alertasAtivos.length > 0 && !showDismissed && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              <strong>Atenção:</strong> Alertas críticos requerem ação imediata conforme protocolo de vigilância epidemiológica.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertasPanel;

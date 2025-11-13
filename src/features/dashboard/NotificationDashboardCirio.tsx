import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import NotificacaoService from '@/services/NotificacaoService';
import DashboardExportMenu from '../../components/common/DashboardExportMenu';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LabelList,
  Dot,
} from "recharts";
import { findRuleByHypothesis } from './config/vigilancia.config';
import {
  User,
  Activity,
  FileText,
  AlertCircle,
  Clock,
  Filter,
  Download,
  ArrowLeft,
  RefreshCw,
  ClipboardList,
  Heart,
  Globe,
  ChevronDown,
  File,
  FileSearch2,
  FileImage,
  Info,
  Award,
  AlertTriangle,
  Bomb,
  BookOpen,
  BarChart2,
  PieChart as PieChartIcon,
  X,
  CheckSquare,
  Undo,
  Bookmark,
  ChevronRight,
  Layers,
  MousePointer,
  RotateCcw,
  Table,
  // Brain, // Temporariamente comentado
  Calendar
} from "lucide-react";

// 🆕 NOVOS IMPORTS: Componentes do dashboard aprimorado
import GeographicLocationPanel from './components/charts/GeographicLocationPanel';
import DashboardTabs, { useDashboardTabs } from './components/DashboardTabs';
// Componentes de IA temporariamente comentados - serão usados no futuro
// import AIInsights from './components/AIInsights';
// import AIChat from './components/AIChat';
// import AIAlerts from './components/AIAlerts';
// import AIGlobalConfig from './components/AIGlobalConfig';
import AtendimentosPorHoraChart from './components/AtendimentosPorHoraChart';
import EstabelecimentosMapaAvancado from './components/EstabelecimentosMapaAvancado';
import AlertasPanel from './components/AlertasPanel';
import PiramideEtariaChart from './components/charts/PiramideEtariaChart';
import DesfechoCasosChart from './components/charts/DesfechoCasosChart';
import EstabelecimentosCasosChart from './components/charts/EstabelecimentosCasosChart';
import DistribuicaoPublicoAtendidoChart from './components/charts/DistribuicaoPublicoAtendidoChart';
import DistribuicaoTipoAtendimentoChart from './components/charts/DistribuicaoTipoAtendimentoChart';
import DistribuicaoSexoChart from './components/charts/DistribuicaoSexoChart';
import DistribuicaoRacaCorChart from './components/charts/DistribuicaoRacaCorChart';
import PrincipaisSintomasChart from './components/charts/PrincipaisSintomasChart';
import TiposTraumaChart from './components/charts/TiposTraumaChart';
import HipotesesDiagnosticasChart from './components/charts/HipotesesDiagnosticasChart';
import SerieTemporalChart from './components/SerieTemporalChart';

// 🕐 NOVO: Hook e Componente para filtro de período personalizado
import useDashboardDateRangeFilter from './hooks/useDashboardTimeFilter';
import DateRangeSelector from './components/TimeRangeSelector';

// 🆕 SISTEMA DE EXPORTAÇÃO DISPONÍVEL:
// Para integrar exportação em um gráfico individual, importe:
import ChartExportMenu from '../../components/common/ChartExportMenu';
// E adicione como prop ou elemento ao lado do gráfico

// Funções de exportação para diferentes formatos
const exportChartAsPNG = (chartId: string, title: string): void => {
  const element = document.getElementById(chartId);
  if (!element) {
    alert('Elemento não encontrado!');
    return;
  }
  
  // Simulação de exportação para PNG
  console.log(`Exportando ${title} como PNG`);
  alert(`Exportação PNG simulada para: ${title}`);
};

const exportChartAsPDF = (chartId: string, title: string): void => {
  const element = document.getElementById(chartId);
  if (!element) {
    alert('Elemento não encontrado!');
    return;
  }
  
  // Simulação de exportação para PDF
  console.log(`Exportando ${title} como PDF`);
  alert(`Exportação PDF simulada para: ${title}`);
};

const exportChartAsWord = (chartId: string, data: ChartDataItem[], title: string): void => {
  const element = document.getElementById(chartId);
  if (!element) {
    alert('Elemento não encontrado!');
    return;
  }
  
  // Simulação de exportação para Word
  console.log(`Exportando ${title} como Word`);
  alert(`Exportação Word simulada para: ${title}`);
};

const exportChartAsCSV = (data: ChartDataItem[], title: string): void => {
  try {
    // Criar cabeçalhos
    const headers = ['Categoria', 'Valor'];
    
    // Criar linhas
    const rows = [
      headers.join(','),
      ...data.map(item => `"${item.name.replace(/"/g, '""')}",${item.value}`)
    ];
    
    // Juntar linhas
    const csvContent = rows.join('\n');
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    alert('Erro ao exportar CSV');
  }
};

// Interface para as props do componente GraphExportMenu
interface GraphExportMenuProps {
  chartId: string;
  chartType: string;
  chartData: ChartDataItem[];
  chartTitle: string;
}

// Componente de menu de exportação para cada gráfico
const GraphExportMenu: React.FC<GraphExportMenuProps> = ({ chartId, chartType, chartData, chartTitle }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const handleExport = (format: string) => {
    switch (format) {
      case 'png':
        exportChartAsPNG(chartId, chartTitle);
        break;
      case 'pdf':
        exportChartAsPDF(chartId, chartTitle);
        break;
      case 'word':
        exportChartAsWord(chartId, chartData, chartTitle);
        break;
      case 'csv':
        exportChartAsCSV(chartData, chartTitle);
        break;
      default:
        break;
    }
    setShowMenu(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
        title="Exportar gráfico"
      >
        <Download className="h-4 w-4" />
      </button>
      
      {showMenu && (
        <div className="absolute right-0 mt-1 bg-white rounded shadow-lg py-1 z-20 min-w-40">
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => handleExport('png')}
          >
            <FileImage className="h-4 w-4 text-green-500" />
            Exportar PNG
          </button>
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => handleExport('pdf')}
          >
            <FileSearch2 className="h-4 w-4 text-red-500" />
            Exportar PDF
          </button>
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => handleExport('word')}
          >
            <File className="h-4 w-4 text-blue-500" />
            Exportar Word
          </button>
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => handleExport('csv')}
          >
            <File className="h-4 w-4 text-gray-500" />
            Exportar CSV
          </button>
        </div>
      )}
    </div>
  );
};

// Cores padronizadas - voltando para a paleta original com tonalidades de azul
const COLORS = {
  primary: "#3b5bdb",
  secondary: "#e05297",
  accent: "#047481",
  neutral: "#374151",
  masculino: "#3b5bdb",
  feminino: "#e05297",
  ignorado: "#999999",
  // Paleta de azuis para os gráficos
  blue: [
    "#1a3cad", // Azul escuro
    "#2a49c4",
    "#3b5bdb",
    "#4c6cf1",
    "#5d7df7",
    "#7f96f9",
    "#a1affb",
    "#c2c9fd",
    "#e4e8fe", // Azul claro
  ],
  // Paleta mais diversificada para pizza/rosca, mas mantendo tons azuis
  pie: [
    "#1a3cad", // Azul escuro
    "#4c6cf1", // Azul médio
    "#7f96f9", // Azul claro
    "#5d7df7", // Azul brilhante
    "#2a49c4", // Azul royal
    "#3b5bdb", // Azul principal
    "#a1affb", // Azul lavanda
    "#c2c9fd", // Azul pastel
    "#e4e8fe", // Azul muito claro
  ],
  // Paleta específica para traumas - variações de vermelho
  trauma: [
    "#8B0000", // Vermelho escuro (DarkRed)
    "#DC143C", // Crimson
    "#B22222", // FireBrick
    "#CD5C5C", // IndianRed
    "#F08080", // LightCoral
    "#FA8072", // Salmon
    "#E9967A", // DarkSalmon
    "#FFA07A", // LightSalmon
    "#FFB6C1", // LightPink
  ],
  // Cores para os tipos de atendimento (mantendo tons azuis)
  atendimento: {
    clinico: "#4c6cf1",     // Azul médio
    trauma: "#FF6B6B",      // Vermelho (mantido para destaque)
    multiplas: "#665FDF",   // Roxo azulado
    qbrn: "#FF9A3C"         // Laranja (mantido para destaque)
  },
  // Cores para as hipóteses diagnósticas alarmantes
  alarmante: "#f44336",     // Vermelho para hipóteses alarmantes
  alerta: "#ff9800",        // Laranja para alertas
  medio: "#facc15",         // Amarelo para prioridade média
  normal: "#3b5bdb",        // Azul para casos normais
};

// Interface para as props do dashboard
interface DashboardProps {
  notificacoes?: any[]; // Lista de notificações da API
  exportOptions?: any; // Opções de exportação com os tipos/categorias
  onDataRefresh?: (newData: any[]) => void; // Callback para notificar sobre novos dados
}

// Define interface for chart data
interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
  isAlarmante?: boolean;
  original?: any; // Dado original para filtragem
}

// Interface para os tipos de notificações que serão exibidos nos cards
interface StatCounts {
  clinico: number;
  trauma: number;
  multiplas: number;
  qbrn: number;
}

const EnhancedNotificationDashboard: React.FC<DashboardProps> = ({
  notificacoes = [],
  exportOptions = {},
  onDataRefresh,
}) => {
  // Para controlar se já fizemos o processamento inicial
  const initialProcessingDone = useRef(false);
  const originalNotificacoes = useRef<any[]>([]);
  const filteredNotificacoes = useRef<any[]>([]);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const refreshDataRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  
  // Estado para controle de visualização
  const { activeTab, setActiveTab } = useDashboardTabs();

  // 🕐 NOVO: Hook para gerenciar o filtro de período personalizado
  const { 
    dateRangeConfig, 
    setDateRangeConfig, 
    filterNotificationsByDateRange,
    periodStart,
    periodEnd,
    resetToDefault: resetDateRange,
    isGlobalFilterActive
  } = useDashboardDateRangeFilter();

  // 🆕 Inicializar selectedPublicos com todos os públicos quando as opções carregarem
  useEffect(() => {
    if (exportOptions?.publicoOptions?.length > 0 && 
        (!dateRangeConfig.selectedPublicos || dateRangeConfig.selectedPublicos.length === 0)) {
      const todosPublicos = exportOptions.publicoOptions.map((p: any) => p.idtipo_publico);
      setDateRangeConfig({
        ...dateRangeConfig,
        selectedPublicos: todosPublicos
      });
    }
  }, [exportOptions?.publicoOptions, setDateRangeConfig]); // ✅ Corrigido: removido dateRangeConfig da dependência

  // 🆕 Inicializar selectedEstabelecimentos com todos os estabelecimentos quando as opções carregarem
  useEffect(() => {
    if (exportOptions?.estabelecimentoOptions?.length > 0 && 
        (!dateRangeConfig.selectedEstabelecimentos || dateRangeConfig.selectedEstabelecimentos.length === 0)) {
      const todosEstabelecimentos = exportOptions.estabelecimentoOptions.map((e: any) => e.idestabelecimento);
      setDateRangeConfig({
        ...dateRangeConfig,
        selectedEstabelecimentos: todosEstabelecimentos
      });
    }
  }, [exportOptions?.estabelecimentoOptions, setDateRangeConfig]); // ✅ Corrigido: removido dateRangeConfig da dependência

  // 🚫 LIMPAR FILTRO DE DATA INDIVIDUAL QUANDO FILTRO GLOBAL FOR ATIVADO
  const isGlobalActive = useMemo(() => isGlobalFilterActive(), [isGlobalFilterActive]);
  useEffect(() => {
    if (isGlobalActive) {
      console.log('🔒 Filtro global ativado - limpando filtro de data individual');
      setSelectedDataNotificacao(null);
      setActiveFilters(prev => ({
        ...prev,
        dataNotificacao: null
      }));
    }
  }, [isGlobalActive]);

  // Estado para filtragem interativa
  const [loading, setLoading] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState("Todos");
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleString());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(60); // 60 segundos = 1 minuto

  // 🆕 Ref para rastrear estado do Ctrl em tempo real
  const ctrlPressedRef = useRef(false);

  // 🆕 Listeners globais para rastrear Ctrl/Cmd
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = true;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 🆕 SISTEMA DE FILTROS CRUZADOS (CROSS-FILTER)
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({
    evento: null,
    tipoAtendimento: null,
    publico: null,
    genero: null,
    raca: null,
    escolaridade: null,
    unidade: null,
    hipotese: null,
    trauma: null,
    sintoma: null,
    faixaEtaria: null,
    desfecho: null,
    dataNotificacao: null, // 🆕 Novo filtro por data de criação da notificação
    // 🆕 NOVOS FILTROS PARA LOCALIZAÇÃO GEOGRÁFICA
    pais: null,
    estado: null,
    municipio: null,
    bairro: null
  });
  
  // 🆕 ESTADOS PARA FILTRO POR DATA DE NOTIFICAÇÃO
  const [selectedDataNotificacao, setSelectedDataNotificacao] = useState<string | null>(null);
  const [datasNotificacaoDisponiveis, setDatasNotificacaoDisponiveis] = useState<string[]>([]);
  const [totalNotificacoesDia, setTotalNotificacoesDia] = useState<number>(0);
  
  // Estado para controlar a exibição da ajuda
  const [showHelp, setShowHelp] = useState(false);
  
  // 🆕 Estado para controlar o modal de fichas
  const [showFichasModal, setShowFichasModal] = useState(false);
  
  // 🆕 Estado para controlar o modal de detalhes do paciente
  const [showPacienteModal, setShowPacienteModal] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);

  // Dados base do dashboard
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [statCounts, setStatCounts] = useState<StatCounts>({
    clinico: 0,
    trauma: 0,
    multiplas: 0,
    qbrn: 0
  });
  
  // Estado para os dados originais não filtrados
  const [originalRaca, setOriginalRaca] = useState<ChartDataItem[]>([]);
  const [originalEscolaridade, setOriginalEscolaridade] = useState<ChartDataItem[]>([]);
  const [originalUnidades, setOriginalUnidades] = useState<ChartDataItem[]>([]);
  const [originalSintomas, setOriginalSintomas] = useState<ChartDataItem[]>([]);
  const [originalTipoAtendimento, setOriginalTipoAtendimento] = useState<ChartDataItem[]>([]);
  const [originalPublico, setOriginalPublico] = useState<ChartDataItem[]>([]);
  const [originalHipoteses, setOriginalHipoteses] = useState<ChartDataItem[]>([]);
  const [originalTrauma, setOriginalTrauma] = useState<ChartDataItem[]>([]);
  const [originalGenero, setOriginalGenero] = useState<ChartDataItem[]>([]);
  
  // 🆕 ESTADOS PARA DADOS DE LOCALIZAÇÃO GEOGRÁFICA
  const [originalPais, setOriginalPais] = useState<ChartDataItem[]>([]);
  const [originalEstado, setOriginalEstado] = useState<ChartDataItem[]>([]);
  const [originalMunicipio, setOriginalMunicipio] = useState<ChartDataItem[]>([]);
  const [originalBairro, setOriginalBairro] = useState<ChartDataItem[]>([]);
  
  // Estado para os dados filtrados de cada categoria
  const [filteredRaca, setFilteredRaca] = useState<ChartDataItem[]>([]);
  const [filteredEscolaridade, setFilteredEscolaridade] = useState<ChartDataItem[]>([]);
  const [filteredUnidades, setFilteredUnidades] = useState<ChartDataItem[]>([]);
  const [filteredSintomas, setFilteredSintomas] = useState<ChartDataItem[]>([]);
  const [filteredTipoAtendimento, setFilteredTipoAtendimento] = useState<ChartDataItem[]>([]);
  const [filteredPublico, setFilteredPublico] = useState<ChartDataItem[]>([]);
  const [filteredHipoteses, setFilteredHipoteses] = useState<ChartDataItem[]>([]);
  const [filteredTrauma, setFilteredTrauma] = useState<ChartDataItem[]>([]);
  const [filteredGenero, setFilteredGenero] = useState<ChartDataItem[]>([]);
  
  // 🆕 ESTADOS PARA DADOS DE LOCALIZAÇÃO GEOGRÁFICA FILTRADOS
  const [filteredPais, setFilteredPais] = useState<ChartDataItem[]>([]);
  const [filteredEstado, setFilteredEstado] = useState<ChartDataItem[]>([]);
  const [filteredMunicipio, setFilteredMunicipio] = useState<ChartDataItem[]>([]);
  const [filteredBairro, setFilteredBairro] = useState<ChartDataItem[]>([]);
  
  // Mapeamentos de tipos de atendimento (serão inicializados com base nos dados)
  const [tipoAtendimentoMap, setTipoAtendimentoMap] = useState<Record<string, string>>({});

  // Mapeamento de descrições para identificadores de filtro
  const atendimentoToFilterKey: Record<string, string> = {
    'clinico': 'Clínico',
    'clínico': 'Clínico', 
    'trauma': 'Trauma',
    'multiplas': 'Múltiplas Vítimas',
    'múltiplas vítimas': 'Múltiplas Vítimas',
    'qbrn': 'Incidente QBRN',
    'incidente qbrn': 'Incidente QBRN'
  };

  // Função para obter a cor correta para cada tipo de atendimento
  const getAtendimentoColor = useCallback((tipoAtendimento: string): string => {
    const tipo = tipoAtendimento.toLowerCase();
    
    if (tipo.includes('clínico') || tipo.includes('clinico')) {
      return COLORS.atendimento.clinico;
    } else if (tipo.includes('trauma')) {
      return COLORS.atendimento.trauma;
    } else if (tipo.includes('múltiplas') || tipo.includes('multiplas')) {
      return COLORS.atendimento.multiplas;
    } else if (tipo.includes('qbrn') || tipo.includes('incidente q')) {
      return COLORS.atendimento.qbrn;
    }
    
    // Cor padrão se não encontrar correspondência
    return COLORS.blue[0];
  }, []);

  // 🕐 NOVO: FILTRAR NOTIFICAÇÕES PELO PERÍODO PERSONALIZADO (PRIMEIRO FILTRO)
  // Aplica o filtro de período ANTES de qualquer outro filtro
  const notificacoesFiltradasPorPeriodo = useMemo(() => {
    console.log(`🕐 Total de notificações originais: ${notificacoes.length}`);
    
    // Sempre usar o hook do filtro - ele decide internamente se filtra ou retorna todas
    const filtradas = filterNotificationsByDateRange(notificacoes);
    
    if (dateRangeConfig.enabled) {
      console.log(`🕐 Aplicando filtro de período personalizado`);
      console.log(`📅 De: ${periodStart.toLocaleString('pt-BR')}`);
      console.log(`📅 Até: ${periodEnd.toLocaleString('pt-BR')}`);
      console.log(`✅ Filtro de período aplicado: ${notificacoes.length} → ${filtradas.length} notificações`);
    } else {
      console.log(`🔓 Filtro de período desabilitado - usando todas as notificações: ${filtradas.length}`);
    }
    
    // Log das primeiras 3 notificações filtradas para debug
    if (filtradas.length > 0) {
      console.log(`🔍 Amostra de notificações após filtro de período:`);
      filtradas.slice(0, 3).forEach((n: any, i: number) => {
        console.log(`   ${i+1}. Evento: ${n.tipoEvento || n.original?.tipo_evento?.descricao}, Data: ${n.created_at}`);
      });
    }
    
    return filtradas;
  }, [notificacoes, dateRangeConfig, filterNotificationsByDateRange, periodStart, periodEnd]);

  // 🆕 FILTRAR NOTIFICAÇÕES PELO EVENTO SELECIONADO
  // IMPORTANTE: Deve vir antes de funções que dependem dele (ex: handleDataNotificacaoChange)
  const notificacoesFiltradasPorEvento = useMemo(() => {
    // Se "Todos" está selecionado, retornar todas as notificações (já filtradas por período)
    if (selectedEvento === "Todos") {
      console.log(`📊 Evento "Todos" selecionado - usando ${notificacoesFiltradasPorPeriodo.length} notificações`);
      return notificacoesFiltradasPorPeriodo;
    }

    // Filtrar pelo evento selecionado
    console.log(`🔍 Filtrando notificações pelo evento: "${selectedEvento}"`);
    
    const filtradas = notificacoesFiltradasPorPeriodo.filter((notificacao: any) => {
      // Buscar o nome do evento usando tipoEvento ou original.tipo_evento.descricao
      const eventoNome = notificacao.tipoEvento || 
                        notificacao.original?.tipo_evento?.descricao;
      
      return eventoNome === selectedEvento;
    });

    console.log(`✅ Filtro de evento aplicado: ${notificacoesFiltradasPorPeriodo.length} → ${filtradas.length} notificações`);
    return filtradas;
  }, [notificacoesFiltradasPorPeriodo, selectedEvento]);

  // 🆕 NOTIFICAÇÕES PARA ANÁLISE TEMPORAL (INDEPENDENTE DO FILTRO GLOBAL)
  // Filtra apenas por evento, ignorando o filtro de período
  const notificacoesParaAnalisetemporal = useMemo(() => {
    // Se "Todos" está selecionado, retornar todas as notificações originais (sem filtro de período)
    if (selectedEvento === "Todos") {
      console.log(`📊 Análise Temporal - Evento "Todos" selecionado - usando ${notificacoes.length} notificações (sem filtro de período)`);
      return notificacoes;
    }

    // Filtrar apenas pelo evento selecionado (ignorando período)
    console.log(`🔍 Análise Temporal - Filtrando notificações pelo evento: "${selectedEvento}" (sem filtro de período)`);
    
    const filtradas = notificacoes.filter((notificacao: any) => {
      // Buscar o nome do evento usando tipoEvento ou original.tipo_evento.descricao
      const eventoNome = notificacao.tipoEvento || 
                        notificacao.original?.tipo_evento?.descricao;
      
      return eventoNome === selectedEvento;
    });

    console.log(`✅ Análise Temporal - Filtro de evento aplicado: ${notificacoes.length} → ${filtradas.length} notificações (sem filtro de período)`);
    return filtradas;
  }, [notificacoes, selectedEvento]);
  
  // Função para obter a descrição de um tipo de atendimento pelo ID
  const getAtendimentoDescById = useCallback((idAtendimento: string | number): string => {
    // Se tipoAtendimentoMap já foi inicializado, usar diretamente
    if (Object.keys(tipoAtendimentoMap).length > 0) {
      return tipoAtendimentoMap[String(idAtendimento)] || "Desconhecido";
    }
    
    // Se não, tentar buscar nas opções
    if (exportOptions?.atendimentoOptions?.length > 0) {
      const atendimento = exportOptions.atendimentoOptions.find(
        (opt: any) => String(opt.idtipo_atendimento) === String(idAtendimento)
      );
      return atendimento?.descricao || "Desconhecido";
    }
    
    return "Desconhecido";
  }, [exportOptions, tipoAtendimentoMap]);

  // Inicializa o mapeamento de tipos de atendimento a partir das opções
  useEffect(() => {
    if (exportOptions?.atendimentoOptions?.length > 0) {
      const mapping: Record<string, string> = {};
      
      exportOptions.atendimentoOptions.forEach((opt: any) => {
        const id = String(opt.idtipo_atendimento);
        mapping[id] = opt.descricao;
      });
      
      setTipoAtendimentoMap(mapping);
    }
  }, [exportOptions]);

  // Função para verificar se uma notificação pertence a um tipo de atendimento específico
  const checkAtendimentoType = useCallback((notificacao: any, tipoDesc: string): boolean => {
    // Normalizar a descrição para comparação
    const tipoDescLower = tipoDesc.toLowerCase();
    
    // Verificar por ID
    const tipoId = notificacao?.original?.tipo_atendimento_idtipo_atendimento;
    if (tipoId !== undefined) {
      const desc = getAtendimentoDescById(tipoId);
      return desc.toLowerCase().includes(tipoDescLower);
    }
    
    // Verificar por descrição
    if (notificacao?.original?.tipo_atendimento?.descricao) {
      return notificacao.original.tipo_atendimento.descricao
        .toLowerCase()
        .includes(tipoDescLower);
    }
    
    // Verificar outros campos possíveis
    if (notificacao?.tipoAtendimento) {
      return notificacao.tipoAtendimento.toLowerCase().includes(tipoDescLower);
    }
    
    return false;
  }, [getAtendimentoDescById]);

  // Função para filtrar notificações
  const filtrarNotificacoes = useCallback((categoria: string | null): any[] => {
    // Se não houver categoria ou for "Todos", retornar todas as notificações originais
    if (!categoria || categoria === "Todos") {
      return originalNotificacoes.current;
    }
    
    // Normalizar a categoria para comparação
    const categoriaLower = categoria.toLowerCase();
    
    // Verificar se é um tipo de atendimento
    const tiposAtendimento = ["clínico", "trauma", "múltiplas vítimas", "incidente qbrn"];
    const isTipoAtendimento = tiposAtendimento.some(tipo => categoriaLower.includes(tipo));
    
    if (isTipoAtendimento) {
      // Filtrar por tipo de atendimento
      const resultado = originalNotificacoes.current.filter(n => checkAtendimentoType(n, categoriaLower));
      return resultado;
    }
    
    // Verificar se é um evento
    if (exportOptions?.eventoOptions?.length > 0) {
      const isEvento = exportOptions.eventoOptions.some(
        (e: any) => e.descricao.toLowerCase() === categoriaLower
      );
      
      if (isEvento) {
        // Filtrar por evento - verificar várias estruturas de dados possíveis
        const resultado = originalNotificacoes.current.filter(n => {
          // Verificar usando a estrutura esperada
          const eventoId = n?.original?.evento_idevento;
          if (eventoId !== undefined) {
            // Encontrar o evento correspondente por ID
            const eventoEncontrado = exportOptions.eventoOptions.find(
              (e: any) => {
                const matchId = String(e.idtipo_evento) === String(eventoId) || 
                               String(e.idevento) === String(eventoId);
                return matchId;
              }
            );
            
            if (eventoEncontrado && eventoEncontrado.descricao.toLowerCase() === categoriaLower) {
              return true;
            }
          }
          
          // Verificar diretamente por descrição do evento (caso o evento esteja embutido)
          if (n?.original?.evento?.descricao) {
            const match = n.original.evento.descricao.toLowerCase() === categoriaLower;
            if (match) return true;
          }
          
          // Verificar nome do evento diretamente
          if (n?.eventoNome) {
            const match = n.eventoNome.toLowerCase() === categoriaLower;
            if (match) return true;
          }
          
          // Verificar o campo evento_nome se existir
          if (n?.original?.evento_nome) {
            const match = n.original.evento_nome.toLowerCase() === categoriaLower;
            if (match) return true;
          }
          
          // Verificar em evento.nome se existir
          if (n?.original?.evento?.nome) {
            const match = n.original.evento.nome.toLowerCase() === categoriaLower;
            if (match) return true;
          }
          
          // Como último recurso, verificar no objeto JSON completo
          const notificacaoStr = JSON.stringify(n).toLowerCase();
          const containsEvento = notificacaoStr.includes(`"descricao":"${categoriaLower}"`) || 
                               notificacaoStr.includes(`"nome":"${categoriaLower}"`) ||
                               notificacaoStr.includes(`"evento_nome":"${categoriaLower}"`);
          
          return containsEvento;
        });
        
        return resultado;
      }
    }
    
    // Filtro genérico para outros tipos de categorias
    console.log(`Aplicando filtro genérico para: ${categoriaLower}`);
    const resultado = originalNotificacoes.current.filter(n => {
      // Tentar encontrar no objeto completo
      const notificacaoStr = JSON.stringify(n).toLowerCase();
      return notificacaoStr.includes(categoriaLower);
    });
    return resultado;
  }, [exportOptions, checkAtendimentoType]);

  // 🆕 FUNÇÃO PARA APLICAR FILTROS CRUZADOS (com suporte a seleção múltipla)
  const applyFilters = useCallback((notificacoes: any[], excludeCategory?: string) => {
    let filteredData = [...notificacoes];
    
    // Aplicar cada filtro ativo (exceto a categoria especificada)
    Object.entries(activeFilters).forEach(([category, filterValue]) => {
      // 🔧 CORREÇÃO: Pular a categoria que queremos excluir (para o próprio gráfico não se auto-filtrar)
      if (category === excludeCategory) {
        return; // Não aplicar este filtro
      }
      
      if (filterValue !== null && filterValue !== undefined) {
        switch (category) {
          case 'evento':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const eventoId = n?.original?.tipo_evento_idtipo_evento;
                if (eventoId !== undefined && exportOptions?.eventoOptions?.length > 0) {
                  const evento = exportOptions.eventoOptions.find(
                    (e: any) => String(e.idtipo_evento) === String(eventoId) || String(e.idevento) === String(eventoId)
                  );
                  return evento?.descricao && filterValue.includes(evento.descricao);
                }
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const eventoId = n?.original?.tipo_evento_idtipo_evento;
                if (eventoId !== undefined && exportOptions?.eventoOptions?.length > 0) {
                  const evento = exportOptions.eventoOptions.find(
                    (e: any) => String(e.idtipo_evento) === String(eventoId) || String(e.idevento) === String(eventoId)
                  );
                  return evento?.descricao === filterValue;
                }
                return false;
              });
            }
            break;
            
          case 'tipoAtendimento':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const tipoId = n?.original?.tipo_atendimento_idtipo_atendimento;
                const tipoDesc = getAtendimentoDescById(tipoId);
                return tipoDesc && filterValue.includes(tipoDesc);
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const tipoId = n?.original?.tipo_atendimento_idtipo_atendimento;
                const tipoDesc = getAtendimentoDescById(tipoId);
                return tipoDesc === filterValue;
              });
            }
            break;
            
          case 'publico':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const publicoId = n?.original?.tipo_publico_idtipo_publico;
                if (publicoId !== undefined && exportOptions?.publicoOptions?.length > 0) {
                  const publico = exportOptions.publicoOptions.find(
                    (p: any) => String(p.idtipo_publico) === String(publicoId)
                  );
                  return publico?.descricao && filterValue.includes(publico.descricao);
                }
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const publicoId = n?.original?.tipo_publico_idtipo_publico;
                if (publicoId !== undefined && exportOptions?.publicoOptions?.length > 0) {
                  const publico = exportOptions.publicoOptions.find(
                    (p: any) => String(p.idtipo_publico) === String(publicoId)
                  );
                  return publico?.descricao === filterValue;
                }
                return false;
              });
            }
            break;
            
          case 'genero':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const generoId = n?.original?.paciente?.tipo_genero_idtipo_genero;
                if (generoId !== undefined && exportOptions?.generoOptions?.length > 0) {
                  const genero = exportOptions.generoOptions.find(
                    (g: any) => String(g.idtipo_genero) === String(generoId)
                  );
                  return genero?.descricao && filterValue.includes(genero.descricao);
                }
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const generoId = n?.original?.paciente?.tipo_genero_idtipo_genero;
                if (generoId !== undefined && exportOptions?.generoOptions?.length > 0) {
                  const genero = exportOptions.generoOptions.find(
                    (g: any) => String(g.idtipo_genero) === String(generoId)
                  );
                  return genero?.descricao === filterValue;
                }
                return false;
              });
            }
            break;
            
          case 'raca':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const racaId = n?.original?.paciente?.tipo_raca_idtipo_raca;
                if (racaId !== undefined && exportOptions?.racaOptions?.length > 0) {
                  const raca = exportOptions.racaOptions.find(
                    (r: any) => String(r.idtipo_raca) === String(racaId)
                  );
                  return raca?.descricao && filterValue.includes(raca.descricao);
                }
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const racaId = n?.original?.paciente?.tipo_raca_idtipo_raca;
                if (racaId !== undefined && exportOptions?.racaOptions?.length > 0) {
                  const raca = exportOptions.racaOptions.find(
                    (r: any) => String(r.idtipo_raca) === String(racaId)
                  );
                  return raca?.descricao === filterValue;
                }
                return false;
              });
            }
            break;
            
          case 'escolaridade':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const escolaridadeId = n?.original?.paciente?.escolaridade_idescolaridade;
                if (escolaridadeId !== undefined && exportOptions?.escolaridadeOptions?.length > 0) {
                  const escolaridade = exportOptions.escolaridadeOptions.find(
                    (e: any) => String(e.idtipo_escolaridade) === String(escolaridadeId)
                  );
                  return escolaridade?.descricao && filterValue.includes(escolaridade.descricao);
                }
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const escolaridadeId = n?.original?.paciente?.escolaridade_idescolaridade;
                if (escolaridadeId !== undefined && exportOptions?.escolaridadeOptions?.length > 0) {
                  const escolaridade = exportOptions.escolaridadeOptions.find(
                    (e: any) => String(e.idtipo_escolaridade) === String(escolaridadeId)
                  );
                  return escolaridade?.descricao === filterValue;
                }
                return false;
              });
            }
            break;
            
          case 'unidade':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla: filtra se o valor estiver no array
              filteredData = filteredData.filter(n => {
                const unidadeId = n?.original?.estabelecimento_idestabelecimento;
                if (unidadeId !== undefined && exportOptions?.estabelecimentoOptions?.length > 0) {
                  const unidade = exportOptions.estabelecimentoOptions.find(
                    (u: any) => String(u.idestabelecimento) === String(unidadeId)
                  );
                  return unidade?.nome && filterValue.includes(unidade.nome);
                }
                return false;
              });
            } else {
              // Seleção simples: filtra se o valor for igual
              filteredData = filteredData.filter(n => {
                const unidadeId = n?.original?.estabelecimento_idestabelecimento;
                if (unidadeId !== undefined && exportOptions?.estabelecimentoOptions?.length > 0) {
                  const unidade = exportOptions.estabelecimentoOptions.find(
                    (u: any) => String(u.idestabelecimento) === String(unidadeId)
                  );
                  return unidade?.nome === filterValue;
                }
                return false;
              });
            }
            break;
            
          case 'hipotese':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const hipoteseId = n?.original?.tipo_hipotese_diag_idtipo_hipotese_diag;
                if (hipoteseId !== undefined && exportOptions?.hipoteseDiagOptions?.length > 0) {
                  const hipotese = exportOptions.hipoteseDiagOptions.find(
                    (h: any) => String(h.idtipo_hipotese_diag) === String(hipoteseId)
                  );
                  return hipotese?.descricao && filterValue.includes(hipotese.descricao);
                }
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const hipoteseId = n?.original?.tipo_hipotese_diag_idtipo_hipotese_diag;
                if (hipoteseId !== undefined && exportOptions?.hipoteseDiagOptions?.length > 0) {
                  const hipotese = exportOptions.hipoteseDiagOptions.find(
                    (h: any) => String(h.idtipo_hipotese_diag) === String(hipoteseId)
                  );
                  return hipotese?.descricao === filterValue;
                }
                return false;
              });
            }
            break;
            
          case 'trauma':
            console.log("🔍 Filtrando por trauma:", filterValue);
            console.log("🔧 traumaOptions disponíveis:", exportOptions?.traumaOptions?.length || 0);
            
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const traumas = n?.original?.notificacao_has_tipo_trauma;
                console.log("🏥 Verificando traumas:", traumas, "na notificação");
                
                if (Array.isArray(traumas) && traumas.length > 0 && exportOptions?.traumaOptions?.length > 0) {
                  return traumas.some((traumaRel: any) => {
                    const traumaId = traumaRel.tipo_trauma_idtipo_trauma;
                    const trauma = exportOptions.traumaOptions.find(
                      (t: any) => String(t.idtipo_trauma) === String(traumaId)
                    );
                    console.log("🔍 Trauma encontrado:", trauma?.descricao, "vs filtro:", filterValue);
                    return trauma?.descricao && filterValue.includes(trauma.descricao);
                  });
                }
                console.log("❌ Trauma não encontrado - traumas:", traumas, "traumaOptions:", exportOptions?.traumaOptions?.length);
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const traumas = n?.original?.notificacao_has_tipo_trauma;
                
                if (Array.isArray(traumas) && traumas.length > 0 && exportOptions?.traumaOptions?.length > 0) {
                  return traumas.some((traumaRel: any) => {
                    const traumaId = traumaRel.tipo_trauma_idtipo_trauma;
                    const trauma = exportOptions.traumaOptions.find(
                      (t: any) => String(t.idtipo_trauma) === String(traumaId)
                    );
                    return trauma?.descricao === filterValue;
                  });
                }
                return false;
              });
            }
            break;
            
          case 'sintoma':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const sintomas = n?.original?.notificacao_has_tipo_sintoma;
                if (Array.isArray(sintomas) && exportOptions?.sintomaOptions?.length > 0) {
                  return sintomas.some((s: any) => {
                    const sintoma = exportOptions.sintomaOptions.find(
                      (opt: any) => String(opt.idtipo_sintoma) === String(s.tipo_sintoma_idtipo_sintoma)
                    );
                    return sintoma?.descricao && filterValue.includes(sintoma.descricao);
                  });
                }
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const sintomas = n?.original?.notificacao_has_tipo_sintoma;
                if (Array.isArray(sintomas) && exportOptions?.sintomaOptions?.length > 0) {
                  return sintomas.some((s: any) => {
                    const sintoma = exportOptions.sintomaOptions.find(
                      (opt: any) => String(opt.idtipo_sintoma) === String(s.tipo_sintoma_idtipo_sintoma)
                    );
                    return sintoma?.descricao === filterValue;
                  });
                }
                return false;
              });
            }
            break;

          case 'faixaEtaria':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const paciente = n?.original?.paciente;
                if (!paciente || paciente.idade === null || paciente.idade === undefined) {
                  return false;
                }
                
                const idadeMeses = paciente.idade;
                let faixaEtaria = '';
                
                if (idadeMeses < 12) {
                  faixaEtaria = 'Menor de 1 ano';
                } else {
                  const anos = Math.floor(idadeMeses / 12);
                  
                  if (anos >= 1 && anos <= 4) faixaEtaria = '1 a 4 anos';
                  else if (anos >= 5 && anos <= 9) faixaEtaria = '5 a 9 anos';
                  else if (anos >= 10 && anos <= 14) faixaEtaria = '10 a 14 anos';
                  else if (anos >= 15 && anos <= 19) faixaEtaria = '15 a 19 anos';
                  else if (anos >= 20 && anos <= 24) faixaEtaria = '20 a 24 anos';
                  else if (anos >= 25 && anos <= 29) faixaEtaria = '25 a 29 anos';
                  else if (anos >= 30 && anos <= 34) faixaEtaria = '30 a 34 anos';
                  else if (anos >= 35 && anos <= 39) faixaEtaria = '35 a 39 anos';
                  else if (anos >= 40 && anos <= 44) faixaEtaria = '40 a 44 anos';
                  else if (anos >= 45 && anos <= 49) faixaEtaria = '45 a 49 anos';
                  else if (anos >= 50 && anos <= 54) faixaEtaria = '50 a 54 anos';
                  else if (anos >= 55 && anos <= 59) faixaEtaria = '55 a 59 anos';
                  else if (anos >= 60 && anos <= 64) faixaEtaria = '60 a 64 anos';
                  else if (anos >= 65 && anos <= 69) faixaEtaria = '65 a 69 anos';
                  else if (anos >= 70 && anos <= 74) faixaEtaria = '70 a 74 anos';
                  else if (anos >= 75 && anos <= 79) faixaEtaria = '75 a 79 anos';
                  else faixaEtaria = '80 ou mais anos';
                }
                
                return faixaEtaria && filterValue.includes(faixaEtaria);
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const paciente = n?.original?.paciente;
                if (!paciente || paciente.idade === null || paciente.idade === undefined) {
                  return false;
                }
                
                const idadeMeses = paciente.idade;
                let faixaEtaria = '';
                
                if (idadeMeses < 12) {
                  faixaEtaria = 'Menor de 1 ano';
                } else {
                  const anos = Math.floor(idadeMeses / 12);
                  
                  if (anos >= 1 && anos <= 4) faixaEtaria = '1 a 4 anos';
                  else if (anos >= 5 && anos <= 9) faixaEtaria = '5 a 9 anos';
                  else if (anos >= 10 && anos <= 14) faixaEtaria = '10 a 14 anos';
                  else if (anos >= 15 && anos <= 19) faixaEtaria = '15 a 19 anos';
                  else if (anos >= 20 && anos <= 24) faixaEtaria = '20 a 24 anos';
                  else if (anos >= 25 && anos <= 29) faixaEtaria = '25 a 29 anos';
                  else if (anos >= 30 && anos <= 34) faixaEtaria = '30 a 34 anos';
                  else if (anos >= 35 && anos <= 39) faixaEtaria = '35 a 39 anos';
                  else if (anos >= 40 && anos <= 44) faixaEtaria = '40 a 44 anos';
                  else if (anos >= 45 && anos <= 49) faixaEtaria = '45 a 49 anos';
                  else if (anos >= 50 && anos <= 54) faixaEtaria = '50 a 54 anos';
                  else if (anos >= 55 && anos <= 59) faixaEtaria = '55 a 59 anos';
                  else if (anos >= 60 && anos <= 64) faixaEtaria = '60 a 64 anos';
                  else if (anos >= 65 && anos <= 69) faixaEtaria = '65 a 69 anos';
                  else if (anos >= 70 && anos <= 74) faixaEtaria = '70 a 74 anos';
                  else if (anos >= 75 && anos <= 79) faixaEtaria = '75 a 79 anos';
                  else faixaEtaria = '80 ou mais anos';
                }
                
                return faixaEtaria === filterValue;
              });
            }
            break;

          case 'desfecho':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const original = n?.original || n;
                const tipoEncerramento = original?.tipo_encerramento;
                
                if (tipoEncerramento && tipoEncerramento.descricao) {
                  return filterValue.includes(tipoEncerramento.descricao);
                }
                
                const desfecho = original?.desfecho;
                return desfecho && filterValue.includes(desfecho);
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const original = n?.original || n;
                const tipoEncerramento = original?.tipo_encerramento;
                
                if (tipoEncerramento && tipoEncerramento.descricao) {
                  return tipoEncerramento.descricao === filterValue;
                }
                
                const desfecho = original?.desfecho;
                return desfecho === filterValue;
              });
            }
            break;
            
          case 'dataNotificacao':
            // 🚫 IGNORAR FILTRO DE DATA INDIVIDUAL SE O FILTRO GLOBAL ESTIVER ATIVO
            if (isGlobalFilterActive()) {
              console.log('🔒 Ignorando filtro de data individual - filtro global ativo');
              break;
            }
            
            filteredData = filteredData.filter(n => {
              const dataCreated = n?.created_at || n?.original?.created_at;
              
              if (dataCreated) {
                try {
                  const dataLocal = new Date(dataCreated);
                  const dataFormatada = dataLocal.toLocaleDateString('pt-BR', {
                    timeZone: 'America/Belem',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).split('/').reverse().join('-'); // Converter para YYYY-MM-DD
                  
                  return dataFormatada === filterValue;
                } catch (error) {
                  console.warn('Erro ao filtrar por data de notificação:', error);
                  return false;
                }
              }
              
              return false;
            });
            break;
            
          // 🆕 NOVOS FILTROS PARA LOCALIZAÇÃO GEOGRÁFICA
          case 'pais':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const paisId = n?.original?.tipo_pais_idtipo_pais;
                if (paisId !== undefined && exportOptions?.paisOptions?.length > 0) {
                  const pais = exportOptions.paisOptions.find(
                    (p: any) => String(p.idtipo_pais) === String(paisId)
                  );
                  return pais?.descricao && filterValue.includes(pais.descricao);
                }
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const paisId = n?.original?.tipo_pais_idtipo_pais;
                if (paisId !== undefined && exportOptions?.paisOptions?.length > 0) {
                  const pais = exportOptions.paisOptions.find(
                    (p: any) => String(p.idtipo_pais) === String(paisId)
                  );
                  return pais?.descricao === filterValue;
                }
                return false;
              });
            }
            break;
            
          case 'estado':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const estadoId = n?.original?.tipo_estado_idtipo_estado;
                if (estadoId !== undefined && exportOptions?.estadoOptions?.length > 0) {
                  const estado = exportOptions.estadoOptions.find(
                    (e: any) => String(e.idtipo_estado) === String(estadoId)
                  );
                  return estado?.descricao && filterValue.includes(estado.descricao);
                }
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const estadoId = n?.original?.tipo_estado_idtipo_estado;
                if (estadoId !== undefined && exportOptions?.estadoOptions?.length > 0) {
                  const estado = exportOptions.estadoOptions.find(
                    (e: any) => String(e.idtipo_estado) === String(estadoId)
                  );
                  return estado?.descricao === filterValue;
                }
                return false;
              });
            }
            break;
            
          case 'municipio':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const municipioId = n?.original?.tipo_municipio_idtipo_municipio;
                if (municipioId !== undefined && exportOptions?.municipioOptions?.length > 0) {
                  const municipio = exportOptions.municipioOptions.find(
                    (m: any) => String(m.idtipo_municipio) === String(municipioId)
                  );
                  return municipio?.descricao && filterValue.includes(municipio.descricao);
                }
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const municipioId = n?.original?.tipo_municipio_idtipo_municipio;
                if (municipioId !== undefined && exportOptions?.municipioOptions?.length > 0) {
                  const municipio = exportOptions.municipioOptions.find(
                    (m: any) => String(m.idtipo_municipio) === String(municipioId)
                  );
                  return municipio?.descricao === filterValue;
                }
                return false;
              });
            }
            break;
            
          case 'bairro':
            if (Array.isArray(filterValue)) {
              // Seleção múltipla
              filteredData = filteredData.filter(n => {
                const bairroId = n?.original?.tipo_bairro_idtipo_bairro;
                if (bairroId !== undefined && exportOptions?.bairroOptions?.length > 0) {
                  const bairro = exportOptions.bairroOptions.find(
                    (b: any) => String(b.idtipo_bairro) === String(bairroId)
                  );
                  return bairro?.descricao && filterValue.includes(bairro.descricao);
                }
                return false;
              });
            } else {
              // Seleção simples
              filteredData = filteredData.filter(n => {
                const bairroId = n?.original?.tipo_bairro_idtipo_bairro;
                if (bairroId !== undefined && exportOptions?.bairroOptions?.length > 0) {
                  const bairro = exportOptions.bairroOptions.find(
                    (b: any) => String(b.idtipo_bairro) === String(bairroId)
                  );
                  return bairro?.descricao === filterValue;
                }
                return false;
              });
            }
            break;
        }
      }
    });
    
    return filteredData;
  }, [activeFilters, exportOptions, getAtendimentoDescById]);

  // 🚨 NOVO: NOTIFICAÇÕES COM TODOS OS FILTROS APLICADOS (INCLUINDO ALERTAS)
  // Aplica todos os filtros ativos (país, município, estabelecimento, hipótese, etc.) nas notificações filtradas por evento
  const notificacoesComTodosFiltros = useMemo(() => {
    console.log(`🔍 Aplicando todos os filtros ativos para alertas...`);
    console.log(`📊 Iniciando com ${notificacoesFiltradasPorEvento.length} notificações (filtradas por evento)`);
    console.log(`🎯 Filtros ativos:`, activeFilters);
    
    // Aplicar a função applyFilters que já existe e considera todos os filtros
    const filtradas = applyFilters(notificacoesFiltradasPorEvento);
    
    console.log(`✅ Filtros aplicados: ${notificacoesFiltradasPorEvento.length} → ${filtradas.length} notificações`);
    
    // Log detalhado dos filtros aplicados
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        console.log(`   ✓ ${key}: ${value}`);
      }
    });
    
    return filtradas;
  }, [notificacoesFiltradasPorEvento, activeFilters, applyFilters]);

  // 🆕 FUNÇÃO PARA ALTERNAR FILTRO (com suporte a seleção múltipla)
  const toggleFilter = useCallback((category: string, value: string, multiSelect = false) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      const currVal = newFilters[category];

      if (multiSelect) {
        // Modo de seleção múltipla (Ctrl pressionado)
        // SEMPRE trabalhar com arrays para consistência
        const vals = Array.isArray(currVal) ? currVal : currVal ? [currVal] : [];
        
        if (vals.includes(value)) {
          // Remove o valor se já estiver selecionado
          const updated = vals.filter(v => v !== value);
          newFilters[category] = updated.length ? updated : null;
        } else {
          // Adiciona o novo valor ao array
          newFilters[category] = [...vals, value];
        }
      } else {
        // Modo de seleção simples (comportamento padrão)
        // SEMPRE usar array para consistência visual
        const vals = Array.isArray(currVal) ? currVal : currVal ? [currVal] : [];
        
        if (vals.includes(value)) {
          // Se o mesmo filtro já está ativo, remove-o
          newFilters[category] = null;
        } else {
          // Define o novo filtro como array de um único item
          newFilters[category] = [value];
        }
      }
      
      console.log(`🎯 Filtro alterado:`, { category, value, multiSelect, newValue: newFilters[category] });
      return newFilters;
    });
  }, []);

  // 🆕 FUNÇÃO PARA LIMPAR TODOS OS FILTROS
  const clearAllFilters = useCallback(() => {
    setActiveFilters({
      evento: null,
      tipoAtendimento: null,
      publico: null,
      genero: null,
      raca: null,
      escolaridade: null,
      unidade: null,
      hipotese: null,
      trauma: null,
      sintoma: null,
      faixaEtaria: null,
      desfecho: null,
      dataNotificacao: null, // 🆕 Incluir filtro de data
      // 🆕 INCLUIR FILTROS DE LOCALIZAÇÃO GEOGRÁFICA
      pais: null,
      estado: null,
      municipio: null,
      bairro: null
    });
    setSelectedCategory(null);
    setSelectedEvento("Todos");
    setSelectedDataNotificacao(null); // 🆕 Limpar data selecionada
    console.log("🧹 Todos os filtros foram limpos");
  }, []);

  // 🆕 FUNÇÃO PARA EXTRAIR DATAS DISPONÍVEIS DAS NOTIFICAÇÕES
  const extrairDatasNotificacao = useCallback((notificacoes: any[]): string[] => {
    if (!notificacoes || notificacoes.length === 0) return [];

    const datas = new Set<string>();
    const timezone = 'America/Belem'; // Fuso horário local

    notificacoes.forEach((notificacao) => {
      // Buscar data de criação da notificação (created_at)
      const dataCreated = notificacao.created_at || notificacao.original?.created_at;
      
      if (dataCreated) {
        try {
          // Converter para o fuso horário local
          const dataLocal = new Date(dataCreated);
          const dataFormatada = dataLocal.toLocaleDateString('pt-BR', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).split('/').reverse().join('-'); // Converter para YYYY-MM-DD
          
          datas.add(dataFormatada);
        } catch (error) {
          console.warn('Erro ao processar data de criação da notificação:', error);
        }
      }
    });

    const datasArray = Array.from(datas).sort().reverse(); // Mais recente primeiro
    return datasArray;
  }, []);

  // 🆕 FUNÇÃO PARA CONTAR NOTIFICAÇÕES POR DATA
  const contarNotificacoesPorData = useCallback((notificacoes: any[], dataFiltro: string | null): number => {
    if (!dataFiltro || !notificacoes || notificacoes.length === 0) return 0;

    const timezone = 'America/Belem';
    let contador = 0;

    notificacoes.forEach((notificacao) => {
      const dataCreated = notificacao.created_at || notificacao.original?.created_at;
      
      if (dataCreated) {
        try {
          const dataLocal = new Date(dataCreated);
          const dataFormatada = dataLocal.toLocaleDateString('pt-BR', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).split('/').reverse().join('-');
          
          if (dataFormatada === dataFiltro) {
            contador++;
          }
        } catch (error) {
          console.warn('Erro ao contar notificações por data:', error);
        }
      }
    });

    return contador;
  }, []);

  // 🆕 FUNÇÃO PARA OBTER A DATA ATUAL NO FORMATO CORRETO
  const obterDataAtual = useCallback((): string => {
    const hoje = new Date();
    return hoje.toLocaleDateString('pt-BR', {
      timeZone: 'America/Belem',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    }).split('/').reverse().join('-'); // YYYY-MM-DD
  }, []);

  // 🆕 HANDLER PARA MUDANÇA DE DATA DE NOTIFICAÇÃO
  const handleDataNotificacaoChange = useCallback((novaData: string) => {
    if (novaData === 'todos') {
      setSelectedDataNotificacao(null);
      setActiveFilters(prev => ({ ...prev, dataNotificacao: null }));
      
      // 🆕 CORREÇÃO: Usar notificações filtradas por evento
      setTotalNotificacoesDia(notificacoesFiltradasPorEvento.length);
    } else if (novaData === 'ultima-data') {
      // 🆕 SEMPRE ÚLTIMA DATA: Usar a data mais recente disponível
      const dataMaisRecente = datasNotificacaoDisponiveis[0]; // Primeira do array = mais recente
      if (dataMaisRecente) {
        const totalParaData = contarNotificacoesPorData(notificacoesFiltradasPorEvento, dataMaisRecente);
        console.log(`🆕 Sempre última data ativado: ${dataMaisRecente} (${totalParaData} notificações)`);
        
        setSelectedDataNotificacao('ultima-data');
        setActiveFilters(prev => ({ ...prev, dataNotificacao: dataMaisRecente }));
        setTotalNotificacoesDia(totalParaData);
      }
    } else {
      // 🆕 CORREÇÃO: Usar notificações filtradas por evento como base
      const dadosParaContar = notificacoesFiltradasPorEvento;
      
      // Contar notificações para a data específica
      const totalParaData = contarNotificacoesPorData(dadosParaContar, novaData);
      
      // 🆕 Se não há notificações para a data, apenas mostrar 0 (sem alert)
      // O dashboard mostrará vazio, que é o comportamento correto
      console.log(`📅 Data ${novaData}: ${totalParaData} notificações do evento selecionado`);
      
      setSelectedDataNotificacao(novaData);
      setActiveFilters(prev => ({ ...prev, dataNotificacao: novaData }));
      setTotalNotificacoesDia(totalParaData);
    }
  }, [contarNotificacoesPorData, notificacoesFiltradasPorEvento, datasNotificacaoDisponiveis]);

  // 🆕 VERIFICAR SE HÁ FILTROS ATIVOS
  const hasActiveFilters = useMemo(() => {
    return Object.values(activeFilters).some(filter => filter !== null);
  }, [activeFilters]);

  // 🆕 FUNÇÃO PARA OBTER DADOS FILTRADOS
  const getFilteredData = useCallback(() => {
    // 🆕 CORREÇÃO: Usar notificações filtradas por evento como base
    const baseData = notificacoesFiltradasPorEvento;
    
    if (!hasActiveFilters) {
      return baseData;
    }
    return applyFilters(baseData);
  }, [hasActiveFilters, applyFilters, notificacoesFiltradasPorEvento]);

  // 🆕 FUNÇÃO PARA OBTER DADOS FILTRADOS EXCLUINDO DESFECHO (para o gráfico de Desfecho)
  const getFilteredDataExcludingDesfecho = useCallback(() => {
    const baseData = notificacoesFiltradasPorEvento;
    
    if (!hasActiveFilters) {
      return baseData;
    }
    return applyFilters(baseData, 'desfecho');
  }, [hasActiveFilters, applyFilters, notificacoesFiltradasPorEvento]);

  // 🆕 FUNÇÃO PARA OBTER DADOS FILTRADOS EXCLUINDO UNIDADE (para o gráfico de Estabelecimentos)
  const getFilteredDataExcludingUnidade = useCallback(() => {
    const baseData = notificacoesFiltradasPorEvento;
    
    if (!hasActiveFilters) {
      return baseData;
    }
    return applyFilters(baseData, 'unidade');
  }, [hasActiveFilters, applyFilters, notificacoesFiltradasPorEvento]);

  // 🆕 FUNÇÃO PARA OBTER DADOS FILTRADOS EXCLUINDO FAIXA ETÁRIA (para Pirâmide Etária)
  const getFilteredDataExcludingFaixaEtaria = useCallback(() => {
    const baseData = notificacoesFiltradasPorEvento;
    
    if (!hasActiveFilters) {
      return baseData;
    }
    return applyFilters(baseData, 'faixaEtaria');
  }, [hasActiveFilters, applyFilters, notificacoesFiltradasPorEvento]);

  // 🆕 FUNÇÃO PARA DETERMINAR QUAIS GRÁFICOS DEVEM SER VISÍVEIS BASEADO NO TIPO DE ATENDIMENTO
  const getVisibleCharts = useCallback(() => {
    // 🔧 MODIFICADO: Sempre mostrar todos os gráficos, independente dos filtros
    // O próprio gráfico filtra os dados internamente
    return {
      trauma: true,
      sintomas: true,
      hipoteses: true,
      demograficos: true
    };
  }, []);

  // Usar a função para obter quais gráficos devem ser visíveis
  const visibleCharts = getVisibleCharts();

  // FUNÇÃO PARA LAYOUT DO GRID - 8 colunas fixas (4 gráficos por linha em telas grandes)
  const getGridLayout = useCallback(() => {
    return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4 mt-2";
  }, []);

  // FUNÇÃO PARA CALCULAR SPANS DOS GRÁFICOS - Grid de 8 colunas (Sintomas 2, Trauma 2, Hipóteses 4)
  const getChartSpans = useCallback(() => {
    // 🔧 MODIFICADO: Layout fixo com todos os 3 gráficos sempre visíveis
    // Sintomas (2) + Trauma (2) + Hipóteses (4) = 8 cols
    return {
      sintomas: "md:col-span-2 lg:col-span-2 xl:col-span-2",   // 2/8 colunas
      trauma: "md:col-span-2 lg:col-span-2 xl:col-span-2",     // 2/8 colunas  
      hipoteses: "md:col-span-2 lg:col-span-4 xl:col-span-4"   // 4/8 colunas (mais espaço para nomes longos)
    };
  }, []);

  // Obter os spans calculados para os gráficos
  const chartSpans = getChartSpans();

  // 🤖 FUNÇÃO PARA PREPARAR DADOS PARA OS COMPONENTES DE IA
  const getAIDashboardData = useCallback(() => {
    const currentData = getFilteredData();
    
    return {
      totalNotifications: currentData.length,
      topSymptoms: filteredSintomas.slice(0, 10),
      criticalHypothesis: filteredHipoteses.filter(h => h.isAlarmante).slice(0, 5),
      topTraumas: filteredTrauma.slice(0, 10),
      demographics: {
        gender: filteredGenero.slice(0, 5),
        age: [] // Pode ser expandido se houver dados de idade
      },
      activeFilters: activeFilters
    };
  }, [getFilteredData, filteredSintomas, filteredHipoteses, filteredTrauma, filteredGenero, activeFilters]);

  // ✅ Função para determinar se uma hipótese é alarmante (baseado no GVS)
  const isHipotesisAlarmante = useCallback((hipotese: string): boolean => {
    const match = findRuleByHypothesis(hipotese);
    return !!match && match.rule.priority === 'critical';
  }, []);

  // ✅ Função para determinar se uma hipótese está em alerta (baseado no GVS)
  const isHipotesisAlerta = useCallback((hipotese: string): boolean => {
    const match = findRuleByHypothesis(hipotese);
    return !!match && match.rule.priority === 'high';
  }, []);

  // ✅ Função para obter a cor adequada para cada hipótese diagnóstica (baseado no GVS)
  const getHipotesisColor = useCallback((hipotese: string, _value: number): string => {
    const match = findRuleByHypothesis(hipotese);
    if (!match) return COLORS.normal; // azul padrão
    
    const pri = match.rule.priority;
    if (pri === 'critical') return COLORS.alarmante; // vermelho
    if (pri === 'high') return COLORS.alerta;        // laranja
    if (pri === 'medium') return COLORS.medio;       // amarelo
    return COLORS.normal;                            // azul
  }, []);

  // 🏳️ FUNÇÃO ESPECIAL PARA PROCESSAR ESTADOS COM CORES ESPECÍFICAS
  const processarEstados = useCallback((
    dados: any[],
    campoId: string,
    opcoes: any[] = [],
    idField: string,
    descField: string
  ) => {
    // Função que mapeia estados brasileiros para cores características
    const getStateColorFromBackend = (stateName: string): string => {
      // Cores características baseadas na identidade visual/bandeira de cada estado brasileiro
      const stateSpecificColors: Record<string, string> = {
        // Região Norte
        "Acre": "#006837", // Verde da floresta amazônica
        "Amapá": "#1B5E20", // Verde escuro amazônico
        "Amazonas": "#2E7D32", // Verde da Amazônia
        "Pará": "#1976D2", // Azul do rio e céu amazônico - DESTAQUE ESPECIAL PARA O PARÁ!
        "Rondônia": "#8BC34A", // Verde claro
        "Roraima": "#4CAF50", // Verde médio
        "Tocantins": "#81C784", // Verde claro dourado
        
        // Região Nordeste  
        "Alagoas": "#0277BD", // Azul do mar
        "Bahia": "#FF9800", // Laranja/dourado
        "Ceará": "#F57C00", // Laranja do sol
        "Maranhão": "#D32F2F", // Vermelho
        "Paraíba": "#1976D2", // Azul
        "Pernambuco": "#FF5722", // Vermelho/laranja
        "Piauí": "#795548", // Marrom/terra
        "Rio Grande do Norte": "#00BCD4", // Azul claro do litoral
        "Sergipe": "#009688", // Verde azulado
        
        // Região Centro-Oeste
        "Distrito Federal": "#9C27B0", // Roxo (Brasília)
        "Goiás": "#CDDC39", // Verde amarelado do cerrado
        "Mato Grosso": "#8BC34A", // Verde do pantanal
        "Mato Grosso do Sul": "#4CAF50", // Verde pantanal
        
        // Região Sudeste
        "Espírito Santo": "#00E676", // Verde claro
        "Minas Gerais": "#FFC107", // Amarelo/dourado das montanhas
        "Rio de Janeiro": "#2196F3", // Azul carioca
        "São Paulo": "#E91E63", // Rosa/magenta industrial
        
        // Região Sul
        "Paraná": "#4CAF50", // Verde do pinheiro
        "Rio Grande do Sul": "#F44336", // Vermelho gaúcho
        "Santa Catarina": "#03A9F4"  // Azul catarinense
      };
      
      return stateSpecificColors[stateName] || "#757575"; // Cinza como fallback
    };

    // Contar ocorrências usando a mesma lógica da processarCategoria
    const contagem: Record<string, {count: number, items: any[]}> = {};
    
    const getPropSafely = (obj: any, path: string): any => {
      if (!obj) return undefined;
      
      const partes = path.split('.');
      let valor = obj;
      
      for (const parte of partes) {
        if (valor && typeof valor === 'object' && parte in valor) {
          valor = valor[parte];
        } else {
          return undefined;
        }
      }
      
      return valor;
    };

    dados.forEach((item) => {
      let valor = getPropSafely(item, campoId);
      
      if (valor !== undefined && valor !== null) {
        const id = String(valor);
        if (!contagem[id]) {
          contagem[id] = { count: 0, items: [] };
        }
        contagem[id].count += 1;
        contagem[id].items.push(item);
      } else {
        if (!contagem["unknown"]) {
          contagem["unknown"] = { count: 0, items: [] };
        }
        contagem["unknown"].count += 1;
        contagem["unknown"].items.push(item);
      }
    });

    // Converter para o formato de gráfico com cores específicas baseadas na identidade do estado
    const resultado: ChartDataItem[] = [];

    for (const [id, data] of Object.entries(contagem)) {
      if (id === "unknown") {
        resultado.push({
          name: "Ignorado",
          value: data.count,
          fill: COLORS.ignorado,
          original: data.items
        });
        continue;
      }

      // Buscar a descrição nas opções do backend
      const opcaoEncontrada = opcoes.find((opt) => String(opt[idField]) === id);
      const descricao = opcaoEncontrada ? opcaoEncontrada[descField] : `Estado ${id}`;
      
      // Usar cor específica baseada na identidade do estado brasileiro
      const fill = getStateColorFromBackend(descricao);

      resultado.push({
        name: descricao,
        value: data.count,
        fill: fill,
        original: data.items
      });
    }

    return resultado.sort((a, b) => b.value - a.value); // Ordenar pelo valor
  }, []);

  // 🏳️ FUNÇÃO ESPECIAL PARA PROCESSAR PAÍSES COM CORES ESPECÍFICAS
  const processarPaises = useCallback((
    dados: any[],
    campoId: string,
    opcoes: any[] = [],
    idField: string,
    descField: string
  ) => {
    // Função que mapeia países para cores características baseadas em suas bandeiras/identidade
    const getCountryColorFromBackend = (countryName: string): string => {
      // Mapeamento de cores específicas para países baseado em suas bandeiras e identidade nacional
      const countrySpecificColors: Record<string, string> = {
        // Brasil - Verde e amarelo, usando verde como predominante
        "Brasil": "#009B3A", // Verde bandeira brasileira
        
        // Países das Américas
        "Argentina": "#74ACDF", // Azul celeste da bandeira
        "Estados Unidos": "#B22234", // Vermelho da bandeira
        "Canadá": "#FF0000", // Vermelho da folha de bordo
        "México": "#006341", // Verde da bandeira mexicana
        "Chile": "#0033A0", // Azul da bandeira chilena
        "Colômbia": "#FCDD09", // Amarelo da bandeira
        "Peru": "#D91023", // Vermelho da bandeira
        "Venezuela": "#FCDD09", // Amarelo da bandeira
        "Uruguai": "#0038A8", // Azul da bandeira
        "Paraguai": "#D52B1E", // Vermelho da bandeira
        "Bolívia, Estado Plurinacional da": "#D52B1E", // Vermelho da bandeira
        "Equador": "#FFE800", // Amarelo da bandeira
        "Costa Rica": "#002868", // Azul da bandeira
        "Panamá": "#005293", // Azul da bandeira
        "Cuba": "#002A8F", // Azul da bandeira
        "Jamaica": "#009B3A", // Verde da bandeira
        "República Dominicana": "#002D62", // Azul da bandeira
        
        // Europa
        "França": "#002654", // Azul da bandeira francesa
        "Alemanha": "#000000", // Preto da bandeira alemã
        "Itália": "#009246", // Verde da bandeira italiana
        "Espanha": "#C60B1E", // Vermelho da bandeira
        "Portugal": "#046A38", // Verde da bandeira portuguesa
        "Reino Unido": "#012169", // Azul da bandeira
        "Países Baixos (Holanda)": "#21468B", // Azul da bandeira holandesa
        "Bélgica": "#000000", // Preto da bandeira
        "Suíça": "#DC143C", // Vermelho da bandeira
        "Áustria": "#ED2939", // Vermelho da bandeira
        "Suécia": "#006AA7", // Azul da bandeira
        "Noruega": "#002868", // Azul da bandeira
        "Dinamarca": "#C60C30", // Vermelho da bandeira
        "Finlândia": "#002F6C", // Azul da bandeira
        "Grécia": "#0D5EAF", // Azul da bandeira grega
        "Turquia": "#E30A17", // Vermelho da bandeira
        "Rússia, Federação da": "#0033A0", // Azul da bandeira
        "Polônia, República da": "#DC143C", // Vermelho da bandeira
        "Ucrânia": "#005BBB", // Azul da bandeira
        
        // Ásia e Oceania
        "China, República Popular": "#DE2910", // Vermelho da bandeira chinesa
        "Japão": "#BC002D", // Vermelho da bandeira japonesa
        "Coréia (do Sul), República da": "#003478", // Azul da bandeira
        "Índia": "#FF9933", // Açafrão da bandeira indiana
        "Austrália": "#012169", // Azul da bandeira
        "Nova Zelândia": "#012169", // Azul da bandeira
        "Israel": "#0038B8", // Azul da bandeira
        "Arábia Saudita": "#006C35", // Verde da bandeira
        "Emirados Árabes Unidos": "#00732F", // Verde da bandeira
        "Irã, República Islâmica do": "#239F40", // Verde da bandeira
        "Iraque": "#CE1126", // Vermelho da bandeira
        "Tailândia": "#2E2D68", // Azul da bandeira
        "Vietnã": "#DA020E", // Vermelho da bandeira
        "Indonésia": "#CE1126", // Vermelho da bandeira
        "Filipinas": "#0038A8", // Azul da bandeira
        "Malásia": "#010066", // Azul da bandeira
        "Cingapura": "#EE0000", // Vermelho da bandeira
        
        // África
        "Egito": "#CE1126", // Vermelho da bandeira
        "África do Sul": "#007749", // Verde da bandeira
        "Nigéria": "#008751", // Verde da bandeira
        "Marrocos": "#C1272D", // Vermelho da bandeira
        "Tunísia": "#E70013", // Vermelho da bandeira
        "Angola": "#CE1126", // Vermelho da bandeira
        "Moçambique": "#009639", // Verde da bandeira
        "Cabo Verde, República de": "#003893", // Azul da bandeira
        "Gana": "#006B3F", // Verde da bandeira
        "Quênia": "#BB0000", // Vermelho da bandeira
        "Etiópia": "#009639", // Verde da bandeira
        
        // Países adicionais com cores representativas
        "Formosa (Taiwan)": "#FE0000", // Vermelho da bandeira
        "Hong Kong": "#BA0000", // Vermelho
        "Macau": "#00785E", // Verde
        "Coreia do Norte": "#024FA2", // Azul da bandeira
        "Paquistão": "#01411C", // Verde da bandeira
        "Bangladesh": "#006A4E", // Verde da bandeira
        "Sri Lanka": "#8D153A", // Vermelho da bandeira
        "Mianmar (Birmânia)": "#FECB00", // Amarelo da bandeira
        "Camboja": "#032EA1", // Azul da bandeira
        "Laos, Rep.Pop.Democr.do": "#CE1126", // Vermelho da bandeira
        "Nepal": "#003893", // Azul da bandeira
        "Butão": "#FFD520", // Amarelo da bandeira
        "Afeganistão": "#000000", // Preto da bandeira
        "Cazaquistão, República do": "#00AFCA", // Azul da bandeira
        "Uzbequistão, República do": "#1EB53A", // Verde da bandeira
        "Turcomenistão, República do": "#00B04F", // Verde da bandeira
        "Quirguiz, República da": "#E4002B", // Vermelho da bandeira
        "Tadjiquistão, República do": "#006600", // Verde da bandeira
        "Mongólia": "#0066CC", // Azul da bandeira
        "Geórgia, República da": "#FFFFFF", // Branco - usar cinza claro
        "Armênia, República da": "#D90012", // Vermelho da bandeira
        "Azerbaijão, República do": "#3F9C35" // Verde da bandeira
      };
      
      // Se temos uma cor específica para o país, usar ela
      if (countrySpecificColors[countryName]) {
        return countrySpecificColors[countryName];
      }
      
      // Para países não mapeados, usar uma paleta de cores harmoniosas
      const fallbackColors = [
        "#2E8B57", // Sea Green
        "#4682B4", // Steel Blue  
        "#CD853F", // Peru
        "#8FBC8F", // Dark Sea Green
        "#B8860B", // Dark Goldenrod
        "#9370DB", // Medium Purple
        "#20B2AA", // Light Sea Green
        "#CD5C5C", // Indian Red
        "#4169E1", // Royal Blue
        "#32CD32", // Lime Green
        "#FF6347", // Tomato
        "#1E90FF", // Dodger Blue
        "#FF8C00", // Dark Orange
        "#00CED1", // Dark Turquoise
        "#FFD700", // Gold
        "#DC143C", // Crimson
        "#00FA9A", // Medium Spring Green
        "#8A2BE2", // Blue Violet
        "#FF1493", // Deep Pink
        "#00BFFF"  // Deep Sky Blue
      ];
      
      // Gerar índice baseado no nome do país para consistência
      let hash = 0;
      for (let i = 0; i < countryName.length; i++) {
        const char = countryName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return fallbackColors[Math.abs(hash) % fallbackColors.length];
    };

    // Contar ocorrências usando a mesma lógica da processarCategoria
    const contagem: Record<string, {count: number, items: any[]}> = {};
    
    const getPropSafely = (obj: any, path: string): any => {
      if (!obj) return undefined;
      
      const partes = path.split('.');
      let valor = obj;
      
      for (const parte of partes) {
        if (valor && typeof valor === 'object' && parte in valor) {
          valor = valor[parte];
        } else {
          return undefined;
        }
      }
      
      return valor;
    };

    dados.forEach((item) => {
      let valor = getPropSafely(item, campoId);
      
      if (valor !== undefined && valor !== null) {
        const id = String(valor);
        if (!contagem[id]) {
          contagem[id] = { count: 0, items: [] };
        }
        contagem[id].count += 1;
        contagem[id].items.push(item);
      } else {
        if (!contagem["unknown"]) {
          contagem["unknown"] = { count: 0, items: [] };
        }
        contagem["unknown"].count += 1;
        contagem["unknown"].items.push(item);
      }
    });

    // Converter para o formato de gráfico com cores específicas baseadas na lista do backend
    const resultado: ChartDataItem[] = [];

    for (const [id, data] of Object.entries(contagem)) {
      if (id === "unknown") {
        resultado.push({
          name: "Ignorado",
          value: data.count,
          fill: COLORS.ignorado,
          original: data.items
        });
        continue;
      }

      // Buscar a descrição nas opções do backend
      const opcaoEncontrada = opcoes.find((opt) => String(opt[idField]) === id);
      const descricao = opcaoEncontrada ? opcaoEncontrada[descField] : `País ${id}`;
      
      // Usar cor específica baseada na identidade do país
      const fill = getCountryColorFromBackend(descricao);

      resultado.push({
        name: descricao,
        value: data.count,
        fill: fill,
        original: data.items
      });
    }

    return resultado.sort((a, b) => b.value - a.value); // Ordenar pelo valor
  }, []);

  const processarCategoria = useCallback((
    dados: any[],
    campoId: string,
    opcoes: any[] = [],
    idField: string,
    descField: string,
    _cores: string[],
    tipoCores: 'normal' | 'pie' = 'normal'
  ) => {
    // Primeiro contar ocorrências
    const contagem: Record<string, {count: number, items: any[]}> = {};
  
    // Função auxiliar para acessar propriedades aninhadas com segurança
    const getPropSafely = (obj: any, path: string): any => {
      if (!obj) return undefined;
      
      const partes = path.split('.');
      let valor = obj;
      
      for (const parte of partes) {
        if (valor && typeof valor === 'object' && parte in valor) {
          valor = valor[parte];
        } else {
          return undefined;
        }
      }
      
      return valor;
    };
  
    dados.forEach((item) => {
      // Acessar valor do campo pelo caminho
      let valor = getPropSafely(item, campoId);
      
      // Se o valor não foi encontrado, tentar outras abordagens
      if (valor === undefined) {
        if (campoId.includes('tipo_raca')) {
          valor = getPropSafely(item, 'raca') || getPropSafely(item, 'original.paciente.raca');
        } else if (campoId.includes('tipo_genero')) {
          valor = getPropSafely(item, 'identidadeGenero') || getPropSafely(item, 'original.paciente.genero');
        } else if (campoId.includes('tipo_atendimento')) {
          valor = getPropSafely(item, 'tipoAtendimento');
        } else if (campoId.includes('tipo_publico')) {
          valor = getPropSafely(item, 'publicoAtendido');
        } else if (campoId.includes('tipo_hipotese_diag')) {
          valor = getPropSafely(item, 'hipoteseDiagnostica') || getPropSafely(item, 'original.hipotese_diagnostica');
        } else if (campoId.includes('tipo_trauma')) {
          valor = getPropSafely(item, 'tipoTrauma') || getPropSafely(item, 'original.trauma');
        }
      }
  // Tratar valores null como undefined para casos específicos como trauma
      if (valor !== undefined && valor !== null) {
        const id = String(valor);
        if (!contagem[id]) {
          contagem[id] = { count: 0, items: [] };
        }
        contagem[id].count += 1;
        contagem[id].items.push(item);
      } else {
        // Para trauma, não mostrar entradas vazias no gráfico, apenas ignorar silenciosamente
        if (campoId.includes('tipo_trauma')) {
          // Ignorar notificações sem trauma (a maioria das notificações clínicas não terá trauma)
          return;
        }
        
        if (!contagem["unknown"]) {
          contagem["unknown"] = { count: 0, items: [] };
        }
        contagem["unknown"].count += 1;
        contagem["unknown"].items.push(item);
      }
    });
  
    // Converter para o formato de gráfico
    const resultado: ChartDataItem[] = [];
    let index = 0;
  
    for (const [id, data] of Object.entries(contagem)) {
      if (id === "unknown") {
        // Para hipóteses diagnósticas, não incluir entradas "Ignorado"
        if (campoId.includes('tipo_hipotese_diag')) {
          continue; // Pular entradas ignoradas/desconhecidas para hipóteses
        }
        
        resultado.push({
          name: "Ignorado",
          value: data.count,
          fill: COLORS.ignorado,
          original: data.items
        });
        continue;
      }
  
      // Buscar a descrição nas opções
      let descricao;
      
      // Primeiro tenta encontrar exatamente
      const opcaoEncontrada = opcoes.find((opt) => String(opt[idField]) === id);
      
      if (opcaoEncontrada) {
        descricao = opcaoEncontrada[descField];
      } else {
        // Se não encontrar, tentar buscar por um ID similar
        const opcaoSimilar = opcoes.find(
          (opt) => String(opt[idField]).includes(id) || id.includes(String(opt[idField]))
        );
        
        if (opcaoSimilar) {
          descricao = opcaoSimilar[descField];
        } else {
          descricao = `Tipo ${id}`;
        }
      }
      
      // Definir a cor baseada no tipo de dado
      let fill;
      let isAlarmante = false;
      
      if (campoId.includes('tipo_atendimento')) {
        // Cores específicas para tipos de atendimento
        fill = getAtendimentoColor(descricao);
      } else if (campoId.includes('tipo_hipotese_diag')) {
        // Cores específicas para hipóteses diagnósticas
        fill = getHipotesisColor(descricao, data.count);
        // Verificar se é uma hipótese alarmante
        isAlarmante = isHipotesisAlarmante(descricao);
      } else if (campoId.includes('tipo_trauma')) {
        // Cores específicas para traumas - usar paleta vermelha
        const paletaTrauma = COLORS.trauma;
        fill = paletaTrauma[index % paletaTrauma.length];
      } else {
        // Usar paleta apropriada para o tipo de gráfico (pizza ou normal)
        const paletaCores = tipoCores === 'pie' ? COLORS.pie : COLORS.blue;
        fill = paletaCores[index % paletaCores.length];
      }
  
      resultado.push({
        name: descricao,
        value: data.count,
        fill: fill,
        isAlarmante: isAlarmante,
        original: data.items
      });
  
      index++;
    }
  
    return resultado.sort((a, b) => b.value - a.value); // Ordenar do maior para o menor
  }, [getAtendimentoColor, getHipotesisColor, isHipotesisAlarmante]);

  // Função para processar categorias muitos-para-muitos
  const processarCategoriaMuitosParaMuitos = useCallback((
    dados: any[],
    campoRelacionamento: string,
    campoIdRelacionado: string,
    opcoes: any[] = [],
    idField: string,
    descField: string,
    _cores: string[],
    tipoCores: 'normal' | 'pie' = 'normal'
  ) => {
    // Contagem para os tipos relacionados
    const contagem: Record<string, {count: number, items: any[]}> = {};

    dados.forEach((item) => {
      // Acessar o relacionamento
      let relacionamentos = item;
      const partes = campoRelacionamento.split(".");

      for (const parte of partes) {
        if (
          relacionamentos &&
          typeof relacionamentos === "object" &&
          parte in relacionamentos
        ) {
          relacionamentos = relacionamentos[parte];
        } else {
          relacionamentos = undefined;
          break;
        }
      }

      // Verificar se é um array de relacionamentos
      if (Array.isArray(relacionamentos)) {
        relacionamentos.forEach((rel) => {
          const idRelacionado = rel[campoIdRelacionado];
          if (idRelacionado !== undefined) {
            const id = String(idRelacionado);
            if (!contagem[id]) {
              contagem[id] = { count: 0, items: [] };
            }
            contagem[id].count += 1;
            if (!contagem[id].items.includes(item)) {
              contagem[id].items.push(item);
            }
          }
        });
      }
    });

    // Converter para formato do gráfico
    const resultado: ChartDataItem[] = [];
    let index = 0;

    for (const [id, data] of Object.entries(contagem)) {
      // Buscar a descrição nas opções
      const descricao =
        opcoes.find((opt) => String(opt[idField]) === id)?.[descField] ||
        `Tipo ${id}`;

      // Usar paleta apropriada para o tipo de gráfico (pizza ou normal)
      const paletaCores = tipoCores === 'pie' ? COLORS.pie : COLORS.blue;
      
      resultado.push({
        name: descricao,
        value: data.count,
        fill: paletaCores[index % paletaCores.length],
        original: data.items
      });

      index++;
    }

    return resultado.sort((a, b) => b.value - a.value); // Ordenar pelo valor
  }, []);

  // Processamento dos dados para gráficos
  const processarDadosGraficos = useCallback((dadosFiltrados: any[]) => {
    // 🆕 CORREÇÃO: Se dadosFiltrados está vazio, LIMPAR todos os gráficos
    if (!Array.isArray(dadosFiltrados) || !dadosFiltrados.length) {
      console.log('📊 processarDadosGraficos - Array vazio, limpando todos os gráficos...');
      
      // Limpar TODOS os gráficos
      setFilteredRaca([]);
      setFilteredEscolaridade([]);
      setFilteredUnidades([]);
      setFilteredGenero([]);
      setFilteredSintomas([]);
      setFilteredTipoAtendimento([]);
      setFilteredPublico([]);
      setFilteredHipoteses([]);
      setFilteredTrauma([]);
      
      // Limpar gráficos de localização geográfica
      setFilteredPais([]);
      setFilteredEstado([]);
      setFilteredMunicipio([]);
      setFilteredBairro([]);
      
      return false;
    }

    if (!exportOptions || typeof exportOptions !== "object") {
      return false;
    }

    try {
      // Processar cada categoria - usar paleta normal para barras, paleta pie para rosca/pizza
      // 🔧 POWER BI STYLE: Cada gráfico usa dados SEM seu próprio filtro
      const dadosSemFiltroRaca = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'raca') : notificacoesFiltradasPorEvento;
      const racaPorNotificacao = processarCategoria(
        dadosSemFiltroRaca,
        "original.paciente.tipo_raca_idtipo_raca",
        exportOptions.racaOptions || [],
        "idtipo_raca",
        "descricao",
        COLORS.blue,
        'normal'
      );
      // Sempre atualizar, mesmo se estiver vazio
      setFilteredRaca(racaPorNotificacao);
      if (racaPorNotificacao.length > 0 && originalRaca.length === 0) {
        setOriginalRaca(racaPorNotificacao);
      }

      const dadosSemFiltroEscolaridade = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'escolaridade') : notificacoesFiltradasPorEvento;
      const escolaridadePorNotificacao = processarCategoria(
        dadosSemFiltroEscolaridade,
        "original.paciente.escolaridade_idescolaridade",
        exportOptions.escolaridadeOptions || [],
        "idtipo_escolaridade",
        "descricao",
        COLORS.blue,
        'normal'
      );
      // Sempre atualizar, mesmo se estiver vazio
      setFilteredEscolaridade(escolaridadePorNotificacao);
      if (escolaridadePorNotificacao.length > 0 && originalEscolaridade.length === 0) {
        setOriginalEscolaridade(escolaridadePorNotificacao);
      }

      const dadosSemFiltroUnidade = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'unidade') : notificacoesFiltradasPorEvento;
      const unidadesPorNotificacao = processarCategoria(
        dadosSemFiltroUnidade,
        "original.estabelecimento_idestabelecimento",
        exportOptions.estabelecimentoOptions || [],
        "idestabelecimento",
        "nome",
        COLORS.blue,
        'normal'
      );
      // Sempre atualizar, mesmo se estiver vazio
      setFilteredUnidades(unidadesPorNotificacao);
      if (unidadesPorNotificacao.length > 0 && originalUnidades.length === 0) {
        setOriginalUnidades(unidadesPorNotificacao);
      }

      // Gênero como gráfico de pizza - usar paleta pie
      // 🔧 POWER BI STYLE: Usar dados SEM filtro de gênero (mas COM outros filtros)
      const dadosSemFiltroGenero = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'genero') : notificacoesFiltradasPorEvento;
      const generoPorNotificacao = processarCategoria(
        dadosSemFiltroGenero,
        "original.paciente.tipo_genero_idtipo_genero",
        exportOptions.generoOptions || [],
        "idtipo_genero",
        "descricao",
        COLORS.pie,
        'pie'
      );
      // Sempre atualizar, mesmo se estiver vazio
      setFilteredGenero(generoPorNotificacao);
      if (generoPorNotificacao.length > 0 && originalGenero.length === 0) {
        setOriginalGenero(generoPorNotificacao);
      }

      const dadosSemFiltroSintoma = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'sintoma') : notificacoesFiltradasPorEvento;
      const sintomasPorNotificacao = processarCategoriaMuitosParaMuitos(
        dadosSemFiltroSintoma,
        "original.notificacao_has_tipo_sintoma",
        "tipo_sintoma_idtipo_sintoma",
        exportOptions.sintomaOptions || [],
        "idtipo_sintoma",
        "descricao",
        COLORS.blue,
        'normal'
      );
      // Sempre atualizar, mesmo se estiver vazio
      setFilteredSintomas(sintomasPorNotificacao);
      if (sintomasPorNotificacao.length > 0 && originalSintomas.length === 0) {
        setOriginalSintomas(sintomasPorNotificacao);
      }

      const dadosSemFiltroTipoAtendimento = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'tipoAtendimento') : notificacoesFiltradasPorEvento;
      const atendimentoPorNotificacao = processarCategoria(
        dadosSemFiltroTipoAtendimento,
        "original.tipo_atendimento_idtipo_atendimento",
        exportOptions.atendimentoOptions || [],
        "idtipo_atendimento",
        "descricao",
        COLORS.blue,
        'normal'
      );
      // Sempre atualizar, mesmo se estiver vazio
      setFilteredTipoAtendimento(atendimentoPorNotificacao);
      if (atendimentoPorNotificacao.length > 0 && originalTipoAtendimento.length === 0) {
        setOriginalTipoAtendimento(atendimentoPorNotificacao);
      }

      // Público como gráfico de rosca - usar paleta pie
      const dadosSemFiltroPublico = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'publico') : notificacoesFiltradasPorEvento;
      const publicoPorNotificacao = processarCategoria(
        dadosSemFiltroPublico,
        "original.tipo_publico_idtipo_publico",
        exportOptions.publicoOptions || [],
        "idtipo_publico",
        "descricao",
        COLORS.pie,
        'pie'
      );
      // Sempre atualizar, mesmo se estiver vazio
      setFilteredPublico(publicoPorNotificacao);
      if (publicoPorNotificacao.length > 0 && originalPublico.length === 0) {
        setOriginalPublico(publicoPorNotificacao);
      }

      const dadosSemFiltroHipotese = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'hipotese') : notificacoesFiltradasPorEvento;
      const hipotesePorNotificacao = processarCategoria(
        dadosSemFiltroHipotese,
        "original.tipo_hipotese_diag_idtipo_hipotese_diag",
        exportOptions.hipoteseDiagOptions || [],
        "idtipo_hipotese_diag",
        "descricao",
        COLORS.blue,
        'normal'
      );
      if (hipotesePorNotificacao.length > 0) {
        // Ordenar hipóteses: primeiro alarmantes, depois valor
        const sortedHipoteses = hipotesePorNotificacao.sort((a, b) => {
          // Primeiro ordenar por alarmante (alarmantes primeiro)
          if (a.isAlarmante && !b.isAlarmante) return -1;
          if (!a.isAlarmante && b.isAlarmante) return 1;
          // Depois por valor (maior primeiro)
          return b.value - a.value;
        });
        
        setFilteredHipoteses(sortedHipoteses);
        if (originalHipoteses.length === 0) {
          setOriginalHipoteses(sortedHipoteses);
        }
      } else {
        // Se não houver hipóteses, limpar o array
        setFilteredHipoteses([]);
      }
      
      // Verificar se há notificações com trauma - agora usando o relacionamento many-to-many
      const notificacoesComTrauma = dadosFiltrados.filter(n => 
        n?.original?.notificacao_has_tipo_trauma && 
        Array.isArray(n.original.notificacao_has_tipo_trauma) && 
        n.original.notificacao_has_tipo_trauma.length > 0
      );
      if (notificacoesComTrauma.length > 0) {
      }

      const dadosSemFiltroTrauma = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'trauma') : notificacoesFiltradasPorEvento;
      const traumaPorNotificacao = processarCategoriaMuitosParaMuitos(
        dadosSemFiltroTrauma,
        "original.notificacao_has_tipo_trauma",
        "tipo_trauma_idtipo_trauma",
        exportOptions.traumaOptions || [],
        "idtipo_trauma",
        "descricao",
        COLORS.trauma,
        'normal'
      );
      // Sempre atualizar, mesmo se estiver vazio
      setFilteredTrauma(traumaPorNotificacao);
      if (traumaPorNotificacao.length > 0 && originalTrauma.length === 0) {
        setOriginalTrauma(traumaPorNotificacao);
      }
      
      // 🆕 PROCESSAMENTO DOS DADOS DE LOCALIZAÇÃO GEOGRÁFICA
      // País de residência - usar função específica com cores individuais
      console.log("🏳️ Processando países do backend:", exportOptions.paisOptions?.length || 0, "países disponíveis");
      if (exportOptions.paisOptions?.length > 0) {
        console.log("🌍 Lista de países:", exportOptions.paisOptions.map((p: any) => p.descricao).sort());
      }
      
      const dadosSemFiltroPais = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'pais') : notificacoesFiltradasPorEvento;
      const paisPorNotificacao = processarPaises(
        dadosSemFiltroPais,
        "original.tipo_pais_idtipo_pais",
        exportOptions.paisOptions || [],
        "idtipo_pais",
        "descricao"
      );
      // Sempre atualizar, mesmo se estiver vazio
      console.log("🏳️ Países com dados:", paisPorNotificacao.map(p => `${p.name} (${p.value})`));
      setFilteredPais(paisPorNotificacao);
      if (paisPorNotificacao.length > 0 && originalPais.length === 0) {
        setOriginalPais(paisPorNotificacao);
      }

      // Estado/UF de residência com cores características dos estados brasileiros
      const dadosSemFiltroEstado = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'estado') : notificacoesFiltradasPorEvento;
      const estadoPorNotificacao = processarEstados(
        dadosSemFiltroEstado,
        "original.tipo_estado_idtipo_estado",
        exportOptions.estadoOptions || [],
        "idtipo_estado", 
        "descricao"
      );
      // Sempre atualizar, mesmo se estiver vazio
      setFilteredEstado(estadoPorNotificacao);
      if (estadoPorNotificacao.length > 0 && originalEstado.length === 0) {
        setOriginalEstado(estadoPorNotificacao);
      }

      // Municípios de residência
      const dadosSemFiltroMunicipio = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'municipio') : notificacoesFiltradasPorEvento;
      const municipioPorNotificacao = processarCategoria(
        dadosSemFiltroMunicipio,
        "original.tipo_municipio_idtipo_municipio",
        exportOptions.municipioOptions || [],
        "idtipo_municipio",
        "descricao", 
        COLORS.blue,
        'normal'
      );
      // Sempre atualizar, mesmo se estiver vazio
      setFilteredMunicipio(municipioPorNotificacao);
      if (municipioPorNotificacao.length > 0 && originalMunicipio.length === 0) {
        setOriginalMunicipio(municipioPorNotificacao);
      }

      // Bairros de residência (específicos de Belém)
      const dadosSemFiltroBairro = hasActiveFilters ? applyFilters(notificacoesFiltradasPorEvento, 'bairro') : notificacoesFiltradasPorEvento;
      const bairroPorNotificacao = processarCategoria(
        dadosSemFiltroBairro,
        "original.tipo_bairro_idtipo_bairro",
        exportOptions.bairroOptions || [],
        "idtipo_bairro",
        "descricao",
        COLORS.blue,
        'normal'
      );
      // Sempre atualizar, mesmo se estiver vazio
      setFilteredBairro(bairroPorNotificacao);
      if (bairroPorNotificacao.length > 0 && originalBairro.length === 0) {
        setOriginalBairro(bairroPorNotificacao);
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao processar dados para gráficos:", error);
      return false;
    }
  }, [exportOptions, processarCategoria, processarCategoriaMuitosParaMuitos, processarPaises,
      originalRaca, originalEscolaridade, originalUnidades, originalGenero, 
      originalSintomas, originalTipoAtendimento, originalPublico, 
      originalHipoteses, originalTrauma, 
      // 🆕 INCLUIR ESTADOS ORIGINAIS DE LOCALIZAÇÃO GEOGRÁFICA
      originalPais, originalEstado, originalMunicipio, originalBairro,
      // 🔧 CORREÇÃO: Incluir dependências de filtros para que os gráficos sejam reprocessados
      applyFilters, hasActiveFilters, notificacoesFiltradasPorEvento, activeFilters]);

  // Função para calcular estatísticas a partir das notificações
  const calcularEstatisticas = useCallback((dadosFiltrados: any[] = []) => {
    // 🆕 CORREÇÃO: Se dadosFiltrados está vazio, use array vazio (não use notificacoes como fallback)
    // Isso garante que quando filtro resulta em 0 notificações, o dashboard mostra 0 (correto)
    const dados = dadosFiltrados;
    
    if (!Array.isArray(dados)) {
      console.error("dados não é um array:", dados);
      return false;
    }

    try {
      // Total de notificações
      const total = dados.length;
      setTotalNotifications(total);

      // Inicializar contagens
      const counts: StatCounts = {
        clinico: 0,
        trauma: 0,
        multiplas: 0,
        qbrn: 0
      };

      // Contar por tipo de atendimento com base nas descrições
      dados.forEach(n => {
        // Obter tipo de atendimento
        const tipoId = n?.original?.tipo_atendimento_idtipo_atendimento;
        let tipoDesc = "";
        
        if (tipoId !== undefined) {
          tipoDesc = getAtendimentoDescById(tipoId);
        } else if (n?.original?.tipo_atendimento?.descricao) {
          tipoDesc = n.original.tipo_atendimento.descricao;
        } else if (n?.tipoAtendimento) {
          tipoDesc = n.tipoAtendimento;
        }
        
        // Classificar baseado na descrição (case insensitive)
        const lowerDesc = tipoDesc.toLowerCase();
        
        if (lowerDesc.includes("clínico") || lowerDesc.includes("clinico")) {
          counts.clinico++;
        } else if (lowerDesc.includes("trauma")) {
          counts.trauma++;
        } else if (lowerDesc.includes("múltiplas vítimas") || lowerDesc.includes("multiplas vitimas")) {
          counts.multiplas++;
        } else if (lowerDesc.includes("qbrn") || lowerDesc.includes("incidente q")) {
          counts.qbrn++;
        }
      });

      console.log("Contagens calculadas:", counts);
      setStatCounts(counts);

      // Processar dados para gráficos
      const processResult = processarDadosGraficos(dados);
      return processResult;
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);
      return false;
    }
  }, [processarDadosGraficos, getAtendimentoDescById]);

  // 🆕 FUNÇÃO MELHORADA PARA PROCESSAR DADOS COM FILTROS CRUZADOS
  // 🆕 FUNÇÃO PARA PROCESSAR DADOS COM FILTROS CRUZADOS
  const processarDadosComFiltros = useCallback(() => {
    console.log('🔄 processarDadosComFiltros - Iniciando...');
    console.log('   - notificacoesFiltradasPorEvento:', notificacoesFiltradasPorEvento.length);
    console.log('   - activeFilters:', activeFilters);
    
    const dadosFiltrados = getFilteredData();
    console.log('   - dadosFiltrados resultado:', dadosFiltrados.length);
    
    // Atualizar dados filtrados de referência
    filteredNotificacoes.current = dadosFiltrados;
    
    // 🆕 ATUALIZAR DATAS DISPONÍVEIS BASEADAS NOS DADOS FILTRADOS
    // 🆕 CORREÇÃO: Usar notificações filtradas por evento como base
    const baseData = notificacoesFiltradasPorEvento;
    let dadosParaDatas = [...baseData];
    
    // Aplicar todos os filtros ativos exceto o filtro de data usando a função applyFilters
    const filtrosSemData = { ...activeFilters };
    delete filtrosSemData.dataNotificacao;
    
    // Se há filtros ativos além da data, aplicá-los
    if (Object.keys(filtrosSemData).some(key => filtrosSemData[key] && filtrosSemData[key] !== 'todos')) {
      // Criar um filtro temporário sem a data
      Object.entries(filtrosSemData).forEach(([filterType, filterValue]) => {
        if (filterValue && filterValue !== 'todos') {
          console.log('🎯 Aplicando filtro para datas:', { filterType, filterValue });
          switch (filterType) {
            case 'evento':
              // 🆕 CORREÇÃO: Não precisa mais filtrar por evento aqui
              // dadosParaDatas já vem de notificacoesFiltradasPorEvento (já filtrado)
              console.log('✅ Filtro de evento já aplicado (via notificacoesFiltradasPorEvento)');
              break;
            case 'categoria':
              const dadosFiltradosCategoria = filtrarNotificacoes(filterValue);
              dadosParaDatas = dadosFiltradosCategoria;
              break;
            // Adicionar outros filtros conforme necessário
          }
        }
      });
    }
    
    // Extrair datas das notificações filtradas (sem filtro de data)
    const todasDatasDisponiveis = extrairDatasNotificacao(dadosParaDatas);
    
    // 🆕 FILTRAR: Remover datas que têm 0 notificações do evento selecionado
    const datasComNotificacoes = todasDatasDisponiveis.filter(data => {
      const totalDia = contarNotificacoesPorData(dadosParaDatas, data);
      return totalDia > 0; // Só incluir datas com pelo menos 1 notificação
    });
    
    // Debug para verificar integração
    console.log('🔍 DEBUG Filtros:', {
      filtrosAtivos: activeFilters,
      filtrosSemData: filtrosSemData,
      totalOriginais: originalNotificacoes.current.length,
      dadosAposFiltros: dadosParaDatas.length,
      todasDatas: todasDatasDisponiveis.length,
      datasComDados: datasComNotificacoes.length,
      amostraDatas: datasComNotificacoes.slice(0, 3),
      eventoAtivo: activeFilters.evento
    });
    
    setDatasNotificacaoDisponiveis(datasComNotificacoes);
    
    // Recalcular estatísticas e gráficos
    console.log('🔄 Chamando calcularEstatisticas com', dadosFiltrados.length, 'notificações');
    
    // 🆕 MELHORIA: Se dadosFiltrados está vazio E há filtro de data,
    // mostrar dados do evento SEM filtro de data (total do evento)
    if (dadosFiltrados.length === 0 && activeFilters.dataNotificacao) {
      console.log('⚠️ Nenhuma notificação para a data selecionada - mostrando total do evento');
      calcularEstatisticas(notificacoesFiltradasPorEvento);
    } else {
      calcularEstatisticas(dadosFiltrados);
    }
  }, [getFilteredData, calcularEstatisticas, activeFilters, exportOptions, extrairDatasNotificacao, filtrarNotificacoes, notificacoesFiltradasPorEvento, contarNotificacoesPorData]);

  // Função para buscar dados frescos do servidor
  const fetchFreshData = useCallback(async () => {
    try {
      // 🆕 PASSO 1: Buscar eventos ativos para filtrar
      const eventosAtivos = exportOptions?.eventoOptions || [];
      const idsEventosAtivos = new Set(eventosAtivos.map((e: any) => e.idtipo_evento));
      
      console.log(`🔍 Buscando notificações... (${idsEventosAtivos.size} eventos ativos)`);
      
      // PASSO 2: Buscar notificações da API
      const response = await NotificacaoService.getAll(1, 1000);
      const allData = response.data || [];
      
      console.log(`📥 Dados frescos recebidos: ${allData.length} notificações`);
      
      // 🆕 PASSO 3: Filtrar apenas notificações de eventos ativos (igual ao DashboardPageCirio)
      const freshData = allData.filter((notificacao: any) => {
        const idEvento = notificacao.original?.tipo_evento?.idtipo_evento || 
                        notificacao.idtipo_evento || 
                        notificacao.tipo_evento?.idtipo_evento;
        
        return idEvento && idsEventosAtivos.has(idEvento);
      });
      
      console.log(`✅ Filtro aplicado: ${allData.length} → ${freshData.length} notificações (apenas eventos ativos)`);
      
      // Verificar se temos dados novos
      if (freshData && Array.isArray(freshData) && freshData.length > 0) {
        // Atualizar as notificações originais
        originalNotificacoes.current = [...freshData];
        return freshData;
      }
      
      return null;
    } catch (error) {
      console.error("Erro ao buscar dados do servidor:", error);
      
      // Em caso de erro, tentar usar dados locais se disponíveis
      if (notificacoes && notificacoes.length > 0) {
        console.log("Usando dados locais como fallback...");
        const mockData = [...notificacoes];
        originalNotificacoes.current = [...mockData];
        return mockData;
      }
      
      return null;
    }
  }, [notificacoes, exportOptions]);

  // Função para atualizar os dados
  const refreshData = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log("⏳ Atualização já em andamento, aguardando...");
      return; // Evita atualizações simultâneas
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      // Buscar dados frescos do servidor usando o NotificacaoService
      const freshData = await fetchFreshData();
      console.log(`📊 Dados recebidos: ${freshData?.length || 0} notificações`);
      
      // Se conseguimos novos dados, processar
      if (freshData) {
        // 🆕 PRESERVAR SELEÇÃO DE DATA DURANTE ATUALIZAÇÃO
        const dataAtualmenteSeleciona = selectedDataNotificacao;
        
        // Extrair novas datas disponíveis
        const novasDatasDisponiveis = extrairDatasNotificacao(freshData);
        setDatasNotificacaoDisponiveis(novasDatasDisponiveis);
        
        // Recalcular total de notificações para a data selecionada (se houver)
        if (dataAtualmenteSeleciona) {
          const novoTotalDia = contarNotificacoesPorData(freshData, dataAtualmenteSeleciona);
          setTotalNotificacoesDia(novoTotalDia);
        }
        
        // Notificar o componente pai sobre novos dados
        if (onDataRefresh && freshData.length !== notificacoes.length) {
          console.log("🔔 Notificando componente pai sobre novos dados...");
          onDataRefresh(freshData);
        }
        
        console.log("📈 Atualizando dados locais...");
        
        // 🆕 USAR SISTEMA DE FILTROS CRUZADOS DURANTE ATUALIZAÇÃO
        const hasActiveFilter = Object.values(activeFilters).some(filter => filter !== null);
        
        if (hasActiveFilter) {
          // 🆕 CORREÇÃO: Aplicar filtros nas notificações já filtradas por evento
          const dadosComFiltrosCruzados = applyFilters(notificacoesFiltradasPorEvento);
          filteredNotificacoes.current = dadosComFiltrosCruzados;
          calcularEstatisticas(dadosComFiltrosCruzados);
        } else if (selectedCategory) {
          // Fallback para sistema antigo (compatibilidade)
          const dadosFiltrados = filtrarNotificacoes(selectedCategory);
          filteredNotificacoes.current = dadosFiltrados;
          calcularEstatisticas(dadosFiltrados);
        } else {
          // 🆕 CORREÇÃO: Sem filtros ativos, usar notificações filtradas por evento
          filteredNotificacoes.current = notificacoesFiltradasPorEvento;
          calcularEstatisticas(notificacoesFiltradasPorEvento);
        }
      } else {
        // Se não conseguirmos novos dados, verificar props
        console.log("⚠️ Nenhum dado fresco obtido, verificando notificações via props...");
        if (notificacoes && notificacoes.length > 0 && 
            notificacoes.length !== originalNotificacoes.current.length) {
          console.log("🔄 Detectada diferença nas notificações:", 
                     "Original:", originalNotificacoes.current.length, 
                     "Novas:", notificacoes.length);
          
          // 🆕 PRESERVAR SELEÇÃO DE DATA DURANTE ATUALIZAÇÃO (PROPS)
          const dataAtualmenteSeleciona = selectedDataNotificacao;
          
          // Substituir os dados originais pelos novos
          originalNotificacoes.current = [...notificacoes];
          
          // Extrair novas datas disponíveis
          const novasDatasDisponiveis = extrairDatasNotificacao(notificacoes);
          setDatasNotificacaoDisponiveis(novasDatasDisponiveis);
          
          // Recalcular total de notificações para a data selecionada (se houver)
          if (dataAtualmenteSeleciona) {
            const novoTotalDia = contarNotificacoesPorData(notificacoes, dataAtualmenteSeleciona);
            setTotalNotificacoesDia(novoTotalDia);
          }
          
          initialProcessingDone.current = false;
        }
        
        // Reprocessar dados com filtros cruzados
        const hasActiveFilter = Object.values(activeFilters).some(filter => filter !== null);
        
        if (hasActiveFilter) {
          // 🆕 CORREÇÃO: Aplicar filtros nas notificações já filtradas por evento
          const dadosComFiltrosCruzados = applyFilters(notificacoesFiltradasPorEvento);
          filteredNotificacoes.current = dadosComFiltrosCruzados;
          calcularEstatisticas(dadosComFiltrosCruzados);
        } else if (selectedCategory) {
          const dadosFiltrados = filtrarNotificacoes(selectedCategory);
          filteredNotificacoes.current = dadosFiltrados;
          calcularEstatisticas(dadosFiltrados);
        } else {
          // 🆕 CORREÇÃO: Sem filtros ativos, usar notificações filtradas por evento
          filteredNotificacoes.current = notificacoesFiltradasPorEvento;
          calcularEstatisticas(notificacoesFiltradasPorEvento);
        }
      }

      // Reativa processamento inicial para que o filtro de eventos funcione
      initialProcessingDone.current = true;
      
    } catch (error) {
      console.error("❌ Erro na atualização:", error);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
      setLastUpdate(new Date().toLocaleString());
    }
  }, [selectedCategory, selectedDataNotificacao, activeFilters, fetchFreshData, notificacoes, filtrarNotificacoes, calcularEstatisticas, onDataRefresh, extrairDatasNotificacao, contarNotificacoesPorData, applyFilters, notificacoesFiltradasPorEvento]);

  // 🔧 CORREÇÃO: Atribuir refreshData ao ref para que o auto-refresh funcione
  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  // Efeito para gerenciar o auto refresh
  useEffect(() => {
    // Limpar qualquer intervalo existente
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }

    // Se a atualização automática está habilitada, configurar o intervalo
    if (autoRefreshEnabled) {
      // Configurar o contador regressivo - 60 segundos (1 minuto)
      setAutoRefreshCountdown(60);
      
      // Atualizar o contador a cada segundo
      const countdownTimer = setInterval(() => {
        setAutoRefreshCountdown(prev => {
          const newCountdown = prev - 1;
          
          // Quando o contador chegar a zero, atualizar os dados
          if (newCountdown <= 0) {
            refreshDataRef.current && refreshDataRef.current();
            return 60; // Resetar para 60 segundos
          }
          
          return newCountdown;
        });
      }, 1000);
      
      autoRefreshInterval.current = countdownTimer;
    }

    // Limpar o intervalo ao desmontar
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };
  }, [autoRefreshEnabled]);

  // 🆕 EFEITO PARA APLICAR FILTROS CRUZADOS
  useEffect(() => {
    if (!initialProcessingDone.current) {
      console.log('⏳ Filtros cruzados: aguardando processamento inicial...');
      return;
    }
    
    console.log('🔄 Aplicando filtros cruzados:', activeFilters);
    setLoading(true);
    processarDadosComFiltros();
    setLoading(false);
  }, [activeFilters, processarDadosComFiltros]);

  // Quando a categoria selecionada mudar, aplicar filtro real (LEGACY - manter compatibilidade)
  useEffect(() => {
    if (!initialProcessingDone.current || hasActiveFilters) return; // Não processar se há filtros cruzados ativos
    
    setLoading(true);
    const dadosFiltrados = filtrarNotificacoes(selectedCategory);
    filteredNotificacoes.current = dadosFiltrados;

    if (dadosFiltrados.length === 0) {
      // sem notificações: zerar totais e limpar gráficos
      setTotalNotifications(0);
      setStatCounts({ clinico:0, trauma:0, multiplas:0, qbrn:0 });
      setFilteredRaca([]); setFilteredEscolaridade([]); setFilteredUnidades([]);
      setFilteredSintomas([]); setFilteredTipoAtendimento([]); setFilteredPublico([]);
      setFilteredHipoteses([]); setFilteredTrauma([]); setFilteredGenero([]);
    } else {
      calcularEstatisticas(dadosFiltrados);
    }

    setLoading(false);
  }, [selectedCategory, filtrarNotificacoes, calcularEstatisticas, hasActiveFilters]);

  // useEffect para processamento inicial de dados
  useEffect(() => {
    // Sempre armazenar as notificações originais quando recebermos novas
    if (notificacoes && notificacoes.length > 0) {
      originalNotificacoes.current = [...notificacoes];
      
      // 🆕 INICIALIZAR DATAS DE NOTIFICAÇÃO DISPONÍVEIS
      const datasDisponiveis = extrairDatasNotificacao(notificacoes);
      setDatasNotificacaoDisponiveis(datasDisponiveis);
      
      // Definir data atual como padrão se não houver data selecionada E for a primeira vez
      if (!selectedDataNotificacao && datasDisponiveis.length > 0 && !initialProcessingDone.current) {
        const dataAtual = obterDataAtual();
        // Se a data atual existe nas datas disponíveis, selecioná-la
        if (datasDisponiveis.includes(dataAtual)) {
          console.log('🗓️ DEBUG: Inicializando com data atual:', dataAtual);
          console.log('🔍 DEBUG: Dados disponíveis antes da inicialização:', datasDisponiveis);
          console.log('🔍 DEBUG: ActiveFilters antes da inicialização:', activeFilters);
          
          setSelectedDataNotificacao(dataAtual);
          
          // IMPORTANTE: Primeiro atualizar activeFilters, depois processar os dados
          setActiveFilters(prev => {
            const novosFilters = { ...prev, dataNotificacao: dataAtual };
            console.log('📋 DEBUG: ActiveFilters após inicialização de data:', novosFilters);
            return novosFilters;
          });
          
          // 🆕 CORREÇÃO: Usar notificações filtradas por evento
          const totalDia = contarNotificacoesPorData(notificacoesFiltradasPorEvento, dataAtual);
          setTotalNotificacoesDia(totalDia);
          console.log('📊 DEBUG: Total de notificações para', dataAtual, ':', totalDia);
          
          // 🆕 IMPORTANTE: NÃO deixar doInitialProcessing executar agora
          // O useEffect de activeFilters (linha 2377) vai processar corretamente
          return; // Interrompe aqui para evitar race condition
        }
      } else if (selectedDataNotificacao) {
        // 🆕 MODO "SEMPRE ÚLTIMA DATA": Atualizar automaticamente para a data mais recente
        if (selectedDataNotificacao === 'ultima-data') {
          const dataMaisRecente = datasDisponiveis[0]; // Primeira do array = mais recente
          
          if (dataMaisRecente) {
            // Sempre usar a data mais recente quando estiver neste modo
            const totalDiaNovo = contarNotificacoesPorData(notificacoesFiltradasPorEvento, dataMaisRecente);
            
            // Só atualizar activeFilters se a data mudou
            setActiveFilters(prev => {
              if (prev.dataNotificacao !== dataMaisRecente) {
                console.log('🔄 Modo "Sempre última data": Atualizando para', dataMaisRecente);
                return { ...prev, dataNotificacao: dataMaisRecente };
              }
              return prev;
            });
            
            setTotalNotificacoesDia(totalDiaNovo);
          }
        } else {
          // Data específica selecionada manualmente
          // Se já temos uma data selecionada, verificar sincronização com activeFilters
          // 🆕 CORREÇÃO: Usar notificações filtradas por evento
          const totalDiaAtualizado = contarNotificacoesPorData(notificacoesFiltradasPorEvento, selectedDataNotificacao);
          setTotalNotificacoesDia(totalDiaAtualizado);
          
          // Garantir sincronização com activeFilters
          setActiveFilters(prev => {
            if (prev.dataNotificacao !== selectedDataNotificacao) {
              console.log('🔄 Sincronizando data selecionada com activeFilters:', selectedDataNotificacao);
              return { ...prev, dataNotificacao: selectedDataNotificacao };
            }
            return prev;
          });
        }
      }
    }
    
    // Esta flag useRef garante que não faremos o processamento repetidamente se não for necessário
    if (initialProcessingDone.current && notificacoes.length === 0) {
      return;
    }

    const doInitialProcessing = async () => {
      try {
        setLoading(true);
        
        // Verificação de segurança
        if (!notificacoes || !Array.isArray(notificacoes) || notificacoes.length === 0) {
          setTotalNotifications(0);
          setStatCounts({
            clinico: 0,
            trauma: 0,
            multiplas: 0,
            qbrn: 0
          });

          // Limpar todos os gráficos com arrays vazios  
          setOriginalRaca([]);
          setOriginalEscolaridade([]);
          setOriginalUnidades([]);
          setOriginalSintomas([]);
          setOriginalTipoAtendimento([]);
          setOriginalPublico([]);
          setOriginalHipoteses([]);
          setOriginalTrauma([]);
          setOriginalGenero([]);
          
          setFilteredRaca([]);
          setFilteredEscolaridade([]);
          setFilteredUnidades([]);
          setFilteredSintomas([]);
          setFilteredTipoAtendimento([]);
          setFilteredPublico([]);
          setFilteredHipoteses([]);
          setFilteredTrauma([]);
          setFilteredGenero([]);
        } else {
          console.log("Iniciando processamento de dados com", notificacoes.length, "notificações");
          
          // 🆕 CORREÇÃO: Sempre partir de notificações filtradas por evento
          const hasActiveFilter = Object.values(activeFilters).some(f => f !== null);
          const base = Array.isArray(notificacoesFiltradasPorEvento) ? notificacoesFiltradasPorEvento : [];
          const dadosFiltrados = hasActiveFilter ? applyFilters(base) : base;
          
          filteredNotificacoes.current = dadosFiltrados;
          const success = calcularEstatisticas(dadosFiltrados);
          console.log("Processamento de dados concluído com sucesso:", success);
        }
        
        // Marcar que o processamento inicial foi concluído
        initialProcessingDone.current = true;
      } catch (error) {
        console.error("Erro no processamento inicial:", error);
        
        // Em caso de erro, mostrar zeros
        setTotalNotifications(0);
        setStatCounts({
          clinico: 0,
          trauma: 0,
          multiplas: 0,
          qbrn: 0
        });
      } finally {
        setLoading(false);
        setLastUpdate(new Date().toLocaleString());
      }
    };

    // Iniciar o processamento
    doInitialProcessing();
    
  }, [notificacoes, calcularEstatisticas, notificacoesFiltradasPorEvento, applyFilters, activeFilters, extrairDatasNotificacao, selectedDataNotificacao, obterDataAtual, contarNotificacoesPorData, exportOptions]);

  // Usar dados reais para eventos
  const eventoOptions = exportOptions?.eventoOptions?.length > 0 
    ? ["Todos", ...exportOptions.eventoOptions.map((e: any) => e.descricao)]
    : ["Todos", "COP30", "Carnaval", "Copa do Mundo Feminina", "Círio de Nazaré"];

  const handleRefresh = useCallback(() => {
    refreshDataRef.current && refreshDataRef.current();
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev);
  }, []);

  const handleEventoChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoEvento = e.target.value;
    console.log(`🎯 Evento alterado para: ${novoEvento}`);
    
    setSelectedEvento(novoEvento);
    setSelectedCategory(novoEvento !== "Todos" ? novoEvento : null);
    
    // CORREÇÃO: Sincronizar com activeFilters para integração com filtro de data
    const eventoValue = novoEvento !== "Todos" ? novoEvento : null;
    setActiveFilters(prev => ({
      ...prev,
      evento: eventoValue
    }));
    
    console.log(`✅ ActiveFilters.evento atualizado para:`, eventoValue);
  }, []);

  // Handler para cards e charts - ATUALIZADO para filtros cruzados (com suporte a Ctrl)
  const handleCardClick = useCallback((tipoAtendimento: string, multiSelect = false) => {
    console.log(`Card clicado: ${tipoAtendimento}`, multiSelect ? '(Ctrl pressionado)' : '');
    
    // Mapear para descrição correta
    let descricao = tipoAtendimento;
    
    // Verificar se é um dos tipos especiais
    const tipoLower = tipoAtendimento.toLowerCase();
    if (tipoLower.includes('clinico') || tipoLower === 'clinico') {
      // Buscar a descrição real do tipo clínico nas opções
      const clinico = exportOptions?.atendimentoOptions?.find(
        (opt: any) => opt.descricao.toLowerCase().includes('clínico') || opt.descricao.toLowerCase().includes('clinico')
      );
      descricao = clinico?.descricao || "Clínico";
    } else if (tipoLower.includes('trauma') || tipoLower === 'trauma') {
      const trauma = exportOptions?.atendimentoOptions?.find(
        (opt: any) => opt.descricao.toLowerCase().includes('trauma')
      );
      descricao = trauma?.descricao || "Trauma";
    } else if (tipoLower.includes('multiplas') || tipoLower === 'multiplas') {
      const multiplas = exportOptions?.atendimentoOptions?.find(
        (opt: any) => opt.descricao.toLowerCase().includes('múltiplas') || opt.descricao.toLowerCase().includes('multiplas')
      );
      descricao = multiplas?.descricao || "Múltiplas Vítimas";
    } else if (tipoLower.includes('qbrn') || tipoLower === 'qbrn') {
      const qbrn = exportOptions?.atendimentoOptions?.find(
        (opt: any) => opt.descricao.toLowerCase().includes('qbrn') || opt.descricao.toLowerCase().includes('incidente q')
      );
      descricao = qbrn?.descricao || "Incidente QBRN";
    }
    
    // Usar o novo sistema de filtros cruzados
    toggleFilter('tipoAtendimento', descricao, multiSelect);
  }, [exportOptions, toggleFilter]);

  // 🆕 HANDLER GENÉRICO PARA CLIQUES EM GRÁFICOS (com suporte a Ctrl para seleção múltipla)
  const handleChartClick = useCallback((category: string, itemName: string, multiSelect = false) => {
    console.log(`🎯 Gráfico clicado: ${category} -> ${itemName}`, multiSelect ? '(Ctrl pressionado)' : '');
    toggleFilter(category, itemName, multiSelect);
  }, [toggleFilter]);

  // Handler para o botão de voltar
  const handleBackButton = useCallback(() => {
    window.history.back();
  }, []);

  // Definir um tipo para as chaves do objeto chartType
  type ChartTypes = 'tipoAtendimento' | 'publico' | 'genero' | 'raca' | 'hipoteses' | 'sintomas';
  
  // Estado para controlar o tipo de gráfico (barras ou pizza)
  const [chartType, setChartType] = useState({
    tipoAtendimento: 'bar',
    publico: 'pie',
    genero: 'pie',
    raca: 'bar',
    hipoteses: 'bar',
    sintomas: 'bar'
  });
  
  // Função para alternar o tipo de gráfico
  const toggleChartType = useCallback((chartName: ChartTypes): void => {
    setChartType(prev => ({
      ...prev,
      [chartName]: prev[chartName] === 'bar' ? 'pie' : 'bar'
    }));
  }, []);

  // FUNÇÃO: Obter classes de container
  const getContainerClasses = useCallback(() => {
    return 'min-h-screen bg-gray-100 text-gray-800 pb-6';
  }, []);

  // FUNÇÃO: Obter classes do header
  const getHeaderClasses = useCallback(() => {
    return 'bg-gradient-to-r from-blue-700 to-blue-900 p-3 sm:p-4 shadow-md sticky top-0 z-10';
  }, []);

  // FUNÇÃO: Verificar se deve esconder controles
  const shouldHideControls = useCallback(() => {
    return false;
  }, []);

  // FUNÇÃO: Obter max-width do container - Otimizado para 4 gráficos por linha (largura total)
  const getMaxWidth = useCallback(() => {
    return 'max-w-[1920px]'; // Largura total para aproveitar toda a tela
  }, []);

  // 🆕 Estado para pesquisa no modal
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  // 🆕 COMPONENTE DO MODAL DE FICHAS
  const FichasModal = useMemo(() => {
    if (!showFichasModal) return null;

    // Obter os dados filtrados atuais e ordenar por data de criação (mais recentes primeiro)
    const fichasFiltradas = [...filteredNotificacoes.current].sort((a: any, b: any) => {
      const dateA = new Date((a.original || a).data_notificacao || 0).getTime();
      const dateB = new Date((b.original || b).data_notificacao || 0).getTime();
      return dateB - dateA; // Ordem decrescente (mais recentes primeiro)
    });
    
    // Filtrar fichas baseado no termo de pesquisa
    const fichasPesquisadas = fichasFiltradas.filter((notificacao: any) => {
      if (!modalSearchTerm) return true;
      
      const original = notificacao.original || notificacao;
      const termo = modalSearchTerm.toLowerCase();
      
      // Pesquisar em múltiplos campos
      const getDescById = (options: any[], id: any, idField: string, descField: string) => {
        if (!options || !Array.isArray(options)) return 'N/A';
        const item = options.find((opt: any) => String(opt[idField]) === String(id));
        return item ? item[descField] : 'N/A';
      };
      
      return (
        original.idnotificacao?.toString().includes(termo) ||
        original.paciente?.nome?.toLowerCase().includes(termo) ||
        original.paciente?.cpf?.includes(termo) ||
        getDescById(
          exportOptions?.estabelecimentoOptions || [],
          original.estabelecimento_idestabelecimento,
          'idestabelecimento',
          'nome'
        )?.toLowerCase().includes(termo) ||
        getDescById(
          exportOptions?.hipoteseDiagOptions || [],
          original.tipo_hipotese_diag_idtipo_hipotese_diag,
          'idtipo_hipotese_diag',
          'descricao'
        )?.toLowerCase().includes(termo)
      );
    });
    
    // Função para formatar data
    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return dateString;
      }
    };

    // Função para obter descrição por ID
    const getDescById = (options: any[], id: any, idField: string, descField: string) => {
      if (!options || !Array.isArray(options)) return 'N/A';
      const item = options.find((opt: any) => String(opt[idField]) === String(id));
      return item ? item[descField] : 'N/A';
    };

    // 🆕 Função para formatar idade corretamente (idade vem em MESES do banco)
    const formatIdade = (idade: number | null | undefined): string => {
      if (!idade || isNaN(Number(idade))) return 'N/A';
      
      const idadeMeses = Number(idade);
      
      // Se for menor que 12 meses, mostrar em meses
      if (idadeMeses < 12) {
        return `${idadeMeses} ${idadeMeses === 1 ? 'mês' : 'meses'}`;
      }
      
      // Se for 12 meses ou mais, converter para anos
      const anos = Math.floor(idadeMeses / 12);
      return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
    };

    // 🆕 Função para abrir modal de detalhes do paciente
    const abrirDetalhesPaciente = (notificacao: any) => {
      const original = notificacao.original || notificacao;
      setPacienteSelecionado(original);
      setShowPacienteModal(true);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[80vh] overflow-hidden">
          {/* Header do Modal */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Fichas de Notificação
                  </h2>
                  <p className="text-sm text-gray-600">
                    {fichasPesquisadas.length} de {fichasFiltradas.length} ficha(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFichasModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Campo de Pesquisa */}
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar por nome, CPF, ID, estabelecimento ou hipótese..."
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FileSearch2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              {modalSearchTerm && (
                <button
                  onClick={() => setModalSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Conteúdo - Lista de Fichas */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {fichasPesquisadas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <FileSearch2 className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhuma ficha encontrada</p>
                <p className="text-sm">Tente ajustar os filtros</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fichasPesquisadas.map((notificacao: any, index: number) => {
                  const original = notificacao.original || notificacao;
                  return (
                    <div
                      key={original.idnotificacao || index}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Cabeçalho da Ficha */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Notificação #{original.idnotificacao}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {formatDate(original.data_notificacao)}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {getDescById(
                            exportOptions?.atendimentoOptions || [],
                            original.tipo_atendimento_idtipo_atendimento,
                            'idtipo_atendimento',
                            'descricao'
                          )}
                        </span>
                      </div>

                      {/* Grid de Informações */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {/* Paciente */}
                        <div>
                          <span className="text-gray-500 font-medium">Paciente:</span>
                          <p className="text-gray-900">
                            {original.paciente?.nome || 'Não informado'}
                          </p>
                        </div>

                        {/* Idade */}
                        <div>
                          <span className="text-gray-500 font-medium">Idade:</span>
                          <p className="text-gray-900">
                            {formatIdade(original.paciente?.idade)}
                          </p>
                        </div>

                        {/* Sexo */}
                        <div>
                          <span className="text-gray-500 font-medium">Sexo:</span>
                          <p className="text-gray-900">
                            {getDescById(
                              exportOptions?.generoOptions || [],
                              original.paciente?.tipo_genero_idtipo_genero,
                              'idtipo_genero',
                              'descricao'
                            )}
                          </p>
                        </div>

                        {/* Estabelecimento */}
                        <div className="md:col-span-2">
                          <span className="text-gray-500 font-medium">Estabelecimento:</span>
                          <p className="text-gray-900">
                            {getDescById(
                              exportOptions?.estabelecimentoOptions || [],
                              original.estabelecimento_idestabelecimento,
                              'idestabelecimento',
                              'nome'
                            )}
                          </p>
                        </div>

                        {/* Hipótese Diagnóstica */}
                        <div>
                          <span className="text-gray-500 font-medium">Hipótese:</span>
                          <p className="text-gray-900">
                            {getDescById(
                              exportOptions?.hipoteseDiagOptions || [],
                              original.tipo_hipotese_diag_idtipo_hipotese_diag,
                              'idtipo_hipotese_diag',
                              'descricao'
                            )}
                          </p>
                        </div>

                        {/* Público */}
                        <div>
                          <span className="text-gray-500 font-medium">Público:</span>
                          <p className="text-gray-900">
                            {getDescById(
                              exportOptions?.publicoOptions || [],
                              original.tipo_publico_idtipo_publico,
                              'idtipo_publico',
                              'descricao'
                            )}
                          </p>
                        </div>

                        {/* Raça/Cor */}
                        <div>
                          <span className="text-gray-500 font-medium">Raça/Cor:</span>
                          <p className="text-gray-900">
                            {getDescById(
                              exportOptions?.racaOptions || [],
                              original.paciente?.tipo_raca_idtipo_raca,
                              'idtipo_raca',
                              'descricao'
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Observações (se houver) */}
                      {original.observacoes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-gray-500 font-medium text-sm">Observações:</span>
                          <p className="text-gray-700 text-sm mt-1">{original.observacoes}</p>
                        </div>
                      )}

                      {/* Botão Ver Ficha - Centralizado */}
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-center">
                        <button
                          onClick={() => abrirDetalhesPaciente(notificacao)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <Info className="h-3 w-3" />
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer do Modal */}
          <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Total: <strong>{fichasFiltradas.length}</strong> ficha(s)
            </p>
            <button
              onClick={() => setShowFichasModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }, [showFichasModal, filteredNotificacoes, exportOptions, modalSearchTerm]);

  // 🆕 MODAL COM IFRAME DA PÁGINA DE EDIÇÃO DO PACIENTE
  const PacienteDetalhesModal = useMemo(() => {
    if (!showPacienteModal || !pacienteSelecionado) return null;

    const urlFicha = `/private/comunicacao-de-caso/editar/${pacienteSelecionado.idnotificacao}`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Ficha do Paciente</h2>
                <p className="text-blue-100 text-xs">
                  Notificação #{pacienteSelecionado.idnotificacao}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPacienteModal(false)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Fechar e voltar ao dashboard"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Iframe com a página completa */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src={urlFicha}
              className="w-full h-full border-0"
              title="Ficha do Paciente"
            />
          </div>
        </div>
      </div>
    );
  }, [showPacienteModal, pacienteSelecionado]);

  return (
    <div data-dashboard="main" className={getContainerClasses()}>
      {/* Renderizar os Modais */}
      {FichasModal}
      {PacienteDetalhesModal}
      
      {/* Cabeçalho */}
      <header className={getHeaderClasses()}>
        <div className={`mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 ${getMaxWidth()}`}>
          <div className="flex items-center gap-2 sm:gap-3 text-white">
            <button
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              title="Voltar"
              onClick={handleBackButton}
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </button>
            <ClipboardList className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" />
            <h1 className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-semibold leading-tight">
              Comunicação de Eventos
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded text-white text-xs sm:text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Última atualização: {lastUpdate}</span>
              {autoRefreshEnabled && (
                <span className="ml-2 text-yellow-200 whitespace-nowrap">
                  Próxima em: {autoRefreshCountdown}s
                </span>
              )}
              {hasActiveFilters && !shouldHideControls() && (
                <span className="ml-2 bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                  {Object.values(activeFilters).filter(f => f !== null).length} filtro(s)
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 px-2 sm:px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Atualizar</span>
              </button>

              <button
                onClick={toggleAutoRefresh}
                className={`flex items-center justify-center gap-2 px-2 sm:px-3 py-2 rounded transition-colors text-xs sm:text-sm whitespace-nowrap ${
                  autoRefreshEnabled 
                    ? "bg-yellow-500 text-white hover:bg-yellow-600" 
                    : "bg-gray-400 text-white hover:bg-gray-500"
                }`}
              >
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">
                  {autoRefreshEnabled ? "Auto ON" : "Auto OFF"}
                </span>
              </button>

              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`flex items-center justify-center gap-2 px-2 sm:px-3 py-2 rounded transition-colors text-xs sm:text-sm whitespace-nowrap ${
                  showHelp 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "bg-gray-400 text-white hover:bg-gray-500"
                }`}
              >
                <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">
                  {showHelp ? "Ocultar Ajuda" : "Ajuda"}
                </span>
              </button>
              <DashboardExportMenu
                paisData={filteredPais}
                estadoData={filteredEstado}
                municipioData={filteredMunicipio}
                bairroData={filteredBairro}
                publicoData={filteredPublico}
                tipoAtendimentoData={filteredTipoAtendimento}
                generoData={filteredGenero}
                racaData={filteredRaca}
                sintomasData={filteredSintomas}
                traumaData={filteredTrauma}
                hipotesesData={filteredHipoteses}
                totalRecords={filteredNotificacoes.current.length}
                activeFilters={activeFilters}
                buttonVariant="button"
                className="text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>
      </header>

      {/* 🕐 NOVO: Seletor de Período Personalizado */}
      <div className={`${getMaxWidth()} mx-auto mt-4 px-4`}>
        <DateRangeSelector
          startDate={dateRangeConfig.startDate}
          startHour={dateRangeConfig.startHour}
          startMinute={dateRangeConfig.startMinute}
          endDate={dateRangeConfig.endDate}
          endHour={dateRangeConfig.endHour}
          endMinute={dateRangeConfig.endMinute}
          enabled={dateRangeConfig.enabled}
          selectedPublicos={dateRangeConfig.selectedPublicos || []}
          publicoOptions={exportOptions?.publicoOptions || []}
          selectedEstabelecimentos={dateRangeConfig.selectedEstabelecimentos || []}
          estabelecimentoOptions={exportOptions?.estabelecimentoOptions || []}
          onChange={(startDate, startHour, startMinute, endDate, endHour, endMinute, enabled, selectedPublicos, selectedEstabelecimentos) => {
            setDateRangeConfig({ startDate, startHour, startMinute, endDate, endHour, endMinute, enabled, selectedPublicos, selectedEstabelecimentos });
          }}
          onReset={resetDateRange}
          periodStart={periodStart}
          periodEnd={periodEnd}
        />
      </div>

      {/* Seção de Filtros */}
      <div className={`${getMaxWidth()} mx-auto mt-4 px-4`}>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Filter className="h-5 w-5" />
              <span className="font-medium">Filtro:</span>
            </div>

            <div className="flex-1">
              <div className="w-full md:w-64">
                <label className="block text-sm text-gray-600 mb-1">Evento</label>
                <select
                  value={selectedEvento}
                  onChange={handleEventoChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  {eventoOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botão para limpar todos os filtros */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                title="Limpar todos os filtros"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </button>
            )}

            {selectedCategory && (
              <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <span>Filtro ativo: {selectedCategory}</span>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedEvento("Todos");
                  }}
                  className="hover:bg-blue-200 rounded-full p-1"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Mostrar filtros ativos */}
          {hasActiveFilters && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Filtros Ativos:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([category, value]) => {
                  if (value === null) return null;
                  
                  const categoryLabels: Record<string, string> = {
                    evento: 'Evento',
                    tipoAtendimento: 'Tipo de Atendimento',
                    publico: 'Público',
                    genero: 'Sexo',
                    raca: 'Raça/Cor',
                    escolaridade: 'Escolaridade',
                    unidade: 'Unidade',
                    hipotese: 'Hipótese Diagnóstica',
                    trauma: 'Tipo de Trauma',
                    sintoma: 'Sintoma',
                    dataNotificacao: 'Data'
                  };
                  
                  return (
                    <div
                      key={category}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                    >
                      <span className="font-medium">{categoryLabels[category]}:</span>
                      <span>{value}</span>
                      <button
                        onClick={() => toggleFilter(category, value)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                        title={`Remover filtro ${categoryLabels[category]}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Ajuda Expansível */}
      {showHelp && (
        <div className="max-w-7xl mx-auto mt-4 px-4">
          <div className="bg-indigo-50 p-4 rounded-lg shadow-sm border border-indigo-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-indigo-800">
                Dashboard Interativo - Como Usar
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border border-indigo-100">
                <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                  <MousePointer className="h-4 w-4" />
                  Filtros Interativos
                </h4>
                <p className="text-gray-700">
                  Clique em qualquer barra, fatia de pizza ou card para filtrar todos os dados.
                  O dashboard funciona como o Power BI - todos os gráficos se atualizam automaticamente.
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border border-indigo-100">
                <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  Filtros Múltiplos
                </h4>
                <p className="text-gray-700">
                  Você pode aplicar vários filtros ao mesmo tempo. 
                  Cada filtro ativo é mostrado na seção "Filtros Ativos" com opção de remoção individual.
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border border-indigo-100">
                <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                  <RotateCcw className="h-4 w-4" />
                  Limpar Filtros
                </h4>
                <p className="text-gray-700">
                  Use o botão "Limpar Filtros" para remover todos os filtros ativos 
                  e ver o dataset completo.
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border border-indigo-100">
                <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                  <Table className="h-4 w-4" />
                  Visualizações
                </h4>
                <p className="text-gray-700">
                  Alterne entre gráficos de barras e pizza usando os ícones no canto 
                  superior direito de cada gráfico.
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border border-indigo-100">
                <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Auto-Atualização
                </h4>
                <p className="text-gray-700">
                  Os dados são atualizados automaticamente a cada minuto. 
                  Você pode desativar essa função ou forçar uma atualização manual.
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border border-indigo-100">
                <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Alertas Visuais
                </h4>
                <p className="text-gray-700">
                  Hipóteses diagnósticas alarmantes são destacadas com bordas vermelhas.
                  Filtros ativos são indicados por bordas pretas nos elementos selecionados.
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded border border-indigo-100">
              <h4 className="font-semibold text-indigo-700 mb-2">💡 Dica Importante:</h4>
              <p className="text-gray-700">
                Este dashboard replica a funcionalidade do Power BI onde <strong>todos os elementos se comunicam entre si</strong>. 
                Quando você filtra por um tipo de atendimento, por exemplo, todos os outros gráficos (gênero, raça, sintomas, etc.) 
                mostram apenas os dados relacionados àquele tipo de atendimento selecionado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sistema de Abas do Dashboard Aprimorado */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Conteúdo principal baseado na aba selecionada */}
      {activeTab === "graficos" && (
        <main
          className={`${getMaxWidth()} mx-auto p-2 sm:p-4 ${getGridLayout()}`}
        >
          {/* LINHA 1: Seletor de Data + Total de Notificações (Grid 8 colunas: 4+4) */}
          
          {/* Seletor de Data - 4 colunas */}
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-4 rounded-lg shadow-lg text-white sm:col-span-2 lg:col-span-4 xl:col-span-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Informações da Data Selecionada */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-full">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-1">
                    {selectedDataNotificacao 
                      ? selectedDataNotificacao === 'ultima-data'
                        ? `${new Date(datasNotificacaoDisponiveis[0] + 'T00:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })} 🔄`
                        : new Date(selectedDataNotificacao + 'T00:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })
                      : 'Todas as Datas'
                    }
                  </h2>
                  <p className="text-indigo-100 text-xs">
                    {selectedDataNotificacao 
                      ? selectedDataNotificacao === 'ultima-data'
                        ? `Hoje - ${totalNotificacoesDia.toLocaleString()} casos (atualiza automaticamente)`
                        : totalNotificacoesDia > 0 
                          ? `${totalNotificacoesDia.toLocaleString()} casos neste dia`
                          : `Sem casos neste dia - mostrando total do evento: ${notificacoesFiltradasPorEvento.length.toLocaleString()}`
                      : `Visualizando todos os registros`
                    }
                  </p>
                </div>
              </div>
              
              {/* Seletor de Data */}
              <div className="flex gap-2 items-center">
                <select
                  value={selectedDataNotificacao || 'todos'}
                  onChange={(e) => handleDataNotificacaoChange(e.target.value)}
                  disabled={isGlobalFilterActive()}
                  className={`px-3 py-2 text-xs text-gray-800 border border-white border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 min-w-[180px] ${
                    isGlobalFilterActive() 
                      ? 'bg-gray-200 cursor-not-allowed opacity-60' 
                      : 'bg-white bg-opacity-90'
                  }`}
                  title={isGlobalFilterActive() ? 'Seletor desabilitado: filtro global ativo' : ''}
                >
                  <option value="todos">
                    {isGlobalFilterActive() ? '🔒 Filtro Global Ativo' : '📊 Todas as Datas'}
                  </option>
                  {!isGlobalFilterActive() && datasNotificacaoDisponiveis.map((data) => {
                    // 🆕 CORREÇÃO: Contar apenas notificações do evento selecionado
                    const totalDia = contarNotificacoesPorData(notificacoesFiltradasPorEvento, data);
                    const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
                    const isToday = data === obterDataAtual();
                    
                    return (
                      <option key={data} value={data}>
                        {isToday ? '🕐' : '📅'} {dataFormatada} ({totalDia.toLocaleString()})
                      </option>
                    );
                  })}
                </select>
                
                {selectedDataNotificacao && !isGlobalFilterActive() && (
                  <button
                    onClick={() => handleDataNotificacaoChange('todos')}
                    className="px-2 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm rounded-lg transition-all duration-200"
                    title="Mostrar todas as datas"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Total de Notificações - 4 colunas */}
          <div
            className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-lg shadow-lg flex items-center gap-3 text-white sm:col-span-2 lg:col-span-4 xl:col-span-4 cursor-pointer hover:shadow-xl hover:from-blue-600 hover:to-blue-800 transition-all"
            onClick={() => setShowFichasModal(true)}
            title="Clique para ver as fichas relacionadas"
          >
            <div className="p-3 bg-white bg-opacity-20 rounded-full flex-shrink-0">
              <FileText className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs text-blue-100 uppercase tracking-wide">Total de Notificações</h3>
              <p className="text-4xl font-bold">
                {totalNotifications.toLocaleString()}
              </p>
              <p className="text-xs text-blue-200 mt-1">
                👆 Clique para ver as fichas
              </p>
            </div>
          </div>

          {/* LINHA 2: Resumo por Tipo - 8 colunas (linha completa) */}
          <div className="bg-white p-3 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-8">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-700">Resumo por Tipo de Atendimento</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={() => handleCardClick("clinico", ctrlPressedRef.current)}>
                <Activity className="h-6 w-6 text-green-600" />
                <p className="text-xs text-gray-600 font-medium">Clínico</p>
                <p className="text-2xl font-bold text-green-700">{statCounts.clinico.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors" onClick={() => handleCardClick("trauma", ctrlPressedRef.current)}>
                <AlertCircle className="h-6 w-6 text-red-600" />
                <p className="text-xs text-gray-600 font-medium">Trauma</p>
                <p className="text-2xl font-bold text-red-700">{statCounts.trauma.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => handleCardClick("multiplas", ctrlPressedRef.current)}>
                <AlertTriangle className="h-6 w-6 text-purple-600" />
                <p className="text-xs text-gray-600 font-medium">Múltiplas</p>
                <p className="text-2xl font-bold text-purple-700">{statCounts.multiplas.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => handleCardClick("qbrn", ctrlPressedRef.current)}>
                <Bomb className="h-6 w-6 text-orange-600" />
                <p className="text-xs text-gray-600 font-medium">QBRN</p>
                <p className="text-2xl font-bold text-orange-700">{statCounts.qbrn.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Indicador de Filtros Ativos - 8 colunas (linha completa) */}
          {hasActiveFilters && (
            <div className="bg-blue-50 p-3 rounded-lg shadow-sm border-l-4 border-blue-500 sm:col-span-2 lg:col-span-4 xl:col-span-8">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-800">
                  Dashboard com Filtros Ativos - Dados Interconectados
                </h3>
              </div>
              <p className="text-xs text-blue-700">
                {Object.values(activeFilters).filter(f => f !== null).length} filtro(s) aplicado(s).
                Todos os gráficos abaixo mostram apenas dados que correspondem aos filtros selecionados.
                Clique em qualquer elemento de gráfico para adicionar/remover filtros.
              </p>
            </div>
          )}

          {/* =============================================== */}
          {/* LINHA 3: Distribuição por Público, Tipo de Atendimento, Sexo e Raça/Cor (Grid 8 cols: 2+2+2+2) */}
          {/* =============================================== */}
          
          {/* Gráfico de Público Atendido - 2 colunas */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <DistribuicaoPublicoAtendidoChart
              data={filteredPublico}
              onChartClick={(itemName, multiSelect) => handleChartClick('publico', itemName, multiSelect)}
              activeFilter={activeFilters.publico}
              chartId="chart-publico"
              title="Distribuição por Público Atendido"
            />
          </div>

          {/* Gráfico de Tipo de Atendimento - 2 colunas */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <DistribuicaoTipoAtendimentoChart
              data={filteredTipoAtendimento}
              onChartClick={(itemName, multiSelect) => handleChartClick('tipoAtendimento', itemName, multiSelect)}
              activeFilter={activeFilters.tipoAtendimento}
              chartId="chart-tipo-atendimento"
              title="Distribuição por Tipo de Atendimento"
            />
          </div>

          {/* Gráfico de Identidade de Gênero - 2 colunas */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <DistribuicaoSexoChart
              data={filteredGenero}
              onChartClick={(itemName, multiSelect) => handleChartClick('genero', itemName, multiSelect)}
              activeFilter={activeFilters.genero}
              chartId="chart-genero"
              title="Distribuição por Identidade de Gênero"
            />
          </div>

          {/* Gráfico de Raça/Cor - 2 colunas */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <DistribuicaoRacaCorChart
              data={filteredRaca}
              onChartClick={(itemName, multiSelect) => handleChartClick('raca', itemName, multiSelect)}
              activeFilter={activeFilters.raca}
              chartId="chart-raca"
              title="Distribuição por Raça e Cor"
            />
          </div>

          {/* =============================================== */}
          {/* LINHA 4: Localização Geográfica - Painel com 4 gráficos internos (Grid 8 cols: 8 largura total) */}
          {/* =============================================== */}
          
          {/* Painel de Localização Geográfica - 8 colunas (largura total) */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-8">
            <GeographicLocationPanel
              paisData={filteredPais}
              estadoData={filteredEstado}
              municipioData={filteredMunicipio}
              bairroData={filteredBairro}
              onFilterClick={toggleFilter}
              activeFilters={activeFilters}
            />
          </div>

          {/* =============================================== */}
          {/* LINHA 5: Estabelecimentos e Pirâmide Etária (Grid 8 cols: 4+4) */}
          {/* =============================================== */}
          
          {/* Estabelecimentos por Número de Casos - 4 colunas */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <EstabelecimentosCasosChart 
              toggleFilter={toggleFilter}
              activeFilters={activeFilters}
              filteredData={getFilteredDataExcludingUnidade()}
            />
          </div>

          {/* Pirâmide Etária por Sexo - 4 colunas */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-4">
            <PiramideEtariaChart 
              toggleFilter={toggleFilter}
              activeFilters={activeFilters}
              filteredData={getFilteredDataExcludingFaixaEtaria()}
            />
          </div>

          {/* =============================================== */}
          {/* LINHA 6: Sinais/Sintomas, Trauma e Hipóteses (Grid 8 cols: 2+2+4 conforme getChartSpans) */}
          {/* =============================================== */}
          
          {/* Principais Sintomas - 2 colunas */}
          <PrincipaisSintomasChart
            data={filteredSintomas}
            onChartClick={(itemName, multiSelect) => handleChartClick('sintoma', itemName, multiSelect)}
            activeFilter={activeFilters.sintoma}
            chartId="chart-sintomas"
            title="Principais Sinais e Sintomas"
            className={`bg-white p-4 rounded-lg shadow-sm ${chartSpans.sintomas}`}
            maxItems={10}
            isVisible={visibleCharts.sintomas}
          />

          {/* Tipos de Trauma - 2 colunas */}
          <TiposTraumaChart
            data={filteredTrauma}
            onChartClick={(itemName, multiSelect) => handleChartClick('trauma', itemName, multiSelect)}
            activeFilter={activeFilters.trauma}
            chartId="chart-trauma"
            title="Tipos de Trauma"
            className={`bg-white p-4 rounded-lg shadow-sm ${chartSpans.trauma}`}
            isVisible={visibleCharts.trauma}
          />

          {/* Hipóteses Diagnósticas - 4 colunas (maior para mostrar nomes completos) */}
          <HipotesesDiagnosticasChart
            data={filteredHipoteses}
            onChartClick={(itemName, multiSelect) => handleChartClick('hipotese', itemName, multiSelect)}
            activeFilter={activeFilters.hipotese}
            chartId="chart-hipoteses"
            title="Hipóteses Diagnósticas"
            className={`bg-white p-4 rounded-lg shadow-sm ${chartSpans.hipoteses}`}
            maxItems={15}
            isVisible={visibleCharts.hipoteses}
            COLORS={COLORS}
          />

          {/* =============================================== */}
          {/* LINHA 7: Desfecho dos Casos (Grid 8 cols: 1 offset + 6 gráfico + 1 offset = centralizado) */}
          {/* =============================================== */}
          
          {/* Espaçamento vazio - 1 coluna */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-1"></div>
          
          {/* Desfecho dos Casos - 6 colunas (divididas internamente) */}
          <div className="sm:col-span-2 lg:col-span-4 xl:col-span-6">
            <DesfechoCasosChart 
              toggleFilter={toggleFilter}
              activeFilters={activeFilters}
              filteredData={getFilteredDataExcludingDesfecho()}
            />
          </div>
          
          {/* Espaçamento vazio - 1 coluna */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-1"></div>
        </main>
      )}

      {/* Aba de Análise Temporal - Séries Temporais */}
      {activeTab === "fluxo" && (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Análise Temporal
              </h2>
              <p className="text-gray-600">
                Visualização de séries temporais por dia e hora de notificação
              </p>
            </div>
            <DashboardExportMenu
              paisData={filteredPais}
              estadoData={filteredEstado}
              municipioData={filteredMunicipio}
              bairroData={filteredBairro}
              publicoData={filteredPublico}
              tipoAtendimentoData={filteredTipoAtendimento}
              generoData={filteredGenero}
              racaData={filteredRaca}
              sintomasData={filteredSintomas}
              traumaData={filteredTrauma}
              hipotesesData={filteredHipoteses}
              totalRecords={filteredNotificacoes.current.length}
              activeFilters={activeFilters}
              buttonVariant="button"
              className="text-xs sm:text-sm"
            />
          </div>
          
          {/* Gráfico 1: Série temporal por dia - USANDO NOTIFICAÇÕES COM FILTROS CRUZADOS */}
          <div className="mb-6">
            <SerieTemporalChart 
              notificacoes={hasActiveFilters ? filteredNotificacoes.current : notificacoesParaAnalisetemporal}
              title="Série Temporal por Dia de Notificação"
              description="Evolução diária do número de notificações"
              estabelecimentoOptions={exportOptions?.estabelecimentoOptions || []}
            />
          </div>
          
          {/* Gráfico 2: Série temporal por hora - USANDO NOTIFICAÇÕES COM FILTROS CRUZADOS */}
          <AtendimentosPorHoraChart 
            notificacoes={hasActiveFilters ? filteredNotificacoes.current : notificacoesParaAnalisetemporal} 
          />
        </main>
      )}

      {/* Aba do Mapa - Distribuição Geográfica */}
      {activeTab === "mapa" && (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Mapa de Estabelecimentos
              </h2>
              <p className="text-gray-600">
                Distribuição geográfica dos estabelecimentos de saúde com indicadores de urgência
              </p>
            </div>
            <DashboardExportMenu
              paisData={filteredPais}
              estadoData={filteredEstado}
              municipioData={filteredMunicipio}
              bairroData={filteredBairro}
              publicoData={filteredPublico}
              tipoAtendimentoData={filteredTipoAtendimento}
              generoData={filteredGenero}
              racaData={filteredRaca}
              sintomasData={filteredSintomas}
              traumaData={filteredTrauma}
              hipotesesData={filteredHipoteses}
              totalRecords={filteredNotificacoes.current.length}
              activeFilters={activeFilters}
              buttonVariant="button"
              className="text-xs sm:text-sm"
            />
          </div>
          
          {/* 🆕 USAR NOTIFICAÇÕES COM FILTROS CRUZADOS NO MAPA */}
          <EstabelecimentosMapaAvancado 
            notificacoes={hasActiveFilters ? filteredNotificacoes.current : notificacoesFiltradasPorEvento}
            exportOptions={exportOptions}
            selectedDataNotificacao={selectedDataNotificacao}
            datasNotificacaoDisponiveis={datasNotificacaoDisponiveis}
            isGlobalFilterActive={isGlobalFilterActive}
          />
        </main>
      )}

      {/* Aba de IA - Temporariamente desabilitada, será usada no futuro
      {false && (
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              Análise Inteligente com IA
            </h2>
            <p className="text-gray-600">
              Insights automáticos, chat interativo e alertas inteligentes com múltiplas opções de IA
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            Insights Automáticos, Chat com IA e Alertas Inteligentes aqui
          </div>
        </main>
      )} */}

      {/* Sistema de Alertas - Sempre visível */}
      {/* 🆕 USAR NOTIFICAÇÕES COM TODOS OS FILTROS APLICADOS */}
      <AlertasPanel 
        key={`alertas-${lastUpdate}-${notificacoesComTodosFiltros.length}`}
        notificacoes={notificacoesComTodosFiltros}
        isGlobalFilterActive={isGlobalFilterActive}
      />

      {/* Indicador de Carregamento */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Carregando dados...</p>
          </div>
        </div>
      )}

      {/* Rodapé */}
      <footer className="max-w-7xl mx-auto p-4 text-center text-xs text-gray-500 mt-4">
        <p>
          © 2025 Secretaria de Saúde Pública do Pará - SESPA. Todos os direitos
          reservados.
        </p>
        <p className="mt-1">Portal Saúde Pará</p>
      </footer>
    </div>
  );
};

export default EnhancedNotificationDashboard;

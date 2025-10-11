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

// 🆕 SISTEMA DE EXPORTAÇÃO DISPONÍVEL:
// Para integrar exportação em um gráfico individual, importe:
// import ChartExportMenu from '../../components/common/ChartExportMenu';
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
  
  // Estado para controle de visualização
  const { activeTab, setActiveTab } = useDashboardTabs();

  // Estado para filtragem interativa
  const [loading, setLoading] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState("Todos");
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleString());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(60); // 60 segundos = 1 minuto

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

  // 🆕 FUNÇÃO PARA APLICAR FILTROS CRUZADOS
  const applyFilters = useCallback((notificacoes: any[]) => {
    let filteredData = [...notificacoes];
    
    // Aplicar cada filtro ativo
    Object.entries(activeFilters).forEach(([category, filterValue]) => {
      if (filterValue !== null && filterValue !== undefined) {
        switch (category) {
          case 'evento':
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
            break;
            
          case 'tipoAtendimento':
            filteredData = filteredData.filter(n => {
              const tipoId = n?.original?.tipo_atendimento_idtipo_atendimento;
              const tipoDesc = getAtendimentoDescById(tipoId);
              return tipoDesc === filterValue;
            });
            break;
            
          case 'publico':
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
            break;
            
          case 'genero':
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
            break;
            
          case 'raca':
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
            break;
            
          case 'escolaridade':
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
            break;
            
          case 'unidade':
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
            break;
            
          case 'hipotese':
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
            break;
            
          case 'trauma':
            console.log("🔍 Filtrando por trauma:", filterValue);
            console.log("🔧 traumaOptions disponíveis:", exportOptions?.traumaOptions?.length || 0);
            
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
                  return trauma?.descricao === filterValue;
                });
              }
              console.log("❌ Trauma não encontrado - traumas:", traumas, "traumaOptions:", exportOptions?.traumaOptions?.length);
              return false;
            });
            break;
            
          case 'sintoma':
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
            break;

          case 'faixaEtaria':
            filteredData = filteredData.filter(n => {
              // ✅ CORRIGIDO: Usar a mesma fonte de dados do PiramideEtariaChart
              const paciente = n?.original?.paciente;
              if (!paciente || paciente.idade === null || paciente.idade === undefined) {
                return false;
              }
              
              // Converter idade em meses para faixa etária usando a mesma lógica do gráfico
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
            break;

          case 'desfecho':
            filteredData = filteredData.filter(n => {
              // ✅ CORRIGIDO: Usar a mesma fonte de dados do DesfechoCasosChart
              const original = n?.original || n;
              const tipoEncerramento = original?.tipo_encerramento;
              
              if (tipoEncerramento && tipoEncerramento.descricao) {
                return tipoEncerramento.descricao === filterValue;
              }
              
              // Fallback: tentar campo desfecho direto também
              const desfecho = original?.desfecho;
              return desfecho === filterValue;
            });
            break;
            
          case 'dataNotificacao':
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
            break;
            
          case 'estado':
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
            break;
            
          case 'municipio':
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
            break;
            
          case 'bairro':
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
            break;
        }
      }
    });
    
    return filteredData;
  }, [activeFilters, exportOptions, getAtendimentoDescById]);

  // 🆕 FUNÇÃO PARA ALTERNAR FILTRO
  const toggleFilter = useCallback((category: string, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      // Se o mesmo filtro já está ativo, removê-lo
      if (newFilters[category] === value) {
        newFilters[category] = null;
      } else {
        // Caso contrário, definir o novo filtro
        newFilters[category] = value;
      }
      
      console.log(`🎯 Filtro alterado:`, { category, value, newFilters });
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
      
      // Recalcular total para todos os dias considerando outros filtros
      let dadosParaContar = originalNotificacoes.current;
      if (activeFilters.evento && activeFilters.evento !== 'todos') {
        dadosParaContar = dadosParaContar.filter(n => {
          const eventoId = n?.original?.tipo_evento_idtipo_evento;
          if (eventoId !== undefined && exportOptions?.eventoOptions?.length > 0) {
            const evento = exportOptions.eventoOptions.find(
              (e: any) => String(e.idtipo_evento) === String(eventoId) || String(e.idevento) === String(eventoId)
            );
            return evento?.descricao === activeFilters.evento;
          }
          return false;
        });
      }
      setTotalNotificacoesDia(dadosParaContar.length);
    } else {
      // 🆕 VALIDAÇÃO: Verificar se há notificações para a data selecionada com o evento ativo
      let dadosParaContar = originalNotificacoes.current;
      
      // Se há filtro de evento ativo, aplicar primeiro
      if (activeFilters.evento && activeFilters.evento !== 'todos') {
        dadosParaContar = dadosParaContar.filter(n => {
          const eventoId = n?.original?.tipo_evento_idtipo_evento;
          if (eventoId !== undefined && exportOptions?.eventoOptions?.length > 0) {
            const evento = exportOptions.eventoOptions.find(
              (e: any) => String(e.idtipo_evento) === String(eventoId) || String(e.idevento) === String(eventoId)
            );
            return evento?.descricao === activeFilters.evento;
          }
          return false;
        });
      }
      
      // Contar notificações para a data específica
      const totalParaData = contarNotificacoesPorData(dadosParaContar, novaData);
      
      // 🆕 Se não há notificações para a data com o evento selecionado, mostrar aviso
      if (totalParaData === 0 && activeFilters.evento && activeFilters.evento !== 'todos') {
        alert(`⚠️ O evento "${activeFilters.evento}" não possui notificações para a data ${novaData.split('-').reverse().join('/')}.`);
        return; // Não atualizar nada, manter seleção atual
      }
      
      setSelectedDataNotificacao(novaData);
      setActiveFilters(prev => ({ ...prev, dataNotificacao: novaData }));
      setTotalNotificacoesDia(totalParaData);
    }
  }, [contarNotificacoesPorData, activeFilters, exportOptions]);

  // 🆕 VERIFICAR SE HÁ FILTROS ATIVOS
  const hasActiveFilters = useMemo(() => {
    return Object.values(activeFilters).some(filter => filter !== null);
  }, [activeFilters]);

  // 🆕 FUNÇÃO PARA OBTER DADOS FILTRADOS
  const getFilteredData = useCallback(() => {
    if (!hasActiveFilters) {
      return originalNotificacoes.current;
    }
    return applyFilters(originalNotificacoes.current);
  }, [hasActiveFilters, applyFilters]);

  // 🆕 FUNÇÃO PARA DETERMINAR QUAIS GRÁFICOS DEVEM SER VISÍVEIS BASEADO NO TIPO DE ATENDIMENTO
  const getVisibleCharts = useCallback(() => {
    const tipoAtendimento = activeFilters.tipoAtendimento;
    
    if (!tipoAtendimento) {
      // Se nenhum tipo de atendimento está selecionado, mostrar todos
      return {
        trauma: true,
        sintomas: true,
        hipoteses: true,
        demograficos: true // público, gênero, raça
      };
    }

    const tipoLower = tipoAtendimento.toLowerCase();
    
    // TRAUMA ou MÚLTIPLAS VÍTIMAS: apenas trauma
    if (tipoLower.includes('trauma') || tipoLower.includes('múltiplas') || tipoLower.includes('multiplas')) {
      return {
        trauma: true,
        sintomas: false,
        hipoteses: false,
        demograficos: true // mantém dados demográficos para análise
      };
    }
    
    // CLÍNICO: apenas sintomas e hipóteses
    if (tipoLower.includes('clínico') || tipoLower.includes('clinico')) {
      return {
        trauma: false,
        sintomas: true,
        hipoteses: true,
        demograficos: true // mantém dados demográficos para análise
      };
    }
    
    // INCIDENTE QBRN: todos os tipos
    if (tipoLower.includes('qbrn') || tipoLower.includes('incidente')) {
      return {
        trauma: true,
        sintomas: true,
        hipoteses: true,
        demograficos: true
      };
    }
    
    // Padrão: mostrar todos
    return {
      trauma: true,
      sintomas: true,
      hipoteses: true,
      demograficos: true
    };
  }, [activeFilters.tipoAtendimento]);

  // Usar a função para obter quais gráficos devem ser visíveis
  const visibleCharts = getVisibleCharts();

  // 🆕 FUNÇÃO PARA CALCULAR O LAYOUT DO GRID DINAMICAMENTE
  const getGridLayout = useCallback(() => {
    // SEMPRE manter o layout de 5 colunas para que os gráficos possam se expandir
    // O que muda são os spans individuais, não o grid total
    return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mt-2";
  }, [visibleCharts]);

  // 🆕 FUNÇÃO PARA CALCULAR SPANS DOS GRÁFICOS DINAMICAMENTE  
  const getChartSpans = useCallback(() => {
    const { trauma, sintomas, hipoteses } = visibleCharts;
    
    // CASO 1: Todos os 3 gráficos visíveis (layout padrão)
    if (trauma && sintomas && hipoteses) {
      return {
        sintomas: "md:col-span-2 lg:col-span-3", // 3/5 colunas
        trauma: "md:col-span-2 lg:col-span-2",   // 2/5 colunas  
        hipoteses: "md:col-span-2 lg:col-span-5" // 5/5 colunas (próxima linha)
      };
    }
    
    // CASO 2: CLÍNICO - só sintomas + hipóteses (sem trauma)
    if (!trauma && sintomas && hipoteses) {
      return {
        sintomas: "md:col-span-2 lg:col-span-5",  // ocupa TODO o espaço da primeira linha (3+2=5)
        trauma: "md:col-span-2 lg:col-span-2",    // não usado
        hipoteses: "md:col-span-2 lg:col-span-5"  // mantém linha inteira
      };
    }
    
    // CASO 3: TRAUMA/MÚLTIPLAS - só trauma (sem sintomas e hipóteses)  
    if (trauma && !sintomas && !hipoteses) {
      return {
        sintomas: "md:col-span-2 lg:col-span-3",  // não usado
        trauma: "md:col-span-2 lg:col-span-5",    // ocupa linha inteira (2+3=5)
        hipoteses: "md:col-span-2 lg:col-span-5"  // não usado
      };
    }
    
    // CASO 4: Outros casos de 2 gráficos
    if ((trauma && sintomas && !hipoteses) || (trauma && !sintomas && hipoteses)) {
      return {
        sintomas: "md:col-span-2 lg:col-span-3",  // expande se visível
        trauma: "md:col-span-2 lg:col-span-2",    // mantém tamanho se visível
        hipoteses: "md:col-span-2 lg:col-span-5"  // linha inteira se visível
      };
    }
    
    // CASO 5: Apenas sintomas
    if (!trauma && sintomas && !hipoteses) {
      return {
        sintomas: "md:col-span-2 lg:col-span-5",  // linha inteira
        trauma: "md:col-span-2 lg:col-span-2",
        hipoteses: "md:col-span-2 lg:col-span-5"
      };
    }
    
    // CASO 6: Apenas hipóteses  
    if (!trauma && !sintomas && hipoteses) {
      return {
        sintomas: "md:col-span-2 lg:col-span-3",
        trauma: "md:col-span-2 lg:col-span-2",
        hipoteses: "md:col-span-2 lg:col-span-5"  // já ocupa linha inteira
      };
    }
    
    // Padrão (fallback)
    return {
      sintomas: "md:col-span-2 lg:col-span-3",
      trauma: "md:col-span-2 lg:col-span-2", 
      hipoteses: "md:col-span-2 lg:col-span-5"
    };
  }, [visibleCharts]);

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
  
    return resultado;
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
    if (!Array.isArray(dadosFiltrados) || !dadosFiltrados.length) {
      return false;
    }

    if (!exportOptions || typeof exportOptions !== "object") {
      return false;
    }

    try {
      // Processar cada categoria - usar paleta normal para barras, paleta pie para rosca/pizza
      const racaPorNotificacao = processarCategoria(
        dadosFiltrados,
        "original.paciente.tipo_raca_idtipo_raca",
        exportOptions.racaOptions || [],
        "idtipo_raca",
        "descricao",
        COLORS.blue,
        'normal'
      );
      if (racaPorNotificacao.length > 0) {
        setFilteredRaca(racaPorNotificacao);
        // Se for a primeira vez, armazenar como original também
        if (originalRaca.length === 0) {
          setOriginalRaca(racaPorNotificacao);
        }
      }

      const escolaridadePorNotificacao = processarCategoria(
        dadosFiltrados,
        "original.paciente.escolaridade_idescolaridade",
        exportOptions.escolaridadeOptions || [],
        "idtipo_escolaridade",
        "descricao",
        COLORS.blue,
        'normal'
      );
      if (escolaridadePorNotificacao.length > 0) {
        setFilteredEscolaridade(escolaridadePorNotificacao);
        if (originalEscolaridade.length === 0) {
          setOriginalEscolaridade(escolaridadePorNotificacao);
        }
      }

      const unidadesPorNotificacao = processarCategoria(
        dadosFiltrados,
        "original.estabelecimento_idestabelecimento",
        exportOptions.estabelecimentoOptions || [],
        "idestabelecimento",
        "nome",
        COLORS.blue,
        'normal'
      );
      if (unidadesPorNotificacao.length > 0) {
        setFilteredUnidades(unidadesPorNotificacao);
        if (originalUnidades.length === 0) {
          setOriginalUnidades(unidadesPorNotificacao);
        }
      }

      // Gênero como gráfico de pizza - usar paleta pie
      const generoPorNotificacao = processarCategoria(
        dadosFiltrados,
        "original.paciente.tipo_genero_idtipo_genero",
        exportOptions.generoOptions || [],
        "idtipo_genero",
        "descricao",
        COLORS.pie,
        'pie'
      );
      if (generoPorNotificacao.length > 0) {
        setFilteredGenero(generoPorNotificacao);
        if (originalGenero.length === 0) {
          setOriginalGenero(generoPorNotificacao);
        }
      }

      const sintomasPorNotificacao = processarCategoriaMuitosParaMuitos(
        dadosFiltrados,
        "original.notificacao_has_tipo_sintoma",
        "tipo_sintoma_idtipo_sintoma",
        exportOptions.sintomaOptions || [],
        "idtipo_sintoma",
        "descricao",
        COLORS.blue,
        'normal'
      );
      if (sintomasPorNotificacao.length > 0) {
        setFilteredSintomas(sintomasPorNotificacao);
        if (originalSintomas.length === 0) {
          setOriginalSintomas(sintomasPorNotificacao);
        }
      }

      const atendimentoPorNotificacao = processarCategoria(
        dadosFiltrados,
        "original.tipo_atendimento_idtipo_atendimento",
        exportOptions.atendimentoOptions || [],
        "idtipo_atendimento",
        "descricao",
        COLORS.blue,
        'normal'
      );
      if (atendimentoPorNotificacao.length > 0) {
        setFilteredTipoAtendimento(atendimentoPorNotificacao);
        if (originalTipoAtendimento.length === 0) {
          setOriginalTipoAtendimento(atendimentoPorNotificacao);
        }
      }

      // Público como gráfico de rosca - usar paleta pie
      const publicoPorNotificacao = processarCategoria(
        dadosFiltrados,
        "original.tipo_publico_idtipo_publico",
        exportOptions.publicoOptions || [],
        "idtipo_publico",
        "descricao",
        COLORS.pie,
        'pie'
      );
      if (publicoPorNotificacao.length > 0) {
        setFilteredPublico(publicoPorNotificacao);
        if (originalPublico.length === 0) {
          setOriginalPublico(publicoPorNotificacao);
        }
      }

      const hipotesePorNotificacao = processarCategoria(
        dadosFiltrados,
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
      }
      
      // Verificar se há notificações com trauma - agora usando o relacionamento many-to-many
      const notificacoesComTrauma = dadosFiltrados.filter(n => 
        n?.original?.notificacao_has_tipo_trauma && 
        Array.isArray(n.original.notificacao_has_tipo_trauma) && 
        n.original.notificacao_has_tipo_trauma.length > 0
      );
      if (notificacoesComTrauma.length > 0) {
      }

      const traumaPorNotificacao = processarCategoriaMuitosParaMuitos(
        dadosFiltrados,
        "original.notificacao_has_tipo_trauma",
        "tipo_trauma_idtipo_trauma",
        exportOptions.traumaOptions || [],
        "idtipo_trauma",
        "descricao",
        COLORS.trauma,
        'normal'
      );
      if (traumaPorNotificacao.length > 0) {
        setFilteredTrauma(traumaPorNotificacao);
        if (originalTrauma.length === 0) {
          setOriginalTrauma(traumaPorNotificacao);
        }
      }
      
      // 🆕 PROCESSAMENTO DOS DADOS DE LOCALIZAÇÃO GEOGRÁFICA
      // País de residência - usar função específica com cores individuais
      console.log("🏳️ Processando países do backend:", exportOptions.paisOptions?.length || 0, "países disponíveis");
      if (exportOptions.paisOptions?.length > 0) {
        console.log("🌍 Lista de países:", exportOptions.paisOptions.map((p: any) => p.descricao).sort());
      }
      
      const paisPorNotificacao = processarPaises(
        dadosFiltrados,
        "original.tipo_pais_idtipo_pais",
        exportOptions.paisOptions || [],
        "idtipo_pais",
        "descricao"
      );
      if (paisPorNotificacao.length > 0) {
        console.log("🏳️ Países com dados:", paisPorNotificacao.map(p => `${p.name} (${p.value})`));
        setFilteredPais(paisPorNotificacao);
        if (originalPais.length === 0) {
          setOriginalPais(paisPorNotificacao);
        }
      }

      // Estado/UF de residência com cores características dos estados brasileiros
      const estadoPorNotificacao = processarEstados(
        dadosFiltrados,
        "original.tipo_estado_idtipo_estado",
        exportOptions.estadoOptions || [],
        "idtipo_estado", 
        "descricao"
      );
      if (estadoPorNotificacao.length > 0) {
        setFilteredEstado(estadoPorNotificacao);
        if (originalEstado.length === 0) {
          setOriginalEstado(estadoPorNotificacao);
        }
      }

      // Municípios de residência
      const municipioPorNotificacao = processarCategoria(
        dadosFiltrados,
        "original.tipo_municipio_idtipo_municipio",
        exportOptions.municipioOptions || [],
        "idtipo_municipio",
        "descricao", 
        COLORS.blue,
        'normal'
      );
      
      if (municipioPorNotificacao.length > 0) {
        setFilteredMunicipio(municipioPorNotificacao);
        if (originalMunicipio.length === 0) {
          setOriginalMunicipio(municipioPorNotificacao);
        }
      }

      // Bairros de residência (específicos de Belém)
      const bairroPorNotificacao = processarCategoria(
        dadosFiltrados,
        "original.tipo_bairro_idtipo_bairro",
        exportOptions.bairroOptions || [],
        "idtipo_bairro",
        "descricao",
        COLORS.blue,
        'normal'
      );
      if (bairroPorNotificacao.length > 0) {
        setFilteredBairro(bairroPorNotificacao);
        if (originalBairro.length === 0) {
          setOriginalBairro(bairroPorNotificacao);
        }
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
      originalPais, originalEstado, originalMunicipio, originalBairro]);

  // Função para calcular estatísticas a partir das notificações
  const calcularEstatisticas = useCallback((dadosFiltrados: any[] = []) => {
    const dados = dadosFiltrados.length > 0 ? dadosFiltrados : notificacoes;
    
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
  }, [notificacoes, processarDadosGraficos, getAtendimentoDescById]);

  // 🆕 FUNÇÃO MELHORADA PARA PROCESSAR DADOS COM FILTROS CRUZADOS
  // 🆕 FUNÇÃO PARA PROCESSAR DADOS COM FILTROS CRUZADOS
  const processarDadosComFiltros = useCallback(() => {
    const dadosFiltrados = getFilteredData();
    
    // Atualizar dados filtrados de referência
    filteredNotificacoes.current = dadosFiltrados;
    
    // 🆕 ATUALIZAR DATAS DISPONÍVEIS BASEADAS NOS DADOS FILTRADOS
    // Aplicar todos os filtros exceto data para obter as datas disponíveis
    let dadosParaDatas = [...originalNotificacoes.current];
    
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
              console.log('🎯 Filtrando evento para datas:', filterValue);
              const dadosAntesEvento = dadosParaDatas.length;
              dadosParaDatas = dadosParaDatas.filter(n => {
                const eventoId = n?.original?.tipo_evento_idtipo_evento;
                if (eventoId !== undefined && exportOptions?.eventoOptions?.length > 0) {
                  const evento = exportOptions.eventoOptions.find(
                    (e: any) => String(e.idtipo_evento) === String(eventoId) || String(e.idevento) === String(eventoId)
                  );
                  
                  // Debug do filtro de evento
                  const match = evento?.descricao === filterValue;
                  if (match) {
                    console.log('✅ Evento match para datas:', { eventoId, eventoNome: evento.descricao, filtroValue: filterValue });
                  }
                  
                  return match;
                }
                return false;
              });
              console.log(`🎯 Filtro evento para datas: ${dadosAntesEvento} → ${dadosParaDatas.length}`);
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
    const novasDatasDisponiveis = extrairDatasNotificacao(dadosParaDatas);
    
    // Debug para verificar integração
    console.log('🔍 DEBUG Filtros:', {
      filtrosAtivos: activeFilters,
      filtrosSemData: filtrosSemData,
      totalOriginais: originalNotificacoes.current.length,
      dadosAposFiltros: dadosParaDatas.length,
      datasDisponiveis: novasDatasDisponiveis.length,
      amostraDatas: novasDatasDisponiveis.slice(0, 3),
      eventoAtivo: activeFilters.evento
    });
    
    setDatasNotificacaoDisponiveis(novasDatasDisponiveis);
    
    // Recalcular estatísticas e gráficos
    calcularEstatisticas(dadosFiltrados);
  }, [getFilteredData, calcularEstatisticas, activeFilters, exportOptions, extrairDatasNotificacao, filtrarNotificacoes]);

  // Função para buscar dados frescos do servidor
  const fetchFreshData = useCallback(async () => {
    try {
      // Usar o NotificacaoService para buscar dados atualizados
      const response = await NotificacaoService.getAll(1, 1000);
      const freshData = response.data || [];
      
      console.log("Dados frescos recebidos:", freshData.length, "notificações");
      
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
  }, [notificacoes]);

  // Função para atualizar os dados
  const refreshData = useCallback(async () => {
    if (loading) {
      return; // Evita atualizações simultâneas
    }
    
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
          // Se temos filtros ativos, reaplicá-los usando o sistema de filtros cruzados
          const dadosComFiltrosCruzados = applyFilters(originalNotificacoes.current);
          filteredNotificacoes.current = dadosComFiltrosCruzados;
          calcularEstatisticas(dadosComFiltrosCruzados);
        } else if (selectedCategory) {
          // Fallback para sistema antigo (compatibilidade)
          const dadosFiltrados = filtrarNotificacoes(selectedCategory);
          filteredNotificacoes.current = dadosFiltrados;
          calcularEstatisticas(dadosFiltrados);
        } else {
          // Sem filtro, processar todos os dados originais
          filteredNotificacoes.current = originalNotificacoes.current;
          calcularEstatisticas(originalNotificacoes.current);
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
          const dadosComFiltrosCruzados = applyFilters(originalNotificacoes.current);
          filteredNotificacoes.current = dadosComFiltrosCruzados;
          calcularEstatisticas(dadosComFiltrosCruzados);
        } else if (selectedCategory) {
          const dadosFiltrados = filtrarNotificacoes(selectedCategory);
          filteredNotificacoes.current = dadosFiltrados;
          calcularEstatisticas(dadosFiltrados);
        } else {
          filteredNotificacoes.current = originalNotificacoes.current;
          calcularEstatisticas(originalNotificacoes.current);
        }
      }

      // Reativa processamento inicial para que o filtro de eventos funcione
      initialProcessingDone.current = true;
      
    } catch (error) {
      console.error("❌ Erro na atualização:", error);
    } finally {
      setLoading(false);
      setLastUpdate(new Date().toLocaleString());
    }
  }, [loading, selectedCategory, selectedDataNotificacao, activeFilters, fetchFreshData, notificacoes, filtrarNotificacoes, calcularEstatisticas, onDataRefresh, extrairDatasNotificacao, contarNotificacoesPorData, applyFilters]);

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
      let countdown = 60;
      setAutoRefreshCountdown(countdown);
      
      // Atualizar o contador a cada segundo
      const countdownTimer = setInterval(() => {
        countdown -= 1;
        setAutoRefreshCountdown(countdown);
        
        // Quando o contador chegar a zero, atualizar os dados
        if (countdown <= 0) {
          refreshDataRef.current && refreshDataRef.current();
          countdown = 60; // Resetar para 60 segundos
          setAutoRefreshCountdown(countdown);
        }
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
          
          // Calcular o total usando os dados filtrados (considerando outros filtros ativos)
          // Se há filtro de evento ativo, usar apenas as notificações desse evento
          let dadosParaContar = notificacoes;
          if (activeFilters.evento && activeFilters.evento !== 'todos') {
            dadosParaContar = notificacoes.filter(n => {
              const eventoId = n?.original?.tipo_evento_idtipo_evento;
              if (eventoId !== undefined && exportOptions?.eventoOptions?.length > 0) {
                const evento = exportOptions.eventoOptions.find(
                  (e: any) => String(e.idtipo_evento) === String(eventoId) || String(e.idevento) === String(eventoId)
                );
                return evento?.descricao === activeFilters.evento;
              }
              return false;
            });
          }
          
          const totalDia = contarNotificacoesPorData(dadosParaContar, dataAtual);
          setTotalNotificacoesDia(totalDia);
          console.log('📊 DEBUG: Total de notificações para', dataAtual, ':', totalDia);
        }
      } else if (selectedDataNotificacao) {
        // Se já temos uma data selecionada, verificar sincronização com activeFilters
        // CORRIGIR: Também considerar outros filtros ativos aqui
        let dadosParaContar = notificacoes;
        if (activeFilters.evento && activeFilters.evento !== 'todos') {
          dadosParaContar = notificacoes.filter(n => {
            const eventoId = n?.original?.tipo_evento_idtipo_evento;
            if (eventoId !== undefined && exportOptions?.eventoOptions?.length > 0) {
              const evento = exportOptions.eventoOptions.find(
                (e: any) => String(e.idtipo_evento) === String(eventoId) || String(e.idevento) === String(eventoId)
              );
              return evento?.descricao === activeFilters.evento;
            }
            return false;
          });
        }
        
        const totalDiaAtualizado = contarNotificacoesPorData(dadosParaContar, selectedDataNotificacao);
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
          
          // Aplicar filtros se houver filtros ativos, caso contrário usar todos os dados
          const hasActiveFilter = Object.values(activeFilters).some(f => f !== null);
          const base = Array.isArray(notificacoes) ? notificacoes : [];
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
    
  }, [notificacoes, calcularEstatisticas]);

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

  // Handler para cards e charts - ATUALIZADO para filtros cruzados
  const handleCardClick = useCallback((tipoAtendimento: string) => {
    console.log(`Card clicado: ${tipoAtendimento}`);
    
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
    toggleFilter('tipoAtendimento', descricao);
  }, [exportOptions, toggleFilter]);

  // 🆕 HANDLER GENÉRICO PARA CLIQUES EM GRÁFICOS
  const handleChartClick = useCallback((category: string, itemName: string) => {
    console.log(`🎯 Gráfico clicado: ${category} -> ${itemName}`);
    toggleFilter(category, itemName);
  }, [toggleFilter]);

  // Handler para o botão de voltar
  const handleBackButton = useCallback(() => {
    window.history.back();
  }, []);

  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

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

  return (
    <div data-dashboard="main" className="min-h-screen bg-gray-100 text-gray-800 pb-6">
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 p-3 sm:p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
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
              {hasActiveFilters && (
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

      {/* Seção de Filtros */}
      <div className="max-w-7xl mx-auto mt-4 px-4">
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
                  Clique no card "Total de Notificações" ou no botão "Limpar Filtros" 
                  para remover todos os filtros e ver o dataset completo.
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
          className={`max-w-7xl mx-auto p-2 sm:p-4 ${getGridLayout()}`}
        >
          {/* 🆕 CARD PRINCIPAL: Seletor de Data de Notificação */}
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-4 sm:p-6 rounded-lg shadow-lg text-white sm:col-span-2 lg:col-span-3 xl:col-span-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Informações da Data Selecionada */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-full">
                  <Calendar className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-1">
                    {selectedDataNotificacao 
                      ? new Date(selectedDataNotificacao + 'T00:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Todas as Datas'
                    }
                  </h2>
                  <p className="text-indigo-100 text-sm">
                    {selectedDataNotificacao 
                      ? `${totalNotificacoesDia.toLocaleString()} notificação(ções) criadas neste dia`
                      : `${totalNotifications.toLocaleString()} notificação(ções) no total`
                    }
                  </p>
                  {selectedDataNotificacao && selectedDataNotificacao === obterDataAtual() && (
                    <span className="inline-block mt-1 px-2 py-1 bg-green-400 bg-opacity-30 text-green-100 text-xs font-medium rounded-full">
                      🕐 Hoje
                    </span>
                  )}
                </div>
              </div>
              
              {/* Seletor de Data */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <select
                  value={selectedDataNotificacao || 'todos'}
                  onChange={(e) => handleDataNotificacaoChange(e.target.value)}
                  className="px-4 py-2 text-sm text-gray-800 border border-white border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 bg-white bg-opacity-90 min-w-[200px]"
                >
                  <option value="todos">📊 Todas as Datas ({totalNotifications.toLocaleString()})</option>
                  {datasNotificacaoDisponiveis.map((data) => {
                    const totalDia = contarNotificacoesPorData(originalNotificacoes.current, data);
                    const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
                    const isToday = data === obterDataAtual();
                    
                    return (
                      <option key={data} value={data}>
                        {isToday ? '🕐' : '📅'} {dataFormatada} ({totalDia.toLocaleString()})
                        {isToday ? ' - Hoje' : ''}
                      </option>
                    );
                  })}
                </select>
                
                {selectedDataNotificacao && (
                  <button
                    onClick={() => handleDataNotificacaoChange('todos')}
                    className="px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm rounded-lg transition-all duration-200 flex items-center gap-2"
                    title="Mostrar todas as datas"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Limpar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cards de Resumo - com indicador de filtros ativos */}
          {hasActiveFilters && (
            <div className="bg-blue-50 p-3 rounded-lg shadow-sm sm:col-span-2 lg:col-span-3 xl:col-span-5 border-l-4 border-blue-500">
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

          {/* Cards de Resumo */}
          <div
            className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm flex items-center gap-3 sm:gap-4 cursor-pointer hover:shadow-md transition-shadow sm:col-span-1 xl:col-span-1 ${!hasActiveFilters && selectedCategory === null ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => { 
              clearAllFilters();
            }}
          >
            <div className="p-2 sm:p-3 bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm text-gray-500 truncate">Total de Notificações</h3>
              <p className="text-xl sm:text-2xl font-bold text-blue-800">
                {totalNotifications.toLocaleString()}
              </p>
            </div>
          </div>

          <div
            className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm flex items-center gap-3 sm:gap-4 cursor-pointer hover:shadow-md transition-shadow sm:col-span-1 xl:col-span-1 ${activeFilters.tipoAtendimento?.toLowerCase().includes('clínico') || activeFilters.tipoAtendimento?.toLowerCase().includes('clinico') ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => handleCardClick("clinico")}
          >
            <div className="p-2 sm:p-3 bg-green-100 text-green-800 rounded-full flex-shrink-0">
              <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm text-gray-500 truncate">Casos Clínicos</h3>
              <p className="text-xl sm:text-2xl font-bold text-green-800">
                {statCounts.clinico.toLocaleString()}
              </p>
            </div>
          </div>

          <div
            className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm flex items-center gap-3 sm:gap-4 cursor-pointer hover:shadow-md transition-shadow sm:col-span-1 xl:col-span-1 ${activeFilters.tipoAtendimento?.toLowerCase().includes('trauma') ? 'ring-2 ring-red-400' : ''}`}
            onClick={() => handleCardClick("trauma")}
          >
            <div className="p-2 sm:p-3 bg-red-100 text-red-800 rounded-full flex-shrink-0">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm text-gray-500 truncate">Casos de Trauma</h3>
              <p className="text-xl sm:text-2xl font-bold text-red-800">
                {statCounts.trauma.toLocaleString()}
              </p>
            </div>
          </div>

          {/* NOVO CARD: Múltiplas Vítimas */}
          <div
            className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm flex items-center gap-3 sm:gap-4 cursor-pointer hover:shadow-md transition-shadow sm:col-span-1 xl:col-span-1 ${activeFilters.tipoAtendimento?.toLowerCase().includes('múltiplas') || activeFilters.tipoAtendimento?.toLowerCase().includes('multiplas') ? 'ring-2 ring-purple-400' : ''}`}
            onClick={() => handleCardClick("multiplas")}
          >
            <div className="p-2 sm:p-3 bg-purple-100 text-purple-800 rounded-full flex-shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm text-gray-500 truncate">Múltiplas Vítimas</h3>
              <p className="text-xl sm:text-2xl font-bold text-purple-800">
                {statCounts.multiplas.toLocaleString()}
              </p>
            </div>
          </div>

          {/* NOVO CARD: Incidente QBRN */}
          <div
            className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm flex items-center gap-3 sm:gap-4 cursor-pointer hover:shadow-md transition-shadow sm:col-span-1 xl:col-span-1 ${activeFilters.tipoAtendimento?.toLowerCase().includes('qbrn') || activeFilters.tipoAtendimento?.toLowerCase().includes('incidente q') ? 'ring-2 ring-orange-400' : ''}`}
            onClick={() => handleCardClick("qbrn")}
          >
            <div className="p-2 sm:p-3 bg-orange-100 text-orange-800 rounded-full flex-shrink-0">
              <Bomb className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm text-gray-500 truncate">Incidente QBRN</h3>
              <p className="text-xl sm:text-2xl font-bold text-orange-800">
                {statCounts.qbrn.toLocaleString()}
              </p>
            </div>
          </div>

          {/* =============================================== */}
          {/* LINHA 1: Distribuição por Público e Tipo de Atendimento */}
          {/* =============================================== */}
          
          {/* Gráfico de Público Atendido */}
          <DistribuicaoPublicoAtendidoChart
            data={filteredPublico}
            onChartClick={(itemName) => handleChartClick('publico', itemName)}
            activeFilter={activeFilters.publico}
            chartId="chart-publico"
            title="Distribuição por Público Atendido"
          />

          {/* Gráfico de Tipo de Atendimento */}
          <DistribuicaoTipoAtendimentoChart
            data={filteredTipoAtendimento}
            onChartClick={(itemName) => handleChartClick('tipoAtendimento', itemName)}
            activeFilter={activeFilters.tipoAtendimento}
            chartId="chart-tipo-atendimento"
            title="Distribuição por Tipo de Atendimento"
          />

          {/* =============================================== */}
          {/* LINHA 2: Distribuição por Sexo e Raça/Cor */}
          {/* =============================================== */}
          
          {/* Gráfico de Identidade de Gênero */}
          <DistribuicaoSexoChart
            data={filteredGenero}
            onChartClick={(itemName) => handleChartClick('genero', itemName)}
            activeFilter={activeFilters.genero}
            chartId="chart-genero"
            title="Distribuição por Sexo"
          />

          {/* Gráfico de Raça */}
          <DistribuicaoRacaCorChart
            data={filteredRaca}
            onChartClick={(itemName) => handleChartClick('raca', itemName)}
            activeFilter={activeFilters.raca}
            chartId="chart-raca"
            title="Distribuição por Raça e Cor"
          />

          {/* =============================================== */}
          {/* LINHA 3: Localização Geográfica */}
          {/* =============================================== */}
          
          {/* 🆕 PAINEL DE LOCALIZAÇÃO GEOGRÁFICA */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5">
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
          {/* LINHA 4: Estabelecimentos */}
          {/* =============================================== */}
          
          {/* Estabelecimentos por Número de Casos */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5">
            <EstabelecimentosCasosChart 
              toggleFilter={toggleFilter}
              activeFilters={activeFilters}
              filteredData={getFilteredData()}
            />
          </div>

          {/* =============================================== */}
          {/* LINHA 5: Sinais e Sintomas e Traumas */}
          {/* =============================================== */}
          
          {/* Principais Sintomas */}
          {visibleCharts.sintomas && (
            <PrincipaisSintomasChart
              data={filteredSintomas}
              onChartClick={(itemName) => handleChartClick('sintoma', itemName)}
              activeFilter={activeFilters.sintoma}
              chartId="chart-sintomas"
              title="Principais Sinais e Sintomas"
              className={`bg-white p-4 rounded-lg shadow-sm ${chartSpans.sintomas}`}
              maxItems={10}
              isVisible={visibleCharts.sintomas}
            />
          )}

          {/* Tipos de Trauma */}
          {visibleCharts.trauma && (
            <TiposTraumaChart
              data={filteredTrauma}
              onChartClick={(itemName) => handleChartClick('trauma', itemName)}
              activeFilter={activeFilters.trauma}
              chartId="chart-trauma"
              title="Tipos de Trauma"
              className={`bg-white p-4 rounded-lg shadow-sm ${chartSpans.trauma}`}
              isVisible={visibleCharts.trauma}
            />
          )}

          {/* =============================================== */}
          {/* LINHA 6: Hipóteses Diagnósticas */}
          {/* =============================================== */}
          
          {/* Hipóteses Diagnósticas */}
          {visibleCharts.hipoteses && (
            <HipotesesDiagnosticasChart
              data={filteredHipoteses}
              onChartClick={(itemName) => handleChartClick('hipotese', itemName)}
              activeFilter={activeFilters.hipotese}
              chartId="chart-hipoteses"
              title="Hipóteses Diagnósticas"
              className={`bg-white p-4 rounded-lg shadow-sm ${chartSpans.hipoteses}`}
              maxItems={15}
              isVisible={visibleCharts.hipoteses}
              COLORS={COLORS}
            />
          )}

          {/* =============================================== */}
          {/* LINHA 7: Pirâmide Etária e Desfecho */}
          {/* =============================================== */}
          
          {/* Pirâmide Etária por Sexo */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-3">
            <PiramideEtariaChart 
              toggleFilter={toggleFilter}
              activeFilters={activeFilters}
              filteredData={getFilteredData()}
            />
          </div>

          {/* Desfecho dos Casos */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <DesfechoCasosChart 
              toggleFilter={toggleFilter}
              activeFilters={activeFilters}
              filteredData={getFilteredData()}
            />
          </div>
        </main>
      )}

      {/* Aba de Fluxo Hospitalar - Análise por Hora */}
      {activeTab === "fluxo" && (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Análise de Fluxo Hospitalar
            </h2>
            <p className="text-gray-600">
              Visualização dos atendimentos por hora para otimização dos recursos hospitalares
            </p>
          </div>
          
          <AtendimentosPorHoraChart 
            key={`atendimentos-${lastUpdate}-${notificacoes.length}`}
            notificacoes={notificacoes} 
          />
        </main>
      )}

      {/* Aba do Mapa - Distribuição Geográfica */}
      {activeTab === "mapa" && (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Mapa de Estabelecimentos
            </h2>
            <p className="text-gray-600">
              Distribuição geográfica dos estabelecimentos de saúde com indicadores de urgência
            </p>
          </div>
          
          <EstabelecimentosMapaAvancado 
            notificacoes={notificacoes}
            exportOptions={exportOptions}
          />
        </main>
      )}

      {/* Aba de IA - Temporariamente desabilitada, será usada no futuro */}
      {false && (
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-600" />
              Análise Inteligente com IA
            </h2>
            <p className="text-gray-600">
              Insights automáticos, chat interativo e alertas inteligentes com múltiplas opções de IA
            </p>
          </div>

          <AIGlobalConfig className="mb-6" />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Insights Automáticos */}
            /*<div className="xl:col-span-2">
              <AIInsights 
                dashboardData={getAIDashboardData()} 
                className="w-full"
              />
            </div>

            {/* Chat com IA */}
            /*<div className="xl:col-span-1">
              <AIChat 
                dashboardData={getAIDashboardData()} 
                className="w-full"
              />
            </div>

            {/* Alertas Inteligentes */}
            /*<div className="xl:col-span-1">
              <AIAlerts 
                dashboardData={getAIDashboardData()} 
                className="w-full"
              />
            </div>

          </div>

          {/* Informações sobre IA e Privacidade */}
          /*<div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-800">Sistema de IA Flexível</h3>
            </div>
            <p className="text-purple-700 text-sm">
              O sistema suporta tanto IA local (Ollama) quanto APIs externas (OpenRouter, OpenAI, Anthropic, etc). 
              Use a configuração acima para escolher entre privacidade total com modelos locais ou acesso aos modelos mais avançados via API.
              <br />
              <span className="text-purple-600 font-medium">
                💡 Dica: Modelos locais garantem privacidade total, enquanto APIs externas oferecem capacidades mais avançadas.
              </span>
            </p>
          </div>
        </main>
      )} */

      {/* Sistema de Alertas - Sempre visível */}
      <AlertasPanel 
        key={`alertas-${lastUpdate}-${notificacoes.length}`}
        notificacoes={notificacoes} 
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
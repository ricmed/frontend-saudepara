import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import NotificacaoService from '@/services/NotificacaoService';
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
  Users,
  Briefcase,
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
  Brain
} from "lucide-react";

// 🆕 NOVOS IMPORTS: Componentes do dashboard aprimorado
import DashboardTabs, { useDashboardTabs } from './components/DashboardTabs';
import AIInsights from './components/AIInsights';
import AIChat from './components/AIChat';
import AIAlerts from './components/AIAlerts';
import AIGlobalConfig from './components/AIGlobalConfig';
import AtendimentosPorHoraChart from './components/AtendimentosPorHoraChart';
import EstabelecimentosMapaAvancado from './components/EstabelecimentosMapaAvancado';
import AlertasPanel from './components/AlertasPanel';
import PiramideEtariaChart from './components/PiramideEtariaChart';
import DesfechoCasosChart from './components/DesfechoCasosChart';
import EstabelecimentosCasosChart from './components/EstabelecimentosCasosChart';

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
    desfecho: null
  });
  
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
      
      console.log("Mapeamento de tipos de atendimento:", mapping);
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
    
    console.log(`Filtrando por categoria: "${categoria}"`);
    
    // Normalizar a categoria para comparação
    const categoriaLower = categoria.toLowerCase();
    
    // Verificar se é um tipo de atendimento
    const tiposAtendimento = ["clínico", "trauma", "múltiplas vítimas", "incidente qbrn"];
    const isTipoAtendimento = tiposAtendimento.some(tipo => categoriaLower.includes(tipo));
    
    if (isTipoAtendimento) {
      // Filtrar por tipo de atendimento
      console.log(`Filtrando por tipo de atendimento: ${categoriaLower}`);
      const resultado = originalNotificacoes.current.filter(n => checkAtendimentoType(n, categoriaLower));
      console.log(`Encontradas ${resultado.length} notificações para o tipo: ${categoriaLower}`);
      return resultado;
    }
    
    // Verificar se é um evento
    if (exportOptions?.eventoOptions?.length > 0) {
      const isEvento = exportOptions.eventoOptions.some(
        (e: any) => e.descricao.toLowerCase() === categoriaLower
      );
      
      if (isEvento) {
        console.log(`Filtrando por evento: ${categoriaLower}`);
        
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
        
        console.log(`Encontradas ${resultado.length} notificações para o evento: ${categoriaLower}`);
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
    console.log(`Encontradas ${resultado.length} notificações para a categoria: ${categoriaLower}`);
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
              const eventoId = n?.original?.evento_idevento;
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
              const dataNascimento = n?.original?.pessoa?.data_nascimento;
              if (dataNascimento) {
                const idade = new Date().getFullYear() - new Date(dataNascimento).getFullYear();
                let faixaEtaria = '';
                
                if (idade < 1) faixaEtaria = 'Menor de 1 ano';
                else if (idade >= 1 && idade <= 4) faixaEtaria = '1 a 4 anos';
                else if (idade >= 5 && idade <= 9) faixaEtaria = '5 a 9 anos';
                else if (idade >= 10 && idade <= 14) faixaEtaria = '10 a 14 anos';
                else if (idade >= 15 && idade <= 19) faixaEtaria = '15 a 19 anos';
                else if (idade >= 20 && idade <= 24) faixaEtaria = '20 a 24 anos';
                else if (idade >= 25 && idade <= 29) faixaEtaria = '25 a 29 anos';
                else if (idade >= 30 && idade <= 34) faixaEtaria = '30 a 34 anos';
                else if (idade >= 35 && idade <= 39) faixaEtaria = '35 a 39 anos';
                else if (idade >= 40 && idade <= 44) faixaEtaria = '40 a 44 anos';
                else if (idade >= 45 && idade <= 49) faixaEtaria = '45 a 49 anos';
                else if (idade >= 50 && idade <= 54) faixaEtaria = '50 a 54 anos';
                else if (idade >= 55 && idade <= 59) faixaEtaria = '55 a 59 anos';
                else if (idade >= 60 && idade <= 64) faixaEtaria = '60 a 64 anos';
                else if (idade >= 65 && idade <= 69) faixaEtaria = '65 a 69 anos';
                else if (idade >= 70 && idade <= 74) faixaEtaria = '70 a 74 anos';
                else if (idade >= 75 && idade <= 79) faixaEtaria = '75 a 79 anos';
                else faixaEtaria = '80 ou mais anos';
                
                return faixaEtaria === filterValue;
              }
              return false;
            });
            break;

          case 'desfecho':
            filteredData = filteredData.filter(n => {
              const desfecho = n?.original?.desfecho;
              return desfecho === filterValue;
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
      desfecho: null
    });
    setSelectedCategory(null);
    setSelectedEvento("Todos");
    console.log("🧹 Todos os filtros foram limpos");
  }, []);

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

  const processarCategoria = useCallback((
    dados: any[],
    campoId: string,
    opcoes: any[] = [],
    idField: string,
    descField: string,
    cores: string[],
    tipoCores: 'normal' | 'pie' = 'normal'
  ) => {
    console.log(`Processando categoria ${campoId} com ${dados.length} itens`);
    
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
  
    console.log(`Resultados processados para ${campoId}:`, resultado.length, "itens");
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
    cores: string[],
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
    console.log("Processando dados para gráficos com opcoes:", exportOptions);
    if (!Array.isArray(dadosFiltrados) || !dadosFiltrados.length) {
      console.log("Sem notificações para processar");
      return false;
    }

    if (!exportOptions || typeof exportOptions !== "object") {
      console.log("exportOptions inválido");
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
        
        console.log("📈 Atualizando hipóteses diagnósticas:", sortedHipoteses.length, "itens");
        setFilteredHipoteses(sortedHipoteses);
        if (originalHipoteses.length === 0) {
          setOriginalHipoteses(sortedHipoteses);
        }
      }

      console.log("🔍 DEBUG: Processando traumas...");
      console.log("📊 Dados filtrados para trauma:", dadosFiltrados.length, "notificações");
      console.log("🔧 traumaOptions disponíveis:", exportOptions?.traumaOptions?.length || 0);
      console.log("🔧 traumaOptions sample:", exportOptions?.traumaOptions?.slice(0, 3));
      
      // Verificar se há notificações com trauma - agora usando o relacionamento many-to-many
      const notificacoesComTrauma = dadosFiltrados.filter(n => 
        n?.original?.notificacao_has_tipo_trauma && 
        Array.isArray(n.original.notificacao_has_tipo_trauma) && 
        n.original.notificacao_has_tipo_trauma.length > 0
      );
      console.log("🏥 Notificações com trauma:", notificacoesComTrauma.length);
      if (notificacoesComTrauma.length > 0) {
        console.log("🏥 Amostra de traumas:", notificacoesComTrauma.slice(0, 5).map(n => 
          n.original.notificacao_has_tipo_trauma.map((t: any) => t.tipo_trauma_idtipo_trauma)
        ));
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
      console.log("📈 Dados de trauma processados:", traumaPorNotificacao);
      if (traumaPorNotificacao.length > 0) {
        setFilteredTrauma(traumaPorNotificacao);
        if (originalTrauma.length === 0) {
          setOriginalTrauma(traumaPorNotificacao);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao processar dados para gráficos:", error);
      return false;
    }
  }, [exportOptions, processarCategoria, processarCategoriaMuitosParaMuitos, 
      originalRaca, originalEscolaridade, originalUnidades, originalGenero, 
      originalSintomas, originalTipoAtendimento, originalPublico, 
      originalHipoteses, originalTrauma]);

  // Função para calcular estatísticas a partir das notificações
  const calcularEstatisticas = useCallback((dadosFiltrados: any[] = []) => {
    const dados = dadosFiltrados.length > 0 ? dadosFiltrados : notificacoes;
    
    if (!Array.isArray(dados)) {
      console.error("dados não é um array:", dados);
      return false;
    }

    console.log("Calculando estatísticas para", dados.length, "notificações");

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
      console.log("📊 Iniciando processamento de dados para gráficos...");
      const processResult = processarDadosGraficos(dados);
      console.log("📊 Processamento de gráficos concluído:", processResult);
      return processResult;
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);
      return false;
    }
  }, [notificacoes, processarDadosGraficos, getAtendimentoDescById]);

  // 🆕 FUNÇÃO MELHORADA PARA PROCESSAR DADOS COM FILTROS CRUZADOS
  const processarDadosComFiltros = useCallback(() => {
    const dadosFiltrados = getFilteredData();
    console.log(`📊 Processando ${dadosFiltrados.length} notificações com filtros cruzados`);
    
    // Atualizar dados filtrados de referência
    filteredNotificacoes.current = dadosFiltrados;
    
    // Recalcular estatísticas e gráficos
    calcularEstatisticas(dadosFiltrados);
  }, [getFilteredData, calcularEstatisticas]);

  // Função para buscar dados frescos do servidor
  const fetchFreshData = useCallback(async () => {
    try {
      console.log("Buscando dados frescos do servidor...");
      
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
    console.log("🔄 Auto-atualização disparada!");
    
    if (loading) {
      console.log("⏸️ Atualização pulada - carregamento em andamento");
      return; // Evita atualizações simultâneas
    }
    
    console.log("📡 Iniciando busca de dados frescos...");
    setLoading(true);
    
    try {
      // Buscar dados frescos do servidor usando o NotificacaoService
      const freshData = await fetchFreshData();
      console.log(`📊 Dados recebidos: ${freshData?.length || 0} notificações`);
      
      // Se conseguimos novos dados, processar
      if (freshData) {
        // Notificar o componente pai sobre novos dados
        if (onDataRefresh && freshData.length !== notificacoes.length) {
          console.log("🔔 Notificando componente pai sobre novos dados...");
          onDataRefresh(freshData);
        }
        
        console.log("📈 Atualizando dados locais...");
        // Atualizar dados originais
        if (selectedCategory) {
          // Se temos um filtro ativo, reaplicá-lo
          console.log(`🎯 Reaplicando filtro: ${selectedCategory}`);
          const dadosFiltrados = filtrarNotificacoes(selectedCategory);
          filteredNotificacoes.current = dadosFiltrados;
          calcularEstatisticas(dadosFiltrados);
        } else {
          // Sem filtro, processar todos os dados originais
          console.log("📋 Processando todos os dados sem filtro");
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
          
          // Substituir os dados originais pelos novos
          originalNotificacoes.current = [...notificacoes];
          initialProcessingDone.current = false;
        }
        
        // Reprocessar o que temos
        if (selectedCategory) {
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
      
      console.log("✅ Auto-atualização concluída com sucesso");

    } catch (error) {
      console.error("❌ Erro na atualização:", error);
    } finally {
      setLoading(false);
      setLastUpdate(new Date().toLocaleString());
      console.log(`🕐 Última atualização: ${new Date().toLocaleString()}`);
    }
  }, [loading, selectedCategory, fetchFreshData, notificacoes, filtrarNotificacoes, calcularEstatisticas, onDataRefresh]);

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
          console.log("🔄 Auto-atualização disparada! Contador zerou.");
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
    if (!initialProcessingDone.current) return;
    
    console.log("🔄 Aplicando filtros cruzados...", activeFilters);
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
    console.log("Notificações recebidas:", notificacoes?.length || 0);
    
    // Sempre armazenar as notificações originais quando recebermos novas
    if (notificacoes && notificacoes.length > 0) {
      originalNotificacoes.current = [...notificacoes];
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
          // Processar todas as notificações (sem filtro inicialmente)
          filteredNotificacoes.current = notificacoes;
          const success = calcularEstatisticas(notificacoes);
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
    console.log(`Evento alterado para: ${novoEvento}`);
    
    setSelectedEvento(novoEvento);
    setSelectedCategory(novoEvento !== "Todos" ? novoEvento : null);
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
    <div className="min-h-screen bg-gray-100 text-gray-800 pb-6">
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
              NOTIFICAÇÕES DURANTE EVENTOS EPIDEMIOLÓGICOS (NDEE)
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
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  onBlur={() =>
                    setTimeout(() => setShowExportDropdown(false), 200)
                  }
                  className="flex items-center justify-center gap-2 px-2 sm:px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs sm:text-sm whitespace-nowrap w-full sm:w-auto"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 mt-1 bg-white rounded shadow-lg py-1 z-20 min-w-[160px] sm:min-w-40">
                    <button className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-gray-100">
                      <FileSearch2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                      Exportar PDF
                    </button>
                    <button className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-gray-100">
                      <File className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                      Exportar Word
                    </button>
                    <button className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-gray-100">
                      <FileImage className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      Exportar PNG
                  </button>
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    <File className="h-4 w-4 text-gray-500" />
                    Exportar CSV
                  </button>
                </div>
              )}
            </div>
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
                    sintoma: 'Sintoma'
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

          {/* Gráfico de Público Atendido */}
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-700" />
                <h3 className="text-xs sm:text-sm font-medium text-gray-700">
                  Distribuição por Público Atendido
                </h3>
                <MousePointer className="h-3 w-3 text-blue-500 opacity-60" />
              </div>
              <div className="flex gap-2 self-start sm:self-auto">
                <button 
                  onClick={() => toggleChartType('publico')}
                  className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                  title="Alternar tipo de gráfico"
                >
                  {chartType.publico === 'bar' ? 
                    <PieChartIcon className="h-4 w-4" /> : 
                    <BarChart2 className="h-4 w-4" />}
                </button>
                <GraphExportMenu 
                  chartId="chart-publico" 
                  chartType={chartType.publico}
                  chartData={filteredPublico}
                  chartTitle="Distribuição por Público Atendido"
                />
              </div>
            </div>
            <div className="h-64" id="chart-publico">
              {filteredPublico.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType.publico === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={filteredPublico}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                        onClick={(data) => {
                          if (data && data.name) {
                            handleChartClick('publico', data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredPublico.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={activeFilters.publico === entry.name ? "#000" : "none"}
                            strokeWidth={activeFilters.publico === entry.name ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                        }}
                        formatter={(value) => [
                          value.toLocaleString(),
                          "Notificações",
                        ]}
                      />
                    </PieChart>
                  ) : (
                    <BarChart
                      data={filteredPublico}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                        }}
                        formatter={(value) => [
                          value.toLocaleString(),
                          "Notificações",
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        onClick={(data) => {
                          if (data && data.name) {
                            handleChartClick('publico', data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredPublico.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={activeFilters.publico === entry.name ? "#000" : "none"}
                            strokeWidth={activeFilters.publico === entry.name ? 2 : 0}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Não há dados disponíveis para exibir
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Tipo de Atendimento - AGORA COMO BARRAS */}
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-700" />
                <h3 className="text-sm font-medium text-gray-700">
                  Distribuição por Tipo de Atendimento
                </h3>
                <MousePointer className="h-3 w-3 text-blue-500 opacity-60" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleChartType('tipoAtendimento')}
                  className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                  title="Alternar tipo de gráfico"
                >
                  {chartType.tipoAtendimento === 'bar' ? 
                    <PieChartIcon className="h-4 w-4" /> : 
                    <BarChart2 className="h-4 w-4" />}
                </button>
                <GraphExportMenu 
                  chartId="chart-tipo-atendimento" 
                  chartType={chartType.tipoAtendimento}
                  chartData={filteredTipoAtendimento}
                  chartTitle="Distribuição por Tipo de Atendimento"
                />
              </div>
            </div>
            <div className="h-64" id="chart-tipo-atendimento">
              {filteredTipoAtendimento.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType.tipoAtendimento === 'bar' ? (
                    <BarChart
                      data={filteredTipoAtendimento}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                        }}
                        formatter={(value) => [
                          value.toLocaleString(),
                          "Notificações",
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        onClick={(data) => {
                          if (data && data.name) {
                            handleChartClick('tipoAtendimento', data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredTipoAtendimento.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={activeFilters.tipoAtendimento === entry.name ? "#000" : "none"}
                            strokeWidth={activeFilters.tipoAtendimento === entry.name ? 2 : 0}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={filteredTipoAtendimento}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                        onClick={(data) => {
                          if (data && data.name) {
                            handleChartClick('tipoAtendimento', data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredTipoAtendimento.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={activeFilters.tipoAtendimento === entry.name ? "#000" : "none"}
                            strokeWidth={activeFilters.tipoAtendimento === entry.name ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                        }}
                        formatter={(value) => [
                          value.toLocaleString(),
                          "Notificações",
                        ]}
                      />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Não há dados disponíveis para exibir
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Identidade de Gênero */}
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-700" />
                <h3 className="text-sm font-medium text-gray-700">
                  Distribuição por Sexo
                </h3>
                <MousePointer className="h-3 w-3 text-blue-500 opacity-60" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleChartType('genero')}
                  className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                  title="Alternar tipo de gráfico"
                >
                  {chartType.genero === 'bar' ? 
                    <PieChartIcon className="h-4 w-4" /> : 
                    <BarChart2 className="h-4 w-4" />}
                </button>
                <GraphExportMenu 
                  chartId="chart-genero" 
                  chartType={chartType.genero}
                  chartData={filteredGenero}
                  chartTitle="Distribuição por Sexo"
                />
              </div>
            </div>
            <div className="h-64" id="chart-genero">
              {filteredGenero.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType.genero === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={filteredGenero}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                        cursor="pointer"
                        onClick={(data) => {
                          if (data && data.name) {
                            handleChartClick('genero', data.name);
                          }
                        }}
                      >
                        {filteredGenero.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={activeFilters.genero === entry.name ? "#000" : "none"}
                            strokeWidth={activeFilters.genero === entry.name ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                        }}
                        formatter={(value) => [
                          value.toLocaleString(),
                          "Notificações",
                        ]}
                      />
                    </PieChart>
                  ) : (
                    <BarChart
                      data={filteredGenero}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                        }}
                        formatter={(value) => [
                          value.toLocaleString(),
                          "Notificações",
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        onClick={(data) => {
                          if (data && data.name) {
                            handleChartClick('genero', data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredGenero.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={activeFilters.genero === entry.name ? "#000" : "none"}
                            strokeWidth={activeFilters.genero === entry.name ? 2 : 0}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Não há dados disponíveis para exibir
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Raça */}
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-700" />
                <h3 className="text-sm font-medium text-gray-700">
                  Distribuição por Raça e Cor
                </h3>
                <MousePointer className="h-3 w-3 text-blue-500 opacity-60" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleChartType('raca')}
                  className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                  title="Alternar tipo de gráfico"
                >
                  {chartType.raca === 'bar' ? 
                    <PieChartIcon className="h-4 w-4" /> : 
                    <BarChart2 className="h-4 w-4" />}
                </button>
                <GraphExportMenu 
                  chartId="chart-raca" 
                  chartType={chartType.raca}
                  chartData={filteredRaca}
                  chartTitle="Distribuição por Raça e Cor"
                />
              </div>
            </div>
            <div className="h-64" id="chart-raca">
              {filteredRaca.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType.raca === 'bar' ? (
                    <BarChart
                      data={filteredRaca}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                        }}
                        formatter={(value) => [
                          value.toLocaleString(),
                          "Notificações",
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        onClick={(data) => {
                          if (data && data.name) {
                            handleChartClick('raca', data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredRaca.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={activeFilters.raca === entry.name ? "#000" : "none"}
                            strokeWidth={activeFilters.raca === entry.name ? 2 : 0}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={filteredRaca}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                        onClick={(data) => {
                          if (data && data.name) {
                            handleChartClick('raca', data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredRaca.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={activeFilters.raca === entry.name ? "#000" : "none"}
                            strokeWidth={activeFilters.raca === entry.name ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                        }}
                        formatter={(value) => [
                          value.toLocaleString(),
                          "Notificações",
                        ]}
                      />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Não há dados disponíveis para exibir
                </div>
              )}
            </div>
          </div>

          {/* Principais Sintomas */}
          {visibleCharts.sintomas && (
          <div className={`bg-white p-4 rounded-lg shadow-sm ${chartSpans.sintomas}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-700" />
                <h3 className="text-sm font-medium text-gray-700">
                  Principais Sinais e Sintomas
                </h3>
              </div>
              <GraphExportMenu 
                chartId="chart-sintomas" 
                chartType="bar"
                chartData={filteredSintomas.slice(0, 10)}
                chartTitle="Principais Sinais e Sintomas"
              />
            </div>
            <div className="h-64" id="chart-sintomas">
              {filteredSintomas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredSintomas.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#666" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#666"
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                      }}
                      formatter={(value) => [
                        value.toLocaleString(),
                        "Notificações",
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      onClick={(data) => {
                        if (data && data.name) {
                          handleChartClick('sintoma', data.name);
                        }
                      }}
                      cursor="pointer"
                    >
                      {filteredSintomas.slice(0, 10).map((entry, i) => (
                        <Cell 
                          key={`cell-${i}`} 
                          fill={entry.fill}
                          stroke={activeFilters.sintoma === entry.name ? "#000" : "none"}
                          strokeWidth={activeFilters.sintoma === entry.name ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Não há dados disponíveis para exibir
                </div>
              )}
            </div>
          </div>
          )}

          {/* Tipos de Trauma */}
          {visibleCharts.trauma && (
          <div className={`bg-white p-4 rounded-lg shadow-sm ${chartSpans.trauma}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-700" />
                <h3 className="text-sm font-medium text-gray-700">
                  Tipos de Trauma
                </h3>
              </div>
              <GraphExportMenu 
                chartId="chart-trauma" 
                chartType="bar"
                chartData={filteredTrauma}
                chartTitle="Tipos de Trauma"
              />
            </div>
            <div className="h-64" id="chart-trauma">
              {filteredTrauma.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredTrauma}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#666" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#666"
                      width={80}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                      }}
                      formatter={(value) => [
                        value.toLocaleString(),
                        "Casos",
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      onClick={(data) => {
                        if (data && data.name) {
                          handleChartClick('trauma', data.name);
                        }
                      }}
                      cursor="pointer"
                    >
                      {filteredTrauma.map((entry, i) => (
                        <Cell 
                          key={`cell-${i}`} 
                          fill={entry.fill}
                          stroke={activeFilters.trauma === entry.name ? "#000" : "none"}
                          strokeWidth={activeFilters.trauma === entry.name ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Nenhum caso de trauma registrado
                </div>
              )}
            </div>
          </div>
          )}

          {/* Hipóteses Diagnósticas */}
          {visibleCharts.hipoteses && (
          <div className={`bg-white p-4 rounded-lg shadow-sm ${chartSpans.hipoteses}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-700" />
                <h3 className="text-sm font-medium text-gray-700">
                  Hipóteses Diagnósticas
                </h3>
              </div>
              <div className="flex gap-2">
                <GraphExportMenu 
                  chartId="chart-hipoteses" 
                  chartType="bar"
                  chartData={filteredHipoteses.slice(0, 15)}
                  chartTitle="Hipóteses Diagnósticas"
                />
                <div className="flex ml-2 space-x-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS.alarmante}}></div>
                    <span>Crítica</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS.alerta}}></div>
                    <span>Alta</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS.medio}}></div>
                    <span>Média</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS.normal}}></div>
                    <span>Normal</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-96" id="chart-hipoteses">
              {filteredHipoteses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredHipoteses.slice(0, 15)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#666" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#666"
                      width={140}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                      }}
                      formatter={(value) => [
                        value.toLocaleString(),
                        "Notificações",
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      onClick={(data) => {
                        if (data && data.name) {
                          handleChartClick('hipotese', data.name);
                        }
                      }}
                      cursor="pointer"
                    >
                      {filteredHipoteses.slice(0, 15).map((entry, i) => (
                        <Cell 
                          key={`cell-${i}`} 
                          fill={entry.fill}
                          // Adicionar uma borda especial para as hipóteses alarmantes
                          // E também destacar a seleção atual
                          stroke={activeFilters.hipotese === entry.name ? "#000" : (entry.isAlarmante ? "#b71c1c" : "none")}
                          strokeWidth={activeFilters.hipotese === entry.name ? 2 : (entry.isAlarmante ? 2 : 0)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Não há dados disponíveis para exibir
                </div>
              )}
            </div>
            <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600">
                <span className="text-red-500 font-bold">⚠️ Atenção: </span>
                As hipóteses em <span className="text-red-500 font-bold">vermelho</span> requerem notificação imediata e vigilância rigorosa mesmo com um único caso.
                As hipóteses em <span className="text-orange-500 font-bold">laranja</span> requerem monitoramento cuidadoso.
                Todas seguem a classificação de vigilância epidemiológica do Ministério da Saúde.
              </p>
            </div>
          </div>
          )}

          {/* Novos Gráficos Solicitados */}
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

          {/* Estabelecimentos por Número de Casos */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5">
            <EstabelecimentosCasosChart 
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
            key={`mapa-${lastUpdate}-${notificacoes.length}`}
            notificacoes={notificacoes} 
          />
        </main>
      )}

      {/* Aba de IA - Análise Inteligente */}
      {activeTab === "ia" && (
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

          {/* Configuração Global da IA */}
          <AIGlobalConfig className="mb-6" />

          {/* Grid responsivo com os 3 componentes de IA */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Insights Automáticos */}
            <div className="xl:col-span-2">
              <AIInsights 
                dashboardData={getAIDashboardData()} 
                className="w-full"
              />
            </div>

            {/* Chat com IA */}
            <div className="xl:col-span-1">
              <AIChat 
                dashboardData={getAIDashboardData()} 
                className="w-full"
              />
            </div>

            {/* Alertas Inteligentes */}
            <div className="xl:col-span-1">
              <AIAlerts 
                dashboardData={getAIDashboardData()} 
                className="w-full"
              />
            </div>

          </div>

          {/* Informações sobre IA e Privacidade */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
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
      )}

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
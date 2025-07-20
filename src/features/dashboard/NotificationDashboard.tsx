import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
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
  RotateCcw
} from "lucide-react";

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
  normal: "#3b5bdb",        // Azul para casos normais
};

// Lista de hipóteses de notificação compulsória imediata para MS, SES e SMS
// Baseado na Portaria nº 204/2016 do Ministério da Saúde e na lista fornecida
const HIPOTESES_ALARMANTES = [
  "BOTULISMO", "CÓLERA", "DIFTERIA", "DOENÇA DE CHAGAS AGUDA", 
  "FEBRE AMARELA", "FEBRE DO NILO OCIDENTAL", "DOENÇA MENINGOCÓCICA", 
  "OUTRAS MENINGITES", "SARAMPO", "RUBÉOLA", "PARALISIA FLÁCIDA AGUDA",
  "DENGUE", "ZIKA VÍRUS", "COVID 19"
];

// Lista de hipóteses de notificação compulsória imediata para MS e SES
// ou notificação semanal mas com necessidade de monitoramento rigoroso
const HIPOTESES_ALERTA = [
  "TÉTANO ACIDENTAL", "COQUELUCHE", "MALÁRIA", "LEPTOSPIROSE", 
  "INFLUENZA SAZONAL", "FEBRE TIFÓIDE", "LEISHMANIOSE VISCERAL",
  "HANSENIASE", "VARICELA", "HERPES ZOSTER", "LEISHMANIOSE TEG. AMERICANA", 
  "CHIKUNGUNYA", "TUBERCULOSE", "ROTAVIROSE", 
  "DOENÇAS DE TRANSMISSÃO HÍDRICA E ALIMENTAR", "CAXUMBA"
];

// Interface para as props do dashboard
interface DashboardProps {
  notificacoes?: any[]; // Lista de notificações da API
  exportOptions?: any; // Opções de exportação com os tipos/categorias
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
}) => {
  // Para controlar se já fizemos o processamento inicial
  const initialProcessingDone = useRef(false);
  const originalNotificacoes = useRef<any[]>([]);
  const filteredNotificacoes = useRef<any[]>([]);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const refreshDataRef = useRef<any>(null);
  
  // Estado para controle de visualização
  const [activeTab, setActiveTab] = useState("graficos");

  // Estado para filtragem interativa
  const [loading, setLoading] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState("Todos");
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleString());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(60); // 60 segundos = 1 minuto

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

  // Função para determinar se uma hipótese é alarmante
  const isHipotesisAlarmante = useCallback((hipotese: string): boolean => {
    const hipoteseUpper = hipotese.toUpperCase();
    // Verificar correspondência exata ou parcial com as hipóteses alarmantes
    return HIPOTESES_ALARMANTES.some(alarmante => 
      hipoteseUpper.includes(alarmante) || alarmante.includes(hipoteseUpper)
    );
  }, []);

  // Função para determinar se uma hipótese está em alerta (média gravidade)
  const isHipotesisAlerta = useCallback((hipotese: string): boolean => {
    const hipoteseUpper = hipotese.toUpperCase();
    // Verificar correspondência exata ou parcial com as hipóteses em alerta
    return HIPOTESES_ALERTA.some(alerta => 
      hipoteseUpper.includes(alerta) || alerta.includes(hipoteseUpper)
    );
  }, []);

  // Função para obter a cor adequada para cada hipótese diagnóstica
  const getHipotesisColor = useCallback((hipotese: string, value: number): string => {
    // Se for uma hipótese alarmante, mesmo com 1 caso já é vermelho
    if (isHipotesisAlarmante(hipotese)) {
      return COLORS.alarmante;
    }
    
    // Se for uma hipótese de alerta, usar a cor de alerta
    if (isHipotesisAlerta(hipotese)) {
      return COLORS.alerta;
    }
    
    // Casos normais, usar a paleta padrão
    return COLORS.normal;
  }, [isHipotesisAlarmante, isHipotesisAlerta]);

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
        
        setFilteredHipoteses(sortedHipoteses);
        if (originalHipoteses.length === 0) {
          setOriginalHipoteses(sortedHipoteses);
        }
      }

      const traumaPorNotificacao = processarCategoria(
        dadosFiltrados,
        "original.tipo_trauma_idtipo_trauma",
        exportOptions.traumaOptions || [],
        "idtipo_trauma",
        "descricao",
        COLORS.blue,
        'normal'
      );
      console.log("Dados de trauma processados:", traumaPorNotificacao);
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
      return processarDadosGraficos(dados);
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);
      return false;
    }
  }, [notificacoes, processarDadosGraficos, getAtendimentoDescById]);

  // Função para buscar dados frescos do servidor usando o NotificacaoService
  const fetchFreshData = useCallback(async () => {
    try {
      console.log("Buscando dados frescos do servidor via NotificacaoService...");
      
      // Simular busca de dados via serviço
      const mockData = [...notificacoes];
      console.log("Novos dados recebidos:", mockData.length, "notificações");
      
      // Atualizar as notificações originais
      originalNotificacoes.current = [...mockData];
      
      return mockData;
    } catch (error) {
      console.error("Erro ao buscar dados do servidor:", error);
      return null;
    }
  }, [notificacoes]);

  // Função para atualizar os dados
  const refreshData = useCallback(async () => {
    if (loading) return; // Evita atualizações simultâneas
    
    console.log("Atualizando dados automaticamente...");
    setLoading(true);
    
    try {
      // Buscar dados frescos do servidor usando o NotificacaoService
      const freshData = await fetchFreshData();
      
      // Se conseguimos novos dados, processar
      if (freshData) {
        // Atualizar dados originais
        if (selectedCategory) {
          // Se temos um filtro ativo, reaplicá-lo
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
        console.log("Verificando notificações via props...");
        if (notificacoes && notificacoes.length > 0 && 
            notificacoes.length !== originalNotificacoes.current.length) {
          console.log("Detectada diferença nas notificações:", 
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

    } catch (error) {
      console.error("Erro na atualização:", error);
    } finally {
      setLoading(false);
      setLastUpdate(new Date().toLocaleString());
    }
  }, [loading, selectedCategory, fetchFreshData, notificacoes, filtrarNotificacoes, calcularEstatisticas]);

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

  // Quando a categoria selecionada mudar, aplicar filtro real
  useEffect(() => {
    if (!initialProcessingDone.current) return;
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
  }, [selectedCategory, filtrarNotificacoes, calcularEstatisticas]);

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

  // Handler para cards e charts
  const handleCardClick = useCallback((tipoAtendimento: string) => {
    console.log(`Card clicado: ${tipoAtendimento}`);
    const filterKey = atendimentoToFilterKey[tipoAtendimento.toLowerCase()] || tipoAtendimento;
    
    // Se já está selecionado, limpar filtro
    if (selectedCategory === filterKey) {
      console.log("Limpando filtro atual");
      setSelectedCategory(null);
      setSelectedEvento("Todos");
    } else {
      console.log(`Aplicando filtro: ${filterKey}`);
      setSelectedCategory(filterKey);
      
      // Manter evento selecionado sincronizado se necessário
      if (tipoAtendimento !== selectedEvento && !Object.values(atendimentoToFilterKey).includes(selectedEvento)) {
        setSelectedEvento("Todos");
      }
    }
  }, [selectedCategory, selectedEvento, atendimentoToFilterKey]);

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
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 text-white mb-4 md:mb-0">
            <button
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Voltar"
              onClick={handleBackButton}
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <ClipboardList className="h-7 w-7" />
            <h1 className="text-xl md:text-2xl font-semibold">
              NOTIFICAÇÕES DURANTE EVENTOS EPIDEMIOLÓGICOS (NDEE)
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded text-white text-sm">
              <Clock className="h-4 w-4" />
              <span>Última atualização: {lastUpdate}</span>
              <span className="ml-2 text-yellow-200">
                {autoRefreshEnabled && `Próxima em: ${autoRefreshCountdown}s`}
              </span>
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Atualizar
            </button>

            <button
              onClick={toggleAutoRefresh}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                autoRefreshEnabled 
                  ? "bg-yellow-500 text-white hover:bg-yellow-600" 
                  : "bg-gray-400 text-white hover:bg-gray-500"
              }`}
            >
              <Clock className="h-4 w-4" />
              {autoRefreshEnabled ? "Auto Atualização ON" : "Auto Atualização OFF"}
            </button>

            {/* Botão de exportação com dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                onBlur={() =>
                  setTimeout(() => setShowExportDropdown(false), 200)
                }
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Exportar
                <ChevronDown className="h-3 w-3" />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 mt-1 bg-white rounded shadow-lg py-1 z-20 min-w-40">
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    <FileSearch2 className="h-4 w-4 text-red-500" />
                    Exportar PDF
                  </button>
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    <File className="h-4 w-4 text-blue-500" />
                    Exportar Word
                  </button>
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    <FileImage className="h-4 w-4 text-green-500" />
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
      </header>

      {/* Seção de Filtros */}
      <div className="max-w-7xl mx-auto mt-4 px-4">
        <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap gap-4 items-center">
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
      </div>

      {/* Abas para alternar entre Gráficos, Tabelas e Mapas */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="flex border-b border-gray-300">
          <button
            className={`py-2 px-4 font-medium ${activeTab === "graficos" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-blue-500"}`}
            onClick={() => setActiveTab("graficos")}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Gráficos
            </div>
          </button>
        </div>
      </div>

      {/* Conteúdo principal baseado na aba selecionada */}
      {activeTab === "graficos" && (
        <main
          className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-2"
        >
          {/* Cards de Resumo */}
          <div
            className={`bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow ${selectedCategory === null ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => { setSelectedCategory(null); setSelectedEvento("Todos"); }}
          >
            <div className="p-3 bg-blue-100 text-blue-800 rounded-full">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Total de Notificações</h3>
              <p className="text-2xl font-bold text-blue-800">
                {totalNotifications.toLocaleString()}
              </p>
            </div>
          </div>

          <div
            className={`bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow ${selectedCategory === 'Clínico' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => handleCardClick("clinico")}
          >
            <div className="p-3 bg-green-100 text-green-800 rounded-full">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Casos Clínicos</h3>
              <p className="text-2xl font-bold text-green-800">
                {statCounts.clinico.toLocaleString()}
              </p>
            </div>
          </div>

          <div
            className={`bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow ${selectedCategory === 'Trauma' ? 'ring-2 ring-red-400' : ''}`}
            onClick={() => handleCardClick("trauma")}
          >
            <div className="p-3 bg-red-100 text-red-800 rounded-full">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Casos de Trauma</h3>
              <p className="text-2xl font-bold text-red-800">
                {statCounts.trauma.toLocaleString()}
              </p>
            </div>
          </div>

          {/* NOVO CARD: Múltiplas Vítimas */}
          <div
            className={`bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow ${selectedCategory === 'Múltiplas Vítimas' ? 'ring-2 ring-purple-400' : ''}`}
            onClick={() => handleCardClick("multiplas")}
          >
            <div className="p-3 bg-purple-100 text-purple-800 rounded-full">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Múltiplas Vítimas</h3>
              <p className="text-2xl font-bold text-purple-800">
                {statCounts.multiplas.toLocaleString()}
              </p>
            </div>
          </div>

          {/* NOVO CARD: Incidente QBRN */}
          <div
            className={`bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow ${selectedCategory === 'Incidente QBRN' ? 'ring-2 ring-orange-400' : ''}`}
            onClick={() => handleCardClick("qbrn")}
          >
            <div className="p-3 bg-orange-100 text-orange-800 rounded-full">
              <Bomb className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Incidente QBRN</h3>
              <p className="text-2xl font-bold text-orange-800">
                {statCounts.qbrn.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Gráfico de Público Atendido */}
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-yellow-700" />
                <h3 className="text-sm font-medium text-gray-700">
                  Distribuição por Público Atendido
                </h3>
              </div>
              <div className="flex gap-2">
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
                            handleCardClick(data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredPublico.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={selectedCategory === entry.name ? "#000" : "none"}
                            strokeWidth={selectedCategory === entry.name ? 2 : 0}
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
                            handleCardClick(data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredPublico.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={selectedCategory === entry.name ? "#000" : "none"}
                            strokeWidth={selectedCategory === entry.name ? 2 : 0}
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
                            handleCardClick(data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredTipoAtendimento.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={selectedCategory === entry.name ? "#000" : "none"}
                            strokeWidth={selectedCategory === entry.name ? 2 : 0}
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
                            handleCardClick(data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredTipoAtendimento.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={selectedCategory === entry.name ? "#000" : "none"}
                            strokeWidth={selectedCategory === entry.name ? 2 : 0}
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
                            handleCardClick(data.name);
                          }
                        }}
                      >
                        {filteredGenero.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={selectedCategory === entry.name ? "#000" : "none"}
                            strokeWidth={selectedCategory === entry.name ? 2 : 0}
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
                            handleCardClick(data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredGenero.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={selectedCategory === entry.name ? "#000" : "none"}
                            strokeWidth={selectedCategory === entry.name ? 2 : 0}
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
                            handleCardClick(data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredRaca.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={selectedCategory === entry.name ? "#000" : "none"}
                            strokeWidth={selectedCategory === entry.name ? 2 : 0}
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
                            handleCardClick(data.name);
                          }
                        }}
                        cursor="pointer"
                      >
                        {filteredRaca.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.fill}
                            stroke={selectedCategory === entry.name ? "#000" : "none"}
                            strokeWidth={selectedCategory === entry.name ? 2 : 0}
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
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2 lg:col-span-3">
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
                          handleCardClick(data.name);
                        }
                      }}
                      cursor="pointer"
                    >
                      {filteredSintomas.slice(0, 10).map((entry, i) => (
                        <Cell 
                          key={`cell-${i}`} 
                          fill={entry.fill}
                          stroke={selectedCategory === entry.name ? "#000" : "none"}
                          strokeWidth={selectedCategory === entry.name ? 2 : 0}
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

          {/* Tipos de Trauma */}
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2 lg:col-span-2">
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
                          handleCardClick(data.name);
                        }
                      }}
                      cursor="pointer"
                    >
                      {filteredTrauma.map((entry, i) => (
                        <Cell 
                          key={`cell-${i}`} 
                          fill={entry.fill}
                          stroke={selectedCategory === entry.name ? "#000" : "none"}
                          strokeWidth={selectedCategory === entry.name ? 2 : 0}
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

          {/* Hipóteses Diagnósticas */}
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2 lg:col-span-5">
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
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                    <span>Alta Prioridade</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
                    <span>Monitoramento</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                    <span>Regular</span>
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
                          handleCardClick(data.name);
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
                          stroke={selectedCategory === entry.name ? "#000" : (entry.isAlarmante ? "#b71c1c" : "none")}
                          strokeWidth={selectedCategory === entry.name ? 2 : (entry.isAlarmante ? 2 : 0)}
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
        </main>
      )}

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
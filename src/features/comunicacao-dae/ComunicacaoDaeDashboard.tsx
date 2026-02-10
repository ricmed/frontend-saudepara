import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ComunicacaoDaeService, { ComunicacaoDae } from '@/services/ComunicacaoDaeService';
import CrsService, { Crs } from '@/services/CrsService';
import NheService, { Nhe } from '@/services/NheService';
import CievsService, { Cievs } from '@/services/CievsService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import {
  FileText,
  Building2,
  Hospital,
  Activity,
  MapPin,
  ArrowLeft,
  RefreshCw,
  X,
  Calendar,
  Menu,
  Layers,
  Info,
  AlertCircle,
  Search,
  Eye,
  Edit,
  Clock,
  Filter,
} from 'lucide-react';
import { SideMenu } from '@/features/home/components/SideMenu';
import ChartExportMenu from '@/components/common/ChartExportMenu';
import DashboardExportMenu from '@/components/common/DashboardExportMenu';
import MapaDashboardDAE, { LocalizacaoMapa, LocalizacaoTipo } from '@/features/dashboard/components/MapaDashboardDAE';
import { MapProviderProvider } from '@/features/maps/leaflet/contexts/MapProviderContext';

interface ChartDataItem {
  name: string;
  value: number;
  id?: number;
}

interface DashboardStats {
  total: number;
  crs: number;
  nhe: number;
  cievs: number;
}

interface ActiveFilters {
  origem_tipo: string | string[] | null;
  origem_id: number | number[] | null;
  dae_id: number | number[] | null;
  municipio_id: number | number[] | null;
}

const ComunicacaoDaeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoDae[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Listas de CRS, NHE e CIEVS para nomes descritivos
  const [crsList, setCrsList] = useState<Crs[]>([]);
  const [nheList, setNheList] = useState<Nhe[]>([]);
  const [cievsList, setCievsList] = useState<Cievs[]>([]);

  // Modal de comunicações
  const [showComunicacoesModal, setShowComunicacoesModal] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  
  // Estado para localizações do mapa
  const [localizacoes, setLocalizacoes] = useState<LocalizacaoMapa[]>([]);
  const [selectedLocalizacao, setSelectedLocalizacao] = useState<LocalizacaoMapa | null>(null);
  const [showLocalizacaoModal, setShowLocalizacaoModal] = useState(false);
  
  // Estado para modal de visualização de ficha
  const [selectedComunicacao, setSelectedComunicacao] = useState<ComunicacaoDae | null>(null);
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [fichaModalMode, setFichaModalMode] = useState<'view' | 'edit'>('view');

  // Filtros
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    origem_tipo: null,
    origem_id: null,
    dae_id: null,
    municipio_id: null,
  });
  
  // Filtro de período
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  
  // Filtro de horário
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [horaFim, setHoraFim] = useState<string>('');

  // Auto-atualização
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(60); // 60 segundos = 1 minuto
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleString('pt-BR'));
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const refreshDataRef = useRef<(() => void) | null>(null);
  const ctrlPressedRef = useRef(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const scrollPositionRef = useRef<number>(0);

  // Listeners para rastrear Ctrl/Cmd para seleção múltipla
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = true;
        setIsCtrlPressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = false;
        setIsCtrlPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Salvar posição atual do scroll antes de atualizar
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
      
      setLoading(true);
      setError(null);
      
      // Carregar dados em paralelo
      const [comunicacoesRes, crsRes, nheRes, cievsRes] = await Promise.all([
        ComunicacaoDaeService.getAll(1, 9999, {}),
        CrsService.getAll(1, 9999),
        NheService.getAll(1, 9999),
        CievsService.getAll(1, 9999)
      ]);
      
      setComunicacoes(comunicacoesRes.data || []);
      setCrsList(crsRes.data || []);
      setNheList(nheRes.data || []);
      setCievsList(cievsRes.data || []);
      
      // Atualizar timestamp da última atualização
      setLastUpdate(new Date().toLocaleString('pt-BR'));
      
      // As localizações serão carregadas automaticamente pelo useEffect que observa dadosFiltrados
    } catch (err: any) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalizacoes = useCallback(async (comunicacoesData: ComunicacaoDae[], filteredComunicacoes?: ComunicacaoDae[]) => {
    try {
      // Usar comunicações filtradas se fornecidas, senão usar todas
      const comunicacoesParaContar = filteredComunicacoes || comunicacoesData;

      // Buscar NHE, CIEVS e CRS com localização
      const [nheWithLocation, cievsWithLocation, crsWithLocation] = await Promise.all([
        NheService.getAllWithLocation(),
        CievsService.getAllWithLocation(),
        CrsService.getAllWithLocation()
      ]);

      const localizacoesData: LocalizacaoMapa[] = [];

      // Processar NHE
      nheWithLocation.forEach((nhe: any) => {
        if (nhe.estabelecimento && nhe.estabelecimento.latitude && nhe.estabelecimento.longitude) {
          // Contar fichas relacionadas a este NHE (usando comunicações filtradas)
          const fichasCount = comunicacoesParaContar.filter(
            c => c.origem_tipo === 'NHE' && c.origem_id === nhe.id_nhe
          ).length;

          localizacoesData.push({
            id: `nhe-${nhe.id_nhe}`,
            nome: nhe.nome,
            tipo: 'NHE' as LocalizacaoTipo,
            lat: parseFloat(nhe.estabelecimento.latitude),
            lng: parseFloat(nhe.estabelecimento.longitude),
            endereco: `${nhe.estabelecimento.logradouro || ''}, ${nhe.estabelecimento.numero || 's/n'} - ${nhe.estabelecimento.bairro || ''}, ${nhe.estabelecimento.cidade || ''}`.trim(),
            fichasCount
          });
        }
      });

      // Processar CIEVS
      cievsWithLocation.forEach((cievs: any) => {
        if (cievs.estabelecimento && cievs.estabelecimento.latitude && cievs.estabelecimento.longitude) {
          const fichasCount = comunicacoesParaContar.filter(
            c => c.origem_tipo === 'CIEVS' && c.origem_id === cievs.id_cievs
          ).length;

          localizacoesData.push({
            id: `cievs-${cievs.id_cievs}`,
            nome: cievs.nome,
            tipo: 'CIEVS' as LocalizacaoTipo,
            lat: parseFloat(cievs.estabelecimento.latitude),
            lng: parseFloat(cievs.estabelecimento.longitude),
            endereco: `${cievs.estabelecimento.logradouro || ''}, ${cievs.estabelecimento.numero || 's/n'} - ${cievs.estabelecimento.bairro || ''}, ${cievs.estabelecimento.cidade || ''}`.trim(),
            fichasCount
          });
        }
      });

      // Processar CRS
      crsWithLocation.forEach((crs: any) => {
        if (crs.estabelecimento && crs.estabelecimento.latitude && crs.estabelecimento.longitude) {
          const fichasCount = comunicacoesParaContar.filter(
            c => c.origem_tipo === 'CRS' && c.origem_id === crs.id_crs
          ).length;

          localizacoesData.push({
            id: `crs-${crs.id_crs}`,
            nome: crs.nome,
            tipo: 'CRS' as LocalizacaoTipo,
            lat: parseFloat(crs.estabelecimento.latitude),
            lng: parseFloat(crs.estabelecimento.longitude),
            endereco: `${crs.estabelecimento.logradouro || ''}, ${crs.estabelecimento.numero || 's/n'} - ${crs.estabelecimento.bairro || ''}, ${crs.estabelecimento.cidade || ''}`.trim(),
            fichasCount
          });
        }
      });

      setLocalizacoes(localizacoesData);
    } catch (err) {
      console.error('Erro ao carregar localizações:', err);
    }
  }, []);

  // Registrar função de refresh para uso do auto-refresh
  useEffect(() => {
    refreshDataRef.current = loadAllData;
  }, []);

  // Restaurar posição do scroll após atualização dos dados
  useEffect(() => {
    if (!loading && scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current);
    }
  }, [loading, comunicacoes]);

  // Configurar auto-refresh
  useEffect(() => {
    // Limpar intervalo anterior se existir
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

    // Cleanup: limpar intervalo quando componente desmontar ou autoRefresh mudar
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };
  }, [autoRefreshEnabled]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev);
  }, []);

  // Função para limpar todos os filtros
  const clearAllFilters = useCallback(() => {
    setActiveFilters({
      origem_tipo: null,
      origem_id: null,
      dae_id: null,
      municipio_id: null
    });
    setDataInicio('');
    setDataFim('');
    setHoraInicio('');
    setHoraFim('');
  }, []);

  // Contar quantos filtros estão ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.values(activeFilters).forEach(value => {
      if (value !== null) {
        if (Array.isArray(value)) {
          count += value.length;
        } else {
          count += 1;
        }
      }
    });
    return count;
  }, [activeFilters]);

  // Aplicar filtros de data e hora
  const comunicacoesFiltradas = useMemo(() => {
    let filtered = [...comunicacoes];

    if (dataInicio) {
      // Criar data início no formato local (00:00:00)
      const [ano, mes, dia] = dataInicio.split('-').map(Number);
      const dataInicioObj = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
      
      filtered = filtered.filter(c => {
        const dataCom = new Date(c.data_comunicacao);
        return dataCom >= dataInicioObj;
      });
    }
    
    if (dataFim) {
      // Criar data fim no formato local (23:59:59)
      const [ano, mes, dia] = dataFim.split('-').map(Number);
      const dataFimObj = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
      
      filtered = filtered.filter(c => {
        const dataCom = new Date(c.data_comunicacao);
        return dataCom <= dataFimObj;
      });
    }

    if (horaInicio || horaFim) {
      filtered = filtered.filter(c => {
        const dataCom = new Date(c.data_comunicacao);
        const hora = dataCom.getHours();
        const minuto = dataCom.getMinutes();
        const horaAtual = hora * 60 + minuto;

        let passaHoraInicio = true;
        let passaHoraFim = true;

        if (horaInicio) {
          const [h, m] = horaInicio.split(':').map(Number);
          const horaInicioMin = h * 60 + m;
          passaHoraInicio = horaAtual >= horaInicioMin;
        }

        if (horaFim) {
          const [h, m] = horaFim.split(':').map(Number);
          const horaFimMin = h * 60 + m;
          passaHoraFim = horaAtual <= horaFimMin;
        }

        return passaHoraInicio && passaHoraFim;
      });
    }

    return filtered;
  }, [comunicacoes, dataInicio, dataFim, horaInicio, horaFim]);

  // Função helper para verificar se valor está no filtro (suporta string simples ou array)
  const matchesFilter = (value: any, filterValue: any): boolean => {
    if (!filterValue) return true;
    if (Array.isArray(filterValue)) {
      return filterValue.includes(value);
    }
    return value === filterValue;
  };

  // Função helper para verificar se um item está ativo no filtro (para UI)
  const isFilterActive = (value: any, filterValue: any): boolean => {
    if (!filterValue) return false;
    if (Array.isArray(filterValue)) {
      return filterValue.includes(value);
    }
    return value === filterValue;
  };

  // Função para obter cor com opacidade baseado no filtro
  const getCellColor = (itemId: any, filterValue: any, baseColor: string): string => {
    const hasFilter = filterValue && (Array.isArray(filterValue) ? filterValue.length > 0 : true);
    if (!hasFilter) return baseColor;
    if (isFilterActive(itemId, filterValue)) return baseColor;
    // Adicionar 30% de opacidade (hexadecimal 4D)
    return baseColor + "4D";
  };

  // Aplicar filtros ativos de gráficos (com suporte a seleção múltipla)
  const dadosFiltrados = useMemo(() => {
    let filtered = [...comunicacoesFiltradas];

    if (activeFilters.origem_tipo) {
      filtered = filtered.filter(c => matchesFilter(c.origem_tipo, activeFilters.origem_tipo));
    }
    if (activeFilters.origem_id) {
      filtered = filtered.filter(c => matchesFilter(c.origem_id, activeFilters.origem_id));
    }
    if (activeFilters.dae_id) {
      filtered = filtered.filter(c => matchesFilter(c.id_dae, activeFilters.dae_id));
    }
    if (activeFilters.municipio_id) {
      filtered = filtered.filter(c => matchesFilter(c.id_municipio_ocorrencia, activeFilters.municipio_id));
    }

    return filtered;
  }, [comunicacoesFiltradas, activeFilters]);

  // Calcular estatísticas
  const stats: DashboardStats = useMemo(() => {
    const calculatedStats = {
      total: dadosFiltrados.length,
      crs: dadosFiltrados.filter(c => c.origem_tipo === 'CRS').length,
      nhe: dadosFiltrados.filter(c => c.origem_tipo === 'NHE').length,
      cievs: dadosFiltrados.filter(c => c.origem_tipo === 'CIEVS').length,
    };
    console.log('📊 Stats calculados:', calculatedStats);
    return calculatedStats;
  }, [dadosFiltrados]);

  // Dados para série temporal
  const dadosSerieTemporalData = useMemo(() => {
    const dateMap = new Map<string, { CRS: number; NHE: number; CIEVS: number; total: number }>();

    dadosFiltrados.forEach(c => {
      const date = new Date(c.data_comunicacao);
      const dateStr = date.toISOString().split('T')[0];

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { CRS: 0, NHE: 0, CIEVS: 0, total: 0 });
      }

      const data = dateMap.get(dateStr)!;
      data.total++;
      
      if (c.origem_tipo === 'CRS') data.CRS++;
      else if (c.origem_tipo === 'NHE') data.NHE++;
      else if (c.origem_tipo === 'CIEVS') data.CIEVS++;
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        ...data
      }))
      .sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return dateA.localeCompare(dateB);
      })
      .slice(-30);
  }, [dadosFiltrados]);

  // Dados para gráfico de municípios
  const dadosMunicipios = useMemo(() => {
    const excludingMunicipio = activeFilters.municipio_id
      ? comunicacoesFiltradas.filter(c => 
          (!activeFilters.origem_tipo || c.origem_tipo === activeFilters.origem_tipo) &&
          (!activeFilters.origem_id || c.origem_id === activeFilters.origem_id) &&
          (!activeFilters.dae_id || c.id_dae === activeFilters.dae_id)
        )
      : dadosFiltrados;

    const counts = excludingMunicipio.reduce((acc, com) => {
      const municipio = com.tipo_municipio?.descricao || 'Não informado';
      const id = com.id_municipio_ocorrencia;
      const key = `${id}_${municipio}`;
      if (!acc[key]) {
        acc[key] = { name: municipio, value: 0, id };
      }
      acc[key].value++;
      return acc;
    }, {} as Record<string, ChartDataItem>);

    return Object.values(counts).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [comunicacoesFiltradas, activeFilters, dadosFiltrados]);

  // Dados para gráfico de DAE (Agravos)
  const dadosDae = useMemo(() => {
    const excludingDae = activeFilters.dae_id
      ? comunicacoesFiltradas.filter(c => 
          (!activeFilters.origem_tipo || c.origem_tipo === activeFilters.origem_tipo) &&
          (!activeFilters.origem_id || c.origem_id === activeFilters.origem_id) &&
          (!activeFilters.municipio_id || c.id_municipio_ocorrencia === activeFilters.municipio_id)
        )
      : dadosFiltrados;

    const counts = excludingDae.reduce((acc, com) => {
      const dae = com.dae?.nome || 'Não informado';
      const id = com.id_dae;
      if (!acc[dae]) {
        acc[dae] = { name: dae, value: 0, id };
      }
      acc[dae].value++;
      return acc;
    }, {} as Record<string, ChartDataItem>);

    return Object.values(counts).sort((a, b) => b.value - a.value).slice(0, 15);
  }, [comunicacoesFiltradas, activeFilters, dadosFiltrados]);

  // Mapas para buscar nomes descritivos por ID
  const crsMap = useMemo(() => {
    const map = new Map<number, string>();
    crsList.forEach(crs => map.set(crs.id_crs, crs.nome));
    return map;
  }, [crsList]);

  const nheMap = useMemo(() => {
    const map = new Map<number, string>();
    nheList.forEach(nhe => map.set(nhe.id_nhe, nhe.nome));
    return map;
  }, [nheList]);

  const cievsMap = useMemo(() => {
    const map = new Map<number, string>();
    cievsList.forEach(cievs => map.set(cievs.id_cievs, cievs.nome));
    return map;
  }, [cievsList]);

  // Dados para gráfico de CRS (todos os 13) - se origem_tipo estiver filtrado e não for CRS, ou se origem_id de outro tipo estiver filtrado, retornar vazio
  const dadosCrs = useMemo(() => {
    // Se filtrou por origem_tipo e não é CRS, retornar vazio
    if (activeFilters.origem_tipo && activeFilters.origem_tipo !== 'CRS') {
      return [];
    }

    // Se filtrou por origem_id, verificar se é de um tipo diferente
    if (activeFilters.origem_id) {
      const origemIds = Array.isArray(activeFilters.origem_id) ? activeFilters.origem_id : [activeFilters.origem_id];
      const temCrsNaSelecao = comunicacoesFiltradas.some(c => 
        c.origem_tipo === 'CRS' && origemIds.includes(c.origem_id)
      );
      // Se não tem CRS na seleção, retornar vazio
      if (!temCrsNaSelecao) {
        return [];
      }
    }

    const excludingOrigemId = activeFilters.origem_id
      ? comunicacoesFiltradas.filter(c => 
          c.origem_tipo === 'CRS' &&
          (!activeFilters.dae_id || c.id_dae === activeFilters.dae_id) &&
          (!activeFilters.municipio_id || c.id_municipio_ocorrencia === activeFilters.municipio_id)
        )
      : comunicacoesFiltradas.filter(c => c.origem_tipo === 'CRS');

    const counts = excludingOrigemId.reduce((acc, com) => {
      const crsName = crsMap.get(com.origem_id) || `CRS ${com.origem_id}`;
      if (!acc[crsName]) {
        acc[crsName] = { name: crsName, value: 0, id: com.origem_id };
      }
      acc[crsName].value++;
      return acc;
    }, {} as Record<string, ChartDataItem>);

    return Object.values(counts).sort((a, b) => b.value - a.value);
  }, [comunicacoesFiltradas, activeFilters.origem_tipo, activeFilters.origem_id, activeFilters.dae_id, activeFilters.municipio_id, crsMap]);

  // Dados para gráfico de NHE - se origem_tipo estiver filtrado e não for NHE, ou se origem_id de outro tipo estiver filtrado, retornar vazio
  const dadosNhe = useMemo(() => {
    // Se filtrou por origem_tipo e não é NHE, retornar vazio
    if (activeFilters.origem_tipo && activeFilters.origem_tipo !== 'NHE') {
      return [];
    }

    // Se filtrou por origem_id, verificar se é de um tipo diferente
    if (activeFilters.origem_id) {
      const origemIds = Array.isArray(activeFilters.origem_id) ? activeFilters.origem_id : [activeFilters.origem_id];
      const temNheNaSelecao = comunicacoesFiltradas.some(c => 
        c.origem_tipo === 'NHE' && origemIds.includes(c.origem_id)
      );
      // Se não tem NHE na seleção, retornar vazio
      if (!temNheNaSelecao) {
        return [];
      }
    }

    const excludingOrigemId = activeFilters.origem_id
      ? comunicacoesFiltradas.filter(c => 
          c.origem_tipo === 'NHE' &&
          (!activeFilters.dae_id || c.id_dae === activeFilters.dae_id) &&
          (!activeFilters.municipio_id || c.id_municipio_ocorrencia === activeFilters.municipio_id)
        )
      : comunicacoesFiltradas.filter(c => c.origem_tipo === 'NHE');

    const counts = excludingOrigemId.reduce((acc, com) => {
      const nheName = nheMap.get(com.origem_id) || `NHE ${com.origem_id}`;
      if (!acc[nheName]) {
        acc[nheName] = { name: nheName, value: 0, id: com.origem_id };
      }
      acc[nheName].value++;
      return acc;
    }, {} as Record<string, ChartDataItem>);

    return Object.values(counts).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [comunicacoesFiltradas, activeFilters.origem_tipo, activeFilters.origem_id, activeFilters.dae_id, activeFilters.municipio_id, nheMap]);

  // Dados para gráfico de CIEVS (todos os 11) - se origem_tipo estiver filtrado e não for CIEVS, ou se origem_id de outro tipo estiver filtrado, retornar vazio
  const dadosCievs = useMemo(() => {
    // Se filtrou por origem_tipo e não é CIEVS, retornar vazio
    if (activeFilters.origem_tipo && activeFilters.origem_tipo !== 'CIEVS') {
      return [];
    }

    // Se filtrou por origem_id, verificar se é de um tipo diferente
    if (activeFilters.origem_id) {
      const origemIds = Array.isArray(activeFilters.origem_id) ? activeFilters.origem_id : [activeFilters.origem_id];
      const temCievsNaSelecao = comunicacoesFiltradas.some(c => 
        c.origem_tipo === 'CIEVS' && origemIds.includes(c.origem_id)
      );
      // Se não tem CIEVS na seleção, retornar vazio
      if (!temCievsNaSelecao) {
        return [];
      }
    }

    const excludingOrigemId = activeFilters.origem_id
      ? comunicacoesFiltradas.filter(c => 
          c.origem_tipo === 'CIEVS' &&
          (!activeFilters.dae_id || c.id_dae === activeFilters.dae_id) &&
          (!activeFilters.municipio_id || c.id_municipio_ocorrencia === activeFilters.municipio_id)
        )
      : comunicacoesFiltradas.filter(c => c.origem_tipo === 'CIEVS');

    const counts = excludingOrigemId.reduce((acc, com) => {
      const cievsName = cievsMap.get(com.origem_id) || `CIEVS ${com.origem_id}`;
      if (!acc[cievsName]) {
        acc[cievsName] = { name: cievsName, value: 0, id: com.origem_id };
      }
      acc[cievsName].value++;
      return acc;
    }, {} as Record<string, ChartDataItem>);

    return Object.values(counts).sort((a, b) => b.value - a.value);
  }, [comunicacoesFiltradas, activeFilters.origem_tipo, activeFilters.origem_id, activeFilters.dae_id, activeFilters.municipio_id, cievsMap]);

  // Mapeamento de municípios do Pará para códigos das bandeiras
  // Formato do arquivo: municipio-{nome}-bandeira-mini-{código}.jpg
  const municipioBandeiraCodigos: Record<string, string> = {
    'Abaetetuba': 'brnnpa0401100107',
    'Abel Figueiredo': 'brnnpa0601700131',
    'Acará': 'brnnpa0401200206',
    'Afuá': 'brnnpa0200500305',
    'Água Azul do Norte': 'brnnpa0601900347',
    'Alenquer': 'brnnpa0100200404',
    'Almeirim': 'brnnpa0100300503',
    'Altamira': 'brnnpa0501500602',
    'Anajás': 'brnnpa0200500701',
    'Ananindeua': 'brnnpa0300700800',
    'Anapu': 'brnnpa0501500859',
    'Augusto Corrêa': 'brnnpa0401000909',
    'Aurora do Pará': 'brnnpa0401300958',
    'Aveiro': 'brnnpa0501401006',
    'Bagre': 'brnnpa0200401105',
    'Baião': 'brnnpa0401101204',
    'Bannach': 'brnnpa0601801253',
    'Barcarena': 'brnnpa0300701303',
    'Belém': 'brnnpa0300701402',
    'Belterra': 'brnnpa0100201451',
    'Benevides': 'brnnpa0300701501',
    'Bom Jesus do Tocantins': 'brnnpa0601701576',
    'Bonito': 'brnnpa0401001600',
    'Bragança': 'brnnpa0401001709',
    'Brasil Novo': 'brnnpa0501501725',
    'Brejo Grande do Araguaia': 'brnnpa0602001758',
    'Breu Branco': 'brnnpa0601601782',
    'Breves': 'brnnpa0200501808',
    'Bujaru': 'brnnpa0300801907',
    'Cachoeira do Arari': 'brnnpa0200602004',
    'Cachoeira do Piriá': 'brnnpa0401301956',
    'Cametá': 'brnnpa0401102103',
    'Canaã dos Carajás': 'brnnpa0601902152',
    'Capanema': 'brnnpa0401002202',
    'Capitão Poço': 'brnnpa0401302301',
    'Castanhal': 'brnnpa0300802400',
    'Chaves': 'brnnpa0200602509',
    'Colares': 'brnnpa0400902608',
    'Conceição do Araguaia': 'brnnpa0602202707',
    'Concórdia do Pará': 'brnnpa0401202756',
    'Cumaru do Norte': 'brnnpa0601802764',
    'Curionópolis': 'brnnpa0601902772',
    'Curralinho': 'brnnpa0200502806',
    'Curuá': 'brnnpa0100202855',
    'Curuçá': 'brnnpa0400902905',
    'Dom Eliseu': 'brnnpa0601702939',
    'Eldorado dos Carajás': 'brnnpa0601902954',
    'Faro': 'brnnpa0100103002',
    'Floresta do Araguaia': 'brnnpa0602203044',
    'Garrafão do Norte': 'brnnpa0401303077',
    'Goianésia do Pará': 'brnnpa0601703093',
    'Gurupá': 'brnnpa0200403101',
    'Igarapé-Açu': 'brnnpa0401003200',
    'Igarapé-Miri': 'brnnpa0401103309',
    'Inhangapi': 'brnnpa0300803408',
    'Ipixuna do Pará': 'brnnpa0401303457',
    'Irituia': 'brnnpa0401303507',
    'Itaituba': 'brnnpa0501403606',
    'Itupiranga': 'brnnpa0601603705',
    'Jacareacanga': 'brnnpa0501403754',
    'Jacundá': 'brnnpa0601603804',
    'Juruti': 'brnnpa0100103903',
    'Limoeiro do Ajuru': 'brnnpa0401104000',
    'Mãe do Rio': 'brnnpa0401304059',
    'Magalhães Barata': 'brnnpa0400904109',
    'Marabá': 'brnnpa0602004208',
    'Maracanã': 'brnnpa0400904307',
    'Marapanim': 'brnnpa0400904406',
    'Marituba': 'brnnpa0300704422',
    'Medicilândia': 'brnnpa0501504455',
    'Melgaço': 'brnnpa0200404505',
    'Mocajuba': 'brnnpa0401104604',
    'Moju': 'brnnpa0401204703',
    'Mojuí dos Campos': 'brnnpa0100204752',
    'Monte Alegre': 'brnnpa0100204802',
    'Muaná': 'brnnpa0200604901',
    'Nova Esperança do Piriá': 'brnnpa0401304950',
    'Nova Ipixuna': 'brnnpa0601604976',
    'Nova Timboteua': 'brnnpa0401005007',
    'Novo Progresso': 'brnnpa0501405031',
    'Novo Repartimento': 'brnnpa0601605064',
    'Óbidos': 'brnnpa0100105106',
    'Oeiras do Pará': 'brnnpa0401105205',
    'Oriximiná': 'brnnpa0100105304',
    'Ourém': 'brnnpa0401305403',
    'Ourilândia do Norte': 'brnnpa0601805437',
    'Pacajá': 'brnnpa0501505486',
    'Palestina do Pará': 'brnnpa0602005494',
    'Paragominas': 'brnnpa0601705502',
    'Parauapebas': 'brnnpa0601905536',
    'Pau D\'Arco': 'brnnpa0602105551',
    'Peixe-Boi': 'brnnpa0401005601',
    'Piçarra': 'brnnpa0602105635',
    'Placas': 'brnnpa0100205650',
    'Ponta de Pedras': 'brnnpa0200605700',
    'Portel': 'brnnpa0200405809',
    'Porto de Moz': 'brnnpa0100305908',
    'Prainha': 'brnnpa0100206005',
    'Primavera': 'brnnpa0401006104',
    'Quatipuru': 'brnnpa0401006112',
    'Redenção': 'brnnpa0602106138',
    'Rio Maria': 'brnnpa0602106161',
    'Rondon do Pará': 'brnnpa0601706187',
    'Rurópolis': 'brnnpa0501406195',
    'Salinópolis': 'brnnpa0400906203',
    'Salvaterra': 'brnnpa0200606302',
    'Santa Bárbara do Pará': 'brnnpa0300706351',
    'Santa Cruz do Arari': 'brnnpa0200606401',
    'Santa Isabel do Pará': 'brnnpa0300806500',
    'Santa Luzia do Pará': 'brnnpa0401306559',
    'Santa Maria das Barreiras': 'brnnpa0602206583',
    'Santa Maria do Pará': 'brnnpa0401006609',
    'Santana do Araguaia': 'brnnpa0602206708',
    'Santarém': 'brnnpa0100206807',
    'Santarém Novo': 'brnnpa0401006906',
    'Santo Antônio do Tauá': 'brnnpa0300807003',
    'São Caetano de Odivelas': 'brnnpa0400907102',
    'São Domingos do Araguaia': 'brnnpa0602007151',
    'São Domingos do Capim': 'brnnpa0401307201',
    'São Félix do Xingu': 'brnnpa0601807300',
    'São Francisco do Pará': 'brnnpa0401007409',
    'São Geraldo do Araguaia': 'brnnpa0602107458',
    'São João da Ponta': 'brnnpa0400907466',
    'São João de Pirabas': 'brnnpa0400907474',
    'São João do Araguaia': 'brnnpa0602007508',
    'São Miguel do Guamá': 'brnnpa0401307607',
    'São Sebastião da Boa Vista': 'brnnpa0200507706',
    'Sapucaia': 'brnnpa0602107755',
    'Senador José Porfírio': 'brnnpa0501507805',
    'Soure': 'brnnpa0200607904',
    'Tailândia': 'brnnpa0401207953',
    'Terra Alta': 'brnnpa0400907961',
    'Terra Santa': 'brnnpa0100107979',
    'Tomé-Açu': 'brnnpa0401208001',
    'Tracuateua': 'brnnpa0401008035',
    'Trairão': 'brnnpa0501408050',
    'Tucumã': 'brnnpa0601808084',
    'Tucuruí': 'brnnpa0601608100',
    'Ulianópolis': 'brnnpa0601708126',
    'Uruará': 'brnnpa0501508159',
    'Vigia': 'brnnpa0400908209',
    'Viseu': 'brnnpa0401308308',
    'Vitória do Xingu': 'brnnpa0501508357',
    'Xinguara': 'brnnpa0602108407',
  };

  // Função para normalizar nome do município
  const normalizeMunicipioName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, '-') // Substitui espaços por hífen
      .replace(/[^a-z0-9-]/g, ''); // Remove caracteres especiais
  };

  // Função para obter caminho da bandeira do município (SEM extensão, o componente adiciona)
  const getMunicipioBandeira = (municipioName: string): string => {
    const codigo = municipioBandeiraCodigos[municipioName];
    const normalized = normalizeMunicipioName(municipioName);
    
    if (codigo) {
      // Se temos o código, usar o formato completo SEM extensão
      return `/images/bandeiras_pa_mini/municipio-${normalized}-bandeira-mini-${codigo}`;
    } else {
      // Sem código, retornar padrão sem código e sem extensão
      return `/images/bandeiras_pa_mini/municipio-${normalized}-bandeira-mini`;
    }
  };

  // 🗺️ Atualizar localizações do mapa sempre que os filtros ou dados mudarem
  useEffect(() => {
    if (comunicacoes.length > 0 && !loading) {
      // Recalcular localizações com base nas comunicações filtradas
      loadLocalizacoes(comunicacoes, dadosFiltrados);
    }
  }, [comunicacoes, dadosFiltrados, loading, loadLocalizacoes]);

  // Função para alternar filtros (com suporte a seleção múltipla)
  const toggleFilter = useCallback((filterKey: keyof ActiveFilters, value: any, multiSelect = false) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      const currVal = newFilters[filterKey];

      if (multiSelect) {
        // Modo de seleção múltipla (Ctrl pressionado)
        const vals = Array.isArray(currVal) ? currVal : currVal ? [currVal] : [];
        
        if (vals.includes(value)) {
          // Remove o valor se já estiver selecionado
          const updated = vals.filter(v => v !== value);
          newFilters[filterKey] = updated.length ? (updated as any) : null;
        } else {
          // Adiciona o novo valor ao array
          newFilters[filterKey] = [...vals, value] as any;
        }
      } else {
        // Modo de seleção simples (comportamento padrão)
        // Se clicar no mesmo item, remove o filtro; senão, substitui
        if (currVal === value || (Array.isArray(currVal) && currVal.length === 1 && currVal[0] === value)) {
          newFilters[filterKey] = null;
        } else {
          newFilters[filterKey] = value as any;
        }
      }
      
      console.log(`🎯 Filtro alterado:`, { filterKey, value, multiSelect, newValue: newFilters[filterKey] });
      return newFilters;
    });
  }, []);

  // Verificar se há filtros ativos
  const hasActiveFilters = 
    Object.values(activeFilters).some(f => f !== null) || 
    dataInicio || 
    dataFim || 
    horaInicio || 
    horaFim;

  // Funções para clique em cards
  const handleCardClick = (tipo: string) => {
    if (tipo === 'all') {
      setShowComunicacoesModal(true);
    } else {
      toggleFilter('origem_tipo', tipo);
    }
  };

  // Formatar data
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

  // Modal de Comunicações
  const ComunicacoesModal = useMemo(() => {
    if (!showComunicacoesModal) return null;

    const comunicacoesOrdenadas = [...dadosFiltrados].sort((a, b) => {
      return new Date(b.data_comunicacao).getTime() - new Date(a.data_comunicacao).getTime();
    });

    const comunicacoesPesquisadas = comunicacoesOrdenadas.filter(com => {
      if (!modalSearchTerm) return true;
      const termo = modalSearchTerm.toLowerCase();
      return (
        com.id_comunicacao?.toString().includes(termo) ||
        com.nome_paciente?.toLowerCase().includes(termo) ||
        com.dae?.nome?.toLowerCase().includes(termo) ||
        com.tipo_municipio?.descricao?.toLowerCase().includes(termo) ||
        com.origem_tipo?.toLowerCase().includes(termo)
      );
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Comunicações DAE
                  </h2>
                  <p className="text-sm text-gray-600">
                    {comunicacoesPesquisadas.length} de {comunicacoesOrdenadas.length} comunicação(ões)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowComunicacoesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Campo de Pesquisa */}
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar por ID, paciente, DAE, município, origem..."
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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

          {/* Lista de Comunicações */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
            {comunicacoesPesquisadas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Search className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhuma comunicação encontrada</p>
                <p className="text-sm">Tente ajustar os filtros ou o termo de pesquisa</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comunicacoesPesquisadas.map((com) => (
                  <div
                    key={com.id_comunicacao}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Info Principal */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Coluna 1 */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">ID / Paciente</p>
                          <p className="font-semibold text-gray-900">#{com.id_comunicacao}</p>
                          <p className="text-sm text-gray-700">{com.nome_paciente || 'Não informado'}</p>
                        </div>

                        {/* Coluna 2 */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">DAE / Origem</p>
                          <p className="text-sm font-medium text-gray-900">{com.dae?.nome || 'Não informado'}</p>
                          <p className="text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              com.origem_tipo === 'CRS' ? 'bg-blue-100 text-blue-800' :
                              com.origem_tipo === 'NHE' ? 'bg-green-100 text-green-800' :
                              com.origem_tipo === 'CIEVS' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {com.origem_tipo}
                            </span>
                          </p>
                        </div>

                        {/* Coluna 3 */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Município / Data</p>
                          <p className="text-sm text-gray-700">{com.tipo_municipio?.descricao || 'Não informado'}</p>
                          <p className="text-xs text-gray-600">{formatDate(com.data_comunicacao)}</p>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setSelectedComunicacao(com);
                            setFichaModalMode('view');
                            setShowFichaModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualizar em modal"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedComunicacao(com);
                            setFichaModalMode('edit');
                            setShowFichaModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Editar em modal"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Total: {comunicacoesPesquisadas.length} comunicação(ões)
              </p>
              <button
                onClick={() => setShowComunicacoesModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [showComunicacoesModal, dadosFiltrados, modalSearchTerm, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modal de Comunicações */}
      {ComunicacoesModal}

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl sticky top-0 z-40">
        <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Dashboard - Comunicação DAE</h1>
                <p className="text-sm text-blue-100">Análise Completa de Doenças, Agravos e Eventos</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
              {/* Timestamp e Contador */}
              <div className="flex items-center gap-2 bg-white/10 p-2 rounded text-white text-xs sm:text-sm" data-export-menu>
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Última atualização: {lastUpdate}</span>
                {autoRefreshEnabled && (
                  <span className="ml-2 text-yellow-200 whitespace-nowrap">
                    Próxima em: {autoRefreshCountdown}s
                  </span>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2" data-export-menu>
                <button
                  onClick={loadAllData}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm"
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>

                <button
                  onClick={toggleAutoRefresh}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap ${
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

                <DashboardExportMenu
                  municipioData={dadosMunicipios}
                  totalRecords={stats.total}
                  activeFilters={{
                    ...activeFilters,
                    dataInicio,
                    dataFim,
                    horaInicio,
                    horaFim
                  }}
                  title="Dashboard de Comunicação DAE"
                  buttonVariant="button"
                  crsData={dadosCrs}
                  nheData={dadosNhe}
                  cievsData={dadosCievs}
                  daeData={dadosDae}
                  serieTemporalData={dadosSerieTemporalData.map(d => ({
                    name: d.date,
                    value: d.total,
                    fill: '#3b5bdb'
                  }))}
                />

                <button
                  onClick={() => navigate('/private/comunicacao-dae')}
                  className="flex items-center gap-2 px-3 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Voltar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Indicador de seleção múltipla ativa */}
      {isCtrlPressed && (
        <div className="fixed top-20 right-4 z-40 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <span className="font-semibold">Modo de Seleção Múltipla Ativo</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">Ctrl pressionado</span>
        </div>
      )}

      {/* Container Principal */}
      <main className="w-full max-w-[98%] mx-auto px-4 py-6" data-dashboard="main">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-5 h-5 text-red-500" />
            </button>
          </div>
        )}

        {/* Indicador de filtros ativos e botão de limpar */}
        {activeFiltersCount > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  {activeFiltersCount} filtro(s) ativo(s)
                </p>
                <p className="text-xs text-blue-700">
                  Use Ctrl+Click para selecionar múltiplos itens
                </p>
              </div>
            </div>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </button>
          </div>
        )}

        {/* Grid de 8 colunas - Layout Power BI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          
          {/* LINHA 1: Filtros de Data e Horário - 8 colunas */}
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-4 rounded-lg shadow-lg text-white sm:col-span-2 lg:col-span-4 xl:col-span-8">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5" />
              <h3 className="text-sm font-semibold">Filtros de Período e Horário</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-blue-100 mb-1">Data Início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-100 mb-1">Data Fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-100 mb-1">Hora Início</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-100 mb-1">Hora Fim</label>
                <input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            {(dataInicio || dataFim || horaInicio || horaFim) && (
              <button
                onClick={() => { setDataInicio(''); setDataFim(''); setHoraInicio(''); setHoraFim(''); }}
                className="mt-2 text-xs text-blue-100 hover:text-white underline"
              >
                Limpar filtros de período
              </button>
            )}
          </div>

          {/* LINHA 2: Cards de Resumo - 8 colunas (4 cards na mesma linha: 2+2+2+2) */}
          
          {/* Total de Comunicações - 2 colunas */}
          <div
            className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-lg shadow-lg flex items-center gap-3 text-white sm:col-span-2 lg:col-span-2 xl:col-span-2 cursor-pointer hover:shadow-xl hover:from-blue-600 hover:to-blue-800 transition-all"
            onClick={() => handleCardClick('all')}
            title="Clique para ver todas as comunicações"
          >
            <div className="p-3 bg-white bg-opacity-20 rounded-full flex-shrink-0">
              <FileText className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs text-blue-100 uppercase tracking-wide">Total de Comunicações</h3>
              <p className="text-4xl font-bold">
                {stats.total.toLocaleString()}
              </p>
              <p className="text-xs text-blue-200 mt-1">
                👆 Clique para ver a lista
              </p>
            </div>
          </div>

          {/* CRS - 2 colunas */}
          <div 
            className="p-4 rounded-lg shadow-lg flex items-center gap-3 text-white sm:col-span-2 lg:col-span-2 xl:col-span-2 cursor-pointer hover:shadow-xl transition-all"
            onClick={(e) => toggleFilter('origem_tipo', 'CRS', e.ctrlKey || e.metaKey)}
            style={{ 
              background: isFilterActive('CRS', activeFilters.origem_tipo)
                ? 'linear-gradient(to bottom right, #67e8f9, #22d3ee)' 
                : 'linear-gradient(to bottom right, #06b6d4, #0891b2)',
              minHeight: '100px',
              border: isFilterActive('CRS', activeFilters.origem_tipo) ? '3px solid #0891b2' : 'none'
            }}
          >
            <div className="p-3 bg-white bg-opacity-20 rounded-full flex-shrink-0">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs uppercase tracking-wide opacity-90">
                CRS {isFilterActive('CRS', activeFilters.origem_tipo) && '✓'}
              </h3>
              <p className="text-4xl font-bold">
                {stats.crs.toLocaleString()}
              </p>
            </div>
          </div>

          {/* NHE - 2 colunas */}
          <div 
            className="p-4 rounded-lg shadow-lg flex items-center gap-3 text-white sm:col-span-2 lg:col-span-2 xl:col-span-2 cursor-pointer hover:shadow-xl transition-all"
            onClick={(e) => toggleFilter('origem_tipo', 'NHE', e.ctrlKey || e.metaKey)}
            style={{ 
              background: isFilterActive('NHE', activeFilters.origem_tipo)
                ? 'linear-gradient(to bottom right, #6ee7b7, #34d399)' 
                : 'linear-gradient(to bottom right, #10b981, #059669)', 
              minHeight: '100px',
              border: isFilterActive('NHE', activeFilters.origem_tipo) ? '3px solid #059669' : 'none'
            }}
          >
            <div className="p-3 bg-white bg-opacity-20 rounded-full flex-shrink-0">
              <Hospital className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs uppercase tracking-wide opacity-90">
                NHE {isFilterActive('NHE', activeFilters.origem_tipo) && '✓'}
              </h3>
              <p className="text-4xl font-bold">
                {stats.nhe.toLocaleString()}
              </p>
            </div>
          </div>

          {/* CIEVS - 2 colunas */}
          <div 
            className="p-4 rounded-lg shadow-lg flex items-center gap-3 text-white sm:col-span-2 lg:col-span-2 xl:col-span-2 cursor-pointer hover:shadow-xl transition-all"
            onClick={(e) => toggleFilter('origem_tipo', 'CIEVS', e.ctrlKey || e.metaKey)}
            style={{ 
              background: isFilterActive('CIEVS', activeFilters.origem_tipo)
                ? 'linear-gradient(to bottom right, #c4b5fd, #a78bfa)' 
                : 'linear-gradient(to bottom right, #8b5cf6, #7c3aed)', 
              minHeight: '100px',
              border: isFilterActive('CIEVS', activeFilters.origem_tipo) ? '3px solid #7c3aed' : 'none'
            }}
          >
            <div className="p-3 bg-white bg-opacity-20 rounded-full flex-shrink-0">
              <Activity className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs uppercase tracking-wide opacity-90">
                CIEVS {isFilterActive('CIEVS', activeFilters.origem_tipo) && '✓'}
              </h3>
              <p className="text-4xl font-bold">
                {stats.cievs.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Indicador de Filtros Ativos */}
          {hasActiveFilters && (
            <div className="bg-blue-50 p-3 rounded-lg shadow-sm border-l-4 border-blue-500 sm:col-span-2 lg:col-span-4 xl:col-span-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-800">
                    Dashboard com Filtros Ativos - Dados Interconectados
                  </h3>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <X className="w-4 h-4" />
                  Limpar Todos os Filtros
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Clique em qualquer gráfico para adicionar/remover filtros.
              </p>
            </div>
          )}

          {/* LINHA 4: Série Temporal - 8 colunas */}
          <div className="bg-white p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Série Temporal por Dia</h3>
                  <p className="text-sm text-gray-600">Evolução diária do número de comunicações (últimos 30 dias)</p>
                </div>
              </div>
              <ChartExportMenu
                chartId="chart-serie-temporal"
                chartData={dadosSerieTemporalData.map(d => ({
                  name: d.date,
                  value: d.total,
                  fill: '#3b5bdb'
                }))}
                chartTitle="Série Temporal - Comunicações DAE"
                buttonVariant="icon"
              />
            </div>
            {dadosSerieTemporalData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500 text-lg font-medium mb-2">Nenhuma comunicação encontrada</p>
                <p className="text-gray-400 text-sm text-center max-w-md">
                  Não há comunicações cadastradas no sistema ou nenhuma corresponde aos filtros selecionados
                </p>
              </div>
            ) : (
              <div className="h-80" id="chart-serie-temporal">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosSerieTemporalData} margin={{ top: 30, right: 30, left: 20, bottom: 50 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b5bdb" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b5bdb" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={12}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                      formatter={(value: any, name: any, props: any) => {
                        const payload = props.payload;
                        const crs = payload.CRS || 0;
                        const nhe = payload.NHE || 0;
                        const cievs = payload.CIEVS || 0;
                        const total = payload.total || 0;
                        
                        if (name === 'total') {
                          const crsPercent = total > 0 ? ((crs / total) * 100).toFixed(1) : '0';
                          const nhePercent = total > 0 ? ((nhe / total) * 100).toFixed(1) : '0';
                          const cievsPercent = total > 0 ? ((cievs / total) * 100).toFixed(1) : '0';
                          
                          return [
                            `${total} comunicações\n\nCRS: ${crs} (${crsPercent}%)\nNHE: ${nhe} (${nhePercent}%)\nCIEVS: ${cievs} (${cievsPercent}%)`,
                            'Total'
                          ];
                        }
                        return [value, name];
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#3b5bdb"
                      strokeWidth={2}
                      fill="url(#colorTotal)"
                      animationDuration={800}
                    >
                      <LabelList
                        dataKey="total"
                        position="top"
                        style={{ fill: '#3b5bdb', fontWeight: 'bold', fontSize: 12 }}
                      />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* LINHA 5: Gráficos CRS, NHE e CIEVS - 8 colunas divididas em 3 */}
          
          {/* Gráfico de CRS */}
          <div className="bg-white p-4 rounded-lg shadow-sm sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4" style={{ color: '#06b6d4' }} />
                Todos os CRS ({dadosCrs.length})
              </h3>
              <ChartExportMenu
                chartId="chart-crs"
                chartData={dadosCrs}
                chartTitle="CRS - Centros Regionais de Saúde"
                buttonVariant="minimal"
              />
            </div>
            {dadosCrs.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <p className="text-xs">Nenhum dado disponível</p>
              </div>
            ) : (
              <>
                <div id="chart-crs">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosCrs.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" style={{ fontSize: '10px' }} allowDecimals={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80}
                      stroke="#6b7280" 
                      style={{ fontSize: '9px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                      onClick={(data) => data && toggleFilter('origem_id', data.id, ctrlPressedRef.current)}
                      cursor="pointer"
                    >
                      {dadosCrs.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={getCellColor(entry.id, activeFilters.origem_id, '#06b6d4')}
                          stroke={isFilterActive(entry.id, activeFilters.origem_id) ? "#000" : "none"}
                          strokeWidth={isFilterActive(entry.id, activeFilters.origem_id) ? 2 : 0}
                        />
                      ))}
                      <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fill: '#374151', fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>

                {/* Lista detalhada */}
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Todos os CRS</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {dadosCrs.map((item, index) => {
                      const total = dadosCrs.reduce((sum, i) => sum + i.value, 0);
                      const percentual = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      const isFiltered = isFilterActive(item.id, activeFilters.origem_id);
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200 ${
                            isFiltered 
                              ? 'bg-cyan-100 border-2 border-cyan-400' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={(e) => toggleFilter('origem_id', item.id, e.ctrlKey || e.metaKey)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ 
                                backgroundColor: '#06b6d4',
                                border: isFiltered ? '2px solid #0891b2' : 'none'
                              }}
                            />
                            <div className="w-6 h-6 bg-cyan-100 rounded-full flex items-center justify-center">
                              <span className="text-cyan-600 font-bold text-[10px]">{index + 1}</span>
                            </div>
                            <span className="font-medium text-[11px]">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 text-xs">{item.value}</div>
                            <div className="text-[10px] text-gray-600">{percentual}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Gráfico de NHE */}
          <div className="bg-white p-4 rounded-lg shadow-sm sm:col-span-2 lg:col-span-3 xl:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Hospital className="h-4 w-4" style={{ color: '#10b981' }} />
                Top 10 NHE ({dadosNhe.length} total)
              </h3>
              <ChartExportMenu
                chartId="chart-nhe"
                chartData={dadosNhe}
                chartTitle="NHE - Núcleos Hospitalares de Epidemiologia"
                buttonVariant="minimal"
              />
            </div>
            {dadosNhe.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <p className="text-xs">Nenhum dado disponível</p>
              </div>
            ) : (
              <>
                <div id="chart-nhe">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosNhe.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" style={{ fontSize: '10px' }} allowDecimals={false} />
                      <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80}
                      stroke="#6b7280" 
                      style={{ fontSize: '9px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                      onClick={(data) => data && toggleFilter('origem_id', data.id, ctrlPressedRef.current)}
                      cursor="pointer"
                    >
                      {dadosNhe.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={getCellColor(entry.id, activeFilters.origem_id, '#10b981')}
                          stroke={isFilterActive(entry.id, activeFilters.origem_id) ? "#000" : "none"}
                          strokeWidth={isFilterActive(entry.id, activeFilters.origem_id) ? 2 : 0}
                        />
                      ))}
                      <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fill: '#374151', fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>

                {/* Lista detalhada */}
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Todos os NHE</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {dadosNhe.map((item, index) => {
                      const total = dadosNhe.reduce((sum, i) => sum + i.value, 0);
                      const percentual = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      const isFiltered = isFilterActive(item.id, activeFilters.origem_id);
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200 ${
                            isFiltered 
                              ? 'bg-green-100 border-2 border-green-400' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={(e) => toggleFilter('origem_id', item.id, e.ctrlKey || e.metaKey)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ 
                                backgroundColor: '#10b981',
                                border: isFiltered ? '2px solid #059669' : 'none'
                              }}
                            />
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 font-bold text-[10px]">{index + 1}</span>
                            </div>
                            <span className="font-medium text-[11px]">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 text-xs">{item.value}</div>
                            <div className="text-[10px] text-gray-600">{percentual}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Gráfico de CIEVS */}
          <div className="bg-white p-4 rounded-lg shadow-sm sm:col-span-2 lg:col-span-3 xl:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Activity className="h-4 w-4" style={{ color: '#8b5cf6' }} />
                Todos os CIEVS ({dadosCievs.length})
              </h3>
              <ChartExportMenu
                chartId="chart-cievs"
                chartData={dadosCievs}
                chartTitle="CIEVS - Centros de Informações Estratégicas em Vigilância em Saúde"
                buttonVariant="minimal"
              />
            </div>
            {dadosCievs.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <p className="text-xs">Nenhum dado disponível</p>
              </div>
            ) : (
              <>
                <div id="chart-cievs">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosCievs.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" style={{ fontSize: '10px' }} allowDecimals={false} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={80}
                        stroke="#6b7280" 
                        style={{ fontSize: '9px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                      onClick={(data) => data && toggleFilter('origem_id', data.id, ctrlPressedRef.current)}
                      cursor="pointer"
                    >
                      {dadosCievs.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={getCellColor(entry.id, activeFilters.origem_id, '#8b5cf6')}
                          stroke={isFilterActive(entry.id, activeFilters.origem_id) ? "#000" : "none"}
                          strokeWidth={isFilterActive(entry.id, activeFilters.origem_id) ? 2 : 0}
                        />
                      ))}
                      <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fill: '#374151', fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>

                {/* Lista detalhada */}
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Todos os CIEVS</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {dadosCievs.map((item, index) => {
                      const total = dadosCievs.reduce((sum, i) => sum + i.value, 0);
                      const percentual = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      const isFiltered = isFilterActive(item.id, activeFilters.origem_id);
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200 ${
                            isFiltered 
                              ? 'bg-purple-100 border-2 border-purple-400' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={(e) => toggleFilter('origem_id', item.id, e.ctrlKey || e.metaKey)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ 
                                backgroundColor: '#8b5cf6',
                                border: isFiltered ? '2px solid #7c3aed' : 'none'
                              }}
                            />
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-bold text-[10px]">{index + 1}</span>
                            </div>
                            <span className="font-medium text-[11px]">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 text-xs">{item.value}</div>
                            <div className="text-[10px] text-gray-600">{percentual}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* LINHA 6: Municípios e DAE - 4+4 colunas */}
          
          {/* Gráfico de Municípios - 4 colunas (estilo Dashboard Círio) */}
          <div className="bg-white p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">Municípios</h3>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {dadosMunicipios.length} {dadosMunicipios.length === 1 ? 'município' : 'municípios'}
                </span>
              </div>
              <ChartExportMenu
                chartId="chart-municipios"
                chartData={dadosMunicipios}
                chartTitle="Municípios - Distribuição Geográfica"
                buttonVariant="icon"
              />
            </div>

            {dadosMunicipios.length === 0 ? (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum dado de município disponível</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Gráfico de Barras - Top 10 */}
                <div className="xl:col-span-2">
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Top 10 Municípios</h4>
                    <p className="text-sm text-gray-500">Clique nas barras para filtrar por município</p>
                  </div>
                  
                  <div id="chart-municipios">
                    <ResponsiveContainer width="100%" height={550}>
                    <BarChart data={dadosMunicipios.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={11}
                        interval={0}
                      />
                      <YAxis fontSize={12} allowDecimals={false} />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-white p-4 border rounded-lg shadow-lg min-w-48">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-6 h-6 rounded border border-gray-200 bg-blue-100 flex items-center justify-center">
                                    <MapPin className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">{label}</p>
                                  </div>
                                </div>
                                <p className="text-blue-600">
                                  <span className="font-bold">{data.value}</span> {data.value === 1 ? 'comunicação' : 'comunicações'}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        cursor="pointer"
                        onClick={(data) => data && toggleFilter('municipio_id', data.id, ctrlPressedRef.current)}
                        radius={[4, 4, 0, 0]}
                      >
                        {dadosMunicipios.slice(0, 10).map((entry, index) => {
                          const colors = [
                            "#1976D2", "#1E88E5", "#2196F3", "#42A5F5", "#64B5F6",
                            "#81C784", "#66BB6A", "#4CAF50", "#43A047", "#388E3C"
                          ];
                          const baseColor = colors[index % colors.length];
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getCellColor(entry.id, activeFilters.municipio_id, baseColor)}
                              stroke={isFilterActive(entry.id, activeFilters.municipio_id) ? "#000" : "none"}
                              strokeWidth={isFilterActive(entry.id, activeFilters.municipio_id) ? 3 : 0}
                            />
                          );
                        })}
                        <LabelList 
                          dataKey="value" 
                          position="top" 
                          style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold',
                            fill: '#374151'
                          }}
                          formatter={(value: number) => value.toLocaleString()}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabela Completa - Todos os Municípios com Bandeiras */}
                <div className="xl:col-span-1">
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Todos os Municípios</h4>
                    <p className="text-sm text-gray-500">Clique para filtrar</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 max-h-[750px] overflow-y-auto">
                    <div className="space-y-2">
                      {dadosMunicipios.map((item, index) => {
                        const isActive = isFilterActive(item.id, activeFilters.municipio_id);
                        const colors = [
                          "#1976D2", "#2196F3", "#4CAF50", "#FF9800", "#9C27B0", 
                          "#F44336", "#00BCD4", "#CDDC39", "#FF5722", "#795548"
                        ];
                        const itemColor = colors[index % colors.length];
                        const bandeiraPattern = getMunicipioBandeira(item.name);
                        
                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              isActive 
                                ? 'bg-blue-100 border border-blue-300 shadow-sm' 
                                : 'bg-white hover:bg-gray-100 border border-transparent hover:shadow-sm'
                            }`}
                            onClick={(e) => toggleFilter('municipio_id', item.id, e.ctrlKey || e.metaKey)}
                            title={`Clique para filtrar por ${item.name}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {/* Bandeira do município */}
                              <img 
                                src={`${bandeiraPattern}.jpg`}
                                alt={`Bandeira de ${item.name}`}
                                className="w-10 h-7 object-cover rounded shadow-sm border border-gray-200"
                                onError={(e) => {
                                  // Tentar PNG se JPG falhar
                                  const target = e.currentTarget;
                                  if (target.src.endsWith('.jpg')) {
                                    target.src = `${bandeiraPattern}.png`;
                                  } else {
                                    // Se ambos falharem, esconder
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center"
                                  style={{ backgroundColor: itemColor + '20' }}
                                >
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: itemColor }}
                                  ></div>
                                </div>
                                <span className={`font-medium text-sm ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>
                                  {item.name}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                                {item.value}
                              </span>
                              {isActive && <span className="text-blue-500 text-xs">●</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gráfico de DAE (Agravos) - 4 colunas - Estilo Dashboard Círio */}
          <div className="bg-white p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-800">DAE - Doenças, Agravos e Eventos</h3>
                <span className="bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full">
                  {dadosDae.length} {dadosDae.length === 1 ? 'agravo' : 'agravos'}
                </span>
              </div>
              <ChartExportMenu
                chartId="chart-dae"
                chartData={dadosDae}
                chartTitle="DAE - Doenças, Agravos e Eventos"
                buttonVariant="icon"
              />
            </div>

            {dadosDae.length === 0 ? (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum dado de DAE disponível</p>
                </div>
              </div>
            ) : (
              <>
                {/* Gráfico de Barras - Top 15 */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Top 15 DAE por Comunicações</h4>
                  <p className="text-xs text-gray-500 mb-3">Clique nas barras para filtrar por agravo específico</p>
                </div>
                
                <div className="h-96" id="chart-dae">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosDae.slice(0, 15)}
                      layout="vertical"
                      margin={{ top: 5, right: 100, left: 10, bottom: 5 }}
                      barCategoryGap="15%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        type="number" 
                        stroke="#666" 
                        allowDecimals={false}
                        fontSize={12}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#666"
                        width={200}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          padding: "12px"
                        }}
                        formatter={(value: any) => [
                          value.toLocaleString(),
                          "Comunicações",
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        onClick={(data) => data && toggleFilter('dae_id', data.id, ctrlPressedRef.current)}
                        cursor="pointer"
                        radius={[0, 4, 4, 0]}
                      >
                        {dadosDae.slice(0, 15).map((entry, index) => {
                          // Gradiente de cores teal
                          const colors = [
                            '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4',
                            '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9',
                            '#0e7490', '#0284c7', '#0ea5e9', '#38bdf8',
                            '#115e59', '#134e4a', '#166534'
                          ];
                          const baseColor = colors[index % colors.length];
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getCellColor(entry.id, activeFilters.dae_id, baseColor)}
                              stroke={isFilterActive(entry.id, activeFilters.dae_id) ? '#000' : 'none'}
                              strokeWidth={isFilterActive(entry.id, activeFilters.dae_id) ? 3 : 0}
                            />
                          );
                        })}
                        <LabelList
                          dataKey="value"
                          position="right"
                          formatter={(value: number) => value.toLocaleString()}
                          style={{ fontSize: '14px', fontWeight: 'bold', fill: '#374151' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Lista detalhada de todos os DAE */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Todos os DAE (Comunicação Imediata)
                  </h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                    {dadosDae.map((item, index) => {
                      const isFiltered = isFilterActive(item.id, activeFilters.dae_id);
                      const total = dadosDae.reduce((sum, i) => sum + i.value, 0);
                      const percentual = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      
                      return (
                        <div
                          key={item.id || index}
                          onClick={(e) => toggleFilter('dae_id', item.id, e.ctrlKey || e.metaKey)}
                          className={`p-3 rounded-lg border-l-4 transition-all cursor-pointer ${
                            isFiltered 
                              ? 'ring-2 ring-teal-500 shadow-md bg-teal-50 border-teal-500' 
                              : 'hover:shadow-sm bg-gray-50 border-gray-400'
                          }`}
                          style={{ 
                            opacity: activeFilters.dae_id && !isFiltered ? 0.5 : 1
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className={`text-xs font-bold ${
                                index < 3 ? 'text-teal-700' : 'text-gray-600'
                              }`}>
                                #{index + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-800">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-900">
                                {item.value}
                              </span>
                              <span className="text-xs text-gray-600 min-w-[45px] text-right">
                                {percentual}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumo Estatístico */}
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="bg-teal-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-teal-700">
                        {dadosDae.length}
                      </div>
                      <div className="text-xs text-gray-600 font-medium mt-1">Tipos de DAE</div>
                    </div>
                    <div className="bg-cyan-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-cyan-700">
                        {dadosDae.reduce((sum, item) => sum + item.value, 0)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium mt-1">Total de Comunicações</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-emerald-700">
                        {dadosDae.length > 0 ? Math.round(dadosDae.reduce((sum, item) => sum + item.value, 0) / dadosDae.length) : 0}
                      </div>
                      <div className="text-xs text-gray-600 font-medium mt-1">Média por DAE</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Mapa de Localização - NHE, CIEVS e CRS */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Mapa de Localizações</h3>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {localizacoes.filter(loc => (loc.fichasCount || 0) > 0).length} local(is) com fichas
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <p>Visualize as localizações com fichas cadastradas. Clique nas bolinhas para ver os detalhes.</p>
          </div>

          <MapProviderProvider>
            <MapaDashboardDAE 
              localizacoes={localizacoes.filter(loc => (loc.fichasCount || 0) > 0)}
              onLocalizacaoClick={(loc) => {
                setSelectedLocalizacao(loc);
                setShowLocalizacaoModal(true);
              }}
            />
          </MapProviderProvider>
        </div>

        {/* Informações e Legendas */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Como usar este dashboard</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>Clique no card "Total"</strong> para ver a lista completa de comunicações</li>
                <li>• <strong>Clique nos cards</strong> CRS/NHE/CIEVS para filtrar por tipo de origem</li>
                <li>• <strong>Use os filtros de período e horário</strong> para analisar intervalos específicos de tempo</li>
                <li>• <strong>Clique nos gráficos</strong> de municípios ou DAE para aplicar filtros específicos</li>
                <li>• <strong>Todos os gráficos são interconectados</strong> - refletem os filtros ativos simultaneamente</li>
                <li>• <strong>Passe o mouse sobre os pontos</strong> do gráfico temporal para ver valores absolutos e porcentagens</li>
                <li>• <strong>Use "Limpar Todos os Filtros"</strong> para resetar e ver todos os dados novamente</li>
                <li>• <strong>No mapa</strong>, clique nas bolinhas coloridas para ver as fichas relacionadas a cada localização</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Fichas por Localização */}
      {showLocalizacaoModal && selectedLocalizacao && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setShowLocalizacaoModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className={`p-6 border-b flex items-center justify-between ${
              selectedLocalizacao.tipo === 'NHE' ? 'bg-green-50' :
              selectedLocalizacao.tipo === 'CIEVS' ? 'bg-purple-50' :
              'bg-orange-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  selectedLocalizacao.tipo === 'NHE' ? 'bg-green-600' :
                  selectedLocalizacao.tipo === 'CIEVS' ? 'bg-purple-600' :
                  'bg-orange-600'
                }`}></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedLocalizacao.nome}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedLocalizacao.tipo} • {selectedLocalizacao.fichasCount} ficha(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLocalizacaoModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Endereço:</strong> {selectedLocalizacao.endereco}
                </p>
              </div>

              {/* Lista de Comunicações */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Comunicações Relacionadas
                </h4>
                
                {dadosFiltrados
                  .filter(c => {
                    const [tipo, id] = selectedLocalizacao.id.split('-');
                    return c.origem_tipo === tipo.toUpperCase() && 
                           c.origem_id === parseInt(id);
                  })
                  .map((comunicacao, index) => (
                    <div
                      key={comunicacao.id_comunicacao}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {comunicacao.nome_paciente || 'Nome não informado'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <strong>Data:</strong> {new Date(comunicacao.data_comunicacao).toLocaleDateString('pt-BR')}
                            </div>
                            <div>
                              <strong>Hora:</strong> {new Date(comunicacao.data_comunicacao).toLocaleTimeString('pt-BR')}
                            </div>
                            <div>
                              <strong>Município:</strong> {comunicacao.tipo_municipio?.nome || 'N/A'}
                            </div>
                            <div>
                              <strong>DAE:</strong> {comunicacao.dae?.nome || 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedComunicacao(comunicacao);
                              setFichaModalMode('view');
                              setShowFichaModal(true);
                            }}
                            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            title="Visualizar em modal"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver
                          </button>
                          <button
                            onClick={() => {
                              setSelectedComunicacao(comunicacao);
                              setFichaModalMode('edit');
                              setShowFichaModal(true);
                            }}
                            className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            title="Editar em modal"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {dadosFiltrados.filter(c => {
                  const [tipo, id] = selectedLocalizacao.id.split('-');
                  return c.origem_tipo === tipo.toUpperCase() && c.origem_id === parseInt(id);
                }).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma comunicação encontrada para esta localização</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowLocalizacaoModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização da Ficha */}
      {showFichaModal && selectedComunicacao && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
          onClick={() => setShowFichaModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className={`flex items-center justify-between p-4 border-b text-white rounded-t-lg ${
              fichaModalMode === 'edit' 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {fichaModalMode === 'edit' ? <Edit className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                {fichaModalMode === 'edit' ? 'Editar' : 'Visualizar'} Comunicação DAE - ID: {selectedComunicacao.id_comunicacao}
              </h3>
              <button
                onClick={() => setShowFichaModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  fichaModalMode === 'edit' ? 'hover:bg-green-700' : 'hover:bg-blue-700'
                }`}
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo - Iframe com a página real */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={fichaModalMode === 'edit' 
                  ? `/private/comunicacao-dae/editar/${selectedComunicacao.id_comunicacao}`
                  : `/private/comunicacao-dae/${selectedComunicacao.id_comunicacao}`
                }
                className="w-full h-full border-0"
                title={`${fichaModalMode === 'edit' ? 'Edição' : 'Visualização'} da Comunicação DAE`}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowFichaModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComunicacaoDaeDashboard;
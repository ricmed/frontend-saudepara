import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  BarChart3,
  Info,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Menu,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'react-toastify';
import { offlineDataManager } from '@/services/offlineDataManager';
import syncService from '@/services/syncService';
import PacienteService from '@/services/PacienteService';
import indexedDBService from '@/services/indexedDB';
import { clearWorkboxRuntimeCaches } from '@/services/appBuildCachePolicy';
import { offlineAuthService } from '@/services/offlineAuthService';
import SetupPinModal from '@/features/auth/components/SetupPinModal';

// Import do SideMenu real do sistema
import { SideMenu } from '@/features/home/components/SideMenu';
import PinManagementTab from '@/features/offlinePage/components/PinManagementTab';

/**
 * Página de Gerenciamento Offline
 * 
 * Funcionalidades:
 * - Download de dados offline por categoria
 * - Sincronização de dados pendentes
 * - Monitoramento de status da conexão
 * - Estatísticas de armazenamento offline
 */
const OfflineManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentDownload, setCurrentDownload] = useState('');
  const [pendingSync, setPendingSync] = useState({ notificacoes: 0, pacientes: 0 });
  const [pendingNotifications, setPendingNotifications] = useState<any[]>([]); // ✅ NOVO: Lista detalhada de notificações pendentes
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'sources' | 'notifications' | 'sync' | 'pin'>('overview');
  
  // ✅ NOVO: Estados para download de notificações
  const [notificationsStats, setNotificationsStats] = useState<any>(null);
  const [notificationsDownloading, setNotificationsDownloading] = useState(false);
  const [notificationsProgress, setNotificationsProgress] = useState(0);
  const [notificationsPhase, setNotificationsPhase] = useState('');
  const [isSyncPaused, setIsSyncPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 🆕 MODO OFFLINE FORÇADO (tipo Spotify)
  const [isOfflineModeForced, setIsOfflineModeForced] = useState(false);
  const [isTogglingOfflineMode, setIsTogglingOfflineMode] = useState(false);

  // 🆕 Estados para gerenciamento de PIN
  const [pinSessionInfo, setPinSessionInfo] = useState<any>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  // ✅ CORRIGIDO: Estados específicos para pacientes
  const [patientsStats, setPatientsStats] = useState<any>(null);
  const [downloadRecommendation, setDownloadRecommendation] = useState<any>(null);
  const [patientsDownloading, setPatientsDownloading] = useState(false);
  const [patientsProgress, setPatientsProgress] = useState(0);
  const [patientsPhase, setPatientsPhase] = useState('');

  // Monitorar conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 🆕 Carregar estado do modo offline forçado
  useEffect(() => {
    const isForced = syncService.isOfflineModeActive();
    setIsOfflineModeForced(isForced);
  }, []);

  // Carregar estatísticas
  useEffect(() => {
    loadStats();
    loadPendingSync();
    loadPatientsStats();
    loadNotificationsStats();
    
    const interval = setInterval(() => {
      loadStats();
      loadPendingSync();
      loadPatientsStats();
      loadNotificationsStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const newStats = await offlineDataManager.getDetailedStats();
      setStats(newStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadPendingSync = async () => {
    try {
      const pending = await syncService.getPendingCount();
      setPendingSync(pending);
      
      // ✅ NOVO: Carregar lista detalhada de notificações pendentes
      const pendingNotifs = await indexedDBService.getPendingNotificacoes();
      setPendingNotifications(pendingNotifs);
    } catch (error) {
      console.error('Erro ao carregar dados pendentes:', error);
    }
  };

  // ✅ CORRIGIDO: Carregar estatísticas de pacientes usando método correto
  const loadPatientsStats = async () => {
    try {
      // ✅ 1. Usar getCacheStats do indexedDBService corrigido
      const cacheStats = await indexedDBService.getCacheStats();
      
      // ✅ 2. Usar getDownloadRecommendation (se disponível)
      let recommendation = null;
      try {
        recommendation = await PacienteService.getDownloadRecommendation();
      } catch (error) {
        console.warn('Erro ao obter recomendação:', error);
        recommendation = {
          totalPatients: 0,
          estimatedSizeMB: 0,
          recommendation: 'cpfs-only',
          reason: 'Dados não disponíveis'
        };
      }
      
      // ✅ 3. Usar getPatientsStatus do offlineDataManager
      const patientsStatus = await offlineDataManager.getPatientsStatus();
      
      // ✅ 4. Combinar informações
      const combinedStats = {
        ...patientsStatus,
        cacheStats,
        totalCached: cacheStats.verificacao + cacheStats.locais
      };
      
      setPatientsStats(combinedStats);
      setDownloadRecommendation(recommendation);
      
      console.log('📊 Stats de pacientes atualizadas:', combinedStats);
      
    } catch (error) {
      console.error('Erro ao carregar stats de pacientes:', error);
      
      // ✅ Fallback seguro
      setPatientsStats({
        verification: { loaded: false, count: 0 },
        localPatients: { loaded: false, count: 0 },
        pendingSync: { loaded: false, count: 0 },
        recommendation: 'Erro ao verificar cache',
        confidence: 'low',
        cacheStats: { verificacao: 0, locais: 0, pendentes: 0 },
        totalCached: 0
      });
    }
  };

  // ✅ NOVO: Carregar estatísticas de notificações
  const loadNotificationsStats = async () => {
    try {
      const cached = await offlineDataManager.getNotificacoesFromCache();
      const pending = await indexedDBService.getPendingNotificacoes();
      
      setNotificationsStats({
        cached: cached.length,
        pending: pending.length,
        total: cached.length + pending.length
      });
    } catch (error) {
      console.error('Erro ao carregar stats de notificações:', error);
      setNotificationsStats({
        cached: 0,
        pending: 0,
        total: 0
      });
    }
  };

  const handleDownloadAll = async () => {
    if (!isOnline) {
      toast.error('❌ Sem conexão com a internet');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      await offlineDataManager.downloadAllData(
        (progress, current) => {
          setDownloadProgress(progress);
          setCurrentDownload(current);
        }
      );
      await loadStats();
      toast.success('✅ Download concluído com sucesso');
    } catch (error) {
      toast.error('Erro no download dos dados');
    } finally {
      setIsDownloading(false);
      setCurrentDownload('');
    }
  };

  const handleDownloadSource = async (source: any) => {
    if (!isOnline) {
      toast.error('❌ Sem conexão com a internet');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setCurrentDownload(source.name);
    
    try {
      // ✅ CORRIGIDO: Download específico da fonte individual usando a chave
      const result = await offlineDataManager.downloadSpecificSource(
        source.key,
        (progress: number, current: string) => {
          setDownloadProgress(progress);
          setCurrentDownload(`${source.name}: ${current || ''}`);
        }
      );
      
      await loadStats();
      
      if (result.success) {
        toast.success(`✅ ${source.name} atualizado com sucesso! ${result.recordCount?.toLocaleString() || 0} registros`);
      } else {
        throw new Error(result.error || 'Erro no download');
      }
      
    } catch (error: any) {
      console.error('Erro no download da fonte:', error);
      toast.error(`❌ Erro no download de ${source.name}: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsDownloading(false);
      setCurrentDownload('');
      setDownloadProgress(0);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('⚠️ Tem certeza que deseja limpar TODOS os dados offline? Você precisará baixá-los novamente.')) {
      try {
        await offlineDataManager.clearOfflineData();
        await loadStats();
        await loadPatientsStats(); // ✅ Atualizar stats de pacientes também
        toast.success('✅ Dados offline limpos');
      } catch (error) {
        toast.error('Erro ao limpar dados');
      }
    }
  };

  /**
   * Apaga o IndexedDB pelo próprio app (deleteDatabase + recria vazio).
   * Útil quando o navegador (ex.: Opera GX) não libera o armazenamento em "Limpar dados do site".
   */
  const handleWipeIndexedDbAndReload = async () => {
    const msg =
      'Isso apaga TODO o banco local (notificações e DAE pendentes, caches, pacientes/estabelecimentos offline, etc.). ' +
      'Sincronize antes se houver pendências.\n\n' +
      'Use se "Limpar dados do site" não zerou o IndexedDB.\n\nContinuar?';
    if (!window.confirm(msg)) return;
    try {
      await indexedDBService.resetDatabase();
      await clearWorkboxRuntimeCaches();
      toast.success('Banco local recriado. Recarregando…');
      setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      console.error('Erro ao recriar IndexedDB:', error);
      toast.error(
        'Não foi possível apagar o banco. Feche todas as abas deste site e tente de novo.'
      );
    }
  };

  // 🆕 FUNÇÃO PARA ALTERNAR MODO OFFLINE FORÇADO (tipo Spotify)
  const handleToggleOfflineMode = async () => {
    setIsTogglingOfflineMode(true);
    
    try {
      // Verificar estado ANTES de alternar
      const wasOffline = syncService.isOfflineModeActive();
      
      console.log(`🔄 Estado ANTES do toggle: ${wasOffline ? 'OFFLINE' : 'ONLINE'}`);
      
      // Alternar o modo (ele faz a inversão internamente)
      await syncService.toggleOfflineMode();
      
      // Verificar estado DEPOIS de alternar (para garantir)
      const nowOffline = syncService.isOfflineModeActive();
      setIsOfflineModeForced(nowOffline);
      
      console.log(`🔄 Estado DEPOIS do toggle: ${nowOffline ? 'OFFLINE' : 'ONLINE'}`);
      console.log(`✅ Modo offline alternado: ${wasOffline ? 'OFFLINE' : 'ONLINE'} → ${nowOffline ? 'OFFLINE' : 'ONLINE'}`);
      
      // Atualizar stats após mudança de modo
      await loadStats();
      await loadPendingSync();
      
    } catch (error) {
      console.error('Erro ao alternar modo offline:', error);
      toast.error('Erro ao alternar modo offline');
    } finally {
      setIsTogglingOfflineMode(false);
    }
  };


  const handleSync = async () => {
    if (!isOnline) {
      toast.error('❌ Sem conexão para sincronizar');
      return;
    }

    try {
      await syncService.forceSyncData();
      await loadPendingSync();
      await loadPatientsStats(); // ✅ Atualizar stats após sync
      toast.success('✅ Sincronização concluída');
    } catch (error) {
      toast.error('Erro na sincronização');
    }
  };

  const handleToggleSyncPause = () => {
    if (isSyncPaused) {
      syncService.startPeriodicSync();
      setIsSyncPaused(false);
      toast.success('✅ Sincronização automática retomada');
    } else {
      syncService.stopPeriodicSync();
      setIsSyncPaused(true);
      toast.info('⏸️ Sincronização automática pausada');
    }
  };

  const handleGoBack = () => {
    navigate('/'); // Volta para a página inicial
  };

  // ✅ NOVOS HANDLERS PARA DEBUG E RESET
  const handleDebugPendingData = async () => {
    try {
      await syncService.debugPendingData();
      toast.info('🔍 Informações de debug foram exibidas no console (F12)');
    } catch (error) {
      console.error('Erro no debug:', error);
      toast.error('❌ Erro ao executar debug');
    }
  };

  const handleResetSyncLock = async () => {
    if (window.confirm('⚠️ Tem certeza que deseja resetar o lock de sincronização? Use apenas se a sincronização estiver travada.')) {
      try {
        await syncService.resetSyncLock();
        await loadPendingSync(); // Atualizar contadores
      } catch (error) {
        console.error('Erro ao resetar lock:', error);
        toast.error('❌ Erro ao resetar lock');
      }
    }
  };

  // ...existing code...

  // ✅ CORRIGIDO: Handlers para download de pacientes usando sistema correto
  const handleDownloadPatients = async () => {
    if (!isOnline) {
      toast.error('❌ Sem conexão com a internet');
      return;
    }

    setPatientsDownloading(true);
    setPatientsProgress(0);
    setPatientsPhase('Iniciando...');

    try {
      let result: { success: boolean; count: number; strategy?: string; error?: string };
      
      setPatientsPhase('Baixando todos os pacientes...');
      const allPatients = await PacienteService.getAllPatientsForOffline(
        (current, total, percentage) => {
          setPatientsProgress(percentage * 0.9);
          setPatientsPhase(`Baixando: ${current}/${total} pacientes`);
        }
      );
      
      setPatientsProgress(95);
      setPatientsPhase('Salvando todos os pacientes no cache...');
      
      // ✅ CORRIGIDO: Usar cache de verificação para não sincronizar
      await indexedDBService.savePacientesParaCache(allPatients);
      
      result = { success: true, count: allPatients.length, strategy: 'Base Completa' };
      
      // ✅ Atualizar estatísticas
      await loadPatientsStats();
      
      if (result.success) {
        setPatientsProgress(100);
        setPatientsPhase('Concluído!');
        toast.success(`✅ ${result.strategy || 'Download'} concluído: ${result.count?.toLocaleString() || 0} registros`);
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
      
    } catch (error: any) {
      console.error('Erro no download:', error);
      toast.error(`❌ Erro no download: ${error.message || 'Erro desconhecido'}`);
      setPatientsPhase('Erro!');
    } finally {
      setPatientsDownloading(false);
      setTimeout(() => {
        setPatientsProgress(0);
        setPatientsPhase('');
      }, 3000);
    }
  };

  // ✅ CORRIGIDO: Handler para limpar apenas cache de verificação
  const handleClearPatientsCache = async () => {
    if (window.confirm('⚠️ Tem certeza que deseja limpar o cache de pacientes para verificação? Os pacientes criados localmente serão preservados.')) {
      try {
        // ✅ CORRIGIDO: Usar método específico para limpar apenas cache de verificação
        await indexedDBService.clearPacientesCache();
        
        await loadPatientsStats();
        toast.success('✅ Cache de verificação de pacientes limpo (dados locais preservados)');
      } catch (error) {
        console.error('Erro ao limpar cache:', error);
        toast.error('❌ Erro ao limpar cache');
      }
    }
  };

  // ✅ NOVO: Handlers para download de notificações
  const handleDownloadNotifications = async (limit: number = 200) => {
    if (!isOnline) {
      toast.error('❌ Sem conexão com a internet');
      return;
    }

    setNotificationsDownloading(true);
    setNotificationsProgress(0);
    setNotificationsPhase('Iniciando...');

    try {
      const result = await offlineDataManager.downloadNotificacoesForOfflineViewing({
        limit,
        encrypt: true,
        onProgress: (progress, current) => {
          setNotificationsProgress(progress);
          setNotificationsPhase(current);
        }
      });

      await loadNotificationsStats();

      if (result.success) {
        setNotificationsProgress(100);
        setNotificationsPhase('Concluído!');
        toast.success(
          `✅ ${result.count} notificações baixadas${result.encrypted ? ' (criptografadas)' : ''}`,
          { autoClose: 4000 }
        );
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro no download de notificações:', error);
      toast.error(`❌ Erro: ${error.message || 'Erro desconhecido'}`);
      setNotificationsPhase('Erro!');
    } finally {
      setNotificationsDownloading(false);
      setTimeout(() => {
        setNotificationsProgress(0);
        setNotificationsPhase('');
      }, 3000);
    }
  };

  const handleClearNotificationsCache = async () => {
    if (window.confirm('⚠️ Tem certeza que deseja limpar o cache de notificações? As notificações pendentes de sincronização serão preservadas.')) {
      try {
        await offlineDataManager.clearNotificacoesCache();
        await loadNotificationsStats();
        toast.success('✅ Cache de notificações limpo (pendentes preservadas)');
      } catch (error) {
        console.error('Erro ao limpar cache:', error);
        toast.error('❌ Erro ao limpar cache');
      }
    }
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-lg text-gray-700">Carregando estatísticas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Padronizado com Campanhas */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>

              <div className="flex items-center gap-3">
                <Database className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Gerenciamento Offline</h1>
                  <p className="text-blue-100 text-sm">Configure seu sistema para funcionar sem internet</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Botão de Informações */}
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center gap-2 px-3 py-2 text-blue-100 hover:text-white hover:bg-blue-700 rounded-lg transition-colors"
                title="Informações do sistema offline"
              >
                <Info className="h-5 w-5" />
              </button>

              {/* Status da conexão */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isOnline ? 'bg-green-500 bg-opacity-20' : 'bg-red-500 bg-opacity-20'
              }`}>
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span className="font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Side Menu - Usando o componente real do sistema */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Navigation Tabs - atualizado */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'patients', label: 'Base de Pacientes', icon: Users },
              { id: 'notifications', label: 'Notificações', icon: Download },
              { id: 'sources', label: 'Todas as Fontes', icon: Database },
              { id: 'sync', label: 'Sincronização', icon: RefreshCw },
              { id: 'pin', label: 'Login Offline (PIN)', icon: Shield }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Painel de Informações */}
        {showInfo && (
          <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200 transition-all duration-300 ease-in-out">
            <div className="flex items-center gap-3 mb-4">
              <Info className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Informações do Sistema Offline</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="ml-auto text-blue-600 hover:text-blue-800 text-xl transition-colors"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="space-y-2">
                <p>• <strong>Dados Essenciais:</strong> Necessários para funcionamento básico (tipos, categorias, etc.)</p>
                <p>• <strong>Dados Geográficos:</strong> Estados, municípios, bairros e informações de localização</p>
                <p>• <strong>Cache de Verificação:</strong> Pacientes baixados apenas para verificar CPF (não são sincronizados)</p>
              </div>
              <div className="space-y-2">
                <p>• <strong>Dados Médicos:</strong> Sintomas, diagnósticos, tipos de atendimento</p>
                <p>• <strong>Sincronização:</strong> Dados criados offline são enviados automaticamente quando há conexão</p>
                <p>• <strong>Pacientes Locais:</strong> Criados offline e marcados para sincronização</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar (quando está baixando) */}
        {isDownloading && (
          <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-blue-900 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Baixando: {currentDownload}
              </span>
              <span className="text-blue-700 font-bold">{Math.round(downloadProgress)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Cards de estatísticas principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-700">Dados Carregados</span>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats.overall.loaded}/{stats.overall.total}
                </div>
                <div className="text-sm text-gray-600">{stats.overall.percentage}% completo</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-700">Total de Registros</span>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {stats.overall.totalRecords.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Armazenados offline</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <RefreshCw className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="font-medium text-gray-700">Pendente Sync</span>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {pendingSync.notificacoes + pendingSync.pacientes}
                </div>
                <div className="text-sm text-gray-600">
                  {pendingSync.notificacoes} notificações, {pendingSync.pacientes} pacientes
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${isOnline && !isOfflineModeForced ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isOnline && !isOfflineModeForced ? (
                      <Wifi className="h-6 w-6 text-green-600" />
                    ) : (
                      <WifiOff className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <span className="font-medium text-gray-700">Status</span>
                </div>
                <div className={`text-3xl font-bold mb-1 ${isOnline && !isOfflineModeForced ? 'text-green-600' : 'text-red-600'}`}>
                  {isOfflineModeForced ? 'Offline' : isOnline ? 'Online' : 'Offline'}
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {isOfflineModeForced 
                    ? '📵 Modo offline ativado (manual)' 
                    : isOnline 
                      ? 'Pronto para download' 
                      : 'Sem conexão de internet'}
                </div>
                
                {/* 🆕 TOGGLE DE MODO OFFLINE FORÇADO (tipo Spotify) */}
                <button
                  onClick={handleToggleOfflineMode}
                  disabled={isTogglingOfflineMode}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    isOfflineModeForced
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isOfflineModeForced ? 'Clique para ativar modo online' : 'Clique para ativar modo offline'}
                >
                  {isTogglingOfflineMode ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Alterando...
                    </span>
                  ) : isOfflineModeForced ? (
                    <span className="flex items-center justify-center gap-2">
                      <Wifi className="h-4 w-4" />
                      Ativar Online
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <WifiOff className="h-4 w-4" />
                      Ativar Offline
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Botões de ação principais */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Ações Rápidas</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleDownloadAll}
                  disabled={isDownloading || !isOnline}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Database className="h-5 w-5" />
                  Baixar Todos os Dados
                </button>

                {(pendingSync.notificacoes + pendingSync.pacientes) > 0 && (
                  <button
                    onClick={handleSync}
                    disabled={!isOnline}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Sincronizar Pendências
                  </button>
                )}

                <button
                  onClick={handleClearData}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                  Limpar Dados
                </button>

                <button
                  type="button"
                  onClick={handleWipeIndexedDbAndReload}
                  disabled={isDownloading}
                  title="Quando o navegador não libera o IndexedDB (ex.: Opera GX)"
                  className="flex items-center gap-2 px-6 py-3 border-2 border-red-300 text-red-800 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Database className="h-5 w-5" />
                  Recriar banco local
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Se o armazenamento IndexedDB não sumir ao limpar dados do site, use{' '}
                <strong>Recriar banco local</strong> com todas as abas do sistema fechadas, exceto esta.
              </p>
            </div>
          </div>
        )}

        {/* ✅ CORRIGIDA: Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            {/* Header da seção */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Base de Pacientes para Verificação Offline</h2>
              </div>
              <p className="text-gray-600">
                Baixe dados de pacientes para verificação de CPF offline. Os dados ficam separados e não são sincronizados como novos cadastros.
              </p>
            </div>

            {/* Progress Bar para download de pacientes */}
            {patientsDownloading && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-blue-900 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    {patientsPhase}
                  </span>
                  <span className="text-blue-700 font-bold">{Math.round(patientsProgress)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${patientsProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Análise e Recomendação */}
            {downloadRecommendation && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Análise da Base de Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {downloadRecommendation.totalPatients.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700">Total de Pacientes</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      ~{Math.round(downloadRecommendation.estimatedSizeMB)}MB
                    </div>
                    <div className="text-sm text-green-700">Tamanho Estimado</div>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    downloadRecommendation.recommendation === 'full' ? 'bg-green-50' :
                    downloadRecommendation.recommendation === 'recent' ? 'bg-yellow-50' : 'bg-orange-50'
                  }`}>
                    <div className={`text-2xl font-bold mb-1 ${
                      downloadRecommendation.recommendation === 'full' ? 'text-green-600' :
                      downloadRecommendation.recommendation === 'recent' ? 'text-yellow-600' : 'text-orange-600'
                    }`}>
                      {downloadRecommendation.recommendation === 'full' ? 'Completo' :
                       downloadRecommendation.recommendation === 'recent' ? 'Recentes' : 'Apenas CPFs'}
                    </div>
                    <div className={`text-sm ${
                      downloadRecommendation.recommendation === 'full' ? 'text-green-700' :
                      downloadRecommendation.recommendation === 'recent' ? 'text-yellow-700' : 'text-orange-700'
                    }`}>
                      Recomendado
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border-l-4 ${
                  downloadRecommendation.recommendation === 'full' ? 'bg-green-50 border-green-400' :
                  downloadRecommendation.recommendation === 'recent' ? 'bg-yellow-50 border-yellow-400' : 'bg-orange-50 border-orange-400'
                }`}>
                  <p className="text-sm text-gray-700">{downloadRecommendation.reason}</p>
                </div>
              </div>
            )}

            {/* ✅ CORRIGIDO: Status Atual usando dados corretos */}
            {patientsStats && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Status Atual do Cache</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Cache de Verificação</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {(patientsStats.verification?.count || patientsStats.cacheStats?.verificacao || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700">
                      {(patientsStats.verification?.loaded || patientsStats.cacheStats?.verificacao > 0) ? 'Disponível para verificação' : 'Nenhum dado em cache'}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Pacientes Locais</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {(patientsStats.localPatients?.count || patientsStats.cacheStats?.locais || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-green-700">Criados offline (serão sincronizados)</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Verificação CPF</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {patientsStats.confidence === 'high' ? 'Alta' : 
                       patientsStats.confidence === 'medium' ? 'Média' : 'Baixa'}
                    </div>
                    <div className="text-sm text-purple-700">
                      {patientsStats.recommendation || 'Confiança de verificação'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ CORRIGIDO: Opções de Download usando métodos corretos */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Opções de Download</h3>
              <div className="grid grid-cols-1 gap-4">
                
                {/* Todos os Pacientes */}
                <div className="p-4 border-2 border-green-200 rounded-lg hover:border-green-300 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Base Completa</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Todos os pacientes (verificação 100% precisa).
                  </p>
                  <button
                    onClick={() => handleDownloadPatients()}
                    disabled={patientsDownloading || !isOnline}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Download Completo
                  </button>
                </div>
              </div>

              {/* Ações adicionais */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleClearPatientsCache}
                    disabled={patientsDownloading}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Limpar Cache de Verificação
                  </button>
                  
                  <button
                    onClick={loadPatientsStats}
                    disabled={patientsDownloading}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Atualizar Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Status das notificações */}
            {notificationsStats && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  Status de Notificações Offline
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Cache de Visualização</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {notificationsStats.cached.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700">Notificações baixadas para visualização offline</div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-orange-900">Pendentes</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {notificationsStats.pending.toLocaleString()}
                    </div>
                    <div className="text-sm text-orange-700">Criadas offline (serão sincronizadas)</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Total Disponível</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {notificationsStats.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-purple-700">Visíveis no modo offline</div>
                  </div>
                </div>

                {/* Informações sobre criptografia */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">🔐 Proteção de Dados</span>
                  </div>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>• As notificações são <strong>criptografadas (AES-256)</strong> antes de serem salvas no dispositivo</p>
                    <p>• Apenas você pode acessar seus dados offline</p>
                    <p>• Os dados são descriptografados automaticamente quando necessário</p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress bar específico para notificações */}
            {notificationsDownloading && (
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-blue-900 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    {notificationsPhase}
                  </span>
                  <span className="text-blue-700 font-bold">{Math.round(notificationsProgress)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${notificationsProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Opções de Download */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Opções de Download</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Download 200 mais recentes */}
                <div className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Download className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Download Padrão</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Baixa as <strong>200 notificações mais recentes</strong> com criptografia AES-256.
                  </p>
                  <button
                    onClick={() => handleDownloadNotifications(200)}
                    disabled={notificationsDownloading || !isOnline}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Baixar 200 Notificações
                  </button>
                </div>

                {/* Download todas as notificações */}
                <div className="p-4 border-2 border-green-200 rounded-lg hover:border-green-300 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Download Completo</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Baixa <strong>todas as notificações</strong> disponíveis (recomendado para uso prolongado offline).
                  </p>
                  <button
                    onClick={() => handleDownloadNotifications(9999)}
                    disabled={notificationsDownloading || !isOnline}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Baixar Todas as Notificações
                  </button>
                </div>
              </div>

              {/* Ações adicionais */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleClearNotificationsCache}
                    disabled={notificationsDownloading}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Limpar Cache
                  </button>
                  
                  <button
                    onClick={loadNotificationsStats}
                    disabled={notificationsDownloading}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Atualizar Status
                  </button>
                </div>
              </div>
            </div>

            {/* Informações importantes */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">ℹ️ Informações Importantes</span>
              </div>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• As notificações baixadas são <strong>apenas para visualização</strong> no modo offline</p>
                <p>• Notificações <strong>criadas offline</strong> aparecem com o badge "🟡 Aguardando sincronização"</p>
                <p>• O cache é atualizado automaticamente após sincronizações bem-sucedidas</p>
                <p>• Recomendado baixar antes de períodos prolongados sem internet</p>
              </div>
            </div>
          </div>
        )}

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Todas as Fontes de Dados</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fonte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registros
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.sources.map((source: any) => (
                      <tr key={source.key} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {source.loaded ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{source.name}</div>
                              <div className="text-sm text-gray-500">{source.key}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            source.loaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {source.loaded ? 'Carregado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {source.recordCount?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDownloadSource(source)}
                            disabled={isDownloading || !isOnline}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              isDownloading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : source.loaded
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isDownloading ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin inline mr-1" />
                                Baixando...
                              </>
                            ) : source.loaded ? (
                              <>
                                <RotateCcw className="h-3 w-3 inline mr-1" />
                                Atualizar
                              </>
                            ) : (
                              <>
                                <Download className="h-3 w-3 inline mr-1" />
                                Baixar
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sync Tab */}
        {activeTab === 'sync' && (
          <div className="space-y-6">            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Sincronização</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleDebugPendingData}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
                  >
                    <Info className="h-4 w-4" />
                    Debug
                  </button>
                  <button
                    onClick={handleResetSyncLock}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Lock
                  </button>
                  <button
                    onClick={handleToggleSyncPause}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSyncPaused
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    {isSyncPaused ? (
                      <>
                        <Play className="h-4 w-4" />
                        Retomar
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4" />
                        Pausar
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Gerencie dados que foram salvos offline e precisam ser enviados para o servidor.
                <br />
                <strong>Nota:</strong> Apenas pacientes criados localmente são sincronizados. Dados baixados para verificação permanecem apenas como cache.
                {isSyncPaused && (
                  <span className="block mt-2 text-orange-600 font-medium">
                    ⚠️ Sincronização automática está pausada
                  </span>
                )}
              </p>

              <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-950">
                <p className="font-medium mb-1">IndexedDB não limpa no Opera GX?</p>
                <p className="text-amber-900/90 mb-3">
                  Feche outras abas do app, use o botão abaixo ou, no DevTools (F12) → Aplicativo → Armazenamento → Limpar dados do site.
                  Se ainda aparecer ~2 MB, desinstale o atalho PWA (se existir) e, em Configurações → Privacidade, remova dados armazenados só para o domínio do sistema.
                </p>
                <button
                  type="button"
                  onClick={handleWipeIndexedDbAndReload}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 text-sm transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Apagar banco local e recarregar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-900">Notificações Pendentes</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900 mb-2">
                    {pendingSync.notificacoes}
                  </div>
                  <p className="text-sm text-orange-700">
                    Notificações salvas offline aguardando sincronização
                  </p>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Pacientes Pendentes</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mb-2">
                    {pendingSync.pacientes}
                  </div>
                  <p className="text-sm text-blue-700">
                    Pacientes criados offline aguardando sincronização
                  </p>
                </div>
              </div>

              {(pendingSync.notificacoes + pendingSync.pacientes) > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Ação Necessária</span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Você tem dados salvos offline que precisam ser sincronizados com o servidor.
                  </p>
                  <button
                    onClick={handleSync}
                    disabled={!isOnline}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isOnline ? 'Sincronizar Agora' : 'Aguardando Conexão'}
                  </button>
                </div>
              )}

              {/* ✅ NOVO: Lista detalhada de notificações pendentes */}
              {pendingNotifications.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📋 Notificações Pendentes de Sincronização
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingNotifications.map((notif: any, index: number) => (
                      <div key={notif.offlineId || index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                #{index + 1} - {notif.formData?.tipoEvento || 'Notificação'}
                              </span>
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                Offline
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <div>
                                <Clock className="inline h-3 w-3 mr-1" />
                                <strong>Criado em:</strong>{' '}
                                {new Date(notif.timestamp).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div>
                                <span className="inline-block w-20 truncate" title={notif.offlineId}>
                                  📱 ID: {notif.offlineId?.substring(0, 15)}...
                                </span>
                              </div>
                              {notif.formData?.paciente && (
                                <div className="col-span-2">
                                  <strong>Paciente:</strong> {notif.formData.paciente}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(pendingSync.notificacoes + pendingSync.pacientes) === 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Tudo Sincronizado</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Não há dados pendentes de sincronização.
                  </p>
                </div>
              )}

              {/* ✅ NOVA SEÇÃO: Informações sobre Duplicação */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Proteção Contra Duplicação</span>
                </div>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>• <strong>Verificação de CPF:</strong> O sistema verifica se o paciente já existe no servidor antes de criar um novo</p>
                  <p>• <strong>Marcação única:</strong> Apenas pacientes criados offline são sincronizados (não dados baixados para cache)</p>
                  <p>• <strong>Controle de concorrência:</strong> Evita sincronizações simultâneas que podem causar duplicação</p>
                  <p>• <strong>Debug disponível:</strong> Use o botão "Debug" para verificar quais dados estão pendentes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🆕 PIN Tab */}
        {activeTab === 'pin' && (
          <PinManagementTab
            pinSessionInfo={pinSessionInfo}
            setPinSessionInfo={setPinSessionInfo}
            showPinSetup={showPinSetup}
            setShowPinSetup={setShowPinSetup}
            showChangePinModal={showChangePinModal}
            setShowChangePinModal={setShowChangePinModal}
          />
        )}
      </main>

      {/* Footer - Seguindo padrão das campanhas */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center md:justify-between flex-wrap gap-4">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} Sistema de Saúde - Gerenciamento Offline
            </div>
            <div className="flex space-x-6">
              <a href="/sobre" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Sobre
              </a>
              <a href="/ajuda" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Ajuda
              </a>
              <a href="/suporte" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Suporte
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OfflineManagementPage;
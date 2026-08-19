import React, { useState, useEffect } from 'react';
import { Download, Wifi, Database, Loader, X, CheckCircle, XCircle, Users, Building } from 'lucide-react'; // ✅ ADICIONAR Building
import { toast } from 'react-toastify';
import { NotificacaoService } from '@/services/NotificacaoService';
import indexedDBService from '@/services/indexedDB';
import { offlineDataManager } from '@/services/offlineDataManager';

interface OfflineDataPreloaderProps {
  className?: string;
  onDataLoaded?: () => void;
}

interface DataItem {
  key: string;
  name: string;
  fetchFn: () => Promise<any[]>;
  loaded: boolean;
  loading: boolean;
  error?: string;
  recordCount?: number;
  category: 'essential' | 'geographic' | 'medical' | 'administrative';
}

const OfflineDataPreloader: React.FC<OfflineDataPreloaderProps> = ({ 
  className = '',
  onDataLoaded 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [patientsStats, setPatientsStats] = useState({ verification: 0, local: 0, pending: 0 });
  
  // ✅ ADICIONAR: Estado para estabelecimentos
  const [estabelecimentosStats, setEstabelecimentosStats] = useState({ 
    verification: 0, 
    local: 0, 
    pending: 0 
  });
  
  const [dataItems, setDataItems] = useState<DataItem[]>([
    { key: 'eventos', name: 'Tipos de Evento', fetchFn: NotificacaoService.getEventoOptions, loaded: false, loading: false, category: 'essential' },
    {
      key: 'localidades-evento',
      name: 'Localidades por Evento',
      fetchFn: () => offlineDataManager.downloadLocalidadesEventoCatalogs(),
      loaded: false,
      loading: false,
      category: 'essential',
    },
    { key: 'publicos', name: 'Tipos de Público', fetchFn: NotificacaoService.getPublicoOptions, loaded: false, loading: false, category: 'essential' },
    { key: 'paises', name: 'Países', fetchFn: NotificacaoService.getPaisOptions, loaded: false, loading: false, category: 'geographic' },
    { key: 'estados', name: 'Estados', fetchFn: NotificacaoService.getEstadoOptions, loaded: false, loading: false, category: 'geographic' },
    { key: 'municipios', name: 'Municípios', fetchFn: NotificacaoService.getMunicipioOptions, loaded: false, loading: false, category: 'geographic' },
    { key: 'bairros', name: 'Bairros', fetchFn: NotificacaoService.getBairroOptions, loaded: false, loading: false, category: 'geographic' },
    { key: 'generos', name: 'Gêneros', fetchFn: NotificacaoService.getGeneroOptions, loaded: false, loading: false, category: 'essential' },
    { key: 'racas', name: 'Raças', fetchFn: NotificacaoService.getRacaOptions, loaded: false, loading: false, category: 'essential' },
    { key: 'escolaridades', name: 'Escolaridades', fetchFn: NotificacaoService.getEscolaridadeOptions, loaded: false, loading: false, category: 'essential' },
    { key: 'atendimentos', name: 'Tipos de Atendimento', fetchFn: NotificacaoService.getAtendimentoOptions, loaded: false, loading: false, category: 'essential' },
    { key: 'sintomas', name: 'Sintomas', fetchFn: NotificacaoService.getSintomaOptions, loaded: false, loading: false, category: 'medical' },
    { key: 'hipoteses', name: 'Hipóteses Diagnósticas', fetchFn: NotificacaoService.getHipoteseDiagOptions, loaded: false, loading: false, category: 'medical' },
    { key: 'traumas', name: 'Tipos de Trauma', fetchFn: NotificacaoService.getTraumaOptions, loaded: false, loading: false, category: 'medical' },
    { key: 'encerramentos', name: 'Tipos de Encerramento', fetchFn: NotificacaoService.getEncerramentoOptions, loaded: false, loading: false, category: 'essential' },
    { key: 'estabelecimentos', name: 'Estabelecimentos', fetchFn: NotificacaoService.getEstabelecimentoOptions, loaded: false, loading: false, category: 'administrative' },
    { 
      key: 'cbos', 
      name: 'CBOs/Profissões', 
      fetchFn: async () => {
        const server = import.meta.env.VITE_API_SERVER;
        const port = import.meta.env.VITE_API_PORT;
        const response = await fetch(`${server}:${port}/api/tipo-cbo?limit=5000`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data?.data || data || [];
      }, 
      loaded: false, 
      loading: false,
      category: 'administrative'
    },
    { 
      key: 'lista-sindromica', 
      name: 'Lista Sindrômica', 
      fetchFn: async () => {
        const server = import.meta.env.VITE_API_SERVER;
        const port = import.meta.env.VITE_API_PORT;
        const response = await fetch(`${server}:${port}/api/lista-sindromica/all`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      }, 
      loaded: false, 
      loading: false,
      category: 'medical'
    }
  ]);

  // Monitorar status da conexão
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

  // Verificar dados em cache ao carregar
  useEffect(() => {
    checkCachedData();
  }, []);

  const checkCachedData = async () => {
    const managerStatus = await offlineDataManager.checkCachedData();
    const updatedItems = await Promise.all(
      dataItems.map(async (item) => {
        try {
          if (item.key === 'localidades-evento') {
            const catalogStatus = managerStatus[item.key];
            return {
              ...item,
              loaded: catalogStatus?.loaded || false,
              recordCount: catalogStatus?.count || 0,
            };
          }

          const cachedData = await indexedDBService.getOpcoes(item.key);
          const hasValidData = cachedData && Array.isArray(cachedData) && cachedData.length > 0;
          return { 
            ...item, 
            loaded: Boolean(hasValidData),
            recordCount: hasValidData ? cachedData.length : 0
          };
        } catch {
          return { ...item, loaded: false, recordCount: 0 };
        }
      })
    );
    setDataItems(updatedItems);
    
    // ✅ VERIFICAR STATS DE PACIENTES E ESTABELECIMENTOS
    try {
      const stats = await indexedDBService.getCacheStats();
      
      // Stats de pacientes
      setPatientsStats({
        verification: stats.verificacao || 0,
        local: stats.locais || 0,
        pending: stats.pendentes || 0
      });
      
      // ✅ NOVO: Stats de estabelecimentos
      setEstabelecimentosStats({
        verification: stats.estabelecimentos_verificacao || 0,
        local: stats.estabelecimentos_locais || 0,
        pending: stats.estabelecimentos_pendentes || 0
      });
      
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    }
    
    // Calcular progresso
    const loadedItems = updatedItems.filter(item => item.loaded).length;
    const totalItems = updatedItems.length;
    const progress = totalItems > 0 ? (loadedItems / totalItems) * 100 : 0;
    
    setProgress(progress);
    
    // Calcular tamanho total
    const totalRecords = updatedItems.reduce((sum, item) => sum + (item.recordCount || 0), 0);
    setTotalSize(totalRecords);
  };

  const downloadAllData = async () => {
    if (isDownloading) return;
    
    // Verificar conectividade antes de iniciar
    if (!isOnline) {
      toast.error('❌ Sem conexão com a internet. Não é possível baixar os dados.');
      return;
    }
    
    setIsDownloading(true);
    setProgress(0);
    
    let totalDownloaded = 0;
    let successCount = 0;
    let errorCount = 0;
    
    toast.info('🔄 Iniciando download dos dados offline...');

    for (let i = 0; i < dataItems.length; i++) {
      const item = dataItems[i];
      
      // Verificar conectividade durante o download
      if (!navigator.onLine) {
        toast.error('❌ Conexão perdida durante o download. Processo interrompido.');
        setIsDownloading(false);
        return;
      }

      // Atualizar estado do item atual
      setDataItems(prev => prev.map(dataItem => 
        dataItem.key === item.key ? { ...dataItem, loading: true, error: undefined } : dataItem
      ));

      try {
        console.log(`📥 Baixando: ${item.name}...`);
        
        const data = await item.fetchFn();
        
        // Validação rigorosa
        if (
          data &&
          Array.isArray(data) &&
          (data.length > 0 || item.key === 'localidades-evento')
        ) {
          if (item.key !== 'localidades-evento') {
            await indexedDBService.saveOpcoes(item.key, data);
          }
          totalDownloaded += data.length;
          successCount++;
          
          // Marcar como carregado com sucesso
          setDataItems(prev => prev.map(dataItem => 
            dataItem.key === item.key ? { 
              ...dataItem, 
              loaded: true, 
              loading: false, 
              recordCount: data.length,
              error: undefined 
            } : dataItem
          ));
          
          console.log(`✅ ${item.name}: ${data.length} registros salvos`);
        } else {
          throw new Error('Nenhum dado disponível');
        }
        
      } catch (error) {
        console.error(`❌ Erro ao baixar ${item.name}:`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        
        // Marcar erro
        setDataItems(prev => prev.map(dataItem => 
          dataItem.key === item.key ? { 
            ...dataItem, 
            loading: false, 
            loaded: false,
            error: errorMessage,
            recordCount: 0
          } : dataItem
        ));

        errorCount++;
        console.error(`❌ ${item.name} falhou: ${errorMessage}`);
      }

      // Atualizar progresso
      const progress = ((i + 1) / dataItems.length) * 100;
      setProgress(progress);
      
      // Pausa entre downloads
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setTotalSize(totalDownloaded);
    setIsDownloading(false);
    
    // Relatório final
    if (errorCount === 0) {
      toast.success(`🎉 Todos os dados baixados com sucesso! ${totalDownloaded.toLocaleString()} registros offline.`);
      onDataLoaded?.();
    } else {
      toast.error(`❌ Falha no download! ${errorCount} itens com erro. Tente novamente.`);
    }
  };

  // Download específico para verificação de pacientes
  const downloadPatientsVerification = async () => {
    if (isDownloading || !isOnline) return;
    
    setIsDownloading(true);
    toast.info('👥 Baixando pacientes para verificação de CPF...');
    
    try {
      const result = await offlineDataManager.downloadPatientsForVerification(
        (progress, current) => {
          setProgress(progress);
          console.log(`${progress}%: ${current}`);
        }
      );
      
      if (result.success) {
        toast.success(`✅ ${result.count} pacientes baixados para verificação!`);        
        // Atualizar stats
        await updateStats();
      } else {
        toast.error(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro no download de pacientes:', error);
      toast.error('Erro ao baixar pacientes');
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  // ✅ NOVO: Download específico para verificação de estabelecimentos
  const downloadEstabelecimentosVerification = async () => {
    if (isDownloading || !isOnline) return;
    
    setIsDownloading(true);
    toast.info('🏥 Baixando estabelecimentos para verificação de CNES...');
    
    try {
      const result = await offlineDataManager.downloadEstabelecimentosForVerification(
        (progress, current) => {
          setProgress(progress);
          console.log(`${progress}%: ${current}`);
        }
      );
      
      if (result.success) {
        toast.success(`✅ ${result.count} estabelecimentos baixados para verificação!`);        
        // Atualizar stats
        await updateStats();
      } else {
        toast.error(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro no download de estabelecimentos:', error);
      toast.error('Erro ao baixar estabelecimentos');
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  // ✅ NOVO: Função auxiliar para atualizar stats
  const updateStats = async () => {
    try {
      const stats = await indexedDBService.getCacheStats();
      
      setPatientsStats({
        verification: stats.verificacao || 0,
        local: stats.locais || 0,
        pending: stats.pendentes || 0
      });
      
      setEstabelecimentosStats({
        verification: stats.estabelecimentos_verificacao || 0,
        local: stats.estabelecimentos_locais || 0,
        pending: stats.estabelecimentos_pendentes || 0
      });
      
    } catch (error) {
      console.error('Erro ao atualizar stats:', error);
    }
  };

  // ✅ ATUALIZAR: Incluir estabelecimentos na limpeza
  const clearOfflineData = async () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados offline? Você precisará baixá-los novamente.')) {
      try {
        // Limpar dados normais
        for (const item of dataItems) {
          if (item.key === 'localidades-evento') {
            await indexedDBService.clearLocalidadesEventoCache();
          } else {
            await indexedDBService.saveOpcoes(item.key, []);
          }
        }
        
        // ✅ Limpar cache de pacientes E estabelecimentos
        await indexedDBService.clearPacientesCache();
        await indexedDBService.clearEstabelecimentosCache();
        
        setDataItems(prev => prev.map(item => ({ 
          ...item, 
          loaded: false, 
          error: undefined, 
          recordCount: 0 
        })));
        setPatientsStats({ verification: 0, local: 0, pending: 0 });
        setEstabelecimentosStats({ verification: 0, local: 0, pending: 0 }); // ✅ ADICIONAR
        setProgress(0);
        setTotalSize(0);
        
        toast.success('🗑️ Dados offline limpos com sucesso!');
      } catch (error) {
        toast.error('Erro ao limpar dados offline');
      }
    }
  };

  // Cálculos de status
  const totalItems = dataItems.length;
  const loadedItems = dataItems.filter(item => item.loaded).length;
  const hasErrors = dataItems.some(item => item.error);
  const isFullyLoaded = loadedItems === totalItems;
  const hasPatientsVerification = patientsStats.verification > 0;
  const hasEstabelecimentosVerification = estabelecimentosStats.verification > 0; // ✅ ADICIONAR

  const getStatusInfo = () => {
    if (!isOnline) {
      return { color: 'red', text: 'Offline - Não é possível baixar' };
    }
    if (hasErrors) {
      return { color: 'red', text: 'Erro nos dados' };
    }
    if (isFullyLoaded && hasPatientsVerification && hasEstabelecimentosVerification) { // ✅ ATUALIZAR
      return { color: 'green', text: 'Sistema completo' };
    }
    if (isFullyLoaded) {
      return { color: 'yellow', text: 'Dados básicos prontos' };
    }
    return { color: 'blue', text: 'Pronto para download' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`relative ${className}`}>
      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
          statusInfo.color === 'green'
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
            : statusInfo.color === 'red'
            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
            : statusInfo.color === 'yellow'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
            : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
        }`}
        title={statusInfo.text}
      >
        {!isOnline ? (
          <Database className="h-4 w-4" />
        ) : isDownloading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : hasErrors ? (
          <XCircle className="h-4 w-4" />
        ) : isFullyLoaded && hasPatientsVerification && hasEstabelecimentosVerification ? ( // ✅ ATUALIZAR
          <CheckCircle className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        
        <span className="text-sm font-medium">
          {!isOnline 
            ? 'Offline'
            : isDownloading 
            ? `Baixando... ${Math.round(progress)}%`
            : `Dados (${loadedItems}/${totalItems})`
          }
        </span>

        {totalSize > 0 && (
          <span className="text-xs opacity-75">
            ({totalSize.toLocaleString()} registros)
          </span>
        )}
      </button>

      {/* Modal/Dropdown detalhado */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Dados para Uso Offline
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status da conexão */}
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {isOnline ? <Wifi className="h-4 w-4" /> : <Database className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {isOnline ? 'Conectado à internet' : 'Modo offline - dados em cache apenas'}
              </span>
            </div>

            {/* ✅ SEÇÃO DE PACIENTES (existente) */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Pacientes</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-blue-700">{patientsStats.verification}</div>
                  <div className="text-blue-600">Verificação</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-700">{patientsStats.local}</div>
                  <div className="text-blue-600">Locais</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-700">{patientsStats.pending}</div>
                  <div className="text-blue-600">Pendentes</div>
                </div>
              </div>
            </div>

            {/* ✅ NOVA SEÇÃO: Stats de Estabelecimentos */}
            <div className="mb-4 p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Estabelecimentos</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-orange-700">{estabelecimentosStats.verification}</div>
                  <div className="text-orange-600">Verificação</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-orange-700">{estabelecimentosStats.local}</div>
                  <div className="text-orange-600">Locais</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-orange-700">{estabelecimentosStats.pending}</div>
                  <div className="text-orange-600">Pendentes</div>
                </div>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Dados carregados: {loadedItems}/{totalItems}
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    hasErrors ? 'bg-red-500' : 
                    isFullyLoaded ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Lista de itens por categoria (mantida igual) */}
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {['essential', 'geographic', 'medical', 'administrative'].map(category => {
                const categoryItems = dataItems.filter(item => item.category === category);
                const categoryNames = {
                  essential: 'Essenciais',
                  geographic: 'Geográficos', 
                  medical: 'Médicos',
                  administrative: 'Administrativos'
                };
                
                return (
                  <div key={category}>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {categoryNames[category as keyof typeof categoryNames]}
                    </h4>
                    <div className="space-y-1">
                      {categoryItems.map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700">{item.name}</span>
                            </div>
                            {item.recordCount !== undefined && item.recordCount > 0 && (
                              <span className="text-gray-500">{item.recordCount} registros</span>
                            )}
                            {item.error && (
                              <div className="text-red-600 mt-1" title={item.error}>
                                Erro: {item.error.length > 20 ? item.error.substring(0, 20) + '...' : item.error}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.loading ? (
                              <Loader className="h-3 w-3 animate-spin text-blue-500" />
                            ) : item.loaded ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : item.error ? (
                              <XCircle className="h-3 w-3 text-red-500" />
                            ) : (
                              <Database className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ✅ BOTÕES DE AÇÃO ATUALIZADOS */}
            <div className="space-y-2">
              {/* Botão principal */}
              <button
                onClick={downloadAllData}
                disabled={isDownloading || !isOnline}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isDownloading || !isOnline
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isDownloading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Baixando...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>{!isOnline ? 'Sem Internet' : 'Baixar Dados Básicos'}</span>
                  </>
                )}
              </button>

              {/* Botão para pacientes */}
              <button
                onClick={downloadPatientsVerification}
                disabled={isDownloading || !isOnline}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isDownloading || !isOnline
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : hasPatientsVerification
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>
                  {hasPatientsVerification ? 'Atualizar Pacientes' : 'Baixar Pacientes (CPF)'}
                </span>
              </button>

              {/* ✅ NOVO: Botão para estabelecimentos */}
              <button
                onClick={downloadEstabelecimentosVerification}
                disabled={isDownloading || !isOnline}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isDownloading || !isOnline
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : hasEstabelecimentosVerification
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                <Building className="h-4 w-4" />
                <span>
                  {hasEstabelecimentosVerification ? 'Atualizar Estabelecimentos' : 'Baixar Estabelecimentos (CNES)'}
                </span>
              </button>

              {/* Botão limpar */}
              {(loadedItems > 0 || totalSize > 0 || hasPatientsVerification || hasEstabelecimentosVerification) && ( // ✅ ATUALIZAR
                <button
                  onClick={clearOfflineData}
                  disabled={isDownloading}
                  className="w-full px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-sm"
                >
                  Limpar Todos os Dados
                </button>
              )}
            </div>

            {/* ✅ INFORMAÇÕES ADICIONAIS ATUALIZADAS */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Wifi className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Status do Sistema:</p>
                  <ul className="space-y-1 text-blue-600">
                    <li>• Dados básicos: {loadedItems}/{totalItems}</li>
                    <li>• Pacientes para verificação: {patientsStats.verification.toLocaleString()}</li>
                    <li>• Estabelecimentos para verificação: {estabelecimentosStats.verification.toLocaleString()}</li> {/* ✅ ADICIONAR */}
                    <li>• Conexão: {isOnline ? 'Online' : 'Offline'}</li>
                    <li>• Status: {statusInfo.text}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineDataPreloader;
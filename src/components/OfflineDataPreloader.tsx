import React, { useState, useEffect } from 'react';
import { Download, Check, AlertCircle, Wifi, Database, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { NotificacaoService } from '@/services/NotificacaoService';
import indexedDBService from '@/services/indexedDB';

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
}

const OfflineDataPreloader: React.FC<OfflineDataPreloaderProps> = ({ 
  className = '',
  onDataLoaded 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);  const [dataItems, setDataItems] = useState<DataItem[]>([
    { key: 'eventos', name: 'Tipos de Evento', fetchFn: NotificacaoService.getEventoOptions, loaded: false, loading: false },
    { key: 'publicos', name: 'Tipos de Público', fetchFn: NotificacaoService.getPublicoOptions, loaded: false, loading: false },
    { key: 'paises', name: 'Países', fetchFn: NotificacaoService.getPaisOptions, loaded: false, loading: false },
    { key: 'estados', name: 'Estados', fetchFn: NotificacaoService.getEstadoOptions, loaded: false, loading: false },
    { key: 'municipios', name: 'Municípios', fetchFn: NotificacaoService.getMunicipioOptions, loaded: false, loading: false },
    { key: 'bairros', name: 'Bairros', fetchFn: NotificacaoService.getBairroOptions, loaded: false, loading: false },
    { key: 'generos', name: 'Gêneros', fetchFn: NotificacaoService.getGeneroOptions, loaded: false, loading: false },
    { key: 'racas', name: 'Raças', fetchFn: NotificacaoService.getRacaOptions, loaded: false, loading: false },
    { key: 'escolaridades', name: 'Escolaridades', fetchFn: NotificacaoService.getEscolaridadeOptions, loaded: false, loading: false },    { key: 'atendimentos', name: 'Tipos de Atendimento', fetchFn: NotificacaoService.getAtendimentoOptions, loaded: false, loading: false },
    { key: 'sintomas', name: 'Sintomas', fetchFn: NotificacaoService.getSintomaOptions, loaded: false, loading: false },
    { key: 'hipoteses', name: 'Hipóteses Diagnósticas', fetchFn: NotificacaoService.getHipoteseDiagOptions, loaded: false, loading: false },
    { key: 'traumas', name: 'Tipos de Trauma', fetchFn: NotificacaoService.getTraumaOptions, loaded: false, loading: false },
    { key: 'encerramentos', name: 'Tipos de Encerramento', fetchFn: NotificacaoService.getEncerramentoOptions, loaded: false, loading: false },
    { key: 'estabelecimentos', name: 'Estabelecimentos', fetchFn: NotificacaoService.getEstabelecimentoOptions, loaded: false, loading: false },
    { 
      key: 'cbos', 
      name: 'CBOs/Profissões', 
      fetchFn: async () => {
        try {
          const server = import.meta.env.VITE_API_SERVER;
          const port = import.meta.env.VITE_API_PORT;
          const response = await fetch(`${server}:${port}/api/tipo-cbo?limit=5000`);
          const data = await response.json();
          return data?.data || data || [];
        } catch (error) {
          console.error('Erro ao buscar CBOs:', error);
          return [];
        }
      }, 
      loaded: false, 
      loading: false 
    },    { 
      key: 'lista-sindromica', 
      name: 'Lista Sindrômica', 
      fetchFn: async () => {
        try {
          const server = import.meta.env.VITE_API_SERVER;
          const port = import.meta.env.VITE_API_PORT;
          // NOVO: rota que retorna todas as hipóteses com seus sintomas
          const response = await fetch(`${server}:${port}/api/lista-sindromica/all`);
          if (!response.ok) {
            throw new Error(`Status HTTP ${response.status}`);
          }
          // Esperamos receber um JSON no formato:
          // [ { id, hipotese, sintomas: [ { id, sintoma }, ... ] }, ... ]
          const todasHipoteses: Array<{
            id: number;
            hipotese: string;
            sintomas: Array<{ id: number; sintoma: string }>;
          }> = await response.json();
          return todasHipoteses;
        } catch (error) {
          console.warn('Falha ao baixar lista sindrômica completa:', error);
          return [];
        }
      }, 
      loaded: false, 
      loading: false 
    }
  ]);

  // Verificar quais dados já estão em cache ao carregar o componente
  useEffect(() => {
    checkCachedData();
  }, []);

  const checkCachedData = async () => {
    const updatedItems = await Promise.all(
      dataItems.map(async (item) => {
        try {
          const cachedData = await indexedDBService.getOpcoes(item.key);
          return { ...item, loaded: !!cachedData };
        } catch {
          return { ...item, loaded: false };
        }
      })
    );
    setDataItems(updatedItems);
    
    // Calcular tamanho total estimado
    const loadedCount = updatedItems.filter(item => item.loaded).length;
    setProgress((loadedCount / updatedItems.length) * 100);
  };
  const downloadAllData = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    setProgress(0);
    
    let completed = 0;
    let totalDownloaded = 0;
    const total = dataItems.length;
    
    toast.info('🔄 Iniciando download dos dados offline...');

    for (const item of dataItems) {
      if (item.loaded) {
        completed++;
        setProgress((completed / total) * 100);
        continue;
      }

      // Atualizar estado do item atual
      setDataItems(prev => prev.map(i => 
        i.key === item.key ? { ...i, loading: true, error: undefined } : i
      ));

      try {
        console.log(`📥 Baixando: ${item.name}...`);
        
        const data = await item.fetchFn();
        
        // Verificar se os dados foram recebidos
        if (data && Array.isArray(data) && data.length > 0) {
          await indexedDBService.saveOpcoes(item.key, data);
          totalDownloaded += data.length;
          
          // Marcar como carregado
          setDataItems(prev => prev.map(i => 
            i.key === item.key ? { ...i, loaded: true, loading: false } : i
          ));
          
          console.log(`✅ ${item.name}: ${data.length} registros salvos`);
        } else {
          // Tratar casos de dados vazios (não crítico para alguns tipos)
          const isOptional = ['lista-sindromica', 'cbos'].includes(item.key);
          
          if (isOptional) {
            console.warn(`⚠️ ${item.name}: Nenhum dado disponível (opcional)`);
            await indexedDBService.saveOpcoes(item.key, []);
            setDataItems(prev => prev.map(i => 
              i.key === item.key ? { ...i, loaded: true, loading: false } : i
            ));
          } else {
            throw new Error('Nenhum dado recebido');
          }
        }
        
      } catch (error) {
        console.error(`❌ Erro ao baixar ${item.name}:`, error);
        
        // Decidir se o erro é crítico ou não
        const isOptional = ['lista-sindromica'].includes(item.key);
        
        if (isOptional) {
          // Para dados opcionais, marcar como "carregado" mesmo com erro
          console.warn(`⚠️ ${item.name} não pôde ser baixado (opcional, continuando...)`);
          await indexedDBService.saveOpcoes(item.key, []);
          setDataItems(prev => prev.map(i => 
            i.key === item.key ? { ...i, loaded: true, loading: false } : i
          ));
        } else {
          // Para dados críticos, marcar erro
          setDataItems(prev => prev.map(i => 
            i.key === item.key ? { 
              ...i, 
              loading: false, 
              error: error instanceof Error ? error.message : 'Erro desconhecido' 
            } : i
          ));
        }
      }

      completed++;
      setProgress((completed / total) * 100);
      
      // Pequena pausa para não sobrecarregar o servidor
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setTotalSize(totalDownloaded);
    setIsDownloading(false);
    
    const successCount = dataItems.filter(item => item.loaded).length;
    const errorCount = total - successCount;
    
    if (errorCount === 0) {
      toast.success(`🎉 Todos os dados baixados! ${totalDownloaded.toLocaleString()} registros salvos offline.`);
      onDataLoaded?.();
    } else {
      const criticalErrors = dataItems.filter(item => 
        item.error && !['lista-sindromica'].includes(item.key)
      ).length;
      
      if (criticalErrors === 0) {
        toast.success(`✅ Dados essenciais baixados! ${totalDownloaded.toLocaleString()} registros offline. ${errorCount} opcionais falharam.`);
        onDataLoaded?.();
      } else {
        toast.warning(`⚠️ ${successCount}/${total} conjuntos baixados. ${criticalErrors} críticos com erro.`);
      }
    }
  };

  const clearOfflineData = async () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados offline? Você precisará baixá-los novamente.')) {
      try {
        for (const item of dataItems) {
          await indexedDBService.saveOpcoes(item.key, []);
        }
        
        setDataItems(prev => prev.map(item => ({ ...item, loaded: false, error: undefined })));
        setProgress(0);
        setTotalSize(0);
        
        toast.success('🗑️ Dados offline limpos com sucesso!');
      } catch (error) {
        toast.error('Erro ao limpar dados offline');
      }
    }
  };

  const loadedCount = dataItems.filter(item => item.loaded).length;
  const totalCount = dataItems.length;
  const isFullyLoaded = loadedCount === totalCount;
  const hasErrors = dataItems.some(item => item.error);

  return (
    <div className={`relative ${className}`}>
      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
          isFullyLoaded 
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
            : hasErrors
            ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
            : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
        }`}
        title={isFullyLoaded ? 'Dados offline prontos' : 'Clique para baixar dados offline'}
      >
        {isDownloading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : isFullyLoaded ? (
          <Check className="h-4 w-4" />
        ) : hasErrors ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        
        <span className="text-sm font-medium">
          {isDownloading 
            ? `Baixando... ${Math.round(progress)}%`
            : isFullyLoaded 
            ? 'Dados Offline Prontos'
            : `Baixar Dados (${loadedCount}/${totalCount})`
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
                ×
              </button>
            </div>

            {/* Barra de progresso */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Progresso: {loadedCount}/{totalCount}
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isFullyLoaded ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Lista de itens */}
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {dataItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <div className="flex items-center space-x-2">
                    {item.loading ? (
                      <Loader className="h-4 w-4 animate-spin text-blue-500" />
                    ) : item.loaded ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : item.error ? (
                      <div title={item.error}>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    ) : (
                      <Database className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botões de ação */}
            <div className="flex space-x-2">
              <button
                onClick={downloadAllData}
                disabled={isDownloading}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isDownloading
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
                    <span>Baixar Todos</span>
                  </>
                )}
              </button>

              {(loadedCount > 0 || totalSize > 0) && (
                <button
                  onClick={clearOfflineData}
                  disabled={isDownloading}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Informações adicionais */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Wifi className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Como funciona:</p>
                  <ul className="space-y-1 text-blue-600">
                    <li>• Baixa todas as opções de dropdowns</li>
                    <li>• Salva no seu dispositivo para uso offline</li>
                    <li>• Formulários funcionam sem internet</li>
                    <li>• Dados são sincronizados quando voltar online</li>
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
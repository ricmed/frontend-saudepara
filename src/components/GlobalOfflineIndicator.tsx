import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2,
  X,
  Settings,
  Download,
  Clock,
  Zap
} from 'lucide-react';
import { useOfflineSystem } from '@/hooks/useOfflineSystem';

interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timeout?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}

const GlobalOfflineIndicator: React.FC = () => {
  const {
    isOnline,
    stats,
    pendingData,
    syncing,
    needsEssentialData,
    downloadEssentialData,
    syncPendingData,
    getOfflineStatusMessage
  } = useOfflineSystem();

  const [showDetails, setShowDetails] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [lastConnectionState, setLastConnectionState] = useState(isOnline);

  // Gerenciar notificações automáticas
  useEffect(() => {
    // Detectar mudanças de conexão
    if (lastConnectionState !== isOnline) {
      if (isOnline) {
        // Ficou online
        addNotification({
          id: 'connection-restored',
          type: 'success',
          title: 'Conexão Restaurada',
          message: 'Internet reconectada! Sincronizando dados...',
          timeout: 3000
        });
        
        // Auto-sync quando voltar online
        if (pendingData.total > 0) {
          setTimeout(() => syncPendingData(), 1000);
        }
      } else {
        // Ficou offline
        if (needsEssentialData()) {
          addNotification({
            id: 'offline-no-data',
            type: 'error',
            title: 'Offline - Dados Ausentes',
            message: 'Você está offline e não possui dados essenciais.',
            actions: [
              {
                label: 'Configurar',
                action: () => window.open('/offline-management', '_blank'),
                primary: true
              }
            ]
          });
        } else {
          addNotification({
            id: 'offline-ready',
            type: 'warning',
            title: 'Modo Offline',
            message: 'Você está offline. Usando dados em cache.',
            timeout: 5000
          });
        }
      }
      setLastConnectionState(isOnline);
    }
  }, [isOnline, lastConnectionState, needsEssentialData, pendingData.total, syncPendingData]);

  const addNotification = (notification: Omit<ToastNotification, 'id'> & { id?: string }) => {
    const id = notification.id || Date.now().toString();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    if (notification.timeout) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.timeout);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getStatusColor = () => {
    if (!isOnline && needsEssentialData()) return 'bg-red-500';
    if (!isOnline) return 'bg-orange-500';
    if (pendingData.total > 0) return 'bg-blue-500';
    if (syncing) return 'bg-purple-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (syncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (pendingData.total > 0) return <Clock className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const handleQuickAction = async () => {
    if (!isOnline && needsEssentialData()) {
      // Redirecionar para página de configuração
      window.open('/offline-management', '_blank');
    } else if (isOnline && pendingData.total > 0) {
      // Sincronizar dados pendentes
      await syncPendingData();
    } else if (!isOnline && !needsEssentialData()) {
      // Mostrar detalhes do cache
      setShowDetails(!showDetails);
    }
  };

  // Não mostrar se tudo está perfeito
  const shouldShow = !isOnline || pendingData.total > 0 || syncing || needsEssentialData();

  if (!shouldShow && notifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Indicador principal */}
      {shouldShow && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex flex-col items-end space-y-2">
            {/* Card principal */}
            <div 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white cursor-pointer transition-all ${getStatusColor()}`}
              onClick={() => setShowDetails(!showDetails)}
            >
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {syncing ? 'Sincronizando...' : getOfflineStatusMessage()}
                </div>
                {pendingData.total > 0 && (
                  <div className="text-xs opacity-90">
                    {pendingData.notificacoes} notificações, {pendingData.pacientes} pacientes
                  </div>
                )}
              </div>
              
              {/* Contador de pendências */}
              {pendingData.total > 0 && (
                <div className="bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs font-bold">
                  {pendingData.total}
                </div>
              )}

              {/* Botão de ação rápida */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickAction();
                }}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1 transition-colors"
              >
                {!isOnline && needsEssentialData() ? (
                  <Download className="h-4 w-4" />
                ) : pendingData.total > 0 ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Painel de detalhes expandido */}
            {showDetails && (
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Status do Sistema</h3>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
                  {/* Status da conexão */}
                  <div className={`p-3 rounded-lg ${
                    isOnline ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isOnline ? (
                        <Wifi className="h-4 w-4 text-green-600" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        isOnline ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      isOnline ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isOnline 
                        ? 'Conectado à internet' 
                        : 'Sem conexão - usando dados em cache'
                      }
                    </p>
                  </div>

                  {/* Dados offline */}
                  {stats && (
                    <div className="p-3 rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-700">Dados Offline</span>
                      </div>
                      <div className="space-y-2 text-sm text-blue-600">
                        <div className="flex justify-between">
                          <span>Carregados:</span>
                          <span>{stats.loadedSources}/{stats.totalSources}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Registros:</span>
                          <span>{stats.totalRecords.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${stats.percentage}%` }}
                          />
                        </div>
                        <div className="text-center">{stats.percentage}% completo</div>
                      </div>
                    </div>
                  )}

                  {/* Dados pendentes */}
                  {pendingData.total > 0 && (
                    <div className="p-3 rounded-lg bg-orange-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-700">
                          Aguardando Sincronização
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-orange-600">
                        <div className="flex justify-between">
                          <span>Notificações:</span>
                          <span>{pendingData.notificacoes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pacientes:</span>
                          <span>{pendingData.pacientes}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ações disponíveis */}
                  <div className="space-y-2">
                    {needsEssentialData() && (
                      <button
                        onClick={async () => {
                          setShowDetails(false);
                          await downloadEssentialData();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Zap className="h-4 w-4" />
                        Baixar Dados Essenciais
                      </button>
                    )}

                    {isOnline && pendingData.total > 0 && (
                      <button
                        onClick={async () => {
                          setShowDetails(false);
                          await syncPendingData();
                        }}
                        disabled={syncing}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                      </button>
                    )}

                    <Link
                      to="/offline-management"
                      onClick={() => setShowDetails(false)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Gerenciar Dados Offline
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notificações toast */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`max-w-sm bg-white rounded-lg shadow-lg border-l-4 ${
                notification.type === 'success' ? 'border-green-500' :
                notification.type === 'warning' ? 'border-yellow-500' :
                notification.type === 'error' ? 'border-red-500' :
                'border-blue-500'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                    {notification.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    {notification.type === 'info' && <Database className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    {notification.actions && (
                      <div className="mt-3 space-x-2">
                        {notification.actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              action.action();
                              removeNotification(notification.id);
                            }}
                            className={`text-sm px-3 py-1 rounded ${
                              action.primary
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default GlobalOfflineIndicator;
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  syncing: boolean;
  pendingCount: number;
  onSync: () => void;
  offlineDataStatus?: {
    hasEssentialData: boolean;
    totalItems: number;
    loadedItems: number;
    hasErrors: boolean;
  };
}

export function OfflineIndicator({ 
  isOnline, 
  syncing, 
  pendingCount, 
  onSync,
  offlineDataStatus 
}: OfflineIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [connectionHistory, setConnectionHistory] = useState<{timestamp: Date, isOnline: boolean}[]>([]);
  
  // Registrar mudanças de conexão
  useEffect(() => {
    setConnectionHistory(prev => [
      { timestamp: new Date(), isOnline },
      ...prev.slice(0, 4) // Manter apenas os últimos 5 eventos
    ]);
  }, [isOnline]);

  // Determinar se deve mostrar o indicador
  const shouldShow = !isOnline || pendingCount > 0 || syncing || 
    (offlineDataStatus && (!offlineDataStatus.hasEssentialData || offlineDataStatus.hasErrors));

  if (!shouldShow) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      if (offlineDataStatus?.hasEssentialData) {
        return {
          color: 'bg-orange-500',
          icon: <Database className="h-4 w-4" />,
          text: 'Offline - Dados em cache',
          description: 'Funcionando com dados offline'
        };
      } else {
        return {
          color: 'bg-red-500',
          icon: <XCircle className="h-4 w-4" />,
          text: 'Offline - Sem dados',
          description: 'Dados essenciais não disponíveis'
        };
      }
    }
    
    if (syncing) {
      return {
        color: 'bg-blue-500',
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        text: 'Sincronizando...',
        description: `${pendingCount} item(s) sendo enviado(s)`
      };
    }
    
    if (pendingCount > 0) {
      return {
        color: 'bg-orange-500',
        icon: <AlertTriangle className="h-4 w-4" />,
        text: `${pendingCount} pendente(s)`,
        description: 'Dados aguardando sincronização'
      };
    }
    
    if (offlineDataStatus?.hasErrors) {
      return {
        color: 'bg-yellow-500',
        icon: <AlertTriangle className="h-4 w-4" />,
        text: 'Dados com problemas',
        description: 'Alguns dados offline com erro'
      };
    }
    
    return {
      color: 'bg-green-500',
      icon: <CheckCircle className="h-4 w-4" />,
      text: 'Online',
      description: 'Tudo funcionando normalmente'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-white transition-all duration-300 cursor-pointer ${statusInfo.color}`}
        onClick={() => setShowDetails(!showDetails)}
        title={statusInfo.description}
      >
        {statusInfo.icon}

        <span className="text-sm font-medium">
          {statusInfo.text}
        </span>

        {/* Indicador de conexão */}
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
        </div>

        {/* Botão de sync (apenas quando online e há pendências) */}
        {isOnline && pendingCount > 0 && !syncing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSync();
            }}
            className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
            title="Sincronizar agora"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Painel de detalhes expandido */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Status da Conexão
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Status atual */}
            <div className={`p-3 rounded-lg mb-4 ${
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
                  {isOnline ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <p className={`text-sm ${
                isOnline ? 'text-green-600' : 'text-red-600'
              }`}>
                {statusInfo.description}
              </p>
            </div>

            {/* Status dos dados offline */}
            {offlineDataStatus && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Dados Offline</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Dados carregados:</span>
                    <span>{offlineDataStatus.loadedItems}/{offlineDataStatus.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dados essenciais:</span>
                    <span className={offlineDataStatus.hasEssentialData ? 'text-green-600' : 'text-red-600'}>
                      {offlineDataStatus.hasEssentialData ? '✓ Disponíveis' : '✗ Ausentes'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={offlineDataStatus.hasErrors ? 'text-yellow-600' : 'text-green-600'}>
                      {offlineDataStatus.hasErrors ? 'Com erros' : 'OK'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Dados pendentes */}
            {pendingCount > 0 && (
              <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-orange-700">
                    Dados Pendentes: {pendingCount}
                  </h4>
                  {isOnline && !syncing && (
                    <button
                      onClick={onSync}
                      className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
                    >
                      Sincronizar
                    </button>
                  )}
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  {syncing 
                    ? 'Enviando dados para o servidor...' 
                    : 'Dados salvos localmente aguardando envio'
                  }
                </p>
              </div>
            )}

            {/* Histórico de conexão */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Histórico Recente</h4>
              <div className="space-y-1">
                {connectionHistory.map((event, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {event.isOnline ? (
                      <Wifi className="h-3 w-3 text-green-500" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-red-500" />
                    )}
                    <span className={event.isOnline ? 'text-green-600' : 'text-red-600'}>
                      {event.isOnline ? 'Conectou' : 'Desconectou'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dicas de uso offline */}
            {!isOnline && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-700 mb-2">Modo Offline</h4>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Você pode continuar preenchendo formulários</li>
                  <li>• Dados serão salvos localmente</li>
                  <li>• Sincronização automática quando voltar online</li>
                  {!offlineDataStatus?.hasEssentialData && (
                    <li className="text-red-600">• ⚠️ Baixe os dados offline primeiro</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
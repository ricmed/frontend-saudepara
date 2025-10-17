import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import syncService from '@/services/syncService';

/**
 * Componente de Toggle para Modo Offline Forçado
 * Similar ao Spotify - permite trabalhar offline mesmo com internet
 */
const OfflineModeToggle: React.FC = () => {
  const [isOfflineForced, setIsOfflineForced] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    // Carregar estado inicial
    const forced = syncService.isOfflineModeActive();
    setIsOfflineForced(forced);

    // Monitorar mudanças de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleToggle = async () => {
    setIsToggling(true);
    
    try {
      const wasOnline = await syncService.toggleOfflineMode();
      setIsOfflineForced(!wasOnline);
    } catch (error) {
      console.error('Erro ao alternar modo offline:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const getStatusInfo = () => {
    if (isOfflineForced) {
      return {
        color: 'orange',
        text: 'Offline',
        description: 'Modo offline ativado (manual)',
        icon: WifiOff
      };
    }
    
    if (!isOnline) {
      return {
        color: 'red',
        text: 'Offline',
        description: 'Sem conexão de internet',
        icon: WifiOff
      };
    }
    
    return {
      color: 'green',
      text: 'Online',
      description: 'Conectado',
      icon: Wifi
    };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-2">
      {/* Indicador de Status */}
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          status.color === 'green' ? 'bg-green-100 text-green-700' :
          status.color === 'orange' ? 'bg-orange-100 text-orange-700' :
          'bg-red-100 text-red-700'
        }`}
        title={status.description}
      >
        <StatusIcon className="h-4 w-4" />
        <span className="text-sm font-medium hidden sm:inline">{status.text}</span>
      </div>

      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className={`p-2 rounded-lg transition-colors ${
          isOfflineForced
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isOfflineForced ? 'Clique para ativar modo online' : 'Clique para ativar modo offline'}
      >
        {isToggling ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : isOfflineForced ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

export default OfflineModeToggle;

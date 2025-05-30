import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, FileText, Users } from 'lucide-react';
import syncService from '@/services/syncService';

interface ConnectionStatusProps {
  showForceSync?: boolean;
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showForceSync = true,
  className = ''
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState({ notificacoes: 0, pacientes: 0 });
  
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
  // *** ADICIONAR CONTADOR DE PENDENTES ***
  useEffect(() => {
    const updateCount = async () => {
      try {
        const count = await syncService.getPendingCount();
        setPendingCount(count);
      } catch (error) {
        console.error('Erro ao atualizar contador:', error);
      }
    };

    updateCount();
    const interval = setInterval(updateCount, 10000); // A cada 10s
    return () => clearInterval(interval);
  }, []);
  
  const handleForceSync = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncService.forceSyncData();
      // Atualizar contador após sync
      const count = await syncService.getPendingCount();
      setPendingCount(count);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalPending = pendingCount.notificacoes + pendingCount.pacientes;

  // *** MELHORAR A EXIBIÇÃO ***
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        color: 'bg-red-50 text-red-700 border-red-200',
        text: 'Modo Offline - Dados salvos localmente'
      };
    }
    
    if (isSyncing) {
      return {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        text: 'Sincronizando dados...'
      };
    }
    
    if (totalPending > 0) {
      return {
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        text: `${totalPending} registro(s) aguardando sincronização`
      };
    }
    
    return {
      color: 'bg-green-50 text-green-700 border-green-200',
      text: 'Todos os dados sincronizados'
    };
  };

  const statusInfo = getStatusInfo();

  // Não mostrar se online e sem pendentes
  if (isOnline && totalPending === 0 && !isSyncing) {
    return null;
  }
    return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 mb-4 border ${className} ${statusInfo.color}`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        
        <span className="text-sm font-medium">{statusInfo.text}</span>
        
        {isSyncing && <RefreshCw className="h-4 w-4 animate-spin" />}
      </div>

      <div className="flex items-center gap-3">
        {/* *** MOSTRAR CONTADORES DETALHADOS *** */}
        {totalPending > 0 && (
          <div className="flex items-center gap-3 text-xs">
            {pendingCount.pacientes > 0 && (
              <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded">
                <Users className="h-3 w-3" />
                {pendingCount.pacientes} paciente(s)
              </span>
            )}
            {pendingCount.notificacoes > 0 && (
              <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded">
                <FileText className="h-3 w-3" />
                {pendingCount.notificacoes} ficha(s)
              </span>
            )}
          </div>
        )}

        {showForceSync && isOnline && totalPending > 0 && !isSyncing && (
          <button 
            onClick={handleForceSync} 
            className="px-3 py-1 bg-white/70 hover:bg-white/90 rounded text-xs transition-colors flex items-center gap-1"
            title="Sincronizar dados"
          >
            <RefreshCw className="h-3 w-3" />
            Sincronizar
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
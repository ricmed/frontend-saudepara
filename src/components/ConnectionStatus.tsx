import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
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
  
  const handleForceSync = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncService.forceSyncData();
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div className={`flex items-center rounded-lg px-3 py-1.5 ${className} ${
      isOnline ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
    }`}>
      {isOnline ? (
        <Wifi className="h-4 w-4 mr-2" />
      ) : (
        <WifiOff className="h-4 w-4 mr-2" />
      )}
      
      <span className="text-sm font-medium">
        {isOnline ? 'Online' : 'Offline - Dados serão salvos localmente'}
      </span>
      
      {showForceSync && isOnline && (
        <button 
          onClick={handleForceSync} 
          disabled={isSyncing}
          className="ml-2 p-1 rounded hover:bg-green-100 transition-colors"
          title="Sincronizar dados"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
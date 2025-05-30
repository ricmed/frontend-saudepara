import React from 'react';
import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  syncing: boolean;
  pendingCount: number;
  onSync: () => void;
}

export function OfflineIndicator({ isOnline, syncing, pendingCount, onSync }: OfflineIndicatorProps) {
  if (isOnline && pendingCount === 0 && !syncing) {
    return null; // Não mostrar nada quando tudo estiver normal
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
        !isOnline 
          ? 'bg-red-500 text-white' 
          : pendingCount > 0 
            ? 'bg-orange-500 text-white'
            : 'bg-green-500 text-white'
      }`}>
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}

        <span className="text-sm font-medium">
          {!isOnline 
            ? 'Offline' 
            : syncing 
              ? 'Sincronizando...'
              : pendingCount > 0
                ? `${pendingCount} pendente(s)`
                : 'Online'
          }
        </span>

        {!isOnline && (
          <Database className="h-4 w-4" />
        )}

        {isOnline && pendingCount > 0 && !syncing && (
          <button
            onClick={onSync}
            className="ml-2 p-1 hover:bg-white/20 rounded"
            title="Sincronizar agora"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        )}

        {syncing && (
          <RefreshCw className="h-4 w-4 animate-spin" />
        )}
      </div>
    </div>
  );
}
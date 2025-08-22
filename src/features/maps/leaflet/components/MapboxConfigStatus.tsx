import React from 'react';
import { CheckCircle, Key, Globe } from 'lucide-react';

export const MapboxConfigStatus: React.FC = () => {
  const mapboxApiKey = localStorage.getItem('mapbox-api-key');
  const hasMapboxKey = !!(mapboxApiKey && mapboxApiKey.trim());

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-full ${hasMapboxKey ? 'bg-green-100' : 'bg-gray-100'}`}>
          {hasMapboxKey ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Key className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <h3 className="font-semibold text-gray-800">Status do Mapbox</h3>
      </div>

      {hasMapboxKey ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Mapbox configurado e disponível</span>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-600 mb-1">API Key configurada:</div>
            <div className="font-mono text-xs text-green-700 break-all">
              {mapboxApiKey?.substring(0, 20)}...{mapboxApiKey?.substring(mapboxApiKey.length - 10)}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="w-4 h-4" />
            <span>Pronto para usar mapas premium do Mapbox</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-500">
            <Key className="w-4 h-4" />
            <span className="text-sm">Mapbox não configurado</span>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600">
              Configure uma API key do Mapbox para acessar mapas premium
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

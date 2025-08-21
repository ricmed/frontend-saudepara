import React, { useState } from 'react';
import { Key, Save, AlertCircle } from 'lucide-react';

interface MapboxConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey?: string;
}

export const MapboxConfigModal: React.FC<MapboxConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentApiKey = ''
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    
    setIsValidating(true);
    
    // Simula validação da API key
    setTimeout(() => {
      onSave(apiKey.trim());
      setIsValidating(false);
      onClose();
    }, 1000);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <Key className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Configurar Mapbox
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key do Mapbox
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="pk.eyJ1Ijoia..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Como obter sua API key:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Acesse <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">mapbox.com</a></li>
                  <li>Faça login ou crie uma conta</li>
                  <li>Vá em "Access tokens"</li>
                  <li>Copie sua "Default public token"</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() || isValidating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Validando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Sua API key será armazenada localmente no seu navegador
          </div>
        </div>
      </div>
    </div>
  );
};

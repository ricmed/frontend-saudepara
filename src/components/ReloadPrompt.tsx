import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface VersionInfo {
  version: string;
  title: string;
  message: string;
}

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    if (needRefresh) {
      // Busca as informações da nova versão
      fetch('/version.json?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => setVersionInfo(data))
        .catch(err => console.error('Erro ao buscar info da versão:', err));
    }
  }, [needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="ReloadPrompt-container">
      { (offlineReady || needRefresh) && (
        <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] max-w-sm animate-fade-in-up flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              {needRefresh ? (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">
                {offlineReady 
                  ? 'Pronto para uso offline' 
                  : (versionInfo?.title || 'Atualização Disponível')}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {offlineReady 
                  ? 'O aplicativo foi salvo para uso sem internet.' 
                  : (versionInfo?.message || 'Uma nova versão do aplicativo está disponível. Atualize para ter acesso às últimas melhorias.')}
              </p>
              {needRefresh && versionInfo?.version && (
                <p className="mt-1 text-xs text-gray-500 font-mono">
                  Versão: {versionInfo.version}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 justify-end mt-1">
            { needRefresh && (
              <button 
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                onClick={() => updateServiceWorker(true)}
              >
                Atualizar Agora
              </button>
            )}
            <button 
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
              onClick={() => close()}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReloadPrompt;

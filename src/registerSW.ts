import { registerSW } from 'virtual:pwa-register';
import { toast } from 'react-toastify';
import React from 'react';
import { clearRefetchableClientCaches } from '@/services/appBuildCachePolicy';

export function registerServiceWorker() {
  // Verificar se o browser suporta Service Worker
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não é suportado neste navegador');
    return;
  }

  // Função para criar o toast de atualização
  const createUpdateToast = (updateSW: (reloadPage?: boolean) => Promise<void>) => {
    // Criar o toast e salvar o ID
    const toastId = toast.info('Nova versão disponível', {
      position: 'bottom-center',
      autoClose: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      closeButton: false,
      bodyClassName: 'text-sm',
      className: 'border border-blue-300',
      style: { minWidth: '300px' },
      render: () => (
        React.createElement('div', { className: 'flex flex-col space-y-2' }, 
          React.createElement('div', { className: 'font-medium' }, 'Nova versão disponível'),
          React.createElement('div', null, 'Atualize para obter as melhorias mais recentes'),
          React.createElement('div', { className: 'flex space-x-2 pt-2' },
            React.createElement('button', {
              onClick: () => {
                void (async () => {
                  await clearRefetchableClientCaches();
                  await updateSW(true);
                  toast.dismiss(toastId);
                })();
              },
              className: 'flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700'
            }, 'Atualizar'),
            React.createElement('button', {
              onClick: () => toast.dismiss(toastId),
              className: 'px-3 py-1.5 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300'
            }, 'Depois')
          )
        )
      )
    });
    return toastId;
  };

  // Registrar o Service Worker
  const updateSW = registerSW({
    // Callback quando uma atualização está disponível
    onNeedRefresh() {
      createUpdateToast(updateSW);
    },
    
    // Callback quando o app está pronto para uso offline
    onOfflineReady() {
      toast.success('Aplicativo pronto para uso offline', {
        icon: '📱',
      });
    },
    
    // Callback quando o Service Worker é registrado com sucesso
    onRegistered(registration) {
      console.log('Service Worker registrado com sucesso:', registration);
      
      // Configurar verificação periódica de atualizações
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // A cada 1 hora
      }
    },
    
    // Callback em caso de erro no registro
    onRegisterError(error) {
      console.error('Erro ao registrar Service Worker:', error);
    }
  });
}
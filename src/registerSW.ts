import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  // Em E2E/CI, o service worker pode causar cache/intercept e travar testes.
  // Usamos flag de build para desabilitar quando necessário.
  const disableSw = (import.meta as any).env?.VITE_DISABLE_SW === 'true';
  if (disableSw) return;

  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não é suportado neste navegador');
    return;
  }

  const updateSW = registerSW({
    onNeedRefresh() {
      const shouldUpdate = window.confirm(
        'Uma nova versão do aplicativo está disponível. Deseja atualizar agora?'
      );
      if (shouldUpdate) {
        void updateSW(true);
      }
    },

    onOfflineReady() {
      // Sem toast — uso offline segue disponível sem aviso na tela.
    },

    onRegistered(registration) {
      console.log('Service Worker registrado com sucesso:', registration);

      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },

    onRegisterError(error) {
      console.error('Erro ao registrar Service Worker:', error);
    },
  });
}

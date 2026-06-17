import { registerSW } from 'virtual:pwa-register';

const SW_UPDATE_INTERVAL_MS = 15 * 60 * 1000;

export function registerServiceWorker() {
  // Em E2E/CI, o service worker pode causar cache/intercept e travar testes.
  const disableSw = (import.meta as any).env?.VITE_DISABLE_SW === 'true';
  if (disableSw) return;

  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não é suportado neste navegador');
    return;
  }

  // registerType: 'autoUpdate' no vite.config — sem onNeedRefresh o app recarrega sozinho
  // quando há nova versão (skipWaiting + clientsClaim já estão no Workbox).
  registerSW({
    immediate: true,

    onOfflineReady() {
      // Uso offline disponível; sem toast para não poluir a tela.
    },

    onRegistered(registration) {
      if (!registration) return;

      console.log('Service Worker registrado:', registration.scope);

      const checkForUpdates = () => {
        registration.update().catch(() => undefined);
      };

      // Ao registrar, ao focar a aba e ao voltar à página visível
      checkForUpdates();

      const onVisible = () => {
        if (document.visibilityState === 'visible') {
          checkForUpdates();
        }
      };

      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('focus', checkForUpdates);

      window.setInterval(checkForUpdates, SW_UPDATE_INTERVAL_MS);
    },

    onRegisterError(error) {
      console.error('Erro ao registrar Service Worker:', error);
    },
  });
}

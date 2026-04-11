import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não é suportado neste navegador');
    return;
  }

  registerSW({
    onNeedRefresh() {
      // Sem UI: com registerType "autoUpdate" no Vite o SW costuma ativar sozinho;
      // evitamos toast/botão "Atualizar".
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

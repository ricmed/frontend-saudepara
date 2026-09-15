import type { ModoLocalidadeEvento } from '@/features/notificationForms/types/index2';

const channelName = (channelId: string) => `comunicacao-caso-print:${channelId}`;

export type ComunicacaoCasoPrintPayload = {
  data: Record<string, string>;
  modoLocalidadeEvento: ModoLocalidadeEvento;
  isSaire: boolean;
  eventoNome: string;
  returnPath: string;
};

type ComunicacaoCasoPrintMessage =
  | { type: 'COMUNICACAO_CASO_PRINT_READY' }
  | { type: 'COMUNICACAO_CASO_PRINT_DATA'; payload: ComunicacaoCasoPrintPayload };

export function relayComunicacaoCasoPrintData(
  channelId: string,
  getPayload: () => ComunicacaoCasoPrintPayload,
  lifetimeMs = 20_000,
): () => void {
  const bc = new BroadcastChannel(channelName(channelId));
  bc.onmessage = (event: MessageEvent<ComunicacaoCasoPrintMessage>) => {
    if (event.data?.type === 'COMUNICACAO_CASO_PRINT_READY') {
      bc.postMessage({
        type: 'COMUNICACAO_CASO_PRINT_DATA',
        payload: getPayload(),
      } satisfies ComunicacaoCasoPrintMessage);
    }
  };
  const timer = window.setTimeout(() => bc.close(), lifetimeMs);
  return () => {
    window.clearTimeout(timer);
    bc.close();
  };
}

export function waitForComunicacaoCasoPrintData(
  channelId: string,
  timeoutMs = 8_000,
): Promise<ComunicacaoCasoPrintPayload | null> {
  return new Promise((resolve) => {
    const bc = new BroadcastChannel(channelName(channelId));
    let settled = false;

    const finish = (payload: ComunicacaoCasoPrintPayload | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      bc.close();
      resolve(payload);
    };

    const timer = window.setTimeout(() => finish(null), timeoutMs);

    bc.onmessage = (event: MessageEvent<ComunicacaoCasoPrintMessage>) => {
      if (event.data?.type === 'COMUNICACAO_CASO_PRINT_DATA' && event.data.payload) {
        finish(event.data.payload);
      }
    };

    bc.postMessage({ type: 'COMUNICACAO_CASO_PRINT_READY' } satisfies ComunicacaoCasoPrintMessage);
  });
}

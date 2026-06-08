const channelName = (channelId: string) => `ficha-print:${channelId}`;

export type FichaPrintMessage =
  | { type: 'FICHA_PRINT_READY' }
  | { type: 'FICHA_PRINT_DATA'; formData: Record<string, unknown> };

export function relayFichaPrintData(
  channelId: string,
  getFormData: () => Record<string, unknown>,
  lifetimeMs = 20_000,
): () => void {
  const bc = new BroadcastChannel(channelName(channelId));
  bc.onmessage = (event: MessageEvent<FichaPrintMessage>) => {
    if (event.data?.type === 'FICHA_PRINT_READY') {
      bc.postMessage({
        type: 'FICHA_PRINT_DATA',
        formData: getFormData(),
      } satisfies FichaPrintMessage);
    }
  };
  const timer = window.setTimeout(() => bc.close(), lifetimeMs);
  return () => {
    window.clearTimeout(timer);
    bc.close();
  };
}

export function waitForFichaPrintData(
  channelId: string,
  timeoutMs = 8_000,
): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    const bc = new BroadcastChannel(channelName(channelId));
    let settled = false;

    const finish = (data: Record<string, unknown> | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      bc.close();
      resolve(data);
    };

    const timer = window.setTimeout(() => finish(null), timeoutMs);

    bc.onmessage = (event: MessageEvent<FichaPrintMessage>) => {
      if (event.data?.type === 'FICHA_PRINT_DATA' && event.data.formData != null) {
        finish(event.data.formData);
      }
    };

    bc.postMessage({ type: 'FICHA_PRINT_READY' } satisfies FichaPrintMessage);
  });
}

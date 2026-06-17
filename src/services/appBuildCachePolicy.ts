const STORAGE_KEY = 'saudepa_app_build_id';

/**
 * Remove entradas da Cache API (Workbox: api-tipos-cache, precache, etc.).
 * Equivale à parte "cache storage" de "Clear site data", sem apagar IndexedDB da fila offline.
 */
export async function clearWorkboxRuntimeCaches(): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    if (keys.length > 0) {
      console.info('[app-cache] Cache API (Workbox) limpo:', keys.length, 'bucket(s)');
    }
  } catch (e) {
    console.warn('[app-cache] Falha ao limpar Cache API:', e);
  }
}

/**
 * Workbox + stores refetcháveis no IndexedDB (opções, CPF/CNES em cache).
 * Não remove notificações, DAE offline, anexos pendentes.
 */
export async function clearRefetchableClientCaches(): Promise<void> {
  await clearWorkboxRuntimeCaches();
  try {
    const { default: indexedDBService } = await import('@/services/indexedDB');
    await indexedDBService.clearRefetchableCachesOnly();
  } catch (e) {
    console.warn('[app-cache] Falha ao limpar IndexedDB refetchável:', e);
  }
}

/**
 * Em builds de produção/preview, se o identificador do build mudou desde a última visita,
 * limpa Cache API + catálogos locais no IndexedDB — alinhado ao que você fazia manualmente
 * (unregister SW + clear site data), exceto pela fila offline.
 */
export async function runIndexedDbCachePolicyIfNewBuild(): Promise<void> {
  if (import.meta.env.DEV) return;

  const current = import.meta.env.VITE_APP_BUILD_ID;
  if (!current || typeof current !== 'string') return;

  const previous = localStorage.getItem(STORAGE_KEY);
  if (previous === current) return;

  try {
    await clearRefetchableClientCaches();
    localStorage.setItem(STORAGE_KEY, current);
    console.info('[app-build] Caches do cliente alinhados à versão:', current);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cache-updated'));
    }
  } catch (e) {
    console.warn('[app-build] Política de cache pós-deploy ignorada:', e);
  }
}

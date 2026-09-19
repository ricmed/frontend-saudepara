const STORAGE_KEY = 'saudepa_app_build_id';
const CATALOG_KEY = 'saudepa_catalog_cache_version';

/** Subir só quando o formato do catálogo local ficar incompatível. */
export const CATALOG_CACHE_VERSION = '1';

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

export function shouldClearCatalogsOnBuild(
  previousCatalogVersion: string | null,
): boolean {
  return Boolean(
    previousCatalogVersion && previousCatalogVersion !== CATALOG_CACHE_VERSION,
  );
}

/**
 * Em builds de produção/preview, se o identificador do build mudou:
 * limpa só a Cache API do Workbox (JS/CSS).
 * Catálogos IndexedDB (gênero, raça, evento…) só zeram se
 * `CATALOG_CACHE_VERSION` mudar de propósito.
 */
export async function runIndexedDbCachePolicyIfNewBuild(): Promise<void> {
  if (import.meta.env.DEV) return;

  const current = import.meta.env.VITE_APP_BUILD_ID;
  if (!current || typeof current !== 'string') return;

  const previous = localStorage.getItem(STORAGE_KEY);
  const previousCatalogVersion = localStorage.getItem(CATALOG_KEY);
  const catalogNeedsClear = shouldClearCatalogsOnBuild(previousCatalogVersion);

  if (previous === current && !catalogNeedsClear) {
    if (!previousCatalogVersion) {
      localStorage.setItem(CATALOG_KEY, CATALOG_CACHE_VERSION);
    }
    return;
  }

  try {
    await clearWorkboxRuntimeCaches();
    if (catalogNeedsClear) {
      const { default: indexedDBService } = await import('@/services/indexedDB');
      await indexedDBService.clearRefetchableCachesOnly();
    }
    localStorage.setItem(STORAGE_KEY, current);
    localStorage.setItem(CATALOG_KEY, CATALOG_CACHE_VERSION);
    console.info('[app-build] Cache API alinhado à versão:', current);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cache-updated'));
    }
  } catch (e) {
    console.warn('[app-build] Política de cache pós-deploy ignorada:', e);
  }
}

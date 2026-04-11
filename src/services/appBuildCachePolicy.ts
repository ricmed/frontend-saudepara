const STORAGE_KEY = 'saudepa_app_build_id';

/**
 * Em builds de produção/preview, se o identificador do build mudou desde a última visita,
 * limpa caches refetcháveis no IndexedDB (opções, caches de CPF/CNES etc.) sem apagar fila offline.
 */
export async function runIndexedDbCachePolicyIfNewBuild(): Promise<void> {
  if (import.meta.env.DEV) return;

  const current = import.meta.env.VITE_APP_BUILD_ID;
  if (!current || typeof current !== 'string') return;

  const previous = localStorage.getItem(STORAGE_KEY);
  if (previous === current) return;

  try {
    const { default: indexedDBService } = await import('@/services/indexedDB');
    await indexedDBService.clearRefetchableCachesOnly();
    localStorage.setItem(STORAGE_KEY, current);
    console.info('[app-build] Catálogos locais alinhados à versão:', current);
  } catch (e) {
    console.warn('[app-build] Limpeza de cache refetchável ignorada:', e);
  }
}

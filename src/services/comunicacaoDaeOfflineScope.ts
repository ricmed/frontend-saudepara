export const COMUNICACAO_DAE_CACHE_SCOPE_VERSION = 'backend-authorized-v1';

export const AUTHENTICATED_USER_IDENTIFIER_KEY = 'sp.user.id.v1';

export interface ComunicacaoDaeCacheEnvelope {
  cacheKind: 'comunicacao-dae';
  scopeVersion: typeof COMUNICACAO_DAE_CACHE_SCOPE_VERSION;
  ownerId: string;
  encrypted: boolean;
  data: unknown;
  downloadedAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getAuthenticatedUserIdentifier(): string | null {
  try {
    const value = sessionStorage.getItem(AUTHENTICATED_USER_IDENTIFIER_KEY)?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function createComunicacaoDaeCacheEnvelope(
  ownerId: string,
  data: unknown,
  encrypted: boolean,
  downloadedAt = Date.now(),
): ComunicacaoDaeCacheEnvelope {
  return {
    cacheKind: 'comunicacao-dae',
    scopeVersion: COMUNICACAO_DAE_CACHE_SCOPE_VERSION,
    ownerId,
    encrypted,
    data,
    downloadedAt,
  };
}

export function isComunicacaoDaeCacheEnvelopeForOwner(
  value: unknown,
  ownerId: string,
): value is ComunicacaoDaeCacheEnvelope {
  if (!isRecord(value)) return false;

  return (
    value.cacheKind === 'comunicacao-dae' &&
    value.scopeVersion === COMUNICACAO_DAE_CACHE_SCOPE_VERSION &&
    value.ownerId === ownerId &&
    typeof value.encrypted === 'boolean' &&
    typeof value.downloadedAt === 'number' &&
    'data' in value
  );
}

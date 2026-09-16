/**
 * Perfil da última sessão interna, no dispositivo.
 * Não substitui cookie para a API: só evita deslogar a UI quando a rede cai.
 * PIN offline não entra neste fluxo.
 */

export const LAST_KNOWN_SESSION_KEY = 'sp.auth.last-known.session.v1';

/** Alinhado ao refresh interno (45 dias). */
export const LAST_KNOWN_TTL_MS = 45 * 24 * 60 * 60 * 1000;

export type LastKnownAuthUser = {
  id?: string;
  username?: string;
  email?: string | null;
  name?: string | null;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  groups?: string[];
  uiPalette?: string;
  [key: string]: unknown;
};

export type LastKnownAuthSession = {
  user: LastKnownAuthUser;
  savedAt: number;
  expiresAt: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isUsableAuthUser(user: unknown): user is LastKnownAuthUser {
  if (!isRecord(user)) return false;
  const id = user.id;
  const username = user.username;
  const hasId = typeof id === 'string' && id.trim().length > 0;
  const hasUsername = typeof username === 'string' && username.trim().length > 0;
  return hasId || hasUsername;
}

export function persistLastKnownUser(
  user: unknown,
  now = Date.now(),
  storage: Pick<Storage, 'setItem' | 'removeItem'> = localStorage
): LastKnownAuthSession | null {
  if (!isUsableAuthUser(user)) return null;

  // Um slot só: login novo substitui o anterior (não acumula perfis).
  storage.removeItem(LAST_KNOWN_SESSION_KEY);

  const session: LastKnownAuthSession = {
    user,
    savedAt: now,
    expiresAt: now + LAST_KNOWN_TTL_MS,
  };

  storage.setItem(LAST_KNOWN_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function readLastKnownUser(
  now = Date.now(),
  storage: Pick<Storage, 'getItem' | 'removeItem'> = localStorage
): LastKnownAuthUser | null {
  const raw = storage.getItem(LAST_KNOWN_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LastKnownAuthSession>;
    if (!isUsableAuthUser(parsed.user)) {
      storage.removeItem(LAST_KNOWN_SESSION_KEY);
      return null;
    }

    const expiresAt = Number(parsed.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= now) {
      storage.removeItem(LAST_KNOWN_SESSION_KEY);
      return null;
    }

    return parsed.user;
  } catch {
    storage.removeItem(LAST_KNOWN_SESSION_KEY);
    return null;
  }
}

export function clearLastKnownUser(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  storage.removeItem(LAST_KNOWN_SESSION_KEY);
}

/**
 * 401/403 = o servidor recusou a sessão: desloga como hoje.
 * Sem resposta, timeout, 5xx, 429 = buraco de rede / instabilidade: mantém o perfil local.
 */
export function shouldKeepLastKnownSession(error: unknown): boolean {
  const status = Number((error as { response?: { status?: number } } | undefined)?.response?.status);
  if (status === 401 || status === 403) return false;
  return true;
}

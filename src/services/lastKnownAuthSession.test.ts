import { describe, expect, it } from 'vitest';
import {
  LAST_KNOWN_SESSION_KEY,
  LAST_KNOWN_TTL_MS,
  clearLastKnownUser,
  isUsableAuthUser,
  persistLastKnownUser,
  readLastKnownUser,
  shouldKeepLastKnownSession,
} from './lastKnownAuthSession';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
    data,
  };
}

const user = { id: 'u-1', username: 'praca.saire', roles: ['notificador'] };

describe('isUsableAuthUser', () => {
  it('aceita id ou username', () => {
    expect(isUsableAuthUser({ id: '1' })).toBe(true);
    expect(isUsableAuthUser({ username: 'esf.alter' })).toBe(true);
  });

  it('rejeita vazio', () => {
    expect(isUsableAuthUser(null)).toBe(false);
    expect(isUsableAuthUser({})).toBe(false);
    expect(isUsableAuthUser({ id: '  ' })).toBe(false);
  });
});

describe('lastKnownAuthSession', () => {
  it('grava e lê o perfil dentro do prazo de 45 dias', () => {
    const storage = memoryStorage();
    const now = Date.parse('2026-09-16T12:00:00-03:00');
    persistLastKnownUser(user, now, storage);

    expect(readLastKnownUser(now + 10 * 24 * 60 * 60 * 1000, storage)).toEqual(user);
    expect(JSON.parse(storage.data[LAST_KNOWN_SESSION_KEY]).expiresAt).toBe(now + LAST_KNOWN_TTL_MS);
  });

  it('expira depois de 45 dias e limpa o storage', () => {
    const storage = memoryStorage();
    const now = Date.parse('2026-09-16T12:00:00-03:00');
    persistLastKnownUser(user, now, storage);

    expect(readLastKnownUser(now + LAST_KNOWN_TTL_MS + 1, storage)).toBeNull();
    expect(storage.data[LAST_KNOWN_SESSION_KEY]).toBeUndefined();
  });

  it('login de outro usuário substitui o perfil anterior (não mistura)', () => {
    const storage = memoryStorage();
    const now = Date.parse('2026-09-16T12:00:00-03:00');
    persistLastKnownUser({ id: 'u-a', username: 'praca.saire' }, now, storage);
    persistLastKnownUser({ id: 'u-b', username: 'esf.alter' }, now + 1000, storage);

    expect(readLastKnownUser(now + 2000, storage)).toEqual({ id: 'u-b', username: 'esf.alter' });
  });

  it('logout limpa o perfil local', () => {
    const storage = memoryStorage();
    persistLastKnownUser(user, Date.now(), storage);
    clearLastKnownUser(storage);
    expect(readLastKnownUser(Date.now(), storage)).toBeNull();
  });

  it('não grava usuário inválido', () => {
    const storage = memoryStorage();
    expect(persistLastKnownUser({}, Date.now(), storage)).toBeNull();
    expect(storage.data[LAST_KNOWN_SESSION_KEY]).toBeUndefined();
  });
});

describe('shouldKeepLastKnownSession', () => {
  it('desloga em 401/403 (sessão recusada pelo servidor)', () => {
    expect(shouldKeepLastKnownSession({ response: { status: 401 } })).toBe(false);
    expect(shouldKeepLastKnownSession({ response: { status: 403 } })).toBe(false);
  });

  it('mantém sessão local em timeout, 5xx e 429', () => {
    expect(shouldKeepLastKnownSession({ code: 'ECONNABORTED' })).toBe(true);
    expect(shouldKeepLastKnownSession({ response: { status: 500 } })).toBe(true);
    expect(shouldKeepLastKnownSession({ response: { status: 429 } })).toBe(true);
    expect(shouldKeepLastKnownSession({})).toBe(true);
  });
});

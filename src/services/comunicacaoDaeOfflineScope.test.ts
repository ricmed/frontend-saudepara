import { describe, expect, it } from 'vitest';
import {
  COMUNICACAO_DAE_CACHE_SCOPE_VERSION,
  createComunicacaoDaeCacheEnvelope,
  isComunicacaoDaeCacheEnvelopeForOwner,
} from './comunicacaoDaeOfflineScope';

describe('comunicacaoDaeOfflineScope', () => {
  it('aceita somente o cache do usuário e da versão de escopo atuais', () => {
    const cache = createComunicacaoDaeCacheEnvelope('user-a', [], false, 123);

    expect(isComunicacaoDaeCacheEnvelopeForOwner(cache, 'user-a')).toBe(true);
    expect(isComunicacaoDaeCacheEnvelopeForOwner(cache, 'user-b')).toBe(false);
  });

  it('invalida cache legado sem proprietário', () => {
    const legacyCache = {
      encrypted: false,
      data: [],
      downloadedAt: 123,
    };

    expect(isComunicacaoDaeCacheEnvelopeForOwner(legacyCache, 'user-a')).toBe(false);
  });

  it('invalida cache de uma versão de escopo anterior', () => {
    const staleCache = {
      ...createComunicacaoDaeCacheEnvelope('user-a', [], false, 123),
      scopeVersion: `${COMUNICACAO_DAE_CACHE_SCOPE_VERSION}-stale`,
    };

    expect(isComunicacaoDaeCacheEnvelopeForOwner(staleCache, 'user-a')).toBe(false);
  });
});

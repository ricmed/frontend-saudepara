import { describe, expect, it } from 'vitest';
import {
  deveRestringirEstabelecimentosAoEvento,
  eventosAtivos,
  eventosAtivosComLocalidade,
  unirEstabelecimentosDoEvento,
} from './offlineEventoScope';

describe('offlineEventoScope', () => {
  it('lista só eventos ativos', () => {
    expect(eventosAtivos([
      { idtipo_evento: 6, ativo: 'S' },
      { idtipo_evento: 1, ativo: 'N' },
    ]).map((evento) => evento.idtipo_evento)).toEqual([6]);
  });

  it('localidade só em evento ativo que usa a dimensão', () => {
    expect(eventosAtivosComLocalidade([
      { idtipo_evento: 6, ativo: 'S', modo_localidade_evento: 'OBRIGATORIA' },
      { idtipo_evento: 1, ativo: 'S', modo_localidade_evento: 'NAO_USA' },
      { idtipo_evento: 2, ativo: 'N', modo_localidade_evento: 'OPCIONAL' },
    ]).map((evento) => evento.idtipo_evento)).toEqual([6]);
  });

  it('restringe unidades quando todos os ativos vinculam', () => {
    expect(deveRestringirEstabelecimentosAoEvento([
      { vincula_estabelecimentos: true },
    ])).toBe(true);
    expect(deveRestringirEstabelecimentosAoEvento([
      { vincula_estabelecimentos: true },
      { vincula_estabelecimentos: false },
    ])).toBe(false);
    expect(deveRestringirEstabelecimentosAoEvento([])).toBe(false);
  });

  it('une notificadora, encaminhamento e óbito sem repetir', () => {
    const unidos = unirEstabelecimentosDoEvento([
      {
        vincula_estabelecimentos: true,
        data: [{ idestabelecimento: 1, nome: 'UBS' }],
        encaminhamentos: [{ idestabelecimento: 2, nome: 'Hospital' }],
        obitos: [{ idestabelecimento: 1, nome: 'UBS' }],
      },
    ]);
    expect(unidos.map((item) => item.idestabelecimento).sort()).toEqual([1, 2]);
  });
});

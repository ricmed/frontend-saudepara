import { describe, expect, it } from 'vitest';
import { deveAvisarListaIncompleta } from './listaCarregamento';

const base = {
  carregando: true,
  termoBusca: '',
  pagina: 1,
  itensPorPagina: 10,
  carregadas: 10,
  total: 40,
  filtroTipo: false,
};

describe('deveAvisarListaIncompleta', () => {
  it('não avisa na primeira página enquanto o lote dela já chegou', () => {
    expect(deveAvisarListaIncompleta(base)).toBe(false);
  });

  it('avisa ao abrir uma página que ainda não chegou', () => {
    expect(deveAvisarListaIncompleta({ ...base, pagina: 2 })).toBe(true);
  });

  it('avisa na pesquisa enquanto o total não fechou', () => {
    expect(deveAvisarListaIncompleta({ ...base, termoBusca: 'ana' })).toBe(true);
  });

  it('avisa no filtro de tipo de atendimento enquanto carrega', () => {
    expect(deveAvisarListaIncompleta({ ...base, filtroTipo: true })).toBe(true);
  });

  it('não avisa depois que o total chegou', () => {
    expect(deveAvisarListaIncompleta({
      ...base,
      carregando: false,
      termoBusca: 'ana',
      pagina: 3,
    })).toBe(false);
  });
});

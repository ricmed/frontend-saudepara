import {
  aplicarEscopoUnidadeNoEvento,
  eventoVinculaEstabelecimentos,
  filtrarUnidadesDoEvento,
  eventoRestringeObito,
  rotuloOpcaoObitoEvento,
  shouldRestrictEstabelecimentosPorEvento,
} from './eventoEstabelecimentos';

describe('eventoEstabelecimentos', () => {
  it('detecta vínculo sem olhar nome do evento', () => {
    expect(eventoVinculaEstabelecimentos(true)).toBe(true);
    expect(eventoVinculaEstabelecimentos(false)).toBe(false);
    expect(eventoVinculaEstabelecimentos(39)).toBe(true);
    expect(eventoVinculaEstabelecimentos(0)).toBe(false);
  });

  it('filtra a lista do evento e deixa a geral intacta quando não há vínculo', () => {
    const unidades = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(filtrarUnidadesDoEvento(unidades, undefined)).toEqual(unidades);
    expect(filtrarUnidadesDoEvento(unidades, [])).toEqual(unidades);
    expect(filtrarUnidadesDoEvento(unidades, [2])).toEqual([{ id: 2 }]);
  });

  it('usuário de unidade só vê a própria se ela estiver na lista do evento', () => {
    const unidades = [
      { idestabelecimento: 10, nome: 'A' },
      { idestabelecimento: 20, nome: 'B' },
    ];
    expect(aplicarEscopoUnidadeNoEvento(unidades, 'estado', 10)).toEqual(unidades);
    expect(aplicarEscopoUnidadeNoEvento(unidades, 'unidade', 20)).toEqual([
      { idestabelecimento: 20, nome: 'B' },
    ]);
    expect(aplicarEscopoUnidadeNoEvento(unidades, 'unidade', 99)).toEqual([]);
  });

  it('não restringe enquanto a lista do evento carrega (pré-seleção do CTA)', () => {
    expect(shouldRestrictEstabelecimentosPorEvento('6', true, true)).toBe(false);
    expect(shouldRestrictEstabelecimentosPorEvento('6', false, true)).toBe(true);
    expect(shouldRestrictEstabelecimentosPorEvento('6', false, false)).toBe(false);
    expect(shouldRestrictEstabelecimentosPorEvento('', false, true)).toBe(false);
  });

  it('só restringe o óbito quando o evento tem vínculos de óbito', () => {
    expect(eventoRestringeObito(false)).toBe(false);
    expect(eventoRestringeObito(true)).toBe(true);
  });

  it('marca SVO como opção excepcional de óbito sem alterar o IML', () => {
    expect(rotuloOpcaoObitoEvento('IML POLICIA CIENTIFICA SANTAREM', '9000003')).toBe(
      'IML POLICIA CIENTIFICA SANTAREM',
    );
    expect(rotuloOpcaoObitoEvento('SVO DVS SESPA', '62502')).toBe(
      'SVO DVS SESPA (interesse epidemiológico excepcional)',
    );
  });
});

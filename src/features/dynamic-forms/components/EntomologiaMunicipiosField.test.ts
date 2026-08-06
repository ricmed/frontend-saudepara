import {
  blocksToEntomologiaArrays,
  mergeEntomologiaMunicipioBlocks,
  resolveCrsIdForMunicipioSelect,
} from './EntomologiaMunicipiosField';

describe('resolveCrsIdForMunicipioSelect', () => {
  it('aceita número e string numérica', () => {
    expect(resolveCrsIdForMunicipioSelect(4)).toBe('4');
    expect(resolveCrsIdForMunicipioSelect('12')).toBe('12');
  });

  it('aceita objeto com value/id_crs', () => {
    expect(resolveCrsIdForMunicipioSelect({ value: 7 })).toBe('7');
    expect(resolveCrsIdForMunicipioSelect({ id_crs: '3' })).toBe('3');
  });

  it('rejeita inválidos (evita listar todo o Pará)', () => {
    expect(resolveCrsIdForMunicipioSelect(undefined)).toBeUndefined();
    expect(resolveCrsIdForMunicipioSelect('')).toBeUndefined();
    expect(resolveCrsIdForMunicipioSelect({})).toBeUndefined();
    expect(resolveCrsIdForMunicipioSelect('abc')).toBeUndefined();
  });
});

describe('mergeEntomologiaMunicipioBlocks', () => {
  it('une resumo e frequência pelo municipio_id no mesmo índice', () => {
    const blocks = mergeEntomologiaMunicipioBlocks(
      [{ municipio_id: '10', tubos_com_larvas: 2 }],
      [{ municipio_id: '10', a1_aeg: 1 }],
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].municipio_id).toBe('10');
    expect(blocks[0].resumo.tubos_com_larvas).toBe(2);
    expect(blocks[0].frequencia.a1_aeg).toBe(1);
  });

  it('um par de linhas vazias vira um único bloco (não dois)', () => {
    const blocks = mergeEntomologiaMunicipioBlocks([{}], [{}]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].municipio_id).toBeUndefined();
  });

  it('mantém municípios em índices diferentes', () => {
    const blocks = mergeEntomologiaMunicipioBlocks(
      [{ municipio_id: '1', tubos_com_larvas: 1 }, { municipio_id: '2', tubos_com_larvas: 0 }],
      [{ municipio_id: '1', a1_aeg: 3 }, { municipio_id: '2', a1_aeg: 1 }],
    );
    expect(blocks.map((b) => b.municipio_id)).toEqual(['1', '2']);
  });

  it('ao selecionar município não inventa bloco extra', () => {
    const before = mergeEntomologiaMunicipioBlocks([{}], [{}]);
    expect(before).toHaveLength(1);
    const after = mergeEntomologiaMunicipioBlocks(
      [{ municipio_id: '55', tubos_com_larvas: 1 }],
      [{ municipio_id: '55' }],
    );
    expect(after).toHaveLength(1);
    expect(after[0].municipio_id).toBe('55');
  });
});

describe('blocksToEntomologiaArrays', () => {
  it('grava municipio_id nas duas arrays', () => {
    const { resumo_mensal, frequencia_recipientes } = blocksToEntomologiaArrays([
      {
        uiKey: '5',
        municipio_id: '5',
        resumo: { tubos_com_larvas: 4 },
        frequencia: { a1_aeg: 2 },
      },
    ]);
    expect(resumo_mensal[0]).toMatchObject({ municipio_id: '5', tubos_com_larvas: 4 });
    expect(frequencia_recipientes[0]).toMatchObject({ municipio_id: '5', a1_aeg: 2 });
  });
});

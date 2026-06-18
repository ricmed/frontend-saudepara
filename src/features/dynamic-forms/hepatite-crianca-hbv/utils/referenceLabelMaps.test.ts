import {
  buildReferenceMapFromSelectItems,
  formatSelectLabelForDisplay,
  resolveReferenceLabel,
} from './referenceLabelMaps';

describe('referenceLabelMaps', () => {
  it('mapeia itens { value, label } dos endpoints /select', () => {
    const map = buildReferenceMapFromSelectItems(
      [
        { value: '1', label: '1 - BRANCA' },
        { value: '4', label: '4 - PARDA' },
        { value: '9', label: '9 - IGNORADO' },
      ],
      'idtipo_raca',
      'descricao',
    );

    expect(resolveReferenceLabel('4', map)).toBe('PARDA');
    expect(resolveReferenceLabel('1', map)).toBe('BRANCA');
    expect(resolveReferenceLabel('', map)).toBe('Não informado');
  });

  it('mapeia escolaridade por código SINAN', () => {
    const map = buildReferenceMapFromSelectItems(
      [{ value: '7', label: '7 - ENSINO FUNDAMENTAL COMPLETO' }],
      'idtipo_escolaridade',
      'descricao',
    );

    expect(resolveReferenceLabel('7', map)).toBe('ENSINO FUNDAMENTAL COMPLETO');
  });

  it('formatSelectLabelForDisplay remove prefixo numérico', () => {
    expect(formatSelectLabelForDisplay('11 - SUPERIOR COMPLETO')).toBe('SUPERIOR COMPLETO');
    expect(formatSelectLabelForDisplay('PARDA')).toBe('PARDA');
  });
});

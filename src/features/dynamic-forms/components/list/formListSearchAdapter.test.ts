import { describe, expect, it } from 'vitest';
import { getFormListSearchFields, mapUiSortToApiParams } from './formListSearchAdapter';

describe('formListSearchAdapter', () => {
  it('returns Entomologia search fields', () => {
    const fields = getFormListSearchFields('ENTOMOLOGIA_LARVAS');
    expect(fields.some((f) => f.value === 'responsavel')).toBe(true);
  });

  it('maps UI sort to API', () => {
    expect(mapUiSortToApiParams('submitted_at', 'desc')).toEqual({
      sortKey: 'submitted_at',
      sortDir: 'desc',
      clientOnly: false,
    });
    expect(mapUiSortToApiParams('f:responsavel', 'asc')).toEqual({
      sortKey: 'json:responsavel',
      sortDir: 'asc',
      clientOnly: false,
    });
    expect(mapUiSortToApiParams('m:crs', 'asc').clientOnly).toBe(true);
  });
});

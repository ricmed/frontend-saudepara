import { describe, expect, it } from 'vitest';
import {
  filterApiSelectOptionsForField,
  SEXO_NASCIMENTO_HEPATITE_CRIANCA_EXCLUDE_CODIGOS,
} from './apiSelectOptionFilters';
import type { FormField } from '@/services/FormService';

const SEXO_OPTIONS = [
  { value: '1', label: 'MASCULINO' },
  { value: '2', label: 'FEMININO' },
  { value: '3', label: 'INTERSEXO' },
  { value: '9', label: 'IGNORADO' },
];

describe('apiSelectOptionFilters', () => {
  it('remove Intersexo e Ignorado no Sexo da ficha SICEX', () => {
    const field = {
      key: 'paciente.sexo',
      type: 'select',
      label: 'Sexo',
      order: 1,
      apiSelectExcludeCodigos: [...SEXO_NASCIMENTO_HEPATITE_CRIANCA_EXCLUDE_CODIGOS],
    } as FormField;

    const filtered = filterApiSelectOptionsForField(SEXO_OPTIONS, field);
    expect(filtered.map((o) => o.value)).toEqual(['1', '2']);
  });

  it('mantém valor antigo excluído quando já salvo (edição)', () => {
    const field = {
      key: 'paciente.sexo',
      type: 'select',
      label: 'Sexo',
      order: 1,
      apiSelectExcludeCodigos: [...SEXO_NASCIMENTO_HEPATITE_CRIANCA_EXCLUDE_CODIGOS],
    } as FormField;

    const filtered = filterApiSelectOptionsForField(SEXO_OPTIONS, field, '9');
    expect(filtered.map((o) => o.value)).toEqual(['1', '2', '9']);
  });
});

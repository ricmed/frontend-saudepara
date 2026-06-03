import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { FormSchema } from '@/services/FormService';
import { useFormRenderer } from './useFormRenderer';
import { CRIANCA_EXPOSTA_HBV_IDADE_ERRO } from '../utils/hepatiteCriancaHbvLimits';

function schemaWithFields(
  fields: FormSchema['sections'][0]['fields'],
  rules: FormSchema['rules'] = undefined,
): FormSchema {
  return {
    agravo: 'TEST',
    sections: [{ id: 's1', title: 'Seção', order: 1, fields }],
    rules,
  };
}

describe('useFormRenderer', () => {
  it('fails validateAll when required visible text is empty and sets error', () => {
    const schema = schemaWithFields([
      { key: 'obs.nota', type: 'text', label: 'Nota', order: 1, required: true },
    ]);
    const { result } = renderHook(() =>
      useFormRenderer({
        schema,
        initialData: {},
      }),
    );

    act(() => {
      expect(result.current.validateAll()).toBe(false);
    });
    expect(result.current.getError('obs.nota')).toMatch(/obrigatório/i);
  });

  it('passes validateAll after filling required field', () => {
    const schema = schemaWithFields([
      { key: 'obs.nota', type: 'text', label: 'Nota', order: 1, required: true },
    ]);
    const { result } = renderHook(() =>
      useFormRenderer({
        schema,
        initialData: {},
      }),
    );

    act(() => {
      result.current.setValue('obs.nota', 'preenchido');
    });
    act(() => {
      expect(result.current.validateAll()).toBe(true);
    });
    expect(result.current.getError('obs.nota')).toBeUndefined();
  });

  it('hides passaporte when não estrangeiro and shows when estrangeiro = SIM', async () => {
    const schema = schemaWithFields([]);
    const { result } = renderHook(() =>
      useFormRenderer({
        schema,
        initialData: { paciente: { e_estrangeiro: '2' } },
      }),
    );

    expect(result.current.isFieldVisible('paciente.passaporte')).toBe(false);

    act(() => {
      result.current.setValue('paciente.e_estrangeiro', '1');
    });

    await waitFor(() => {
      expect(result.current.isFieldVisible('paciente.passaporte')).toBe(true);
    });
  });

  it('CPF obrigatório só quando É Estrangeiro = NÃO (2)', async () => {
    const schema = schemaWithFields([]);
    const { result } = renderHook(() =>
      useFormRenderer({
        schema,
        initialData: { paciente: { e_estrangeiro: '2' } },
      }),
    );

    expect(result.current.isFieldRequired('paciente.cpf')).toBe(true);

    act(() => {
      result.current.setValue('paciente.e_estrangeiro', '1');
    });

    await waitFor(() => {
      expect(result.current.isFieldRequired('paciente.cpf')).toBe(false);
    });
  });

  it('HEPATITE_CRIANCA_HBV: validateAll não lança e rejeita idade acima de 24 meses', () => {
    const schema: FormSchema = {
      agravo: 'HEPATITE_CRIANCA_HBV',
      sections: [
        {
          id: 's1',
          title: 'Paciente',
          order: 1,
          fields: [
            {
              key: 'paciente.data_nascimento',
              type: 'date',
              label: 'Data de Nascimento',
              order: 1,
              required: true,
            },
            { key: 'paciente.idade', type: 'idade', label: 'Idade', order: 2, required: false },
          ],
        },
      ],
    };
    const { result } = renderHook(() =>
      useFormRenderer({
        schema,
        formKey: 'HEPATITE_CRIANCA_HBV',
        initialData: {
          paciente: { data_nascimento: '2020-01-01', idade: 72 },
        },
      }),
    );

    let valid = true;
    act(() => {
      valid = result.current.validateAll();
    });
    expect(valid).toBe(false);
    expect(result.current.getError('paciente.idade') ?? result.current.getError('paciente.data_nascimento')).toBe(
      CRIANCA_EXPOSTA_HBV_IDADE_ERRO,
    );
  });

  it('HEPATITE_CRIANCA_HBV: CPF e CNS não são obrigatórios', () => {
    const schema: FormSchema = {
      agravo: 'HEPATITE_CRIANCA_HBV',
      sections: [
        {
          id: 's1',
          title: 'Paciente',
          order: 1,
          fields: [
            { key: 'crianca_hbv.numero_sinan_mae', type: 'text', label: 'SINAN mãe', order: 1 },
          ],
        },
      ],
    };
    const { result } = renderHook(() =>
      useFormRenderer({ schema, formKey: 'HEPATITE_CRIANCA_HBV', initialData: {} }),
    );

    expect(result.current.isFieldRequired('paciente.cpf')).toBe(false);
    expect(result.current.isFieldRequired('paciente.cns')).toBe(false);
  });
});

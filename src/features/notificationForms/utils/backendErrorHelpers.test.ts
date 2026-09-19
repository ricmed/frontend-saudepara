import { describe, expect, it } from 'vitest';
import { mapBackendValidationErrors } from './backendErrorHelpers';

const PATIENT_CREATE_ERROR_FIELD_MAP: Record<string, string> = {
  tipo_genero_idtipo_genero: 'identidadeGenero',
  nome_mae: 'nomeMae',
};

describe('mapBackendValidationErrors', () => {
  it('mapeia gênero obrigatório do backend para o campo da ficha', () => {
    const mapped = mapBackendValidationErrors(
      { tipo_genero_idtipo_genero: 'obrigatório' },
      PATIENT_CREATE_ERROR_FIELD_MAP,
    );
    expect(mapped.identidadeGenero).toBe('obrigatório');
  });

  it('mapeia outros obrigatórios do paciente', () => {
    const mapped = mapBackendValidationErrors(
      { nome_mae: 'obrigatório' },
      PATIENT_CREATE_ERROR_FIELD_MAP,
    );
    expect(mapped.nomeMae).toBe('obrigatório');
  });
});

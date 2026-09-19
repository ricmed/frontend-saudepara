import { describe, expect, it } from 'vitest';
import {
  extractBackendMessage,
  mapBackendValidationErrors,
} from './backendErrorHelpers';

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

describe('extractBackendMessage', () => {
  it('usa a mensagem do servidor quando existe', () => {
    expect(
      extractBackendMessage(
        { response: { status: 400, data: { message: 'Localidade do evento é obrigatória' } } },
        'fallback',
      ),
    ).toBe('Localidade do evento é obrigatória');
  });

  it('não mostra só o status code 400 do axios', () => {
    expect(
      extractBackendMessage(
        { message: 'Request failed with status code 400', response: { status: 400, data: {} } },
        'fallback',
      ),
    ).toBe('Dado obrigatório faltando ou inválido. Confira a ficha.');
  });
});

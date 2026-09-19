import { describe, expect, it } from 'vitest';
import {
  applyFormClassificationsToPatient,
  buildPatientPayloadFromForm,
  parseOptionalInt,
} from './patientPayloadHelpers';

const mapGestanteForApi = (value: string) => (value === '1' ? 'S' : value === '2' ? 'N' : null);

const baseForm = {
  paciente: 'PACIENTE TESTE',
  nomeMae: 'MAE TESTE',
  dataNascimento: '1990-01-01',
  cpf: '',
  contatoTelefonico: '91999999999',
  ddi: '55',
  gestante: '2',
  idadeMeses: '',
  identidadeGenero: '1',
  raca: '4',
  escolaridade: '',
  profissao: '',
} as any;

describe('patientPayloadHelpers', () => {
  it('parseOptionalInt aceita string e número', () => {
    expect(parseOptionalInt('1')).toBe(1);
    expect(parseOptionalInt(1)).toBe(1);
    expect(parseOptionalInt('MULHER CISGENERO')).toBeNull();
    expect(parseOptionalInt('')).toBeNull();
  });

  it('buildPatientPayloadFromForm manda o ID do gênero', () => {
    const payload = buildPatientPayloadFromForm(baseForm, { mapGestanteForApi });
    expect(payload.tipo_genero_idtipo_genero).toBe(1);
    expect(payload.tipo_raca_idtipo_raca).toBe(4);
  });

  it('applyFormClassificationsToPatient preenche gênero que faltava no cadastro local', () => {
    const merged = applyFormClassificationsToPatient(
      { nome: 'PACIENTE TESTE', tipo_genero_idtipo_genero: null },
      { identidadeGenero: '1', raca: '4' },
    );
    expect(merged.tipo_genero_idtipo_genero).toBe(1);
    expect(merged.tipo_raca_idtipo_raca).toBe(4);
  });
});

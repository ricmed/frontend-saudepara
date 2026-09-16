import { describe, expect, it, vi } from 'vitest';
import {
  CPF_IDENTITY_CONFLICT_MESSAGE,
  findExistingPatientByPriority,
  isCpfIdentityConflictError,
  isCpfIdentityConflictMatch,
  isReusablePatientMatch,
} from './patientLookupHelpers';

const patientA = {
  idpaciente: 10,
  nome: 'PACIENTE ANTERIOR',
  cpf: '52998224725',
  nome_mae: 'MAE ANTERIOR',
  data_nascimento: '1990-01-15',
};

const patientBSameCpf = {
  idpaciente: 11,
  nome: 'PACIENTE NOVO',
  cpf: '52998224725',
  nome_mae: 'MAE NOVA',
  data_nascimento: '2000-05-20',
};

describe('findExistingPatientByPriority — CPF', () => {
  it('reutiliza o paciente quando CPF e nome são da mesma pessoa', async () => {
    const searchPatients = vi.fn().mockResolvedValue([patientA]);

    const result = await findExistingPatientByPriority({
      cpf: '52998224725',
      nomePaciente: 'paciente anterior',
      dataNascimento: '1990-01-15',
      nomeMae: 'MAE ANTERIOR',
      searchPatients,
    });

    expect(result.matchedBy).toBe('cpf');
    expect(isReusablePatientMatch(result.matchedBy)).toBe(true);
    expect(result.pacienteExistente.idpaciente).toBe(10);
  });

  it('não vincula quando o CPF já pertence a outra pessoa', async () => {
    const searchPatients = vi.fn().mockResolvedValue([patientA]);

    const result = await findExistingPatientByPriority({
      cpf: '52998224725',
      nomePaciente: patientBSameCpf.nome,
      dataNascimento: patientBSameCpf.data_nascimento,
      nomeMae: patientBSameCpf.nome_mae,
      searchPatients,
    });

    expect(result.matchedBy).toBe('cpf_identity_conflict');
    expect(isCpfIdentityConflictMatch(result.matchedBy)).toBe(true);
    expect(isReusablePatientMatch(result.matchedBy)).toBe(false);
    expect(result.pacienteExistente.idpaciente).toBe(10);
  });

  it('ignora o primeiro resultado da busca se o CPF não for exatamente o digitado', async () => {
    const searchPatients = vi.fn().mockResolvedValue([
      { idpaciente: 99, nome: 'OUTRO', cpf: '11111111111' },
    ]);

    const result = await findExistingPatientByPriority({
      cpf: '52998224725',
      nomePaciente: 'PACIENTE NOVO',
      searchPatients,
    });

    expect(result.matchedBy).toBeNull();
    expect(result.pacienteExistente).toBeNull();
  });
});

describe('findExistingPatientByPriority — nome + data / mãe', () => {
  it('ainda associa por nome e data de nascimento quando não há CPF', async () => {
    const searchPatients = vi.fn().mockResolvedValue([patientA]);

    const result = await findExistingPatientByPriority({
      nomePaciente: 'PACIENTE ANTERIOR',
      dataNascimento: '1990-01-15',
      searchPatients,
    });

    expect(result.matchedBy).toBe('nome_data');
    expect(result.pacienteExistente.idpaciente).toBe(10);
  });

  it('ainda associa por nome e nome da mãe quando não há CPF nem data', async () => {
    const searchPatients = vi.fn().mockResolvedValue([patientA]);

    const result = await findExistingPatientByPriority({
      nomePaciente: 'PACIENTE ANTERIOR',
      nomeMae: 'MAE ANTERIOR',
      searchPatients,
    });

    expect(result.matchedBy).toBe('nome_mae');
    expect(result.pacienteExistente.idpaciente).toBe(10);
  });
});

describe('mensagem de conflito de CPF', () => {
  it('é a mesma usada no toast / fila de sync', () => {
    expect(isCpfIdentityConflictError(new Error(CPF_IDENTITY_CONFLICT_MESSAGE))).toBe(true);
    expect(CPF_IDENTITY_CONFLICT_MESSAGE).toMatch(/já está cadastrado/i);
    expect(CPF_IDENTITY_CONFLICT_MESSAGE).toMatch(/paciente associado/i);
  });
});

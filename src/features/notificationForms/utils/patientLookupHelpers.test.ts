import { describe, expect, it, vi } from 'vitest';
import {
  cpfAlreadyRegistered,
  findExistingPatientByPriority,
  hasUsableCpf,
} from './patientLookupHelpers';

const alreadyOnFile = {
  idpaciente: 10,
  nome: 'PACIENTE ANTERIOR',
  cpf: '52998224725',
};

describe('cpfAlreadyRegistered', () => {
  it('é true quando o CPF já existe no cadastro', async () => {
    const searchPatients = vi.fn().mockResolvedValue([alreadyOnFile]);
    await expect(
      cpfAlreadyRegistered('52998224725', searchPatients)
    ).resolves.toBe(true);
  });

  it('é false quando o CPF é inédito', async () => {
    const searchPatients = vi.fn().mockResolvedValue([]);
    await expect(
      cpfAlreadyRegistered('52998224725', searchPatients)
    ).resolves.toBe(false);
  });

  it('ignora CPF incompleto', async () => {
    const searchPatients = vi.fn();
    await expect(cpfAlreadyRegistered('123', searchPatients)).resolves.toBe(false);
    expect(searchPatients).not.toHaveBeenCalled();
    expect(hasUsableCpf('52998224725')).toBe(true);
    expect(hasUsableCpf('123')).toBe(false);
  });
});

describe('findExistingPatientByPriority', () => {
  it('não reutiliza cadastro por CPF — a ficha nova sobe com paciente próprio', async () => {
    const searchPatients = vi.fn().mockResolvedValue([alreadyOnFile]);
    const result = await findExistingPatientByPriority({
      cpf: '52998224725',
      nomePaciente: 'PACIENTE ANTERIOR',
      searchPatients,
    });
    expect(result.pacienteExistente).toBeNull();
    expect(result.matchedBy).toBeNull();
  });
});

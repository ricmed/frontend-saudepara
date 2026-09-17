import { isSameCpf } from './patientMatchingHelpers';

type SearchPatientsFn = (query: string) => Promise<any[]>;

export type PatientLookupMatchType = 'cpf' | null;

export type PatientLookupResult = {
  pacienteExistente: any | null;
  matchedBy: PatientLookupMatchType;
};

type FindExistingPatientParams = {
  cpf?: string;
  nomePaciente: string;
  dataNascimento?: string;
  nomeMae?: string;
  searchPatients: SearchPatientsFn;
};

const digitsCpf = (cpf?: string): string => (cpf ?? '').replace(/\D/g, '');

export const hasUsableCpf = (cpf?: string): boolean => digitsCpf(cpf).length === 11;

export const cpfAlreadyRegistered = async (
  cpf: string | undefined,
  searchPatients: SearchPatientsFn
): Promise<boolean> => {
  if (!hasUsableCpf(cpf)) return false;
  try {
    const found = await searchPatients(cpf!);
    return (found || []).some((patient) => isSameCpf(patient, cpf!));
  } catch {
    return false;
  }
};

/** Mantido para quem já selecionou o paciente na lista (pacienteId). Não reusa por CPF. */
export const findExistingPatientByPriority = async (
  _params: FindExistingPatientParams
): Promise<PatientLookupResult> => {
  return {
    pacienteExistente: null,
    matchedBy: null
  };
};

export const isReusablePatientMatch = (
  matchedBy: PatientLookupMatchType
): matchedBy is 'cpf' => matchedBy === 'cpf';

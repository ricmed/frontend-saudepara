type PatientCandidate = {
  nome?: string | null;
  nome_mae?: string | null;
  data_nascimento?: string | null;
  cpf?: string | null;
};

export const normalizeForExactMatch = (value?: string | null): string => {
  return (value ?? '').toUpperCase().trim();
};

export const digitsOnly = (value?: string | null): string => {
  return (value ?? '').replace(/\D/g, '');
};

export const isSameCpf = (
  patient: Pick<PatientCandidate, 'cpf'>,
  cpf: string
): boolean => {
  const candidateCpf = digitsOnly(patient.cpf);
  const typedCpf = digitsOnly(cpf);
  return candidateCpf.length === 11 && candidateCpf === typedCpf;
};

export const isSamePersonName = (
  patient: PatientCandidate,
  patientName: string
): boolean => {
  return normalizeForExactMatch(patient.nome) === normalizeForExactMatch(patientName);
};

export const toIsoDateOnly = (value?: string | null): string | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
};

export const isSameNameAndBirthDate = (
  patient: PatientCandidate,
  patientName: string,
  birthDate: string
): boolean => {
  const normalizedName = normalizeForExactMatch(patientName);
  const candidateName = normalizeForExactMatch(patient.nome);
  const candidateBirthDate = toIsoDateOnly(patient.data_nascimento);
  return candidateName === normalizedName && candidateBirthDate === birthDate;
};

export const isSameNameAndMotherName = (
  patient: PatientCandidate,
  patientName: string,
  motherName: string
): boolean => {
  const normalizedName = normalizeForExactMatch(patientName);
  const normalizedMotherName = normalizeForExactMatch(motherName);
  const candidateName = normalizeForExactMatch(patient.nome);
  const candidateMotherName = normalizeForExactMatch(patient.nome_mae);
  return candidateName === normalizedName && candidateMotherName === normalizedMotherName;
};

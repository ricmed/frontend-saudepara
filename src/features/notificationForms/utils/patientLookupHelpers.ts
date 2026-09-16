import {
  isSameCpf,
  isSameNameAndBirthDate,
  isSameNameAndMotherName,
  isSamePersonName,
  normalizeForExactMatch
} from './patientMatchingHelpers';

type SearchPatientsFn = (query: string) => Promise<any[]>;

export type PatientLookupMatchType =
  | 'cpf'
  | 'nome_data'
  | 'nome_mae'
  | 'cpf_identity_conflict'
  | null;

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

export const CPF_IDENTITY_CONFLICT_MESSAGE =
  'Este CPF já está cadastrado e já possui um paciente associado. Confira o número ou use o cadastro existente.';

export const isReusablePatientMatch = (
  matchedBy: PatientLookupMatchType
): matchedBy is 'cpf' | 'nome_data' | 'nome_mae' => {
  return matchedBy === 'cpf' || matchedBy === 'nome_data' || matchedBy === 'nome_mae';
};

export const isCpfIdentityConflictMatch = (
  matchedBy: PatientLookupMatchType
): boolean => matchedBy === 'cpf_identity_conflict';

export const isCpfIdentityConflictError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes(CPF_IDENTITY_CONFLICT_MESSAGE);
};

const exactCpfMatches = (candidates: any[] | undefined, cpf: string): any[] => {
  return (candidates || []).filter((patient) => isSameCpf(patient, cpf));
};

export const findExistingPatientByPriority = async ({
  cpf,
  nomePaciente,
  dataNascimento,
  nomeMae,
  searchPatients
}: FindExistingPatientParams): Promise<PatientLookupResult> => {
  // Estratégia 1: CPF — só reutiliza se o nome for o mesmo paciente
  if (cpf && cpf.length === 11) {
    try {
      const pacientesPorCpf = await searchPatients(cpf);
      const matchesByCpf = exactCpfMatches(pacientesPorCpf, cpf);
      if (matchesByCpf.length) {
        const samePerson = matchesByCpf.find((patient) =>
          isSamePersonName(patient, nomePaciente)
        );
        if (samePerson) {
          return {
            pacienteExistente: samePerson,
            matchedBy: 'cpf'
          };
        }
        return {
          pacienteExistente: matchesByCpf[0],
          matchedBy: 'cpf_identity_conflict'
        };
      }
    } catch {
      // Mantém comportamento de fallback para próximas estratégias.
    }
  }

  // Estratégia 2: Nome + Data de nascimento
  if (nomePaciente && dataNascimento) {
    try {
      const pacientesPorNome = await searchPatients(nomePaciente);
      if (pacientesPorNome?.length) {
        const match = pacientesPorNome.find((p: any) =>
          isSameNameAndBirthDate(p, nomePaciente, dataNascimento)
        );
        if (match) {
          return {
            pacienteExistente: match,
            matchedBy: 'nome_data'
          };
        }
      }
    } catch {
      // Mantém comportamento de fallback para próximas estratégias.
    }
  }

  // Estratégia 3: Nome + Nome da mãe
  if (nomePaciente && nomeMae && nomeMae.length > 5) {
    try {
      const pacientesPorNome = await searchPatients(nomePaciente);
      if (pacientesPorNome?.length) {
        const nomeNormalizado = normalizeForExactMatch(nomePaciente);
        const nomeMaeNormalizado = normalizeForExactMatch(nomeMae);
        const match = pacientesPorNome.find((p: any) => {
          if (!p.nome_mae) return false;
          const nomePacienteMatch = normalizeForExactMatch(p.nome) === nomeNormalizado;
          const nomeMaePacienteMatch = normalizeForExactMatch(p.nome_mae) === nomeMaeNormalizado;
          return nomePacienteMatch && nomeMaePacienteMatch && isSameNameAndMotherName(p, nomePaciente, nomeMae);
        });
        if (match) {
          return {
            pacienteExistente: match,
            matchedBy: 'nome_mae'
          };
        }
      }
    } catch {
      // Mantém comportamento original: apenas segue sem match.
    }
  }

  return {
    pacienteExistente: null,
    matchedBy: null
  };
};

import {
  isSameNameAndBirthDate,
  isSameNameAndMotherName,
  normalizeForExactMatch
} from './patientMatchingHelpers';

type SearchPatientsFn = (query: string) => Promise<any[]>;

export type PatientLookupMatchType = 'cpf' | 'nome_data' | 'nome_mae' | null;

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

export const findExistingPatientByPriority = async ({
  cpf,
  nomePaciente,
  dataNascimento,
  nomeMae,
  searchPatients
}: FindExistingPatientParams): Promise<PatientLookupResult> => {
  // Estratégia 1: CPF
  if (cpf && cpf.length === 11) {
    try {
      const pacientesPorCpf = await searchPatients(cpf);
      if (pacientesPorCpf?.length) {
        return {
          pacienteExistente: pacientesPorCpf[0],
          matchedBy: 'cpf'
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

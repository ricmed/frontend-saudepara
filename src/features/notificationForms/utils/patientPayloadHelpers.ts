import type { FormData } from '@/features/notificationForms/types/index2';

type BuildPatientPayloadDependencies = {
  mapGestanteForApi: (value: string) => string | null;
};

type BuildPatientPayloadOptions = {
  uppercaseNome?: boolean;
  uppercaseNomeMae?: boolean;
  includeNullableClassificationIds?: boolean;
};

export const parseOptionalInt = (value?: string | number | null): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }
  const parsed = parseInt(String(value).trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const firstClassificationId = (...values: Array<string | number | null | undefined>): number | null => {
  for (const value of values) {
    const parsed = parseOptionalInt(value);
    if (parsed) return parsed;
  }
  return null;
};

export const applyFormClassificationsToPatient = (
  pacienteData: Record<string, any>,
  formData?: {
    identidadeGenero?: string;
    raca?: string;
    escolaridade?: string;
    profissao?: string;
    tipo_genero_idtipo_genero?: string | number | null;
    tipo_raca_idtipo_raca?: string | number | null;
    escolaridade_idescolaridade?: string | number | null;
    cbo_idcbo?: string | number | null;
  } | null,
): Record<string, any> => {
  if (!formData) return pacienteData;

  return {
    ...pacienteData,
    tipo_genero_idtipo_genero:
      firstClassificationId(
        pacienteData.tipo_genero_idtipo_genero,
        formData.identidadeGenero,
        formData.tipo_genero_idtipo_genero,
      ) ?? pacienteData.tipo_genero_idtipo_genero,
    tipo_raca_idtipo_raca:
      firstClassificationId(
        pacienteData.tipo_raca_idtipo_raca,
        formData.raca,
        formData.tipo_raca_idtipo_raca,
      ) ?? pacienteData.tipo_raca_idtipo_raca,
    escolaridade_idescolaridade:
      firstClassificationId(
        pacienteData.escolaridade_idescolaridade,
        formData.escolaridade,
        formData.escolaridade_idescolaridade,
      ) ?? pacienteData.escolaridade_idescolaridade,
    cbo_idcbo:
      firstClassificationId(
        pacienteData.cbo_idcbo,
        formData.profissao,
        formData.cbo_idcbo,
      ) ?? pacienteData.cbo_idcbo,
  };
};

export const resolvePatientAgeInMonths = (formData: FormData): number | null => {
  if (formData.dataNascimento && formData.dataNascimento.trim() !== '') return null;
  return parseOptionalInt(formData.idadeMeses);
};

export const buildPatientPayloadFromForm = (
  formData: FormData,
  dependencies: BuildPatientPayloadDependencies,
  options: BuildPatientPayloadOptions = {}
): Record<string, any> => {
  const {
    uppercaseNome = false,
    uppercaseNomeMae = false,
    includeNullableClassificationIds = true
  } = options;

  const nome = uppercaseNome ? formData.paciente.toUpperCase() : formData.paciente;
  const nomeMaeValue = formData.nomeMae || '';
  const nomeMae = uppercaseNomeMae ? nomeMaeValue.toUpperCase() : nomeMaeValue;

  // CNS / sexo ao nascimento / e_estrangeiro são fluxo SINAN (formulários dinâmicos).
  const payload: Record<string, any> = {
    nome,
    nome_mae: nomeMae,
    data_nascimento: formData.dataNascimento || null,
    cpf: formData.cpf || '',
    contato: formData.contatoTelefonico || '',
    ddi: formData.ddi || '55',
    gestante: dependencies.mapGestanteForApi(formData.gestante),
    idade: resolvePatientAgeInMonths(formData)
  };

  const classificationFields = {
    tipo_genero_idtipo_genero: parseOptionalInt(formData.identidadeGenero),
    tipo_raca_idtipo_raca: parseOptionalInt(formData.raca),
    escolaridade_idescolaridade: parseOptionalInt(formData.escolaridade),
    cbo_idcbo: parseOptionalInt(formData.profissao)
  };

  if (includeNullableClassificationIds) {
    return { ...payload, ...classificationFields };
  }

  const filteredClassifications = Object.fromEntries(
    Object.entries(classificationFields).filter(([, value]) => value !== null)
  );
  return { ...payload, ...filteredClassifications };
};

import type { FormData } from '@/features/notificationForms/types/index2';

type BuildPatientPayloadDependencies = {
  mapGestanteForApi: (value: string) => string | null;
};

type BuildPatientPayloadOptions = {
  uppercaseNome?: boolean;
  uppercaseNomeMae?: boolean;
  includeNullableClassificationIds?: boolean;
};

const parseOptionalInt = (value?: string): number | null => {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
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

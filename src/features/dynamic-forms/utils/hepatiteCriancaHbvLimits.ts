import type { FormSchema } from '@/services/FormService';
import type { FieldValidationError } from './formValidationTypes';

/** Limite epidemiológico (NT 11/2025 MS): criança exposta = RN ou até 24 meses. */
export const CRIANCA_EXPOSTA_HBV_MAX_IDADE_MESES = 24;

export function isHepatiteCriancaHBVForm(options: {
  schema?: FormSchema | { agravo?: string; sections?: Array<{ fields?: Array<{ key?: string }> }> } | null;
  formKey?: string;
}): boolean {
  const key = String(options.formKey ?? options.schema?.agravo ?? '').trim().toUpperCase();
  if (key === 'HEPATITE_CRIANCA_HBV') return true;
  const sections = options.schema?.sections;
  if (!sections?.length) return false;
  return sections.some((s) =>
    (s.fields ?? []).some((f) => f.key === 'crianca_hbv.numero_sinan_mae'),
  );
}

export const CRIANCA_EXPOSTA_HBV_IDADE_ERRO =
  'Esta ficha é para recém-nascido ou criança com até 24 meses (definição MS — criança exposta ao HBV).';

export const CRIANCA_EXPOSTA_HBV_IDADE_OU_NASCIMENTO_ERRO =
  'Informe a idade em meses ou a data de nascimento.';

export function calcularIdadeMesesFromBirthDate(birthDate: string | Date): number | undefined {
  try {
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return undefined;
    const today = new Date();
    let anos = today.getFullYear() - birth.getFullYear();
    let meses = today.getMonth() - birth.getMonth();
    if (meses < 0 || (meses === 0 && today.getDate() < birth.getDate())) {
      anos--;
      meses += 12;
    }
    if (today.getDate() < birth.getDate()) meses--;
    const totalMeses = anos * 12 + meses;
    return totalMeses < 0 ? undefined : totalMeses;
  } catch {
    return undefined;
  }
}

export function isIdadeValidaCriancaExpostaHBV(meses: number): boolean {
  return !Number.isNaN(meses) && meses >= 0 && meses <= CRIANCA_EXPOSTA_HBV_MAX_IDADE_MESES;
}

function readPacienteBirthDate(formData: Record<string, unknown>): string | undefined {
  const paciente = formData.paciente;
  if (!paciente || typeof paciente !== 'object') return undefined;
  const record = paciente as Record<string, unknown>;
  const raw = record.data_nascimento ?? record.dt_nascimento;
  if (raw == null || raw === '') return undefined;
  return String(raw);
}

export function hasPacienteIdadeInformada(formData: Record<string, unknown>): boolean {
  const idadeRaw = (formData.paciente as Record<string, unknown> | undefined)?.idade;
  if (idadeRaw == null || idadeRaw === '') return false;
  return !Number.isNaN(Number(idadeRaw));
}

export function hasPacienteDataNascimentoInformada(formData: Record<string, unknown>): boolean {
  return Boolean(readPacienteBirthDate(formData));
}

/** Valida idade em meses e data de nascimento para a ficha criança exposta. */
export function collectHepatiteCriancaExpostaAgeErrors(
  formData: Record<string, unknown>,
): FieldValidationError[] {
  const errors: FieldValidationError[] = [];

  const hasIdade = hasPacienteIdadeInformada(formData);
  const hasDataNascimento = hasPacienteDataNascimentoInformada(formData);

  if (!hasIdade && !hasDataNascimento) {
    errors.push(
      {
        field: 'paciente.idade',
        message: CRIANCA_EXPOSTA_HBV_IDADE_OU_NASCIMENTO_ERRO,
        code: 'REQUIRED_HEPATITE_CRIANCA_IDADE_OU_NASCIMENTO',
      },
      {
        field: 'paciente.data_nascimento',
        message: CRIANCA_EXPOSTA_HBV_IDADE_OU_NASCIMENTO_ERRO,
        code: 'REQUIRED_HEPATITE_CRIANCA_IDADE_OU_NASCIMENTO',
      },
    );
    return errors;
  }

  const idadeRaw = (formData.paciente as Record<string, unknown> | undefined)?.idade;
  if (idadeRaw != null && idadeRaw !== '') {
    const meses = Number(idadeRaw);
    if (!Number.isNaN(meses) && !isIdadeValidaCriancaExpostaHBV(meses)) {
      errors.push({
        field: 'paciente.idade',
        message: CRIANCA_EXPOSTA_HBV_IDADE_ERRO,
        code: 'INVALID_HEPATITE_CRIANCA_IDADE',
      });
    }
  }

  const birthRaw = readPacienteBirthDate(formData);
  if (birthRaw) {
    const totalMeses = calcularIdadeMesesFromBirthDate(birthRaw);
    if (totalMeses !== undefined && !isIdadeValidaCriancaExpostaHBV(totalMeses)) {
      errors.push({
        field: 'paciente.data_nascimento',
        message: CRIANCA_EXPOSTA_HBV_IDADE_ERRO,
        code: 'INVALID_HEPATITE_CRIANCA_IDADE',
      });
    }
  }

  return errors;
}

/** Exibição da idade em meses (ficha criança exposta: sempre meses até 24). */
export function formatIdadeMesesParaExibicao(
  meses: number,
  options?: { sempreMesesAte?: number },
): string {
  const m = Math.floor(Number(meses));
  if (Number.isNaN(m)) return '';
  const limite = options?.sempreMesesAte;
  if (limite != null && m <= limite) {
    return `${m} ${m === 1 ? 'mês' : 'meses'}`;
  }
  if (m < 12) {
    return `${m} ${m === 1 ? 'mês' : 'meses'}`;
  }
  const anos = Math.floor(m / 12);
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
}

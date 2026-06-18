import { get } from 'lodash';
import type { FieldValidationError } from './formValidationTypes';

export const HEPATITE_INVESTIGADOR_REQUIRED_KEYS = [
  'investigador.municipio_id',
  'investigador.unidade_id',
  'investigador.nome',
  'investigador.funcao',
] as const;

export const HEPATITE_INVESTIGADOR_VISIBLE_KEYS = new Set<string>([
  'investigador.municipio_id',
  'investigador.unidade_id',
]);

const DEFAULT_LABELS: Record<string, string> = {
  'investigador.municipio_id': 'Município (Pará)',
  'investigador.unidade_id': 'Unidade de Saúde (CNES)',
  'investigador.nome': 'Nome',
  'investigador.funcao': 'Função',
};

function isEmptyInvestigadorValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

export function isHepatiteInvestigadorRequiredKey(key: string): boolean {
  return (HEPATITE_INVESTIGADOR_REQUIRED_KEYS as readonly string[]).includes(key);
}

/** Dados do investigador exigidos na ficha SINAN criança exposta. */
export function collectHepatiteCriancaInvestigadorErrors(
  formData: Record<string, unknown>,
  fieldLabels: Record<string, string> = {},
): FieldValidationError[] {
  const errors: FieldValidationError[] = [];

  for (const key of HEPATITE_INVESTIGADOR_REQUIRED_KEYS) {
    const value = get(formData, key);
    if (isEmptyInvestigadorValue(value)) {
      const label = fieldLabels[key] ?? DEFAULT_LABELS[key] ?? key;
      errors.push({
        field: key,
        message: `${label} é obrigatório`,
        code: 'REQUIRED',
      });
    }
  }

  return errors;
}

import { get } from 'lodash';
import type { FieldValidationError } from './formValidationTypes';
import { tipoExposicaoMostraHbv } from './hepatiteCriancaExposicao';

/** Marcadores HBV da mãe exigidos em cenário pré-natal (áudios 5 e 6: só HBsAg e HBV-DNA). */
export const MAE_LAB_HBV_CORE_REQUIRED_KEYS = ['mae.lab.hbv_hbsag', 'mae.lab.hbv_dna'] as const;

export const MAE_LAB_HBV_WHEN_ANTES = 'mae.lab.hepatite_b_quando_antes_prenatal';
export const MAE_LAB_HBV_WHEN_DURANTE = 'mae.lab.hepatite_b_quando_durante_prenatal';
export const MAE_LAB_HBV_WHEN_MATERNIDADE = 'mae.lab.hepatite_b_quando_maternidade';

const SINAN_SIM = '1';

type ValueGetter = (key: string) => unknown;

function isSim(value: unknown): boolean {
  return String(value ?? '') === SINAN_SIM;
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

export function buildFieldLabelMap(
  sections: Array<{ fields?: Array<{ key?: string; label?: string }> }> | undefined,
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const section of sections ?? []) {
    for (const field of section.fields ?? []) {
      if (field.key && field.label) {
        labels[field.key] = field.label;
      }
    }
  }
  return labels;
}

/** Antes ou durante o pré-natal — HBsAg e HBV-DNA obrigatórios. */
export function maeLabHbvQuandoRequiresCoreMarkers(getValue: ValueGetter): boolean {
  return isSim(getValue(MAE_LAB_HBV_WHEN_ANTES)) || isSim(getValue(MAE_LAB_HBV_WHEN_DURANTE));
}

/** Somente maternidade marcada — todos os marcadores facultativos. */
export function maeLabHbvQuandoSomenteMaternidade(getValue: ValueGetter): boolean {
  if (!isSim(getValue(MAE_LAB_HBV_WHEN_MATERNIDADE))) return false;
  return !maeLabHbvQuandoRequiresCoreMarkers(getValue);
}

export function isMaeLabHbvMarkerRequired(key: string, getValue: ValueGetter): boolean {
  if (maeLabHbvQuandoSomenteMaternidade(getValue)) return false;
  if (!maeLabHbvQuandoRequiresCoreMarkers(getValue)) return false;
  return (MAE_LAB_HBV_CORE_REQUIRED_KEYS as readonly string[]).includes(key);
}

/** Valida HBsAg/HBV-DNA quando o cenário pré-natal da mãe exige marcadores. */
export function collectHepatiteCriancaMaeLabErrors(
  formData: Record<string, unknown>,
  visible: Record<string, boolean> = {},
  fieldLabels: Record<string, string> = {},
): FieldValidationError[] {
  if (!tipoExposicaoMostraHbv(get(formData, 'notificacao.tipo_exposicao_hepatite'))) return [];

  const getValue: ValueGetter = (key) => get(formData, key);
  const errors: FieldValidationError[] = [];

  for (const key of MAE_LAB_HBV_CORE_REQUIRED_KEYS) {
    if (visible[key] === false) continue;
    if (!isMaeLabHbvMarkerRequired(key, getValue)) continue;
    if (!isEmptyValue(getValue(key))) continue;

    const label = fieldLabels[key] ?? key;
    errors.push({
      field: key,
      message: `${label} é obrigatório`,
      code: 'REQUIRED',
    });
  }

  return errors;
}

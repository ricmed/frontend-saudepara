import { get } from 'lodash';
import type { FieldValidationError } from './formValidationTypes';
import {
  TIPO_EXPOSICAO_HEPATITE_KEY,
  tipoExposicaoMostraHbv,
  tipoExposicaoMostraHcv,
} from './hepatiteCriancaExposicao';

export const MAE_SOROLOGIA_REAGENTE_HBV_KEY = 'mae.lab.sorologia_reagente_hepatite_b';
export const MAE_SOROLOGIA_REAGENTE_HCV_KEY = 'mae.lab.sorologia_reagente_hepatite_c';

const SINAN_SIM = '1';
const SINAN_NAO = '2';

const DEFAULT_LABELS: Record<string, string> = {
  [MAE_SOROLOGIA_REAGENTE_HBV_KEY]: 'Hepatite B (HBsAg Reagente)',
  [MAE_SOROLOGIA_REAGENTE_HCV_KEY]: 'Hepatite C (Anti-HCV Reagente)',
};

type ValueGetter = (key: string) => unknown;

function isSorologiaReagenteInformada(value: unknown): boolean {
  const v = String(value ?? '').trim();
  return v === SINAN_SIM || v === SINAN_NAO;
}

/** Campo 37 — Sim/Não obrigatório para cada vírus visível conforme o tipo de exposição. */
export function isMaeSorologiaReagenteRequired(key: string, getValue: ValueGetter): boolean {
  const tipo = getValue(TIPO_EXPOSICAO_HEPATITE_KEY);
  if (key === MAE_SOROLOGIA_REAGENTE_HBV_KEY) return tipoExposicaoMostraHbv(tipo);
  if (key === MAE_SOROLOGIA_REAGENTE_HCV_KEY) return tipoExposicaoMostraHcv(tipo);
  return false;
}

export function isMaeSorologiaReagentePreenchida(key: string, getValue: ValueGetter): boolean {
  if (!isMaeSorologiaReagenteRequired(key, getValue)) return true;
  return isSorologiaReagenteInformada(getValue(key));
}

/** Campo 37 — Sim/Não obrigatório para cada vírus visível conforme o tipo de exposição. */
export function collectHepatiteCriancaMaeSorologiaErrors(
  formData: Record<string, unknown>,
  visible: Record<string, boolean> = {},
  fieldLabels: Record<string, string> = {},
): FieldValidationError[] {
  const getValue: ValueGetter = (key) => get(formData, key);
  const errors: FieldValidationError[] = [];

  const keys: string[] = [];
  if (tipoExposicaoMostraHbv(get(formData, TIPO_EXPOSICAO_HEPATITE_KEY))) {
    keys.push(MAE_SOROLOGIA_REAGENTE_HBV_KEY);
  }
  if (tipoExposicaoMostraHcv(get(formData, TIPO_EXPOSICAO_HEPATITE_KEY))) {
    keys.push(MAE_SOROLOGIA_REAGENTE_HCV_KEY);
  }

  for (const key of keys) {
    if (visible[key] === false) continue;
    if (!isMaeSorologiaReagenteRequired(key, getValue)) continue;
    if (isSorologiaReagenteInformada(getValue(key))) continue;

    const label = fieldLabels[key] ?? DEFAULT_LABELS[key] ?? key;
    errors.push({
      field: key,
      message: `${label} é obrigatório (informe Sim ou Não)`,
      code: 'REQUIRED',
    });
  }

  return errors;
}

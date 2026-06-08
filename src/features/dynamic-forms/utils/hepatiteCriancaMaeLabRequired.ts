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

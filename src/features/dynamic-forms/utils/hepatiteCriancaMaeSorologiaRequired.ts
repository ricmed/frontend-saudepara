import {
  TIPO_EXPOSICAO_HEPATITE_KEY,
  tipoExposicaoMostraHbv,
  tipoExposicaoMostraHcv,
} from './hepatiteCriancaExposicao';

export const MAE_SOROLOGIA_REAGENTE_HBV_KEY = 'mae.lab.sorologia_reagente_hepatite_b';
export const MAE_SOROLOGIA_REAGENTE_HCV_KEY = 'mae.lab.sorologia_reagente_hepatite_c';

const SINAN_SIM = '1';
const SINAN_NAO = '2';

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

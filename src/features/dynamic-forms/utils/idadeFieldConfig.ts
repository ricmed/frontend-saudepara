export type IdadeFieldSchema = {
  somenteAnos?: boolean;
  somenteMeses?: boolean;
  idadeMaxMeses?: number;
};
export function isIdadeMesesComoTotal(field: IdadeFieldSchema, idadeMaxMesesCampo: number): boolean {
  return Boolean(field.somenteMeses) || idadeMaxMesesCampo > 11;
}

export function getIdadeFieldDefaultUnidade(
  field: IdadeFieldSchema,
  idadeMaxMesesCampo: number,
  meses?: number,
): 'anos' | 'meses' {
  if (field.somenteAnos) return 'anos';
  if (field.somenteMeses || isIdadeMesesComoTotal(field, idadeMaxMesesCampo)) return 'meses';
  if (meses !== undefined) return meses >= 12 ? 'anos' : 'meses';
  return 'anos';
}

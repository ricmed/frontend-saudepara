/** Campo principal — timing vacina HBV + imunoglobulina na maternidade (áudio 10). */
export const MATERNIDADE_HBV_HBIG_KEY = 'crianca.vacina_hepatite_b_maternidade';

export const MATERNIDADE_NAO_REALIZADO_QUAL_KEY = 'crianca.maternidade_hbv_hbig_nao_realizado_qual';

export const MATERNIDADE_VACINA_DATA_KEY = 'crianca.maternidade_vacina_hbv_data';

export const MATERNIDADE_HBIG_DATA_KEY = 'crianca.imunoglobulina_hbig_data';

export const MATERNIDADE_ANTES_24H = '1';
export const MATERNIDADE_APOS_24H = '2';
export const MATERNIDADE_NAO_REALIZADO = '4';

export const MATERNIDADE_NAO_REALIZADO_QUAL_OPTIONS = [
  { value: 'vacina', label: 'Não foi realizada a vacina' },
  { value: 'imunoglobulina', label: 'Não foi realizada a imunoglobulina' },
  { value: 'ambos', label: 'Não foi realizado nenhuma das duas (vacina e imunoglobulina)' },
] as const;

export function maternidadeHbvHbigRealizado(maternidadeCode: unknown): boolean {
  const code = String(maternidadeCode ?? '');
  return code === MATERNIDADE_ANTES_24H || code === MATERNIDADE_APOS_24H;
}

export function maternidadeHbvHbigNaoRealizado(maternidadeCode: unknown): boolean {
  return String(maternidadeCode ?? '') === MATERNIDADE_NAO_REALIZADO;
}

export function isMaternidadeNaoRealizadoQualRequired(maternidadeCode: unknown): boolean {
  return maternidadeHbvHbigNaoRealizado(maternidadeCode);
}

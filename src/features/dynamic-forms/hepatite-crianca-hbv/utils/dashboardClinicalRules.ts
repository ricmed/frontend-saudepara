import {
  tipoExposicaoMostraHbv,
  tipoExposicaoMostraHcv,
} from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';
import {
  MATERNIDADE_NAO_REALIZADO,
  maternidadeHbvHbigRealizado,
} from '@/features/dynamic-forms/utils/hepatiteCriancaMaternidadeHbvHbig';
import { shouldShowCriancaLabEsquema2Repeticao } from '@/features/dynamic-forms/utils/criancaLabEsquema2Repeticao';
import type { HepatiteCriancaSubmission } from '../types';

export const SINAN_SIM = '1';
export const SINAN_NAO = '2';
export const SOROLOGIA_REAGENTE = '1';
export const SOROLOGIA_NAO_REAGENTE = '2';
export const SOROLOGIA_NAO_REALIZADO = '4';

export const ESQUEMA1_IDADE_MIN = 9;
export const ESQUEMA1_IDADE_MAX = 15;
export const HCV_JANELA_3_6_MIN = 3;
export const HCV_JANELA_3_6_MAX = 6;
export const HCV_18M_IDADE_MIN = 18;

const ESQUEMA1_MARKERS: Array<keyof HepatiteCriancaSubmission> = [
  'labE1Hbsag',
  'labE1AntiHbs',
  'labE1HbvDna',
];

export function isSinanSim(value: string): boolean {
  return String(value ?? '').trim() === SINAN_SIM;
}

export function isSorologiaReagente(value: string): boolean {
  return String(value ?? '').trim() === SOROLOGIA_REAGENTE;
}

export function isLabResultInformado(value: string): boolean {
  const code = String(value ?? '').trim();
  return code === SOROLOGIA_REAGENTE || code === SOROLOGIA_NAO_REAGENTE;
}

export function isMaeHbsagPositivo(row: HepatiteCriancaSubmission): boolean {
  return isSorologiaReagente(row.maeLabHbvHbsag) || isSinanSim(row.maeSorologiaReagenteHbv);
}

export function isHcvMaternoExposicao(row: HepatiteCriancaSubmission): boolean {
  return tipoExposicaoMostraHcv(row.tipoExposicao);
}

export function isElegivelEsquema1(row: HepatiteCriancaSubmission): boolean {
  if (!tipoExposicaoMostraHbv(row.tipoExposicao)) return false;
  return idadeNaJanela(row.idadeMeses, ESQUEMA1_IDADE_MIN, ESQUEMA1_IDADE_MAX);
}

export function isElegivelHcv36(row: HepatiteCriancaSubmission): boolean {
  if (!isHcvMaternoExposicao(row)) return false;
  return idadeNaJanela(row.idadeMeses, HCV_JANELA_3_6_MIN, HCV_JANELA_3_6_MAX);
}

export function isElegivelHcv18(row: HepatiteCriancaSubmission): boolean {
  if (!isHcvMaternoExposicao(row)) return false;
  return row.idadeMeses !== null && row.idadeMeses >= HCV_18M_IDADE_MIN;
}

export function isEsquema1Examinado(row: HepatiteCriancaSubmission): boolean {
  return ESQUEMA1_MARKERS.some((key) => isLabResultInformado(row[key]));
}

export function isEsquema1Completo(row: HepatiteCriancaSubmission): boolean {
  return ESQUEMA1_MARKERS.every((key) => isLabResultInformado(row[key]));
}

export function isEsquema2Elegivel(row: HepatiteCriancaSubmission): boolean {
  if (!tipoExposicaoMostraHbv(row.tipoExposicao)) return false;
  return shouldShowCriancaLabEsquema2Repeticao(row.labE1AntiHbs);
}

export function isEsquema2Examinado(row: HepatiteCriancaSubmission): boolean {
  return (
    isLabResultInformado(row.labE2Hbsag) ||
    isLabResultInformado(row.labE2AntiHbs) ||
    isLabResultInformado(row.labE2HbvDna)
  );
}

export function recebeuHbigNaMaternidade(row: HepatiteCriancaSubmission): boolean {
  if (maternidadeHbvHbigRealizado(row.vacinaMaternidade)) return true;
  if (isSinanSim(row.imunoglobulinaHbig)) return true;
  return false;
}

export function semHbigNaMaternidade(row: HepatiteCriancaSubmission): boolean {
  if (String(row.vacinaMaternidade) === MATERNIDADE_NAO_REALIZADO) {
    const qual = row.maternidadeNaoRealizadoQual;
    return qual === 'imunoglobulina' || qual === 'ambos';
  }
  if (row.imunoglobulinaHbig === SINAN_NAO) return true;
  return false;
}

export function doseVacinaAplicada(value: string): boolean {
  return isSinanSim(value);
}

export function dose1Aplicada(row: HepatiteCriancaSubmission): boolean {
  return maternidadeHbvHbigRealizado(row.vacinaMaternidade) || doseVacinaAplicada(row.vacinaDose1);
}

export function esquemaVacinalCompleto(row: HepatiteCriancaSubmission): boolean {
  return (
    dose1Aplicada(row) &&
    doseVacinaAplicada(row.vacinaDose2) &&
    doseVacinaAplicada(row.vacinaDose3) &&
    doseVacinaAplicada(row.vacinaDose4)
  );
}

export function idadeNaJanela(meses: number | null, min: number, max: number): boolean {
  if (meses === null) return false;
  return meses >= min && meses <= max;
}

export type MedicamentoCategoria =
  | 'Tenofovir'
  | 'Entecavir'
  | 'Lamivudina'
  | 'Outro informado'
  | 'Não informado'
  | 'Sem tratamento';

export function classifyMedicamentoPrenatal(row: HepatiteCriancaSubmission): MedicamentoCategoria {
  if (row.prenatalTratamentoHepatiteB === SINAN_NAO) {
    return 'Sem tratamento';
  }
  const texto = String(row.prenatalMedicamento ?? '').trim().toLowerCase();
  if (!texto) {
    return row.prenatalTratamentoHepatiteB === SINAN_SIM ? 'Não informado' : 'Não informado';
  }
  if (texto.includes('tenofovir') || texto.includes('tdf') || texto.includes('taf')) return 'Tenofovir';
  if (texto.includes('entecavir')) return 'Entecavir';
  if (texto.includes('lamivudina') || texto.includes('3tc')) return 'Lamivudina';
  return 'Outro informado';
}

export type HbsagTimingLabel = 'Antes do pré-natal' | 'Durante o pré-natal' | 'Maternidade' | 'Não informado';

export function resolveHbsagTimingLabels(row: HepatiteCriancaSubmission): HbsagTimingLabel[] {
  const labels: HbsagTimingLabel[] = [];
  if (isSinanSim(row.maeHbQuandoAntesPrenatal)) labels.push('Antes do pré-natal');
  if (isSinanSim(row.maeHbQuandoDurantePrenatal)) labels.push('Durante o pré-natal');
  if (isSinanSim(row.maeHbQuandoMaternidade)) labels.push('Maternidade');
  return labels.length > 0 ? labels : ['Não informado'];
}

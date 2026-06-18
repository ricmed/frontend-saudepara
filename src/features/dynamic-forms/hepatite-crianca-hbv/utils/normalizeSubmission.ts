import { getValueAtPath } from '@/features/dynamic-forms/utils/formResponsesListUtils';
import {
  TIPO_EXPOSICAO_AMBOS,
  TIPO_EXPOSICAO_HBV,
  TIPO_EXPOSICAO_HCV,
  TIPO_EXPOSICAO_HEPATITE_KEY,
} from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';
import { calcularIdadeMesesFromBirthDate } from '@/features/dynamic-forms/utils/hepatiteCriancaHbvLimits';
import type { HepatiteCriancaSubmission } from '../types';

function strField(raw: unknown): string {
  return String(raw ?? '').trim();
}

function resolveIdadeMeses(dataJson: Record<string, unknown>): number | null {
  const dataNasc = getValueAtPath(dataJson, 'paciente.data_nascimento');
  if (dataNasc) {
    const meses = calcularIdadeMesesFromBirthDate(String(dataNasc));
    if (meses !== undefined) return meses;
  }
  const idadeRaw = getValueAtPath(dataJson, 'paciente.idade');
  if (idadeRaw != null && idadeRaw !== '') {
    const n = Number(idadeRaw);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return null;
}

function normalizeIbge(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw).replace(/\D/g, '').trim();
}

function parseCoord(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(String(raw).replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}

export function normalizeHepatiteSubmission(
  id: number,
  dataJson: Record<string, unknown>,
): HepatiteCriancaSubmission {
  const tipo = String(getValueAtPath(dataJson, TIPO_EXPOSICAO_HEPATITE_KEY) ?? '').trim();
  const lat = parseCoord(getValueAtPath(dataJson, 'residencia.geo_campo_1'));
  const lng = parseCoord(getValueAtPath(dataJson, 'residencia.geo_campo_2'));

  let dtNotificacao: string | null = null;
  const dtRaw = getValueAtPath(dataJson, 'notificacao.dt_notificacao');
  if (dtRaw) {
    const parsed = new Date(String(dtRaw));
    if (!Number.isNaN(parsed.getTime())) dtNotificacao = parsed.toISOString();
  }

  let dataEncerramento: string | null = null;
  const encRaw = getValueAtPath(dataJson, 'conclusao.data_encerramento');
  if (encRaw) {
    const parsed = new Date(String(encRaw));
    if (!Number.isNaN(parsed.getTime())) dataEncerramento = parsed.toISOString();
  }

  return {
    id,
    dtNotificacao,
    tipoExposicao: tipo,
    municipioNotificacaoIbge: normalizeIbge(getValueAtPath(dataJson, 'notificacao.municipio_notificacao_ibge')),
    municipioResidenciaIbge: normalizeIbge(getValueAtPath(dataJson, 'residencia.municipio_ibge')),
    nascimentoMunicipioIbge: normalizeIbge(getValueAtPath(dataJson, 'crianca.nascimento_municipio_ibge')),
    dataEncerramento,
    lat,
    lng,
    idadeMeses: resolveIdadeMeses(dataJson),
    maeRacaCor: strField(getValueAtPath(dataJson, 'mae.raca_cor')),
    maeEscolaridade: strField(getValueAtPath(dataJson, 'mae.escolaridade')),
    maeHivAids: strField(getValueAtPath(dataJson, 'mae.hiv_aids')),
    maeSifilis: strField(getValueAtPath(dataJson, 'mae.sifilis')),
    maeSorologiaReagenteHbv: strField(getValueAtPath(dataJson, 'mae.lab.sorologia_reagente_hepatite_b')),
    maeLabHbvHbsag: strField(getValueAtPath(dataJson, 'mae.lab.hbv_hbsag')),
    maeHbQuandoAntesPrenatal: strField(getValueAtPath(dataJson, 'mae.lab.hepatite_b_quando_antes_prenatal')),
    maeHbQuandoDurantePrenatal: strField(getValueAtPath(dataJson, 'mae.lab.hepatite_b_quando_durante_prenatal')),
    maeHbQuandoMaternidade: strField(getValueAtPath(dataJson, 'mae.lab.hepatite_b_quando_maternidade')),
    prenatalFezPrenatal: strField(getValueAtPath(dataJson, 'prenatal.fez_prenatal')),
    prenatalTratamentoHepatiteB: strField(getValueAtPath(dataJson, 'prenatal.tratamento_hepatite_b')),
    prenatalMedicamento: strField(getValueAtPath(dataJson, 'prenatal.medicamento_utilizado')),
    vacinaMaternidade: strField(getValueAtPath(dataJson, 'crianca.vacina_hepatite_b_maternidade')),
    maternidadeNaoRealizadoQual: strField(getValueAtPath(dataJson, 'crianca.maternidade_hbv_hbig_nao_realizado_qual')),
    imunoglobulinaHbig: strField(getValueAtPath(dataJson, 'crianca.imunoglobulina_hbig')),
    vacinaDose1: strField(getValueAtPath(dataJson, 'crianca.vacina_hepatite_b_dose_1')),
    vacinaDose2: strField(getValueAtPath(dataJson, 'crianca.vacina_hepatite_b_dose_2')),
    vacinaDose3: strField(getValueAtPath(dataJson, 'crianca.vacina_hepatite_b_dose_3')),
    vacinaDose4: strField(getValueAtPath(dataJson, 'crianca.vacina_hepatite_b_dose_4')),
    labE1Hbsag: strField(getValueAtPath(dataJson, 'crianca.lab.esquema1.hbsag')),
    labE1AntiHbs: strField(getValueAtPath(dataJson, 'crianca.lab.esquema1.anti_hbs')),
    labE1HbvDna: strField(getValueAtPath(dataJson, 'crianca.lab.esquema1.hbv_dna')),
    labE1Alt: strField(getValueAtPath(dataJson, 'crianca.lab.esquema1.alt')),
    labE2Hbsag: strField(getValueAtPath(dataJson, 'crianca.lab.esquema2.hbsag')),
    labE2AntiHbs: strField(getValueAtPath(dataJson, 'crianca.lab.esquema2.anti_hbs')),
    labE2HbvDna: strField(getValueAtPath(dataJson, 'crianca.lab.esquema2.hbv_dna')),
    acompM36HcvRna: strField(getValueAtPath(dataJson, 'crianca.acomp.m3_6.hcv_rna')),
    acompAntiHcv: strField(getValueAtPath(dataJson, 'crianca.acomp.anti_hcv')),
    acompHcvRna: strField(getValueAtPath(dataJson, 'crianca.acomp.hcv_rna')),
    conclusaoEvolucaoCaso: strField(getValueAtPath(dataJson, 'conclusao.evolucao_caso')),
    conclusaoClassificacaoEtiologica: strField(
      getValueAtPath(dataJson, 'conclusao.classificacao_etiologica'),
    ),
    numeroSinanMae: strField(getValueAtPath(dataJson, 'crianca_hbv.numero_sinan_mae')),
  };
}

export function isHbvMaternoTipo(tipo: string): boolean {
  return tipo === TIPO_EXPOSICAO_HBV || tipo === TIPO_EXPOSICAO_AMBOS;
}

export function isHcvMaternoTipo(tipo: string): boolean {
  return tipo === TIPO_EXPOSICAO_HCV || tipo === TIPO_EXPOSICAO_AMBOS;
}

export function isCasoEncerrado(row: HepatiteCriancaSubmission): boolean {
  return Boolean(row.dataEncerramento);
}

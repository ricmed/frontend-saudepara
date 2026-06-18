import { describe, expect, it } from 'vitest';
import {
  TIPO_EXPOSICAO_HBV,
  TIPO_EXPOSICAO_HCV,
} from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';
import {
  MATERNIDADE_ANTES_24H,
  MATERNIDADE_NAO_REALIZADO,
} from '@/features/dynamic-forms/utils/hepatiteCriancaMaternidadeHbvHbig';
import {
  classifyMedicamentoPrenatal,
  dose1Aplicada,
  esquemaVacinalCompleto,
  isElegivelEsquema1,
  isEsquema1Completo,
  isMaeHbsagPositivo,
  recebeuHbigNaMaternidade,
  SINAN_NAO,
  SINAN_SIM,
  SOROLOGIA_REAGENTE,
  SOROLOGIA_NAO_REAGENTE,
} from './dashboardClinicalRules';
import type { HepatiteCriancaSubmission } from '../types';

function baseRow(overrides: Partial<HepatiteCriancaSubmission> = {}): HepatiteCriancaSubmission {
  return {
    id: 1,
    dtNotificacao: null,
    tipoExposicao: TIPO_EXPOSICAO_HBV,
    municipioNotificacaoIbge: '',
    municipioResidenciaIbge: '',
    nascimentoMunicipioIbge: '',
    dataEncerramento: null,
    lat: null,
    lng: null,
    idadeMeses: 12,
    maeRacaCor: '',
    maeEscolaridade: '',
    maeHivAids: '',
    maeSifilis: '',
    maeSorologiaReagenteHbv: '',
    maeLabHbvHbsag: '',
    maeHbQuandoAntesPrenatal: '',
    maeHbQuandoDurantePrenatal: '',
    maeHbQuandoMaternidade: '',
    prenatalFezPrenatal: '',
    prenatalTratamentoHepatiteB: '',
    prenatalMedicamento: '',
    vacinaMaternidade: '',
    maternidadeNaoRealizadoQual: '',
    imunoglobulinaHbig: '',
    vacinaDose1: '',
    vacinaDose2: '',
    vacinaDose3: '',
    vacinaDose4: '',
    labE1Hbsag: '',
    labE1AntiHbs: '',
    labE1HbvDna: '',
    labE1Alt: '',
    labE2Hbsag: '',
    labE2AntiHbs: '',
    labE2HbvDna: '',
    acompM36HcvRna: '',
    acompAntiHcv: '',
    acompHcvRna: '',
    conclusaoEvolucaoCaso: '',
    conclusaoClassificacaoEtiologica: '',
    numeroSinanMae: '',
    ...overrides,
  };
}

describe('dashboardClinicalRules', () => {
  it('identifica mãe HBsAg+ por marcador ou sorologia', () => {
    expect(isMaeHbsagPositivo(baseRow({ maeLabHbvHbsag: SOROLOGIA_REAGENTE }))).toBe(true);
    expect(isMaeHbsagPositivo(baseRow({ maeSorologiaReagenteHbv: SINAN_SIM }))).toBe(true);
    expect(isMaeHbsagPositivo(baseRow())).toBe(false);
  });

  it('elegibilidade esquema 1 na janela 9–15 meses (HBV)', () => {
    expect(isElegivelEsquema1(baseRow({ idadeMeses: 8 }))).toBe(false);
    expect(isElegivelEsquema1(baseRow({ idadeMeses: 10 }))).toBe(true);
    expect(isElegivelEsquema1(baseRow({ idadeMeses: 16 }))).toBe(false);
    expect(isElegivelEsquema1(baseRow({ idadeMeses: 10, tipoExposicao: TIPO_EXPOSICAO_HCV }))).toBe(
      false,
    );
  });

  it('esquema 1 completo exige HBsAg, Anti-HBs e HBV-DNA informados', () => {
    const incompleto = baseRow({
      labE1Hbsag: SOROLOGIA_REAGENTE,
      labE1AntiHbs: SOROLOGIA_NAO_REAGENTE,
    });
    expect(isEsquema1Completo(incompleto)).toBe(false);
    expect(
      isEsquema1Completo(
        baseRow({
          labE1Hbsag: SOROLOGIA_REAGENTE,
          labE1AntiHbs: SOROLOGIA_NAO_REAGENTE,
          labE1HbvDna: SOROLOGIA_NAO_REAGENTE,
        }),
      ),
    ).toBe(true);
  });

  it('dose 1 conta maternidade ou dose 1 aplicada', () => {
    expect(dose1Aplicada(baseRow({ vacinaMaternidade: MATERNIDADE_ANTES_24H }))).toBe(true);
    expect(dose1Aplicada(baseRow({ vacinaDose1: SINAN_SIM }))).toBe(true);
    expect(dose1Aplicada(baseRow())).toBe(false);
  });

  it('esquema vacinal completo exige 4 doses', () => {
    expect(
      esquemaVacinalCompleto(
        baseRow({
          vacinaMaternidade: MATERNIDADE_ANTES_24H,
          vacinaDose2: SINAN_SIM,
          vacinaDose3: SINAN_SIM,
          vacinaDose4: SINAN_SIM,
        }),
      ),
    ).toBe(true);
  });

  it('HBIG recebido via maternidade ou campo legado', () => {
    expect(recebeuHbigNaMaternidade(baseRow({ vacinaMaternidade: MATERNIDADE_ANTES_24H }))).toBe(
      true,
    );
    expect(recebeuHbigNaMaternidade(baseRow({ imunoglobulinaHbig: SINAN_SIM }))).toBe(true);
    expect(
      recebeuHbigNaMaternidade(
        baseRow({ vacinaMaternidade: MATERNIDADE_NAO_REALIZADO, imunoglobulinaHbig: SINAN_NAO }),
      ),
    ).toBe(false);
  });

  it('classifica medicamento do pré-natal', () => {
    expect(
      classifyMedicamentoPrenatal(baseRow({ prenatalTratamentoHepatiteB: SINAN_NAO })),
    ).toBe('Sem tratamento');
    expect(
      classifyMedicamentoPrenatal(
        baseRow({ prenatalMedicamento: 'Tenofovir 300mg', prenatalTratamentoHepatiteB: SINAN_SIM }),
      ),
    ).toBe('Tenofovir');
  });
});

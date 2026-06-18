import { describe, expect, it } from 'vitest';
import { TIPO_EXPOSICAO_HBV } from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';
import { MATERNIDADE_NAO_REALIZADO } from '@/features/dynamic-forms/utils/hepatiteCriancaMaternidadeHbvHbig';
import { SOROLOGIA_REAGENTE } from './dashboardClinicalRules';
import { resolveAlertasAtivos } from './dashboardOutcomeRules';
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
    maeLabHbvHbsag: SOROLOGIA_REAGENTE,
    maeHbQuandoAntesPrenatal: '',
    maeHbQuandoDurantePrenatal: '',
    maeHbQuandoMaternidade: '',
    prenatalFezPrenatal: '',
    prenatalTratamentoHepatiteB: '',
    prenatalMedicamento: '',
    vacinaMaternidade: MATERNIDADE_NAO_REALIZADO,
    maternidadeNaoRealizadoQual: 'imunoglobulina',
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

describe('dashboardOutcomeRules', () => {
  it('gera alerta HBIG para mãe HBsAg+ sem HBIG em caso aberto', () => {
    const alertas = resolveAlertasAtivos(baseRow());
    expect(alertas).toContain('hbig_pendente');
    expect(alertas).toContain('esquema1_pendente');
    expect(alertas).toContain('sem_evolucao');
  });

  it('não gera alertas quando caso está encerrado', () => {
    const alertas = resolveAlertasAtivos(
      baseRow({ dataEncerramento: '2025-06-01T00:00:00.000Z', conclusaoEvolucaoCaso: '2' }),
    );
    expect(alertas).toEqual([]);
  });
});

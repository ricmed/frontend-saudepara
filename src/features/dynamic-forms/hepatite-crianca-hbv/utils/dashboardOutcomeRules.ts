import { CRIANCA_EXPOSTA_HBV_MAX_IDADE_MESES } from '@/features/dynamic-forms/utils/hepatiteCriancaHbvLimits';
import { tipoExposicaoMostraHbv } from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';
import type { HepatiteAlertaTipo, HepatiteCriancaSubmission } from '../types';
import { isCasoEmAberto } from './conclusaoLabels';
import {
  isElegivelEsquema1,
  isElegivelHcv18,
  isElegivelHcv36,
  isEsquema1Examinado,
  isEsquema2Elegivel,
  isEsquema2Examinado,
  isLabResultInformado,
  isMaeHbsagPositivo,
  recebeuHbigNaMaternidade,
} from './dashboardClinicalRules';


export const ALERTA_LABELS: Record<HepatiteAlertaTipo, string> = {
  hbig_pendente: 'IGHAHB pendente (mãe HBsAg+)',
  esquema1_pendente: 'Esquema 1 pendente (9–15m)',
  esquema2_pendente: 'Esquema 2 pendente',
  hcv_36_pendente: 'HCV-RNA 3–6m pendente',
  hcv_18_pendente: 'Sorologia HCV 18m pendente',
  idade_acima_limite: 'Idade acima de 24 meses sem encerramento',
  sem_evolucao: 'Sem evolução do caso informada',
};

export const ALERTA_SEVERIDADE: Record<HepatiteAlertaTipo, 'alta' | 'media' | 'baixa'> = {
  hbig_pendente: 'alta',
  esquema1_pendente: 'alta',
  esquema2_pendente: 'media',
  hcv_36_pendente: 'media',
  hcv_18_pendente: 'media',
  idade_acima_limite: 'baixa',
  sem_evolucao: 'baixa',
};

export function resolveAlertasAtivos(row: HepatiteCriancaSubmission): HepatiteAlertaTipo[] {
  const alertas: HepatiteAlertaTipo[] = [];
  const aberto = isCasoEmAberto(row.dataEncerramento);

  if (
    aberto &&
    tipoExposicaoMostraHbv(row.tipoExposicao) &&
    isMaeHbsagPositivo(row) &&
    !recebeuHbigNaMaternidade(row)
  ) {
    alertas.push('hbig_pendente');
  }

  if (aberto && isElegivelEsquema1(row) && !isEsquema1Examinado(row)) {
    alertas.push('esquema1_pendente');
  }

  if (aberto && isEsquema2Elegivel(row) && !isEsquema2Examinado(row)) {
    alertas.push('esquema2_pendente');
  }

  if (aberto && isElegivelHcv36(row) && !isLabResultInformado(row.acompM36HcvRna)) {
    alertas.push('hcv_36_pendente');
  }

  if (
    aberto &&
    isElegivelHcv18(row) &&
    !isLabResultInformado(row.acompAntiHcv) &&
    !isLabResultInformado(row.acompHcvRna)
  ) {
    alertas.push('hcv_18_pendente');
  }

  if (
    aberto &&
    row.idadeMeses !== null &&
    row.idadeMeses > CRIANCA_EXPOSTA_HBV_MAX_IDADE_MESES
  ) {
    alertas.push('idade_acima_limite');
  }

  if (aberto && !row.conclusaoEvolucaoCaso) {
    alertas.push('sem_evolucao');
  }

  return alertas;
}

export function temAlertaPrioritario(row: HepatiteCriancaSubmission): boolean {
  return resolveAlertasAtivos(row).some((a) => ALERTA_SEVERIDADE[a] === 'alta');
}

import { useMemo } from 'react';
import { tipoExposicaoMostraHbv } from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';
import { maternidadeHbvHbigRealizado } from '@/features/dynamic-forms/utils/hepatiteCriancaMaternidadeHbvHbig';
import type {
  HepatiteChartItem,
  HepatiteCoberturaVacinalCharts,
  HepatiteCriancaSubmission,
  HepatitePerfilMaternoCharts,
  HepatiteSeguimentoLabCharts,
  ReferenceLabelMaps,
} from '../types';
import {
  classifyMedicamentoPrenatal,
  dose1Aplicada,
  esquemaVacinalCompleto,
  isElegivelEsquema1,
  isElegivelHcv18,
  isElegivelHcv36,
  isEsquema1Completo,
  isEsquema1Examinado,
  isEsquema2Elegivel,
  isEsquema2Examinado,
  isLabResultInformado,
  isMaeHbsagPositivo,
  isSinanSim,
  isSorologiaReagente,
  recebeuHbigNaMaternidade,
  resolveHbsagTimingLabels,
  semHbigNaMaternidade,
  doseVacinaAplicada,
  SOROLOGIA_NAO_REALIZADO,
} from '../utils/dashboardClinicalRules';
import { resolveReferenceLabel } from '../utils/referenceLabelMaps';

type Args = {
  dadosFiltrados: HepatiteCriancaSubmission[];
  referenceMaps: ReferenceLabelMaps;
};

function countBy<T>(
  rows: T[],
  pick: (row: T) => string | string[],
): HepatiteChartItem[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const keys = pick(row);
    const list = Array.isArray(keys) ? keys : [keys];
    for (const key of list) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function useHepatiteCriancaDashboardClinicalCharts({
  dadosFiltrados,
  referenceMaps,
}: Args) {
  const perfilMaterno = useMemo((): HepatitePerfilMaternoCharts => {
    const fezPrenatalInformado = dadosFiltrados.filter((r) => r.prenatalFezPrenatal !== '');
    return {
      racaCor: countBy(dadosFiltrados, (r) =>
        resolveReferenceLabel(r.maeRacaCor, referenceMaps.raca),
      ),
      escolaridade: countBy(dadosFiltrados, (r) =>
        resolveReferenceLabel(r.maeEscolaridade, referenceMaps.escolaridade),
      ),
      hbsagTiming: countBy(
        dadosFiltrados.filter((r) => tipoExposicaoMostraHbv(r.tipoExposicao)),
        (r) => resolveHbsagTimingLabels(r),
      ),
      medicamentos: countBy(dadosFiltrados, (r) => classifyMedicamentoPrenatal(r)),
      kpis: {
        total: dadosFiltrados.length,
        fezPrenatalSim: fezPrenatalInformado.filter((r) => isSinanSim(r.prenatalFezPrenatal)).length,
        fezPrenatalInformado: fezPrenatalInformado.length,
        hivSim: dadosFiltrados.filter((r) => isSinanSim(r.maeHivAids)).length,
        sifilisSim: dadosFiltrados.filter((r) => isSinanSim(r.maeSifilis)).length,
      },
    };
  }, [dadosFiltrados, referenceMaps]);

  const coberturaVacinal = useMemo((): HepatiteCoberturaVacinalCharts => {
    const hbvRows = dadosFiltrados.filter((r) => tipoExposicaoMostraHbv(r.tipoExposicao));
    const elegiveisHbig = hbvRows.filter((r) => isMaeHbsagPositivo(r));
    const hbigRecebido = elegiveisHbig.filter((r) => recebeuHbigNaMaternidade(r)).length;
    const semHbig = elegiveisHbig.filter(
      (r) => !recebeuHbigNaMaternidade(r) && semHbigNaMaternidade(r),
    ).length;
    const alertaHbsagSemHbig = elegiveisHbig.filter((r) => !recebeuHbigNaMaternidade(r)).length;

    const doseCounts = [
      { name: '1ª dose', value: hbvRows.filter((r) => dose1Aplicada(r)).length },
      { name: '2ª dose', value: hbvRows.filter((r) => doseVacinaAplicada(r.vacinaDose2)).length },
      { name: '3ª dose', value: hbvRows.filter((r) => doseVacinaAplicada(r.vacinaDose3)).length },
      { name: '4ª dose', value: hbvRows.filter((r) => doseVacinaAplicada(r.vacinaDose4)).length },
    ];

    return {
      alertaHbsagSemHbig,
      funilDoses: doseCounts,
      hbigRamo: [
        { name: 'Elegíveis (HBsAg+)', value: elegiveisHbig.length },
        { name: 'Receberam IGHAHB', value: hbigRecebido },
        { name: 'Sem IGHAHB', value: semHbig },
      ],
      kpis: {
        esquemaCompleto: hbvRows.filter((r) => esquemaVacinalCompleto(r)).length,
        hbigRecebido,
        vacinaMaternidade: hbvRows.filter((r) => maternidadeHbvHbigRealizado(r.vacinaMaternidade)).length,
        elegiveisHbig: elegiveisHbig.length,
        semHbig,
        totalHbv: hbvRows.length,
      },
    };
  }, [dadosFiltrados]);

  const seguimentoLab = useMemo((): HepatiteSeguimentoLabCharts => {
    const elegiveisE1 = dadosFiltrados.filter((r) => isElegivelEsquema1(r));
    const examinadasE1 = elegiveisE1.filter((r) => isEsquema1Examinado(r));
    const pendentesE1 = elegiveisE1.filter((r) => !isEsquema1Examinado(r));
    const completasE1 = elegiveisE1.filter((r) => isEsquema1Completo(r));

    const elegiveisE2 = dadosFiltrados.filter((r) => isEsquema2Elegivel(r));
    const examinadasE2 = elegiveisE2.filter((r) => isEsquema2Examinado(r));

    const elegiveisHcv36 = dadosFiltrados.filter((r) => isElegivelHcv36(r));
    const realizadasHcv36 = elegiveisHcv36.filter((r) => isLabResultInformado(r.acompM36HcvRna));

    const elegiveisHcv18 = dadosFiltrados.filter((r) => isElegivelHcv18(r));
    const realizadasHcv18 = elegiveisHcv18.filter(
      (r) => isLabResultInformado(r.acompAntiHcv) || isLabResultInformado(r.acompHcvRna),
    );

    const gapLaboratorial =
      pendentesE1.length +
      elegiveisE2.filter((r) => !isEsquema2Examinado(r)).length +
      elegiveisHcv36.filter((r) => !isLabResultInformado(r.acompM36HcvRna)).length +
      elegiveisHcv18.filter(
        (r) => !isLabResultInformado(r.acompAntiHcv) && !isLabResultInformado(r.acompHcvRna),
      ).length;

    return {
      esquema1: {
        elegiveis: elegiveisE1.length,
        examinadas: examinadasE1.length,
        pendentes: pendentesE1.length,
        hbsagPos: examinadasE1.filter((r) => isSorologiaReagente(r.labE1Hbsag)).length,
        antiHbsPos: examinadasE1.filter((r) => isSorologiaReagente(r.labE1AntiHbs)).length,
        hbvDnaPos: examinadasE1.filter((r) => isSorologiaReagente(r.labE1HbvDna)).length,
        inconclusivo: examinadasE1.filter((r) =>
          [r.labE1Hbsag, r.labE1AntiHbs, r.labE1HbvDna].some((v) => String(v) === SOROLOGIA_NAO_REALIZADO),
        ).length,
        completas: completasE1.length,
      },
      esquema2: {
        elegiveis: elegiveisE2.length,
        examinadas: examinadasE2.length,
        pendentes: elegiveisE2.length - examinadasE2.length,
        antiHbsPos: examinadasE2.filter((r) => isSorologiaReagente(r.labE2AntiHbs)).length,
      },
      hcv36: {
        elegiveis: elegiveisHcv36.length,
        realizadas: realizadasHcv36.length,
        reagentes: realizadasHcv36.filter((r) => isSorologiaReagente(r.acompM36HcvRna)).length,
      },
      hcv18: {
        elegiveis: elegiveisHcv18.length,
        realizadas: realizadasHcv18.length,
        reagentes: realizadasHcv18.filter(
          (r) => isSorologiaReagente(r.acompAntiHcv) || isSorologiaReagente(r.acompHcvRna),
        ).length,
      },
      gapLaboratorial,
      alertaEsquema1Pendente: pendentesE1.length,
    };
  }, [dadosFiltrados]);

  return { perfilMaterno, coberturaVacinal, seguimentoLab };
}

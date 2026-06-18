import { useMemo } from 'react';
import {
  TIPO_EXPOSICAO_AMBOS,
  TIPO_EXPOSICAO_HBV,
  TIPO_EXPOSICAO_HCV,
} from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';
import { calcularSemanaEpidemiologica } from '@/utils/timezoneUtils';
import type {
  HepatiteChartItem,
  HepatiteCriancaSubmission,
  HepatiteDashboardStats,
  HepatiteMapaPonto,
  HepatiteSemanaEpidemiologicaPoint,
  HepatiteSerieTemporalPoint,
} from '../types';
import { isCasoEncerrado, isHbvMaternoTipo, isHcvMaternoTipo } from '../utils/normalizeSubmission';
import { resolveMunicipioLabel, type MunicipioLabelMaps } from '../utils/municipioIbgeLabels';

type Args = {
  dadosFiltrados: HepatiteCriancaSubmission[];
  municipioMaps: MunicipioLabelMaps;
};

function aggregateMunicipios(
  rows: HepatiteCriancaSubmission[],
  pickIbge: (row: HepatiteCriancaSubmission) => string,
  maps: MunicipioLabelMaps,
): HepatiteChartItem[] {
  const counts = new Map<string, HepatiteChartItem>();
  for (const row of rows) {
    const ibge = pickIbge(row);
    const key = ibge || '__vazio__';
    const name = ibge ? resolveMunicipioLabel(ibge, maps) : 'Não informado';
    const existing = counts.get(key);
    if (existing) {
      existing.value += 1;
    } else {
      counts.set(key, { id: ibge || undefined, name, value: 1 });
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.value - a.value);
}

export function useHepatiteCriancaDashboardCharts({
  dadosFiltrados,
  municipioMaps,
}: Args) {
  const stats: HepatiteDashboardStats = useMemo(
    () => ({
      total: dadosFiltrados.length,
      comHbvMaterno: dadosFiltrados.filter((r) => isHbvMaternoTipo(r.tipoExposicao)).length,
      comHcvMaterno: dadosFiltrados.filter((r) => isHcvMaternoTipo(r.tipoExposicao)).length,
      casosEncerrados: dadosFiltrados.filter((r) => isCasoEncerrado(r)).length,
    }),
    [dadosFiltrados],
  );

  const dadosSerieTemporal = useMemo((): HepatiteSerieTemporalPoint[] => {
    const dateMap = new Map<string, HepatiteSerieTemporalPoint>();

    for (const row of dadosFiltrados) {
      if (!row.dtNotificacao) continue;
      const date = new Date(row.dtNotificacao);
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Belem' });
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { date: '', total: 0, HBV: 0, HCV: 0, Ambos: 0 });
      }
      const bucket = dateMap.get(dateStr)!;
      bucket.total += 1;
      if (row.tipoExposicao === TIPO_EXPOSICAO_HBV) bucket.HBV += 1;
      else if (row.tipoExposicao === TIPO_EXPOSICAO_HCV) bucket.HCV += 1;
      else if (row.tipoExposicao === TIPO_EXPOSICAO_AMBOS) bucket.Ambos += 1;
    }

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([iso, data]) => ({
        ...data,
        date: `${iso.slice(8, 10)}/${iso.slice(5, 7)}`,
      }));
  }, [dadosFiltrados]);

  const dadosSemanaEpidemiologica = useMemo((): HepatiteSemanaEpidemiologicaPoint[] => {
    const seMap = new Map<string, HepatiteSemanaEpidemiologicaPoint>();

    for (const row of dadosFiltrados) {
      if (!row.dtNotificacao) continue;
      const se = calcularSemanaEpidemiologica(row.dtNotificacao);
      if (!se) continue;
      const key = `${se.ano}-${String(se.semana).padStart(2, '0')}`;
      if (!seMap.has(key)) {
        seMap.set(key, {
          name: `SE ${String(se.semana).padStart(2, '0')}`,
          ano: se.ano,
          value: 0,
        });
      }
      seMap.get(key)!.value += 1;
    }

    return Array.from(seMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, d]) => d);
  }, [dadosFiltrados]);

  const dadosMunicipiosNotificacao = useMemo(
    () =>
      aggregateMunicipios(
        dadosFiltrados,
        (r) => r.municipioNotificacaoIbge,
        municipioMaps,
      ),
    [dadosFiltrados, municipioMaps],
  );

  const dadosMunicipiosResidencia = useMemo(
    () =>
      aggregateMunicipios(
        dadosFiltrados,
        (r) => r.municipioResidenciaIbge,
        municipioMaps,
      ),
    [dadosFiltrados, municipioMaps],
  );

  const mapaPontos = useMemo((): HepatiteMapaPonto[] => {
    const bucket = new Map<string, HepatiteMapaPonto>();
    for (const row of dadosFiltrados) {
      if (row.lat === null || row.lng === null) continue;
      const key = `${row.lat.toFixed(5)}:${row.lng.toFixed(5)}`;
      const existing = bucket.get(key);
      if (existing) {
        existing.fichasCount += 1;
      } else {
        bucket.set(key, {
          id: key,
          lat: row.lat,
          lng: row.lng,
          fichasCount: 1,
          tipo: 'residencia',
        });
      }
    }
    return Array.from(bucket.values());
  }, [dadosFiltrados]);

  return {
    stats,
    dadosSerieTemporal,
    dadosSemanaEpidemiologica,
    dadosMunicipiosNotificacao,
    dadosMunicipiosResidencia,
    mapaPontos,
  };
}

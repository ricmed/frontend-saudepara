import {
  sumResumoDashColumn,
  type EntomologiaResumoDashRow,
  type EntomologiaSubmissionLike,
} from './entomologiaDashboardTables';

export type EntomologiaDashboardKpis = {
  relatorios: number;
  municipios: number;
  tubosComLarvas: number;
  totalAeg: number;
  totalAlb: number;
  municipiosComAlb: number;
};

export function computeEntomologiaDashboardKpis(
  submissions: EntomologiaSubmissionLike[],
  resumoRows: EntomologiaResumoDashRow[],
): EntomologiaDashboardKpis {
  const municipioIds = new Set(resumoRows.map((r) => r.municipio_id).filter(Boolean));
  const municipiosComAlb = new Set(
    resumoRows.filter((r) => r.total_alb > 0).map((r) => r.municipio_id).filter(Boolean),
  );

  return {
    relatorios: submissions.length,
    municipios: municipioIds.size,
    tubosComLarvas: sumResumoDashColumn(resumoRows, 'tubos_com_larvas'),
    totalAeg: sumResumoDashColumn(resumoRows, 'total_aeg'),
    totalAlb: sumResumoDashColumn(resumoRows, 'total_alb'),
    municipiosComAlb: municipiosComAlb.size,
  };
}

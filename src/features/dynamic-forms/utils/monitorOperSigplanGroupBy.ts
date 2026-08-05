import type { FormSchema } from '@/services/FormService';
import {
  indexGeoMunicipiosById,
  resolveSigplanGroupKey,
  type GeoDimensoesCatalog,
  type SigplanGroupBy,
} from './monitorOperGeoDimensoes';
import {
  buildSigplanCustoByMunicipio,
  type SigplanMunicipioCustoRow,
} from './monitorOperSigplanCusto';
import {
  buildSigplanImpactosByGroup,
  type SigplanImpactosByGroup,
} from './monitorOperSigplanImpactos';
import {
  buildSigplanMunicipioPresenceMatrix,
  type SigplanMunicipioPresenceRow,
} from './monitorOperSigplanPanel';
import type { MonitorOperCustoSums, MonitorOperRow } from './monitorOperRegionalReport';

export type SigplanPresenceGroupRow = {
  groupKey: string;
  groupLabel: string;
  municipioCount: number;
  capacitacao: boolean;
  capacitacaoPessoas: number;
  avaliacao: boolean;
  avaliacaoModalidades: string[];
  acao_complementar: boolean;
  acaoComplementarPessoas: number;
};

export type SigplanCustoGroupRow = MonitorOperCustoSums & {
  groupKey: string;
  groupLabel: string;
  municipioCount: number;
};

/**
 * Agrega matriz de presença por eixo geográfico.
 * Sim no grupo = ≥1 município do grupo com Sim; pessoas = soma das linhas municipais (já rateadas na matriz).
 */
export function aggregateSigplanPresenceByGroup(
  matrix: SigplanMunicipioPresenceRow[],
  groupBy: SigplanGroupBy,
  catalog: GeoDimensoesCatalog | null | undefined,
  municipioLabels: Record<string, string>,
  crsLabels: Record<string, string>,
): SigplanPresenceGroupRow[] {
  if (groupBy === 'municipio') {
    return matrix.map((r) => ({
      groupKey: `mun:${r.municipioId}`,
      groupLabel:
        municipioLabels[r.municipioId] ||
        catalog?.municipios.find((m) => String(m.idtipo_municipio) === r.municipioId)?.descricao ||
        `Município (${r.municipioId})`,
      municipioCount: 1,
      capacitacao: r.capacitacao,
      capacitacaoPessoas: r.capacitacaoPessoas,
      avaliacao: r.avaliacao,
      avaliacaoModalidades: r.avaliacaoModalidades,
      acao_complementar: r.acao_complementar,
      acaoComplementarPessoas: r.acaoComplementarPessoas,
    }));
  }

  const byId = indexGeoMunicipiosById(catalog?.municipios ?? []);
  const acc = new Map<
    string,
    {
      label: string;
      muns: Set<string>;
      capacitacao: boolean;
      capacitacaoPessoas: number;
      avaliacao: boolean;
      modalidades: Set<string>;
      acao_complementar: boolean;
      acaoComplementarPessoas: number;
    }
  >();

  for (const row of matrix) {
    const dim = byId.get(row.municipioId);
    const { key, label } = resolveSigplanGroupKey(row.municipioId, groupBy, dim, municipioLabels, crsLabels);
    let g = acc.get(key);
    if (!g) {
      g = {
        label,
        muns: new Set(),
        capacitacao: false,
        capacitacaoPessoas: 0,
        avaliacao: false,
        modalidades: new Set(),
        acao_complementar: false,
        acaoComplementarPessoas: 0,
      };
      acc.set(key, g);
    }
    g.muns.add(row.municipioId);
    if (row.capacitacao) g.capacitacao = true;
    g.capacitacaoPessoas += row.capacitacaoPessoas;
    if (row.avaliacao) g.avaliacao = true;
    for (const m of row.avaliacaoModalidades) g.modalidades.add(m);
    if (row.acao_complementar) g.acao_complementar = true;
    g.acaoComplementarPessoas += row.acaoComplementarPessoas;
  }

  return [...acc.entries()]
    .map(([groupKey, g]) => ({
      groupKey,
      groupLabel: g.label,
      municipioCount: g.muns.size,
      capacitacao: g.capacitacao,
      capacitacaoPessoas: g.capacitacaoPessoas,
      avaliacao: g.avaliacao,
      avaliacaoModalidades: [...g.modalidades].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      acao_complementar: g.acao_complementar,
      acaoComplementarPessoas: g.acaoComplementarPessoas,
    }))
    .sort((a, b) => a.groupLabel.localeCompare(b.groupLabel, 'pt-BR'));
}

/** Soma o rateio municipal já calculado no eixo escolhido. */
export function aggregateSigplanCustoByGroup(
  byMunicipio: SigplanMunicipioCustoRow[],
  groupBy: SigplanGroupBy,
  catalog: GeoDimensoesCatalog | null | undefined,
  municipioLabels: Record<string, string>,
  crsLabels: Record<string, string>,
): SigplanCustoGroupRow[] {
  if (groupBy === 'municipio') {
    return byMunicipio.map((r) => ({
      ...r,
      groupKey: `mun:${r.municipioId}`,
      groupLabel: municipioLabels[r.municipioId] || `Município (${r.municipioId})`,
      municipioCount: 1,
    }));
  }

  const byId = indexGeoMunicipiosById(catalog?.municipios ?? []);
  const acc = new Map<
    string,
    MonitorOperCustoSums & { label: string; muns: Set<string> }
  >();

  for (const row of byMunicipio) {
    const dim = byId.get(row.municipioId);
    const { key, label } = resolveSigplanGroupKey(row.municipioId, groupBy, dim, municipioLabels, crsLabels);
    let g = acc.get(key);
    if (!g) {
      g = {
        label,
        muns: new Set(),
        el_339014: 0,
        el_339030: 0,
        el_339033: 0,
        el_339036: 0,
        el_339039: 0,
        total: 0,
      };
      acc.set(key, g);
    }
    g.muns.add(row.municipioId);
    g.el_339014 += row.el_339014;
    g.el_339030 += row.el_339030;
    g.el_339033 += row.el_339033;
    g.el_339036 += row.el_339036;
    g.el_339039 += row.el_339039;
    g.total += row.total;
  }

  return [...acc.entries()]
    .map(([groupKey, g]) => ({
      groupKey,
      groupLabel: g.label,
      municipioCount: g.muns.size,
      el_339014: g.el_339014,
      el_339030: g.el_339030,
      el_339033: g.el_339033,
      el_339036: g.el_339036,
      el_339039: g.el_339039,
      total: g.total,
    }))
    .sort((a, b) => b.total - a.total || a.groupLabel.localeCompare(b.groupLabel, 'pt-BR'));
}

/**
 * Impactos: mantém lista de municípios; acrescenta groupIds distintos para o rótulo “Em N …”.
 */
export function annotateSigplanImpactosWithGroups(
  byGroup: SigplanImpactosByGroup,
  groupBy: SigplanGroupBy,
  catalog: GeoDimensoesCatalog | null | undefined,
  municipioLabels: Record<string, string>,
  crsLabels: Record<string, string>,
): SigplanImpactosByGroup {
  if (groupBy === 'municipio') return byGroup;
  const byId = indexGeoMunicipiosById(catalog?.municipios ?? []);
  const mapItems = (items: typeof byGroup.epi): typeof byGroup.epi =>
    items.map((item) => {
      const groupKeys = new Set<string>();
      for (const munId of item.municipioIds) {
        const dim = byId.get(munId);
        const { key } = resolveSigplanGroupKey(munId, groupBy, dim, municipioLabels, crsLabels);
        groupKeys.add(key);
      }
      return { ...item, groupCount: groupKeys.size };
    });
  return {
    epi: mapItems(byGroup.epi),
    san: mapItems(byGroup.san),
    amb: mapItems(byGroup.amb),
  };
}

export function buildSigplanViewsForGroupBy(
  rows: MonitorOperRow[],
  schema: FormSchema | null | undefined,
  groupBy: SigplanGroupBy,
  catalog: GeoDimensoesCatalog | null | undefined,
  municipioLabels: Record<string, string>,
  crsLabels: Record<string, string>,
) {
  const presenceMatrix = buildSigplanMunicipioPresenceMatrix(rows);
  const custoByMun = buildSigplanCustoByMunicipio(rows);
  const impactos = buildSigplanImpactosByGroup(rows, schema);
  return {
    presence: aggregateSigplanPresenceByGroup(
      presenceMatrix,
      groupBy,
      catalog,
      municipioLabels,
      crsLabels,
    ),
    custo: aggregateSigplanCustoByGroup(custoByMun, groupBy, catalog, municipioLabels, crsLabels),
    impactos: annotateSigplanImpactosWithGroups(
      impactos,
      groupBy,
      catalog,
      municipioLabels,
      crsLabels,
    ),
  };
}

import type { FormSchema } from '@/services/FormService';
import {
  extractImpactoAcaoFieldList,
  impactCheckboxAppliesToArea,
  isTruthyCheckbox,
  monitorOperImpactKeyGroup,
  normalizeMunicipiosAlcancados,
  type MonitorOperRow,
} from './monitorOperRegionalReport';

export type SigplanImpactGroup = 'epi' | 'san' | 'amb';

export type SigplanImpactoItem = {
  key: string;
  label: string;
  group: SigplanImpactGroup;
  /** Municípios distintos onde o impacto foi Sim (presença). */
  municipioIds: string[];
  /** Quando Agrupar por ≠ município: qtde de grupos distintos cobertos. */
  groupCount?: number;
};

export type SigplanImpactosByGroup = Record<SigplanImpactGroup, SigplanImpactoItem[]>;

export const SIGPLAN_IMPACT_GROUP_LABELS: Record<SigplanImpactGroup, string> = {
  epi: 'Vigilância epidemiológica e controle de doenças',
  san: 'Vigilância sanitária',
  amb: 'Vigilância ambiental e saúde do trabalhador',
};

function getNestedValue(row: MonitorOperRow, dottedKey: string): unknown {
  return dottedKey.split('.').reduce((o: unknown, part) => {
    if (o && typeof o === 'object') return (o as Record<string, unknown>)[part];
    return undefined;
  }, row);
}

/**
 * Impactos marcados Sim nas linhas filtradas, com municípios alcançados (set).
 * Só entra impacto aplicável à área da linha e com ≥1 município.
 */
export function buildSigplanImpactosByGroup(
  rows: MonitorOperRow[],
  schema: FormSchema | null | undefined,
): SigplanImpactosByGroup {
  const fieldMeta = extractImpactoAcaoFieldList(schema);
  const byKey = new Map<string, { label: string; group: SigplanImpactGroup; muns: Set<string> }>();

  for (const { key, label } of fieldMeta) {
    const group = monitorOperImpactKeyGroup(key);
    if (!group) continue;
    byKey.set(key, { label, group, muns: new Set() });
  }

  for (const d of rows) {
    const area = d?.acao?.area as string | undefined;
    const municipios = [...new Set(normalizeMunicipiosAlcancados(d?.acao?.municipios_alcancados))];
    if (municipios.length === 0) continue;

    for (const [key, meta] of byKey) {
      if (!impactCheckboxAppliesToArea(area, key)) continue;
      if (!isTruthyCheckbox(getNestedValue(d, key))) continue;
      for (const m of municipios) meta.muns.add(m);
    }
  }

  const out: SigplanImpactosByGroup = { epi: [], san: [], amb: [] };
  for (const [key, meta] of byKey) {
    if (meta.muns.size === 0) continue;
    out[meta.group].push({
      key,
      label: meta.label,
      group: meta.group,
      municipioIds: [...meta.muns].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    });
  }

  for (const g of ['epi', 'san', 'amb'] as const) {
    out[g].sort(
      (a, b) =>
        b.municipioIds.length - a.municipioIds.length || a.label.localeCompare(b.label, 'pt-BR'),
    );
  }

  return out;
}

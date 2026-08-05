/**
 * Dimensões geográficas SES-PA para filtros/agregação do relatório Monitor Operacional / SIGPLAN.
 * Chave de join = idtipo_municipio (string), atributos vindos de GET /api/geo-dimensoes/catalog.
 */

export type GeoMunicipioDimensao = {
  idtipo_municipio: number;
  codigo: string;
  descricao: string;
  crs_id: number | null;
  macrorregiao_id: number | null;
  macrorregiao_nome: string | null;
  regiao_saude_id: number | null;
  regiao_saude_nome: string | null;
  regiao_integracao_id: number | null;
  regiao_integracao_nome: string | null;
};

export type GeoDimensoesCatalog = {
  macrorregioes: Array<{ value: number; label: string; abrv: string | null }>;
  regioesSaude: Array<{ value: number; label: string; macrorregiao_id: number | null }>;
  regioesIntegracao: Array<{ value: number; label: string }>;
  municipios: GeoMunicipioDimensao[];
};

export type SigplanGroupBy =
  | 'municipio'
  | 'crs'
  | 'regiao_saude'
  | 'macrorregiao'
  | 'regiao_integracao';

export const SIGPLAN_GROUP_BY_LABELS: Record<SigplanGroupBy, string> = {
  municipio: 'Município',
  crs: 'Centro Regional (CRS)',
  regiao_saude: 'Região de Saúde',
  macrorregiao: 'Macrorregião',
  regiao_integracao: 'Região de Integração',
};

export type GeoFilterSlice = {
  macrorregiao_id: string;
  regiao_saude_id: string;
  regiao_integracao_id: string;
  municipio_id: string;
};

export function emptyGeoFilterSlice(): GeoFilterSlice {
  return { macrorregiao_id: '', regiao_saude_id: '', regiao_integracao_id: '', municipio_id: '' };
}

export function hasActiveGeoFilters(f: GeoFilterSlice): boolean {
  return Boolean(f.macrorregiao_id || f.regiao_saude_id || f.regiao_integracao_id || f.municipio_id);
}

export function indexGeoMunicipiosById(
  municipios: GeoMunicipioDimensao[],
): Map<string, GeoMunicipioDimensao> {
  const map = new Map<string, GeoMunicipioDimensao>();
  for (const m of municipios) {
    map.set(String(m.idtipo_municipio), m);
  }
  return map;
}

export function municipioMatchesGeoFilters(dim: GeoMunicipioDimensao, f: GeoFilterSlice): boolean {
  if (f.macrorregiao_id && String(dim.macrorregiao_id ?? '') !== f.macrorregiao_id) return false;
  if (f.regiao_saude_id && String(dim.regiao_saude_id ?? '') !== f.regiao_saude_id) return false;
  if (f.regiao_integracao_id && String(dim.regiao_integracao_id ?? '') !== f.regiao_integracao_id) {
    return false;
  }
  if (f.municipio_id && String(dim.idtipo_municipio) !== f.municipio_id) return false;
  return true;
}

/** Conjunto de idtipo_municipio que satisfaz os filtros geográficos. */
export function resolveAllowedMunicipioIds(
  catalog: GeoDimensoesCatalog | null | undefined,
  f: GeoFilterSlice,
): Set<string> | null {
  if (!hasActiveGeoFilters(f)) return null;
  if (!catalog?.municipios?.length) return new Set();
  const out = new Set<string>();
  for (const m of catalog.municipios) {
    if (municipioMatchesGeoFilters(m, f)) out.add(String(m.idtipo_municipio));
  }
  return out;
}

export type GeoCascadeOptions = {
  macrorregioes: Array<{ value: string; label: string }>;
  regioesSaude: Array<{ value: string; label: string }>;
  regioesIntegracao: Array<{ value: string; label: string }>;
  municipios: Array<{ value: string; label: string }>;
};

/**
 * Opções em cascata: cada seletor lista valores presentes nos municípios que ainda
 * casam com os *outros* filtros (exceto o próprio campo).
 */
export function buildGeoCascadeOptions(
  catalog: GeoDimensoesCatalog | null | undefined,
  f: GeoFilterSlice,
): GeoCascadeOptions {
  const empty: GeoCascadeOptions = {
    macrorregioes: [],
    regioesSaude: [],
    regioesIntegracao: [],
    municipios: [],
  };
  if (!catalog?.municipios?.length) return empty;

  const base = catalog.municipios;

  const forMacro = base.filter((m) =>
    municipioMatchesGeoFilters(m, { ...f, macrorregiao_id: '' }),
  );
  const forRs = base.filter((m) => municipioMatchesGeoFilters(m, { ...f, regiao_saude_id: '' }));
  const forRi = base.filter((m) =>
    municipioMatchesGeoFilters(m, { ...f, regiao_integracao_id: '' }),
  );
  const forMun = base.filter((m) => municipioMatchesGeoFilters(m, { ...f, municipio_id: '' }));

  const macroIds = new Set(
    forMacro.map((m) => m.macrorregiao_id).filter((id): id is number => id != null),
  );
  const rsIds = new Set(
    forRs.map((m) => m.regiao_saude_id).filter((id): id is number => id != null),
  );
  const riIds = new Set(
    forRi.map((m) => m.regiao_integracao_id).filter((id): id is number => id != null),
  );

  return {
    macrorregioes: catalog.macrorregioes
      .filter((x) => macroIds.has(x.value))
      .map((x) => ({ value: String(x.value), label: x.label })),
    regioesSaude: catalog.regioesSaude
      .filter((x) => rsIds.has(x.value))
      .map((x) => ({ value: String(x.value), label: x.label })),
    regioesIntegracao: catalog.regioesIntegracao
      .filter((x) => riIds.has(x.value))
      .map((x) => ({ value: String(x.value), label: x.label })),
    municipios: forMun
      .map((m) => ({ value: String(m.idtipo_municipio), label: m.descricao }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
  };
}

export type SigplanGroupKey = { key: string; label: string };

export function resolveSigplanGroupKey(
  municipioId: string,
  groupBy: SigplanGroupBy,
  dim: GeoMunicipioDimensao | undefined,
  municipioLabels: Record<string, string>,
  crsLabels: Record<string, string>,
): SigplanGroupKey {
  if (groupBy === 'municipio') {
    return {
      key: `mun:${municipioId}`,
      label: municipioLabels[municipioId] || dim?.descricao || `Município (${municipioId})`,
    };
  }
  if (!dim) {
    return { key: `${groupBy}:unknown`, label: 'Sem dimensão' };
  }
  if (groupBy === 'crs') {
    const id = dim.crs_id;
    if (id == null) return { key: 'crs:none', label: 'Sem CRS' };
    return {
      key: `crs:${id}`,
      label: crsLabels[String(id)] || `CRS ${id}`,
    };
  }
  if (groupBy === 'regiao_saude') {
    if (dim.regiao_saude_id == null) return { key: 'rs:none', label: 'Sem região de saúde' };
    return {
      key: `rs:${dim.regiao_saude_id}`,
      label: dim.regiao_saude_nome || `Região ${dim.regiao_saude_id}`,
    };
  }
  if (groupBy === 'macrorregiao') {
    if (dim.macrorregiao_id == null) return { key: 'macro:none', label: 'Sem macrorregião' };
    return {
      key: `macro:${dim.macrorregiao_id}`,
      label: dim.macrorregiao_nome || `Macro ${dim.macrorregiao_id}`,
    };
  }
  if (groupBy === 'regiao_integracao') {
    if (dim.regiao_integracao_id == null) {
      return { key: 'ri:none', label: 'Sem região de integração' };
    }
    return {
      key: `ri:${dim.regiao_integracao_id}`,
      label: dim.regiao_integracao_nome || `Integração ${dim.regiao_integracao_id}`,
    };
  }
  const _exhaustive: never = groupBy;
  return _exhaustive;
}

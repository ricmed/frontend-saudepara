import {
  normalizeMunicipiosAlcancados,
  parseMoney,
  sumCustos,
  type MonitorOperCustoSums,
  type MonitorOperRow,
} from './monitorOperRegionalReport';

export type SigplanMunicipioCustoRow = MonitorOperCustoSums & {
  municipioId: string;
};

export type SigplanCustoSummary = {
  /** Soma dos custos das linhas (uma vez cada) que têm ao menos um município. */
  totalGeral: number;
  /** Elementos agregados uma vez por linha (mesmo critério do totalGeral). */
  elementos: MonitorOperCustoSums;
  /** Municípios com fatia de custo, ordenados por total desc. */
  byMunicipio: SigplanMunicipioCustoRow[];
};

function emptyCusto(): MonitorOperCustoSums {
  return {
    el_339014: 0,
    el_339030: 0,
    el_339033: 0,
    el_339036: 0,
    el_339039: 0,
    total: 0,
  };
}

function rowCustoElements(d: MonitorOperRow): MonitorOperCustoSums {
  const c = d?.custo;
  if (!c || typeof c !== 'object') return emptyCusto();
  const el_339014 = parseMoney(c.el_339014);
  const el_339030 = parseMoney(c.el_339030);
  const el_339033 = parseMoney(c.el_339033);
  const el_339036 = parseMoney(c.el_339036);
  const el_339039 = parseMoney(c.el_339039);
  const rowTotal = parseMoney(c.total);
  const total = rowTotal > 0 ? rowTotal : el_339014 + el_339030 + el_339033 + el_339036 + el_339039;
  return { el_339014, el_339030, el_339033, el_339036, el_339039, total };
}

function addScaled(acc: MonitorOperCustoSums, src: MonitorOperCustoSums, factor: number): void {
  acc.el_339014 += src.el_339014 * factor;
  acc.el_339030 += src.el_339030 * factor;
  acc.el_339033 += src.el_339033 * factor;
  acc.el_339036 += src.el_339036 * factor;
  acc.el_339039 += src.el_339039 * factor;
  acc.total += src.total * factor;
}

/**
 * Custo por município com rateio igual: cada linha divide seus elementos/total por N municípios.
 * Linhas sem município são ignoradas nesta fatia.
 */
export function buildSigplanCustoByMunicipio(rows: MonitorOperRow[]): SigplanMunicipioCustoRow[] {
  const byMun = new Map<string, MonitorOperCustoSums>();

  for (const d of rows) {
    const municipios = [...new Set(normalizeMunicipiosAlcancados(d?.acao?.municipios_alcancados))];
    if (municipios.length === 0) continue;
    const custo = rowCustoElements(d);
    if (custo.total <= 0 && custo.el_339014 + custo.el_339030 + custo.el_339033 + custo.el_339036 + custo.el_339039 <= 0) {
      // ainda assim registra município com zeros se quiser aparecer? Plan: só fatia de custo — skip pure zero lines for cleaner table
      // Actually include if any element or total > 0; skip all-zero
      continue;
    }
    const factor = 1 / municipios.length;
    for (const munId of municipios) {
      let acc = byMun.get(munId);
      if (!acc) {
        acc = emptyCusto();
        byMun.set(munId, acc);
      }
      addScaled(acc, custo, factor);
    }
  }

  return [...byMun.entries()]
    .map(([municipioId, c]) => ({ municipioId, ...c }))
    .sort((a, b) => b.total - a.total || a.municipioId.localeCompare(b.municipioId, undefined, { numeric: true }));
}

/**
 * Total geral = soma das linhas com município (sem rateio).
 * byMunicipio = lista rateada ordenada por total.
 */
export function summarizeSigplanCusto(rows: MonitorOperRow[]): SigplanCustoSummary {
  const withMun = rows.filter(
    (d) => normalizeMunicipiosAlcancados(d?.acao?.municipios_alcancados).length > 0,
  );
  const elementos = sumCustos(withMun);
  const byMunicipio = buildSigplanCustoByMunicipio(rows);
  return {
    totalGeral: elementos.total,
    elementos,
    byMunicipio,
  };
}

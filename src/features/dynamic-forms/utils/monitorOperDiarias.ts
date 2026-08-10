/** Valor unitário da diária SESPA usado no Modelo QDQQ 2026 (elemento 3390-14). */
export const MONITOR_OPER_VALOR_DIARIA = 247.07;

function parseYmd(value: unknown): Date | null {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  // UTC noon evita DST ao calcular diferença só de calendário.
  const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

function toNonNegNumber(value: unknown): number {
  if (value === '' || value === null || value === undefined) return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function roundMoney2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Nº de dias da atividade (Modelo QDQQ):
 * (fim − início em dias corridos) + 0,5.
 * Ex.: 2026-05-01 → 2026-05-05 = 4,5.
 */
export function calcMonitorOperNDiasAtividade(inicio: unknown, fim: unknown): number | null {
  const a = parseYmd(inicio);
  const b = parseYmd(fim);
  if (!a || !b) return null;
  const diffMs = b.getTime() - a.getTime();
  if (diffMs < 0) return null;
  const diffDays = Math.round(diffMs / 86_400_000);
  return roundMoney2(diffDays + 0.5);
}

/** Quantidade de diárias = dias × (técnicos + motoristas). */
export function calcMonitorOperQtdDiarias(
  nDias: number | null | undefined,
  nTecnicos: unknown,
  nMotoristas: unknown,
): number | null {
  if (nDias == null || !Number.isFinite(nDias) || nDias < 0) return null;
  const pessoas = toNonNegNumber(nTecnicos) + toNonNegNumber(nMotoristas);
  return roundMoney2(nDias * pessoas);
}

/** Valor 3390-14 = qtd diárias × 247,07. */
export function calcMonitorOperValorDiarias(
  nDias: number | null | undefined,
  nTecnicos: unknown,
  nMotoristas: unknown,
  valorUnitario: number = MONITOR_OPER_VALOR_DIARIA,
): number | null {
  const qtd = calcMonitorOperQtdDiarias(nDias, nTecnicos, nMotoristas);
  if (qtd == null) return null;
  return roundMoney2(qtd * valorUnitario);
}

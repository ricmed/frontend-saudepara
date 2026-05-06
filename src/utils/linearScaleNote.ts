export function clampNoteInRange(n: number, minV: number, maxV: number, fallback = 0): number {
  if (!Number.isFinite(n)) return fallback;
  if (minV > maxV) return fallback;
  return Math.min(maxV, Math.max(minV, Math.round(n)));
}

function scaleBoundsFloored(rawMin?: number, rawMax?: number): { loB: number; hiB: number } {
  const lo = Math.floor(rawMin ?? 1);
  const hi = Math.floor(rawMax ?? 5);
  return { loB: Math.min(lo, hi), hiB: Math.max(lo, hi) };
}

/**
 * Garante cada nota dentro de [mín, máx] da escala e sem repetir (ordem preservada;
 * duplicata vira o menor inteiro livre no intervalo).
 */
export function normalizeScalePointLabelRows(
  rows: Array<{ value: number; label: string }>,
  rawMin?: number,
  rawMax?: number
): Array<{ value: number; label: string }> {
  const { loB, hiB } = scaleBoundsFloored(rawMin, rawMax);
  const used = new Set<number>();
  const out: Array<{ value: number; label: string }> = [];
  for (const row of rows) {
    let v = clampNoteInRange(Number(row.value), loB, hiB, loB);
    if (used.has(v)) {
      let found = false;
      for (let x = loB; x <= hiB; x++) {
        if (!used.has(x)) {
          v = x;
          found = true;
          break;
        }
      }
      if (!found) continue;
    }
    used.add(v);
    out.push({ value: v, label: row.label });
  }
  return out;
}

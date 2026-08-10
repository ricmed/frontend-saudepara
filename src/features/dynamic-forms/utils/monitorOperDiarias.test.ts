import { describe, expect, it } from 'vitest';
import {
  MONITOR_OPER_VALOR_DIARIA,
  calcMonitorOperNDiasAtividade,
  calcMonitorOperQtdDiarias,
  calcMonitorOperValorDiarias,
} from './monitorOperDiarias';

describe('calcMonitorOperNDiasAtividade', () => {
  it('modelo Excel: 1 a 5 mai = 4,5', () => {
    expect(calcMonitorOperNDiasAtividade('2026-05-01', '2026-05-05')).toBe(4.5);
  });

  it('mesmo dia = 0,5', () => {
    expect(calcMonitorOperNDiasAtividade('2026-05-01', '2026-05-01')).toBe(0.5);
  });

  it('fim antes do início = null', () => {
    expect(calcMonitorOperNDiasAtividade('2026-05-05', '2026-05-01')).toBeNull();
  });
});

describe('calcMonitorOperValorDiarias', () => {
  it('2 téc + 1 motor × 4,5 × 247,07 = 3335,45', () => {
    expect(MONITOR_OPER_VALOR_DIARIA).toBe(247.07);
    const nDias = calcMonitorOperNDiasAtividade('2026-05-01', '2026-05-05');
    expect(calcMonitorOperQtdDiarias(nDias, 2, 1)).toBe(13.5);
    expect(calcMonitorOperValorDiarias(nDias, 2, 1)).toBe(3335.45);
  });
});

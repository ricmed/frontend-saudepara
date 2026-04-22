import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  DEMO_CRS_ID,
  getMonitorOperDemoSubmissionsForReport,
  summarizeDemoPayloads,
} from './monitorOperRegionalDemoSubmissions';
import {
  buildMonitorOperRegionalReport,
  computeTotalAcumuladoMes,
  filterMonitorOperRows,
  qdqqConsolidationKey,
} from '../utils/monitorOperRegionalReport';
import type { FormSchema } from '@/services/FormService';

const schemaPath = path.join(__dirname, '../../../../e2e/fixtures/monitor-oper-regional-schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as FormSchema;

describe('monitorOperRegionalDemoSubmissions', () => {
  it('todos os cenários compartilham CRS/ano/quadrimestre (QDQQ consolidável)', () => {
    const seeds = getMonitorOperDemoSubmissionsForReport();
    const rows = filterMonitorOperRows(seeds);
    const keys = new Set(rows.map((r) => qdqqConsolidationKey(r)));
    expect(keys.size).toBe(1);
    const ta = computeTotalAcumuladoMes(rows);
    expect(ta && 'mixed' in ta && !ta.mixed).toBe(true);
    if (ta && 'mixed' in ta && !ta.mixed) {
      expect(ta.crs_id).toBe(DEMO_CRS_ID);
      expect(ta.quadrimestre).toBe('Q1');
      expect(ta.programadas).toBeGreaterThan(0);
    }
  });

  it('gera relatório consolidado sem erro (áreas, custos, resumo)', () => {
    const seeds = getMonitorOperDemoSubmissionsForReport();
    const rows = filterMonitorOperRows(seeds);
    const rep = buildMonitorOperRegionalReport(rows, schema);
    expect(rep.validRowCount).toBe(6);
    expect(rep.byArea.length).toBeGreaterThan(0);
    expect(rep.custoSums.total).toBeGreaterThan(0);
    expect(rep.resumo.objetivoSim + rep.resumo.obstaculosSim).toBeGreaterThan(0);
    expect(rep.impactCounts.length).toBeGreaterThan(0);
  });

  it('summarizeDemoPayloads cobre múltiplas áreas', () => {
    const seeds = getMonitorOperDemoSubmissionsForReport();
    const sum = summarizeDemoPayloads(seeds.map((s) => s.data_json));
    expect(sum.count).toBe(6);
    expect(Object.keys(sum.areas).length).toBeGreaterThanOrEqual(4);
  });
});

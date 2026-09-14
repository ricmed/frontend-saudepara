import { describe, expect, it } from 'vitest';
import {
  aggregateEventLocalities,
  EVENT_LOCALITY_CHART_TOP_COUNT,
  eventUsesLocalidadeOperacional,
  getEventLocalityMarkerRadius,
  getMappableEventLocalities,
  getTopEventLocalitiesForChart,
  resolveAggregateCountPolicy
} from './eventLocalities';
import { HOMOLOGACAO_MIN_AGGREGATE_COUNT } from './aggregateCountDefaults';

const createNotification = (
  id: number,
  overrides: Record<string, unknown> = {}
) => ({
  original: {
    localidade_evento_id: id,
    localidade_evento_outro: 'texto livre que não pode ser agregado',
    localidade_evento: {
      id,
      nome: `Localidade ${id}`,
      tipo: 'BAIRRO',
      especial: 'NORMAL',
      ribeirinha: false,
      latitude: -2.43,
      longitude: -54.7,
      exibir_mapa: true,
      ativo: true,
      ordem: id,
      ...overrides
    }
  }
});

describe('event locality operational mode', () => {
  it('hides residence neighborhoods only when the selected event uses locality mode', () => {
    expect(eventUsesLocalidadeOperacional(undefined)).toBe(false);
    expect(eventUsesLocalidadeOperacional(null)).toBe(false);
    expect(eventUsesLocalidadeOperacional('NAO_USA')).toBe(false);
    expect(eventUsesLocalidadeOperacional('OPCIONAL')).toBe(true);
    expect(eventUsesLocalidadeOperacional('OBRIGATORIA')).toBe(true);
  });
});

describe('event locality aggregate policy', () => {
  it('uses the configured threshold in production', () => {
    expect(resolveAggregateCountPolicy('7', 'production')).toEqual({
      enabled: true,
      minimumCount: 7,
      source: 'environment'
    });
  });

  it('fails closed in production without a configured threshold', () => {
    expect(resolveAggregateCountPolicy(undefined, 'producao')).toEqual({
      enabled: false,
      minimumCount: null,
      source: 'disabled'
    });
  });

  it('uses the provisional fallback only in development and homologation', () => {
    expect(resolveAggregateCountPolicy(undefined, 'development').minimumCount)
      .toBe(5);
    expect(resolveAggregateCountPolicy('', 'homologacao').minimumCount)
      .toBe(5);
    expect(HOMOLOGACAO_MIN_AGGREGATE_COUNT).toBe(5);
    expect(resolveAggregateCountPolicy(undefined, 'test').enabled)
      .toBe(false);
  });
});

describe('event locality aggregation', () => {
  const policy = {
    enabled: true,
    minimumCount: 3,
    source: 'environment' as const
  };

  it('does not merge communities by tipo or ribeirinha flag', () => {
    const data = aggregateEventLocalities([
      createNotification(11, { nome: 'Areia Branca', tipo: 'COMUNIDADE', ribeirinha: false }),
      createNotification(11, { nome: 'Areia Branca', tipo: 'COMUNIDADE', ribeirinha: false }),
      createNotification(11, { nome: 'Areia Branca', tipo: 'COMUNIDADE', ribeirinha: false }),
      createNotification(12, { nome: 'Taparí', tipo: 'COMUNIDADE', ribeirinha: true }),
      createNotification(12, { nome: 'Taparí', tipo: 'COMUNIDADE', ribeirinha: true }),
      createNotification(12, { nome: 'Taparí', tipo: 'COMUNIDADE', ribeirinha: true }),
    ], policy);

    expect(data.map((item) => item.id).sort()).toEqual([11, 12]);
    expect(data.find((item) => item.id === 12)?.ribeirinha).toBe(true);
  });

  it('groups by stable ID and never uses the OUTRO free text as a label', () => {
    const data = aggregateEventLocalities([
      createNotification(10),
      createNotification(10),
      createNotification(10),
      createNotification(20, {
        nome: 'Outro',
        tipo: null,
        especial: 'OUTRO',
        latitude: null,
        longitude: null,
        exibir_mapa: false
      })
    ], policy);

    expect(data).toHaveLength(2);
    expect(data.find((item) => item.id === 10)?.count).toBe(3);
    expect(data.find((item) => item.id === 20)?.label).toBe('Outro');
    expect(JSON.stringify(data)).not.toContain(
      'texto livre que não pode ser agregado'
    );
  });

  it('suppresses after aggregation and excludes unsafe markers', () => {
    const data = aggregateEventLocalities([
      createNotification(1),
      createNotification(1),
      createNotification(2),
      createNotification(2),
      createNotification(2),
      createNotification(3, {
        especial: 'NAO_INFORMADO',
        tipo: null,
        latitude: null,
        longitude: null,
        exibir_mapa: false
      }),
      createNotification(3, {
        especial: 'NAO_INFORMADO',
        tipo: null,
        latitude: null,
        longitude: null,
        exibir_mapa: false
      }),
      createNotification(3, {
        especial: 'NAO_INFORMADO',
        tipo: null,
        latitude: null,
        longitude: null,
        exibir_mapa: false
      })
    ], policy);

    expect(data.find((item) => item.id === 1)?.suppressed).toBe(true);
    expect(data.find((item) => item.id === 2)?.suppressed).toBe(false);
    expect(getMappableEventLocalities(data).map((item) => item.id).sort())
      .toEqual([1, 2]);
  });

  it('keeps the chart at the same top-10 cut used by bairros', () => {
    const ranked = getTopEventLocalitiesForChart(
      Array.from({ length: 12 }, (_, index) => ({
        id: index + 1,
        label: `L${index + 1}`,
        count: index + 1,
        suppressed: false,
        tipo: 'BAIRRO' as const,
        especial: 'NORMAL' as const,
        ribeirinha: false,
        latitude: -2.43,
        longitude: -54.7,
        exibirMapa: true,
        ordem: index + 1
      }))
    );

    expect(EVENT_LOCALITY_CHART_TOP_COUNT).toBe(10);
    expect(ranked).toHaveLength(10);
    expect(ranked[0]?.label).toBe('L12');
    expect(ranked[9]?.label).toBe('L3');
  });

  it('scales marker radius linearly so high vs low counts look clearly different', () => {
    expect(getEventLocalityMarkerRadius(0, 10)).toBe(0);

    const small = getEventLocalityMarkerRadius(5, 100);
    const mid = getEventLocalityMarkerRadius(50, 100);
    const large = getEventLocalityMarkerRadius(100, 100);

    expect(small).toBeLessThan(mid);
    expect(mid).toBeLessThan(large);
    expect(large).toBe(42);
    expect(small).toBe(5 + 0.05 * 37);
    // Contraste forte: o maior deve ser bem maior que o menor
    expect(large / small).toBeGreaterThan(5);
  });
});

import { describe, expect, it } from 'vitest';
import {
  aggregateEventLocalities,
  getEventLocalityMarkerRadius,
  getMappableEventLocalities,
  resolveAggregateCountPolicy
} from './eventLocalities';

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
    expect(getMappableEventLocalities(data).map((item) => item.id)).toEqual([2]);
  });

  it('scales marker radius proportionally within bounds', () => {
    expect(getEventLocalityMarkerRadius(0, 10)).toBe(0);
    expect(getEventLocalityMarkerRadius(1, 100))
      .toBeLessThan(getEventLocalityMarkerRadius(100, 100));
    expect(getEventLocalityMarkerRadius(100, 100)).toBe(26);
  });
});

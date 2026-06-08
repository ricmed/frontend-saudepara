import { describe, expect, it } from 'vitest';
import {
  isMaeLabHbvMarkerRequired,
  maeLabHbvQuandoRequiresCoreMarkers,
  maeLabHbvQuandoSomenteMaternidade,
  MAE_LAB_HBV_WHEN_ANTES,
  MAE_LAB_HBV_WHEN_DURANTE,
  MAE_LAB_HBV_WHEN_MATERNIDADE,
} from './hepatiteCriancaMaeLabRequired';

const get =
  (data: Record<string, string>) =>
  (key: string): unknown =>
    data[key];

describe('maeLabHbvQuandoRequiresCoreMarkers', () => {
  it('true quando Antes do Pré-natal = Sim', () => {
    expect(
      maeLabHbvQuandoRequiresCoreMarkers(get({ [MAE_LAB_HBV_WHEN_ANTES]: '1' })),
    ).toBe(true);
  });

  it('true quando Durante o Pré-natal = Sim', () => {
    expect(
      maeLabHbvQuandoRequiresCoreMarkers(get({ [MAE_LAB_HBV_WHEN_DURANTE]: '1' })),
    ).toBe(true);
  });

  it('false quando só Maternidade = Sim', () => {
    expect(
      maeLabHbvQuandoRequiresCoreMarkers(get({ [MAE_LAB_HBV_WHEN_MATERNIDADE]: '1' })),
    ).toBe(false);
  });
});

describe('maeLabHbvQuandoSomenteMaternidade', () => {
  it('true para cenário exclusivo de maternidade', () => {
    expect(
      maeLabHbvQuandoSomenteMaternidade(get({ [MAE_LAB_HBV_WHEN_MATERNIDADE]: '1' })),
    ).toBe(true);
  });

  it('false quando maternidade e durante pré-natal', () => {
    expect(
      maeLabHbvQuandoSomenteMaternidade(
        get({
          [MAE_LAB_HBV_WHEN_MATERNIDADE]: '1',
          [MAE_LAB_HBV_WHEN_DURANTE]: '1',
        }),
      ),
    ).toBe(false);
  });
});

describe('isMaeLabHbvMarkerRequired', () => {
  it('exige HBsAg e HBV-DNA no pré-natal', () => {
    const gv = get({ [MAE_LAB_HBV_WHEN_ANTES]: '1' });
    expect(isMaeLabHbvMarkerRequired('mae.lab.hbv_hbsag', gv)).toBe(true);
    expect(isMaeLabHbvMarkerRequired('mae.lab.hbv_dna', gv)).toBe(true);
    expect(isMaeLabHbvMarkerRequired('mae.lab.hbv_anti_hbs', gv)).toBe(false);
  });

  it('não exige marcadores na maternidade isolada', () => {
    const gv = get({ [MAE_LAB_HBV_WHEN_MATERNIDADE]: '1' });
    expect(isMaeLabHbvMarkerRequired('mae.lab.hbv_hbsag', gv)).toBe(false);
    expect(isMaeLabHbvMarkerRequired('mae.lab.hbv_dna', gv)).toBe(false);
    expect(isMaeLabHbvMarkerRequired('mae.lab.hbv_anti_hbc_total', gv)).toBe(false);
  });
});

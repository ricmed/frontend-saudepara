import { describe, expect, it } from 'vitest';
import { collectHepatiteCriancaFormValidationErrors } from './hepatiteCriancaCollectValidationErrors';
import { MAE_SOROLOGIA_REAGENTE_HBV_KEY } from './hepatiteCriancaMaeSorologiaRequired';
import { MATERNIDADE_HBV_HBIG_KEY } from './hepatiteCriancaMaternidadeHbvHbig';

const labels: Record<string, string> = {
  [MAE_SOROLOGIA_REAGENTE_HBV_KEY]: 'Sorologia HBV',
  [MATERNIDADE_HBV_HBIG_KEY]: 'Vacina maternidade',
  'mae.lab.hbv_hbsag': 'HBsAg',
};

describe('collectHepatiteCriancaFormValidationErrors', () => {
  it('exige sorologia Sim/Não quando HBV e valor inválido', () => {
    const errors = collectHepatiteCriancaFormValidationErrors(
      {
        notificacao: { tipo_exposicao_hepatite: '1' },
        mae: { lab: { sorologia_reagente_hepatite_b: '9' } },
      },
      { [MAE_SOROLOGIA_REAGENTE_HBV_KEY]: true },
      labels,
    );
    expect(errors.some((e) => e.field === MAE_SOROLOGIA_REAGENTE_HBV_KEY)).toBe(true);
    expect(errors.find((e) => e.field === MAE_SOROLOGIA_REAGENTE_HBV_KEY)?.message).toMatch(
      /Sim ou Não/i,
    );
  });

  it('exige vacina maternidade com opção válida (1, 2 ou 4)', () => {
    const errors = collectHepatiteCriancaFormValidationErrors(
      {
        notificacao: { tipo_exposicao_hepatite: '1' },
        crianca: { vacina_hepatite_b_maternidade: '3' },
      },
      { [MATERNIDADE_HBV_HBIG_KEY]: true },
      labels,
    );
    expect(errors.some((e) => e.field === MATERNIDADE_HBV_HBIG_KEY)).toBe(true);
  });

  it('exige HBsAg quando pré-natal antes marcado', () => {
    const errors = collectHepatiteCriancaFormValidationErrors(
      {
        notificacao: { tipo_exposicao_hepatite: '1' },
        mae: {
          lab: {
            hepatite_b_quando_antes_prenatal: '1',
            hbv_hbsag: '',
          },
        },
      },
      { 'mae.lab.hbv_hbsag': true },
      labels,
    );
    expect(errors.some((e) => e.field === 'mae.lab.hbv_hbsag')).toBe(true);
  });

  it('exige dados do investigador', () => {
    const errors = collectHepatiteCriancaFormValidationErrors({}, {}, labels);
    expect(errors.some((e) => e.field === 'investigador.nome')).toBe(true);
    expect(errors.some((e) => e.field === 'investigador.municipio_id')).toBe(true);
  });
});

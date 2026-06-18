import { describe, expect, it } from 'vitest';
import {
  addMonthsToIsoDate,
  buildHepBDoseScheduleUpdates,
  computeHepBDoseScheduleFromFirstDose,
  isHepBScheduledDoseDateKey,
  maxScheduledHepBDoseDateIso,
  suggestFirstHepBDoseFromMaternidade,
} from './hepatiteCriancaVacinaHepBSchedule';

describe('addMonthsToIsoDate', () => {
  it('soma meses calendário', () => {
    expect(addMonthsToIsoDate('2024-01-15', 2)).toBe('2024-03-15');
    expect(addMonthsToIsoDate('2024-01-31', 1)).toBe('2024-02-29');
  });
});

describe('computeHepBDoseScheduleFromFirstDose', () => {
  it('gera 0, 2, 4 e 6 meses a partir da 1ª dose', () => {
    expect(computeHepBDoseScheduleFromFirstDose('2024-01-10')).toEqual([
      '2024-01-10',
      '2024-03-10',
      '2024-05-10',
      '2024-07-10',
    ]);
  });
});

describe('suggestFirstHepBDoseFromMaternidade', () => {
  it('antes de 24h usa data de nascimento', () => {
    expect(suggestFirstHepBDoseFromMaternidade('2024-06-01', '1')).toBe('2024-06-01');
  });

  it('após 24h adiciona um dia', () => {
    expect(suggestFirstHepBDoseFromMaternidade('2024-06-01', '2')).toBe('2024-06-02');
  });
});

describe('buildHepBDoseScheduleUpdates', () => {
  it('preenche doses 2–4 vazias', () => {
    const { updates } = buildHepBDoseScheduleUpdates({
      anchorIso: '2024-01-10',
      getValue: (key) => (key === 'crianca.vacina_hepatite_b_dose_1_data' ? '2024-01-10' : ''),
      lastAutoByKey: {},
    });
    expect(updates).toEqual({
      'crianca.vacina_hepatite_b_dose_2_data': '2024-03-10',
      'crianca.vacina_hepatite_b_dose_3_data': '2024-05-10',
      'crianca.vacina_hepatite_b_dose_4_data': '2024-07-10',
    });
  });

  it('não sobrescreve data editada manualmente', () => {
    const { updates } = buildHepBDoseScheduleUpdates({
      anchorIso: '2024-01-10',
      getValue: (key) => {
        if (key === 'crianca.vacina_hepatite_b_dose_2_data') return '2024-04-01';
        return '';
      },
      lastAutoByKey: {},
    });
    expect(updates['crianca.vacina_hepatite_b_dose_2_data']).toBeUndefined();
  });
});

describe('isHepBScheduledDoseDateKey', () => {
  it('identifica apenas as quatro datas de dose HBV', () => {
    expect(isHepBScheduledDoseDateKey('crianca.vacina_hepatite_b_dose_2_data')).toBe(true);
    expect(isHepBScheduledDoseDateKey('notificacao.dt_notificacao')).toBe(false);
  });
});

describe('maxScheduledHepBDoseDateIso', () => {
  it('projeta limite 24 meses à frente', () => {
    const ref = new Date(2026, 5, 18);
    expect(maxScheduledHepBDoseDateIso(ref)).toBe('2028-06-18');
  });
});

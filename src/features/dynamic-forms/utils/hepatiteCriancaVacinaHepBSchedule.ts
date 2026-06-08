/** Intervalos em meses a partir da 1ª dose (maternidade) — áudio 7. */
export const HEP_B_DOSE_MONTH_OFFSETS = [0, 2, 4, 6] as const;

export const HEP_B_DOSE_DATA_KEYS = [
  'crianca.vacina_hepatite_b_dose_1_data',
  'crianca.vacina_hepatite_b_dose_2_data',
  'crianca.vacina_hepatite_b_dose_3_data',
  'crianca.vacina_hepatite_b_dose_4_data',
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE.test(value);
}

/** Soma meses calendário; se o dia não existir no mês alvo, usa o último dia do mês. */
export function addMonthsToIsoDate(isoDate: string, months: number): string | null {
  if (!isIsoDate(isoDate)) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const targetMonthIndex = m - 1 + months;
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const day = Math.min(d, lastDay);
  const yy = targetYear;
  const mm = String(normalizedMonth + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Calcula as quatro datas previstas (0, 2, 4 e 6 meses) a partir da 1ª dose. */
export function computeHepBDoseScheduleFromFirstDose(firstDoseIso: string): string[] | null {
  if (!isIsoDate(firstDoseIso)) return null;
  const out: string[] = [];
  for (const offset of HEP_B_DOSE_MONTH_OFFSETS) {
    const next = addMonthsToIsoDate(firstDoseIso, offset);
    if (!next) return null;
    out.push(next);
  }
  return out;
}

/**
 * Data sugerida da 1ª dose a partir do nascimento + vacina na maternidade.
 * `1` = antes de 24h (mesmo dia); `2` = após 24h (+1 dia).
 */
export function suggestFirstHepBDoseFromMaternidade(
  birthIso: string,
  maternidadeCode: unknown,
): string | null {
  const code = String(maternidadeCode ?? '');
  if (code === '1') return birthIso;
  if (code === '2') return addDaysToIsoDate(birthIso, 1);
  return null;
}

function addDaysToIsoDate(isoDate: string, days: number): string | null {
  if (!isIsoDate(isoDate)) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + days);
  const yy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, '0');
  const dd = String(base.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export type HepBScheduleApplyResult = {
  updates: Partial<Record<(typeof HEP_B_DOSE_DATA_KEYS)[number], string>>;
  /** Valores que substituíram datas geradas automaticamente antes. */
  replacedAuto: Partial<Record<(typeof HEP_B_DOSE_DATA_KEYS)[number], string>>;
};

/**
 * Monta atualizações de datas previstas. Preenche vazios ou sobrescreve valores
 * que ainda são iguais à última sugestão automática.
 */
export function buildHepBDoseScheduleUpdates(input: {
  anchorIso: string;
  getValue: (key: string) => unknown;
  lastAutoByKey: Partial<Record<string, string>>;
}): HepBScheduleApplyResult {
  const schedule = computeHepBDoseScheduleFromFirstDose(input.anchorIso);
  const updates: Partial<Record<(typeof HEP_B_DOSE_DATA_KEYS)[number], string>> = {};
  const replacedAuto: Partial<Record<(typeof HEP_B_DOSE_DATA_KEYS)[number], string>> = {};
  if (!schedule) return { updates, replacedAuto };

  HEP_B_DOSE_DATA_KEYS.forEach((key, index) => {
    if (index === 0) return;
    const suggested = schedule[index];
    const current = input.getValue(key);
    const currentStr = current != null && String(current).trim() !== '' ? String(current) : '';
    const lastAuto = input.lastAutoByKey[key];
    if (!currentStr || (lastAuto && currentStr === lastAuto)) {
      if (currentStr !== suggested) {
        updates[key] = suggested;
        if (currentStr && lastAuto && currentStr === lastAuto) {
          replacedAuto[key] = currentStr;
        }
      }
    }
  });

  return { updates, replacedAuto };
}

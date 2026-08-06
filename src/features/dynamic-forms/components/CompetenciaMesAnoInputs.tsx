import React, { useEffect, useState } from 'react';

const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
] as const;

/** Parse `YYYY-MM` → partes; inválido → vazios. */
export function parseCompetenciaMesAno(value: unknown): { year: string; month: string } {
  const s = typeof value === 'string' ? value.trim() : '';
  const m = s.match(/^(\d{4})-(\d{2})$/);
  if (!m) return { year: '', month: '' };
  return { year: m[1], month: m[2] };
}

export function formatCompetenciaMesAno(year: string, month: string): string | undefined {
  if (year && month) return `${year}-${month}`;
  return undefined;
}

export function currentCompetenciaMesAno(): string {
  const now = new Date();
  const y = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${mm}`;
}

function buildYearOptions(centerYear?: number): number[] {
  const y = centerYear ?? new Date().getFullYear();
  const start = y - 10;
  const end = y + 1;
  const years: number[] = [];
  for (let i = end; i >= start; i--) years.push(i);
  return years;
}

const selectClass = (hasError?: boolean, disabled?: boolean) =>
  `w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    hasError ? 'border-red-500' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`;

export interface CompetenciaMesAnoInputsProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  error?: boolean;
  /** Compacto para filtros de dashboard. */
  compact?: boolean;
  idPrefix?: string;
}

/**
 * Mês (nome) + Ano (lista) → valor `YYYY-MM`.
 * Substitui o input nativo type="month", pouco usável no Windows.
 */
export const CompetenciaMesAnoInputs: React.FC<CompetenciaMesAnoInputsProps> = ({
  value,
  onChange,
  disabled,
  error,
  compact,
  idPrefix = 'competencia',
}) => {
  const parsed = parseCompetenciaMesAno(value);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  useEffect(() => {
    const next = parseCompetenciaMesAno(value);
    setMonth(next.month);
    setYear(next.year);
  }, [value]);

  const years = buildYearOptions();
  const yearNum = year ? Number(year) : NaN;
  const yearsWithValue =
    Number.isFinite(yearNum) && !years.includes(yearNum)
      ? [yearNum, ...years].sort((a, b) => b - a)
      : years;

  const commit = (nextYear: string, nextMonth: string) => {
    setYear(nextYear);
    setMonth(nextMonth);
    const formatted = formatCompetenciaMesAno(nextYear, nextMonth);
    onChange(formatted ?? '');
  };

  const onMonthChange = (mm: string) => {
    const y = year || String(new Date().getFullYear());
    if (!mm) {
      commit('', '');
      return;
    }
    // Ao escolher só o mês, assume o ano já selecionado ou o ano corrente.
    commit(y, mm);
  };

  const onYearChange = (y: string) => {
    if (!y) {
      commit('', '');
      return;
    }
    if (!month) {
      setYear(y);
      return;
    }
    commit(y, month);
  };

  return (
    <div className={compact ? 'flex flex-wrap items-end gap-2' : undefined}>
      <div className={compact ? 'flex flex-wrap gap-2' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
        <div className={compact ? 'w-40' : undefined}>
          <label htmlFor={`${idPrefix}-mes`} className="sr-only">
            Mês
          </label>
          <select
            id={`${idPrefix}-mes`}
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            disabled={disabled}
            className={selectClass(error, disabled)}
            aria-label="Mês da competência"
          >
            <option value="">Mês</option>
            {MONTHS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className={compact ? 'w-28' : undefined}>
          <label htmlFor={`${idPrefix}-ano`} className="sr-only">
            Ano
          </label>
          <select
            id={`${idPrefix}-ano`}
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            disabled={disabled}
            className={selectClass(error, disabled)}
            aria-label="Ano da competência"
          >
            <option value="">Ano</option>
            {yearsWithValue.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export { MONTHS as COMPETENCIA_MESES };

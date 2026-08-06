/** Larguras fixas (px) das colunas de identidade congeladas — ordem: CRS, Competência, Responsável, Município. */
export const ENTOMO_FROZEN_ID_WIDTHS = [110, 92, 140, 176] as const;

export const ENTOMO_FROZEN_ID_COUNT = ENTOMO_FROZEN_ID_WIDTHS.length;

/** Altura da área de tabela: preenche o restante da viewport abaixo de filtros/KPIs/abas. */
export const ENTOMO_TABLE_VIEWPORT_MAX =
  'max-h-[calc(100dvh-12rem)] min-h-[32rem]';

export const ENTOMO_TABLE_HALF_VIEWPORT_MAX =
  'max-h-[calc((100dvh-14rem)/2)] min-h-[18rem]';

/**
 * Altura fixa da 1ª linha do thead (grupos).
 * A 2ª linha (aeg/alb) usa o mesmo valor em `top-*` para ficar colada, sem vão branco.
 */
export const ENTOMO_THEAD_ROW_H = 'h-9';
export const ENTOMO_THEAD_ROW2_TOP = 'top-9';

export function frozenLeftPx(index: number): number {
  let left = 0;
  for (let i = 0; i < index && i < ENTOMO_FROZEN_ID_WIDTHS.length; i++) {
    left += ENTOMO_FROZEN_ID_WIDTHS[i];
  }
  return left;
}

export function frozenColWidthPx(index: number): number {
  return ENTOMO_FROZEN_ID_WIDTHS[index] ?? 120;
}

const STICKY_SHADOW = 'shadow-[2px_0_4px_-2px_rgba(15,23,42,0.18)]';

type HeaderRow = 1 | 2;

/**
 * Cabeçalho sticky sem borda entre as duas linhas (evita o “risco branco”
 * entre Imóveis/A1 e aeg/alb com border-separate).
 */
export function denseThTopClass(headerRow: HeaderRow = 1, extra?: string): string {
  const top = headerRow === 1 ? 'top-0' : ENTOMO_THEAD_ROW2_TOP;
  const z = headerRow === 1 ? 'z-[22]' : 'z-[21]';
  const height = headerRow === 2 ? ENTOMO_THEAD_ROW_H : '';
  const bottomEdge =
    headerRow === 2
      ? 'shadow-[inset_0_-1px_0_0_rgb(30,58,138)]'
      : 'border-b-0';
  return [
    'px-2.5 py-0 text-xs font-semibold uppercase tracking-wide text-white',
    'whitespace-nowrap bg-blue-700',
    'align-middle',
    height,
    bottomEdge,
    'sticky',
    top,
    z,
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** Células com rowSpan=2 (CRS, Local, Tubos, Outros): altura das duas linhas, sem risco no meio. */
export function denseThRowSpanClass(extra?: string): string {
  return [
    'px-2.5 py-0 text-xs font-semibold uppercase tracking-wide text-white',
    'whitespace-nowrap bg-blue-700 align-middle',
    'h-[4.5rem]',
    'sticky top-0 z-[32]',
    'shadow-[inset_0_-1px_0_0_rgb(30,58,138)]',
    STICKY_SHADOW,
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function denseThFrozenClass(frozenIndex: number, extra?: string): string {
  return denseThRowSpanClass(extra);
}

export function denseThScrollClass(extra?: string): string {
  return denseThRowSpanClass(extra);
}

export function denseTdFrozenClass(frozenIndex: number, rowStripe: 'even' | 'odd', extra?: string): string {
  return [
    'px-3 py-2.5 text-sm text-slate-800 whitespace-nowrap',
    rowStripe === 'even' ? 'bg-white' : 'bg-sky-50/70',
    'sticky z-10',
    STICKY_SHADOW,
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function denseTdScrollClass(extra?: string): string {
  return ['px-3 py-2.5 text-sm text-slate-700 whitespace-nowrap tabular-nums', extra ?? '']
    .filter(Boolean)
    .join(' ');
}

export function denseNumTdClass(alb = false, extra?: string): string {
  return denseTdScrollClass(
    ['text-right min-w-[3.25rem]', alb ? 'text-red-600 font-medium' : '', extra ?? ''].filter(Boolean).join(' '),
  );
}

/** 1ª linha — rótulo do bloco (Imóveis, A1…), colado na linha aeg/alb. */
export function denseThGroupClass(): string {
  return denseThTopClass(
    1,
    `${ENTOMO_THEAD_ROW_H} text-center border-x border-blue-800/80 bg-blue-700`,
  );
}

/** 2ª linha — aeg / alb, sticky imediatamente abaixo da linha de grupos. */
export function denseThSubClass(alb = false): string {
  return denseThTopClass(
    2,
    [
      'text-center min-w-[3.25rem] border-x border-blue-800/80 bg-blue-700',
      alb ? 'text-rose-100' : 'text-blue-50',
    ]
      .filter(Boolean)
      .join(' '),
  );
}

export function rowStripeClass(index: number): 'even' | 'odd' {
  return index % 2 === 0 ? 'even' : 'odd';
}

export function denseTableClass(): string {
  return 'min-w-full border-separate border-spacing-0 text-sm';
}

export function denseTfootClass(): string {
  return 'bg-gradient-to-r from-slate-100 to-sky-50 font-semibold text-slate-900';
}

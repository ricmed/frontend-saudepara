import React from 'react';
import type { FormField } from '@/services/FormService';

export const LAB_CELL = 'min-w-0 w-full [&>div]:mb-0';

/** Mesma tipografia/altura do DateField padrão em todo o formulário. */
export const DATE_FIELD_OPTS: Partial<FormField> = {
  hideLabel: true,
};

export const DATE_ROW_WRAP =
  'w-full min-w-0 max-w-full shrink-0 sm:w-[13.5rem] [&>div]:mb-0 [&_input]:text-sm [&_input]:py-2 [&_button]:text-sm [&_button]:px-3 [&_button]:py-2';

/** Alinha a data com a base do select (rótulo do marcador fica acima). */
export const MARKER_ROW_GRID =
  'grid max-w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_13.5rem] sm:items-end sm:gap-3';

export type RenderLabFn = (key: string, overrides?: Partial<FormField>) => React.ReactNode;

export function LabMarkerRow({
  renderLab,
  resultKey,
  dateKey,
}: {
  renderLab: RenderLabFn;
  resultKey: string;
  dateKey: string;
}) {
  return (
    <div className={MARKER_ROW_GRID}>
      <div className={LAB_CELL}>{renderLab(resultKey)}</div>
      <div className={DATE_ROW_WRAP}>{renderLab(dateKey, DATE_FIELD_OPTS)}</div>
    </div>
  );
}

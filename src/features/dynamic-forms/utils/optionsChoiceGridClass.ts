import type { FormField } from '@/services/FormService';

/** Grid responsivo para opções em checkbox-group, radio e select em modo cartões. */
export function optionsChoiceGridClass(field: FormField): string {
  const c = field.gridCols;
  if (c === 1) return 'grid gap-3 grid-cols-1';
  if (c === 3) return 'grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return 'grid gap-3 grid-cols-1 sm:grid-cols-2';
}

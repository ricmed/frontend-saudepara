import type { FormField } from '@/services/FormService';

export type ApiSelectOption = { value: string; label: string };

/** Código SINAN — Intersexo (excluído apenas em formulários que definem `apiSelectExcludeCodigos`). */
export const SEXO_NASCIMENTO_INTERSEXO_CODIGO = '3';

function getExcludeCodigos(field: FormField): string[] {
  const raw = (field as FormField & { apiSelectExcludeCodigos?: string[] }).apiSelectExcludeCodigos;
  return Array.isArray(raw) ? raw.map(String) : [];
}

/**
 * Remove códigos da lista de opções conforme o schema do campo.
 * Mantém o valor já salvo visível ao editar registro antigo.
 */
export function filterApiSelectOptionsForField(
  options: ApiSelectOption[],
  field: FormField,
  currentValue?: unknown,
): ApiSelectOption[] {
  const excluded = new Set(getExcludeCodigos(field));
  if (excluded.size === 0) return options;
  const current = currentValue != null && currentValue !== '' ? String(currentValue) : '';
  return options.filter((o) => !excluded.has(String(o.value)) || String(o.value) === current);
}

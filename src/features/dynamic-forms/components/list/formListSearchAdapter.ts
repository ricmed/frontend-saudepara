/**
 * Adapter de campos de busca/ordenação por formulário (kit lista tipo DAE).
 * Paths em data_json — sem campos de paciente/CPF/CNS.
 */

export type FormListSearchField = {
  value: string;
  label: string;
  /** Paths JSON relativos a data_json (ex.: responsavel). Vazio = só colunas reais. */
  jsonPaths: string[];
};

const ENTOMOLOGIA_FIELDS: FormListSearchField[] = [
  { value: 'all', label: 'Todos os campos', jsonPaths: ['responsavel', 'competencia'] },
  { value: 'responsavel', label: 'Responsável', jsonPaths: ['responsavel'] },
  { value: 'competencia', label: 'Competência', jsonPaths: ['competencia'] },
  { value: 'created_by', label: 'Criado por', jsonPaths: [] },
];

const DEFAULT_FIELDS: FormListSearchField[] = [
  { value: 'all', label: 'Todos os campos', jsonPaths: [] },
  { value: 'created_by', label: 'Criado por', jsonPaths: [] },
];

export function getFormListSearchFields(formKey: string | undefined | null): FormListSearchField[] {
  const k = String(formKey || '').trim().toUpperCase();
  if (k === 'ENTOMOLOGIA_LARVAS') return ENTOMOLOGIA_FIELDS;
  return DEFAULT_FIELDS;
}

/** sortKey de UI (submitted_at | created_by | f:campo) → params da API */
export function mapUiSortToApiParams(sortKey: string | null, order: 'asc' | 'desc'): {
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  clientOnly: boolean;
} {
  if (!sortKey) return { clientOnly: false };
  if (sortKey.startsWith('m:') || sortKey.startsWith('h:')) {
    return { clientOnly: true };
  }
  if (sortKey === 'submitted_at') {
    return { sortKey: 'submitted_at', sortDir: order, clientOnly: false };
  }
  if (sortKey === 'created_at') {
    return { sortKey: 'created_at', sortDir: order, clientOnly: false };
  }
  if (sortKey === 'created_by') {
    return { sortKey: 'created_by', sortDir: order, clientOnly: false };
  }
  if (sortKey.startsWith('f:')) {
    const field = sortKey.slice(2);
    return { sortKey: `json:${field}`, sortDir: order, clientOnly: false };
  }
  return { clientOnly: true };
}

/** Paths JSON permitidos para sort/search (anti-injection). */
export const FORM_RESPONSE_JSON_SORT_WHITELIST = new Set([
  'responsavel',
  'competencia',
  'crs_id',
  'equipe',
]);

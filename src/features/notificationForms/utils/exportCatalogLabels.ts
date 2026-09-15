const CBO_ID_FIELDS = ['idtipo_cbo', 'id', 'idcbo', 'cbo_idcbo'] as const;

export function looksLikeNumericId(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  return /^\d+$/.test(String(value).trim());
}

export function findCatalogOption(
  value: string | number | null | undefined,
  options: Array<Record<string, unknown>> | undefined | null,
  idField: string,
): Record<string, unknown> | undefined {
  const id = String(value ?? '').trim();
  if (!id || !Array.isArray(options) || options.length === 0) return undefined;
  return options.find((opt) => {
    if (!opt || typeof opt !== 'object') return false;
    if (opt[idField] != null && String(opt[idField]) === id) return true;
    if (idField !== 'id' && opt.id != null && String(opt.id) === id) return true;
    return false;
  });
}

export function formatCatalogLabel(
  option: Record<string, unknown> | null | undefined,
  descField: string = 'descricao',
): string {
  if (!option) return '';
  const primary = String(option[descField] ?? '').trim();
  if (primary) return primary;
  const descricao = String(option.descricao ?? '').trim();
  if (descricao) return descricao;
  return String(option.nome ?? '').trim();
}

/** Resolve ID de catálogo para texto. Nunca devolve o número cru. */
export function resolveCatalogLabel(
  value: unknown,
  options: Array<Record<string, unknown>> | undefined | null,
  idField: string,
  descField: string = 'descricao',
): string {
  if (value === undefined || value === null || value === '') return '';

  if (typeof value === 'object') {
    return formatCatalogLabel(value as Record<string, unknown>, descField);
  }

  const asString = String(value).trim();
  const fromOptions = formatCatalogLabel(
    findCatalogOption(asString, options, idField),
    descField,
  );
  if (fromOptions) return fromOptions;
  if (looksLikeNumericId(asString)) return '';
  return asString;
}

export function formatCboLabel(option: {
  codigo?: string | null;
  descricao?: string | null;
  nome?: string | null;
} | null | undefined): string {
  if (!option) return '';
  const descricao = String(option.descricao || option.nome || '').trim();
  const codigo = String(option.codigo || '').trim();
  if (codigo && descricao) return `${codigo} - ${descricao}`;
  return descricao;
}

export function findCboOption(
  value: string | number | null | undefined,
  options: Array<Record<string, unknown>> | undefined | null,
): Record<string, unknown> | undefined {
  const id = String(value ?? '').trim();
  if (!id || !Array.isArray(options) || options.length === 0) return undefined;
  return options.find((opt) => {
    if (!opt || typeof opt !== 'object') return false;
    return CBO_ID_FIELDS.some(
      (field) => opt[field] != null && String(opt[field]) === id,
    );
  });
}

export function resolveCboLabel(
  value: unknown,
  options?: Array<Record<string, unknown>> | null,
): string {
  if (value === undefined || value === null || value === '') return '';

  if (typeof value === 'object') {
    return formatCboLabel(value as { codigo?: string; descricao?: string; nome?: string });
  }

  const asString = String(value).trim();
  const fromOptions = formatCboLabel(findCboOption(asString, options ?? undefined));
  if (fromOptions) return fromOptions;

  if (looksLikeNumericId(asString)) return '';
  return asString;
}

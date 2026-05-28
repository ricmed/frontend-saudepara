/**
 * Normaliza texto para busca: minúsculas, sem acentos, cedilhas nem outros diacríticos.
 * Permite que buscas ignorem diferenças de maiúsculas/minúsculas e acentuação.
 * Uso: normalizeForSearch(texto).includes(normalizeForSearch(termo))
 */
export function normalizeForSearch(str: string | null | undefined): string {
  if (str == null || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Verifica se o texto contém o termo de busca (ignorando maiúsculas, acentos, cedilhas).
 */
export function searchMatches(text: string | null | undefined, searchTerm: string | null | undefined): boolean {
  if (!searchTerm || typeof searchTerm !== 'string') return true;
  const normalizedText = normalizeForSearch(text);
  const normalizedTerm = normalizeForSearch(searchTerm);
  return normalizedText.includes(normalizedTerm);
}

export type SearchableLabelOption = {
  label: string;
  termoOficial?: string;
  /** Aliases de busca (termo popular/regional). */
  aliases?: string[];
  /** @deprecated use aliases */
  sinonimos?: string[];
};

function resolveSearchAliases(option: SearchableLabelOption): string[] {
  const fromAliases = option.aliases ?? option.sinonimos ?? [];
  return fromAliases;
}

function resolveCanonicalLabel(option: SearchableLabelOption): string {
  return option.termoOficial ?? option.label;
}

/** Busca no termo oficial ou em aliases (não altera o valor salvo). */
export function searchMatchesWithSynonyms(
  option: SearchableLabelOption,
  searchTerm: string | null | undefined,
): boolean {
  if (!searchTerm || typeof searchTerm !== 'string') return true;
  const termoOficial = resolveCanonicalLabel(option);
  if (searchMatches(termoOficial, searchTerm)) return true;
  const aliases = resolveSearchAliases(option);
  return aliases.some((alias) => searchMatches(alias, searchTerm));
}

/** Retorna o alias que fez match, ou null se o match foi no termo oficial. */
export function getMatchingSynonym(
  option: SearchableLabelOption,
  searchTerm: string | null | undefined,
): string | null {
  if (!searchTerm || typeof searchTerm !== 'string') return null;
  const termoOficial = resolveCanonicalLabel(option);
  if (searchMatches(termoOficial, searchTerm)) return null;
  const aliases = resolveSearchAliases(option);
  return aliases.find((alias) => searchMatches(alias, searchTerm)) ?? null;
}

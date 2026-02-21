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

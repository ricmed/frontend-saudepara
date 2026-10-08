export function normalizarBuscaBairro(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

export function bairroCorrespondeBusca(descricao: string, query: string): boolean {
  const termo = normalizarBuscaBairro(query);
  if (!termo) return true;
  return normalizarBuscaBairro(descricao).includes(termo);
}

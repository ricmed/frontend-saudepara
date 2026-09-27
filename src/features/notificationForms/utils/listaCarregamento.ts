export const LISTA_TAMANHO_LOTE = 10;

export function deveAvisarListaIncompleta(input: {
  carregando: boolean;
  termoBusca: string;
  pagina: number;
  itensPorPagina: number;
  carregadas: number;
  total: number;
  filtroTipo: boolean;
}): boolean {
  if (!input.carregando || input.total <= input.carregadas) {
    return false;
  }

  if (input.termoBusca.trim().length >= 3 || input.filtroTipo) {
    return true;
  }

  const paginaAtual = Math.max(1, input.pagina);
  const inicio = (paginaAtual - 1) * input.itensPorPagina;
  const fim = inicio + input.itensPorPagina;
  return inicio >= input.carregadas || fim > input.carregadas;
}

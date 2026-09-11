export function tiposEstabelecimentoDoMapa(
  estabelecimentos: Array<{ tipo?: string | null }>,
): string[] {
  return [...new Set(
    estabelecimentos
      .map((item) => item.tipo?.trim())
      .filter((tipo): tipo is string => Boolean(tipo)),
  )].sort((left, right) => left.localeCompare(right, 'pt-BR'));
}

export function contarEstabelecimentosPorTipo(
  estabelecimentos: Array<{ tipo?: string | null }>,
  tipo: string,
): number {
  return estabelecimentos.filter((item) => item.tipo === tipo).length;
}

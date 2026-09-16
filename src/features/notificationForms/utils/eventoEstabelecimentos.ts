export type EstabelecimentoAllowedOption = {
  idestabelecimento: number;
  nome: string;
  cidade?: string;
  cnes?: string;
};

export function eventoVinculaEstabelecimentos(
  quantidadeOuFlag: number | boolean | null | undefined,
): boolean {
  if (typeof quantidadeOuFlag === 'boolean') {
    return quantidadeOuFlag;
  }
  return (quantidadeOuFlag ?? 0) > 0;
}

export function filtrarUnidadesDoEvento<T extends { id: number }>(
  unidades: T[],
  idsVinculados: number[] | undefined,
): T[] {
  if (!idsVinculados || idsVinculados.length === 0) {
    return unidades;
  }
  const allow = new Set(idsVinculados);
  return unidades.filter((unidade) => allow.has(unidade.id));
}

export function aplicarEscopoUnidadeNoEvento<
  T extends { idestabelecimento: number },
>(
  unidades: T[],
  nivel: string | undefined,
  estabelecimentoId: number | null | undefined,
): T[] {
  if (nivel === 'unidade' && estabelecimentoId) {
    return unidades.filter((unidade) => unidade.idestabelecimento === estabelecimentoId);
  }
  return unidades;
}

export function toAllowedOptions(
  rows: Array<{
    idestabelecimento: number;
    nome: string;
    cidade?: string | null;
    cnes?: string | null;
  }>,
): EstabelecimentoAllowedOption[] {
  return rows.map((row) => ({
    idestabelecimento: row.idestabelecimento,
    nome: row.nome,
    cidade: row.cidade ?? undefined,
    cnes: row.cnes ?? undefined,
  }));
}

/** Restringe a lista só depois do load — durante loading lista vazia quebrava a pré-seleção. */
export function shouldRestrictEstabelecimentosPorEvento(
  eventoIdValue: string | null | undefined,
  loading: boolean,
  vincula: boolean,
): boolean {
  const eventoId = Number(eventoIdValue);
  const hasEvento = Number.isInteger(eventoId) && eventoId > 0;
  return hasEvento && !loading && vincula;
}

export function eventoRestringeObito(vinculaObitos: boolean): boolean {
  return vinculaObitos;
}

export function rotuloOpcaoObitoEvento(
  nome: string,
  cnes?: string | null,
): string {
  const cnesNormalizado = (cnes ?? '').replace(/^0+/, '');
  const isSvo = cnesNormalizado === '62502' || /SVO/i.test(nome);
  if (!isSvo) {
    return nome;
  }
  return `${nome} (interesse epidemiológico excepcional)`;
}

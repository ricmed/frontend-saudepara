export function formatComunicacaoDaeAgravoNomes(com: {
  daes?: { nome: string }[];
  dae?: { nome?: string } | null;
}): string {
  if (com.daes?.length) {
    return com.daes.map((d) => d.nome).join(', ');
  }
  return com.dae?.nome || '-';
}

export function formatComunicacaoDaeAgravoCodigos(com: {
  daes?: { codigo?: string | null }[];
  dae?: { codigo?: string | null } | null;
}): string {
  if (com.daes?.length) {
    const c = com.daes.map((d) => d.codigo).filter(Boolean) as string[];
    return c.length ? c.join(', ') : '-';
  }
  return com.dae?.codigo || '-';
}

/** IDs de agravos (DAE) vinculados à comunicação — suporta múltiplos (API) e legado (só id_dae). */
export function getComunicacaoDaeAgravoIds(com: {
  id_dae: number;
  id_daes?: number[] | null;
}): number[] {
  if (com.id_daes?.length) {
    return [...new Set(com.id_daes)];
  }
  return com.id_dae ? [com.id_dae] : [];
}

export function comunicacaoMatchesDaeFilter(
  com: { id_dae: number; id_daes?: number[] | null },
  daeId: number,
): boolean {
  return getComunicacaoDaeAgravoIds(com).includes(daeId);
}

/** Filtro do dashboard (valor único ou lista de IDs de agravo). */
export function matchesDaeDashboardFilter(
  com: { id_dae: number; id_daes?: number[] | null; dae?: { nome?: string }; daes?: { id_dae: number; nome: string }[] },
  filterValue: number | number[] | null | undefined,
): boolean {
  if (filterValue === null || filterValue === undefined) return true;
  if (Array.isArray(filterValue) && filterValue.length === 0) return true;
  const ids = getComunicacaoDaeAgravoIds(com);
  if (Array.isArray(filterValue)) {
    return filterValue.some((fid) => ids.includes(fid));
  }
  return ids.includes(filterValue);
}

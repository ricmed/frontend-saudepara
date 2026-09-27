export type EventoComCidades = {
  municipios_ids?: number[] | null;
  abrangencia?: Array<{ municipio?: { idtipo_municipio?: number | null } | null }> | null;
  evento_abrangencia_municipio?: Array<{
    tipo_municipio_id?: number | null;
    tipo_municipio?: { idtipo_municipio?: number | null } | null;
  }> | null;
};

export type EscopoEventoUsuario = {
  pronto: boolean;
  verTodos: boolean;
  isEstado: boolean;
  municipioId: number | null;
  /** Cidade própria e, na CRS, as cidades da regional. */
  municipioIds?: number[];
};

function idValido(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** `null` = o payload não trouxe a lista. Array vazio = evento sem cidade. */
export function idsAbrangencia(evento: EventoComCidades | null | undefined): number[] | null {
  if (!evento || typeof evento !== 'object') {
    return null;
  }
  if (Array.isArray(evento.municipios_ids)) {
    return evento.municipios_ids.filter(idValido);
  }
  if (Array.isArray(evento.abrangencia)) {
    return evento.abrangencia
      .map((linha) => linha?.municipio?.idtipo_municipio)
      .filter(idValido);
  }
  if (Array.isArray(evento.evento_abrangencia_municipio)) {
    return evento.evento_abrangencia_municipio
      .map((linha) => linha?.tipo_municipio?.idtipo_municipio ?? linha?.tipo_municipio_id)
      .filter(idValido);
  }
  return null;
}

function cidadesDoEscopo(usuario: EscopoEventoUsuario): number[] {
  if (usuario.municipioIds && usuario.municipioIds.length > 0) {
    return usuario.municipioIds;
  }
  return usuario.municipioId != null ? [usuario.municipioId] : [];
}

/**
 * Basta uma cidade. Belém vê o evento que também lista Ananindeua.
 * Unidade entra pela cidade do estabelecimento. CRS entra se alguma cidade
 * da regional está na lista. Estado e admin master veem o que o servidor entregou.
 */
export function eventoVisivelParaUsuario(
  evento: EventoComCidades,
  usuario: EscopoEventoUsuario,
): boolean {
  const ids = idsAbrangencia(evento);
  if (!usuario.pronto) {
    return ids == null || ids.length === 0;
  }
  if (usuario.verTodos || usuario.isEstado) {
    return true;
  }
  if (ids == null) {
    return true;
  }
  const cidades = cidadesDoEscopo(usuario);
  if (ids.length === 0 || cidades.length === 0) {
    return false;
  }
  return ids.some((id) => cidades.includes(id));
}

export function escopoEventoDoUsuario(
  permissions: {
    loading: boolean;
    isAdmin: boolean;
    isEstado: boolean;
    municipioId?: number | null;
  },
  municipioIds?: number[],
): EscopoEventoUsuario {
  const municipioId = Number(permissions.municipioId);
  const proprio =
    Number.isInteger(municipioId) && municipioId > 0 ? municipioId : null;
  const lista = (municipioIds ?? (proprio != null ? [proprio] : [])).filter(idValido);
  return {
    pronto: !permissions.loading,
    verTodos: permissions.isAdmin,
    isEstado: permissions.isEstado,
    municipioId: proprio,
    municipioIds: [...new Set(lista)],
  };
}

export function getNotificacaoHipoteseIds(original: unknown): number[] {
  if (!original || typeof original !== 'object') {
    return [];
  }

  const record = original as {
    notificacao_has_tipo_hipotese_diag?: Array<{
      tipo_hipotese_diag_idtipo_hipotese_diag?: number;
      tipo_hipotese_diag?: { idtipo_hipotese_diag?: number };
    }>;
    tipo_hipotese_diag_idtipo_hipotese_diag?: number | null;
  };

  const fromJoin = (record.notificacao_has_tipo_hipotese_diag ?? [])
    .map((rel) =>
      rel.tipo_hipotese_diag_idtipo_hipotese_diag
      ?? rel.tipo_hipotese_diag?.idtipo_hipotese_diag,
    )
    .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));

  if (fromJoin.length > 0) {
    return [...new Set(fromJoin)];
  }

  const legacy = record.tipo_hipotese_diag_idtipo_hipotese_diag;
  return typeof legacy === 'number' && Number.isFinite(legacy) ? [legacy] : [];
}

export function getNotificacaoHipoteseNomes(notif: unknown): string[] {
  if (!notif || typeof notif !== 'object') {
    return [];
  }

  const wrapper = notif as {
    hipoteseDiagnostico?: string;
    tipo_hipotese_diag?: { descricao?: string };
    original?: {
      notificacao_has_tipo_hipotese_diag?: Array<{
        tipo_hipotese_diag?: { descricao?: string };
      }>;
      tipo_hipotese_diag?: { descricao?: string };
    };
  };
  const original = wrapper.original ?? wrapper;

  const fromJoin = (original.notificacao_has_tipo_hipotese_diag ?? [])
    .map((rel) => rel.tipo_hipotese_diag?.descricao?.trim())
    .filter((nome): nome is string => Boolean(nome));
  if (fromJoin.length > 0) {
    return fromJoin;
  }

  const legacy = original.tipo_hipotese_diag?.descricao?.trim()
    || wrapper.tipo_hipotese_diag?.descricao?.trim()
    || wrapper.hipoteseDiagnostico?.trim();
  return legacy ? [legacy] : [];
}

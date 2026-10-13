export type MonitorOperListaRecorte = 'todas' | 'qdqq' | 'sigplan';

export type MonitorOperListaSituacao = 'programacao' | 'relato_programacao' | 'relato_nao_programado';

type MonitorOperListaData = {
  cabecalho?: Record<string, unknown> | null;
  acao?: Record<string, unknown> | null;
};

function isSim(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

export function classifyMonitorOperLista(data: MonitorOperListaData | null | undefined): {
  programada: boolean;
  relato: boolean;
  situacao: MonitorOperListaSituacao | null;
} {
  const momento = String(data?.cabecalho?.momento ?? '').trim();
  const programadaFlag = isSim(data?.acao?.qtd_programadas_qdqq);
  const realizadaFlag = isSim(data?.acao?.qtd_realizadas_conforme_programacao);
  const naoProgramadaFlag = isSim(data?.acao?.qtd_nao_programadas_qdqq);
  const escolhida = isSim(data?.acao?.qdqq_escolhida);

  if (momento === 'programacao') {
    return { programada: true, relato: false, situacao: 'programacao' };
  }

  if (momento === 'relato') {
    const estavaNoQdqq = programadaFlag || escolhida;
    if (estavaNoQdqq) {
      return { programada: true, relato: true, situacao: 'relato_programacao' };
    }
    return { programada: false, relato: true, situacao: 'relato_nao_programado' };
  }

  if (programadaFlag && realizadaFlag) {
    return { programada: true, relato: true, situacao: 'relato_programacao' };
  }
  if (programadaFlag) {
    return { programada: true, relato: false, situacao: 'programacao' };
  }
  if (naoProgramadaFlag || realizadaFlag) {
    return { programada: false, relato: true, situacao: 'relato_nao_programado' };
  }

  return { programada: false, relato: false, situacao: null };
}

export function monitorOperListaSituacaoLabel(situacao: MonitorOperListaSituacao | null): string {
  switch (situacao) {
    case 'programacao':
      return 'Programação';
    case 'relato_programacao':
      return 'Relato da programação';
    case 'relato_nao_programado':
      return 'Relato não programado';
    case null:
      return '—';
    default: {
      const exhaustive: never = situacao;
      return exhaustive;
    }
  }
}

export function monitorOperMatchesListaRecorte(
  data: MonitorOperListaData | null | undefined,
  recorte: MonitorOperListaRecorte,
): boolean {
  if (recorte === 'todas') return true;
  const classified = classifyMonitorOperLista(data);
  switch (recorte) {
    case 'qdqq':
      return classified.programada;
    case 'sigplan':
      return classified.relato;
    default: {
      const exhaustive: never = recorte;
      return exhaustive;
    }
  }
}

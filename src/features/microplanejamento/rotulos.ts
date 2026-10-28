export const STATUS_PLANO = [
  ['RASCUNHO', 'Rascunho'],
  ['EM_VALIDACAO', 'Em validação'],
  ['APROVADO', 'Aprovado'],
  ['EM_EXECUCAO', 'Em execução'],
  ['CONCLUIDA', 'Concluída'],
  ['REPROGRAMADA', 'Reprogramada'],
  ['CANCELADA', 'Cancelada'],
  ['ENCERRADO', 'Encerrado'],
] as const;

export const STATUS_PLANO_ROTULO: Record<string, string> = Object.fromEntries(STATUS_PLANO);

export const STATUS_ALERTA_ROTULO: Record<string, string> = {
  NOVO: 'Novo',
  EM_ANALISE: 'Em análise',
  TRATADO: 'Tratado',
  ENCERRADO: 'Encerrado',
};

export const SEVERIDADE_ROTULO: Record<string, string> = {
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
};

export const FAIXA_PRIORIDADE_ROTULO: Record<string, string> = {
  MUITO_ALTA: 'Muito alta',
  ALTA: 'Alta',
  MODERADA: 'Moderada',
  BAIXA: 'Baixa',
};

export function rotuloMapa(mapa: Record<string, string>, valor: string) {
  return mapa[valor] ?? valor;
}

export function formatarNumero(valor: number) {
  return valor.toLocaleString('pt-BR');
}

export function formatarPercentual(valor: number) {
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

export function formatarDataIso(valor?: string | null) {
  if (!valor) return '—';
  const iso = String(valor).slice(0, 10);
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

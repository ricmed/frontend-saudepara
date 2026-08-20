/**
 * Obstáculos do Monitor Operacional (QDQQ) por atividade.
 * Espelho do util do backend — filtro de UI no FormRenderer.
 */

export type MonitorOperObstaculoOption = { value: string; label: string };

export const MONITOR_OPER_OBSTACULOS_CAPACITACAO: MonitorOperObstaculoOption[] = [
  { value: 'nao_comparecimento_toda_equipe', label: 'Não comparecimento de toda a equipe municipal' },
  { value: 'nao_comparecimento_parte_equipe', label: 'Não comparecimento de parte da equipe municipal' },
  { value: 'problemas_adm_financeiros', label: 'Problemas administrativos financeiros' },
  { value: 'problemas_internet', label: 'Problemas com a internet' },
  { value: 'problemas_espaco_fisico', label: 'Problemas com o espaço físico' },
  { value: 'dificuldade_deslocamento_trajeto', label: 'Dificuldade no deslocamento com o trajeto' },
  { value: 'dificuldade_deslocamento_veiculo', label: 'Dificuldade no deslocamento com o veículo' },
  { value: 'dificuldade_deslocamento_motorista', label: 'Dificuldade no deslocamento com o motorista' },
];

/** Opções oficiais quando atividade = Ação complementar. */
export const MONITOR_OPER_OBSTACULOS_ACAO_COMPLEMENTAR: MonitorOperObstaculoOption[] = [
  { value: 'falta_insumos_diagnostico', label: 'Falta de insumos para diagnóstico' },
  { value: 'falta_insumos_tratamento', label: 'Falta de insumos para tratamento' },
  { value: 'falta_insumos_preventivas', label: 'Falta de insumos para ações preventivas' },
];

/** Aquisição. */
export const MONITOR_OPER_OBSTACULOS_AQUISICAO: MonitorOperObstaculoOption[] = [
  { value: 'problemas_adm_orcamentarios', label: 'Problemas administrativos orçamentários' },
  { value: 'problemas_adm_gestao', label: 'Problemas administrativos de gestão' },
];

/** Distribuição. */
export const MONITOR_OPER_OBSTACULOS_DISTRIBUICAO: MonitorOperObstaculoOption[] = [
  {
    value: 'dificuldade_contrato_terceirizado',
    label: 'Dificuldade com o contrato terceirizado para a execução do serviço',
  },
];

/** Fiscalização / inspeção. */
export const MONITOR_OPER_OBSTACULOS_FISCALIZACAO: MonitorOperObstaculoOption[] = [
  { value: 'dificuldade_adesao_usuario', label: 'Dificuldades com a adesão do usuário' },
  {
    value: 'dificuldade_articulacao_gestao',
    label: 'Dificuldades de articulação com a gestão municipal',
  },
  {
    value: 'participacao_insuficiente_equipe',
    label: 'Participação e ou colaboração insuficiente da equipe técnica do município',
  },
];

/**
 * Catálogo provisório para atividades ainda sem lista dedicada.
 */
export const MONITOR_OPER_OBSTACULOS_OUTRAS_PROVISORIO: MonitorOperObstaculoOption[] = [];

export const MONITOR_OPER_OBSTACULOS_ALL: MonitorOperObstaculoOption[] = [
  ...MONITOR_OPER_OBSTACULOS_CAPACITACAO,
  ...MONITOR_OPER_OBSTACULOS_ACAO_COMPLEMENTAR,
  ...MONITOR_OPER_OBSTACULOS_AQUISICAO,
  ...MONITOR_OPER_OBSTACULOS_DISTRIBUICAO,
  ...MONITOR_OPER_OBSTACULOS_FISCALIZACAO,
  ...MONITOR_OPER_OBSTACULOS_OUTRAS_PROVISORIO,
];

export function monitorOperObstaculoOptionsForAtividade(
  atividade: unknown,
): MonitorOperObstaculoOption[] {
  const a = String(atividade ?? '').trim();
  if (!a) return [];
  if (a === 'capacitacao' || a === 'avaliacao') return MONITOR_OPER_OBSTACULOS_CAPACITACAO;
  if (a === 'acao_complementar') return MONITOR_OPER_OBSTACULOS_ACAO_COMPLEMENTAR;
  if (a === 'aquisicao') return MONITOR_OPER_OBSTACULOS_AQUISICAO;
  if (a === 'distribuicao') return MONITOR_OPER_OBSTACULOS_DISTRIBUICAO;
  if (a === 'fiscalizacao_inspecao' || a === 'regulacao') return MONITOR_OPER_OBSTACULOS_FISCALIZACAO;
  return MONITOR_OPER_OBSTACULOS_OUTRAS_PROVISORIO;
}

export function formatMonitorOperObstaculoLabel(value: unknown): string {
  const v = String(value ?? '').trim();
  if (!v) return '—';
  const hit = MONITOR_OPER_OBSTACULOS_ALL.find((o) => o.value === v);
  return hit?.label ?? v;
}

/** Campo 60 — Evolução do caso (rótulos SES-PA). */
export const EVOLUCAO_DETECTADO = '1';
export const EVOLUCAO_NAO_DETECTADO = '2';
export const EVOLUCAO_PERDA_SEGUIMENTO = '3';
export const EVOLUCAO_EM_ANDAMENTO = '4';
export const EVOLUCAO_TRANSFERENCIA = '5';
export const EVOLUCAO_OBITO_FULMINANTE = '6';
export const EVOLUCAO_OBITO_OUTRAS = '7';

export const EVOLUCAO_CASO_LABELS: Record<string, string> = {
  [EVOLUCAO_DETECTADO]: 'Detectado',
  [EVOLUCAO_NAO_DETECTADO]: 'Não-Detectado',
  [EVOLUCAO_PERDA_SEGUIMENTO]: 'Perda de seguimento',
  [EVOLUCAO_EM_ANDAMENTO]: 'Caso em andamento',
  [EVOLUCAO_TRANSFERENCIA]: 'Transferência',
  [EVOLUCAO_OBITO_FULMINANTE]: 'Óbito — hepatite fulminante',
  [EVOLUCAO_OBITO_OUTRAS]: 'Óbito — outras causas',
};

/** Campo 61 — Classificação etiológica. */
export const CLASSIFICACAO_VIRUS_B = '1';
export const CLASSIFICACAO_VIRUS_C = '2';
export const CLASSIFICACAO_VIRUS_BC = '3';

export const CLASSIFICACAO_ETIOLOGICA_LABELS: Record<string, string> = {
  [CLASSIFICACAO_VIRUS_B]: 'Vírus B',
  [CLASSIFICACAO_VIRUS_C]: 'Vírus C',
  [CLASSIFICACAO_VIRUS_BC]: 'Vírus B e C',
};

export function resolveEvolucaoLabel(code: string): string {
  const key = String(code ?? '').trim();
  if (!key) return 'Não informado';
  return EVOLUCAO_CASO_LABELS[key] ?? `Cód. ${key}`;
}

export function resolveClassificacaoLabel(code: string): string {
  const key = String(code ?? '').trim();
  if (!key) return 'Não informado';
  return CLASSIFICACAO_ETIOLOGICA_LABELS[key] ?? `Cód. ${key}`;
}

export function isObitoEvolucao(code: string): boolean {
  const key = String(code ?? '').trim();
  return key === EVOLUCAO_OBITO_FULMINANTE || key === EVOLUCAO_OBITO_OUTRAS;
}

export function isCasoEmAberto(dataEncerramento: string | null): boolean {
  return !dataEncerramento;
}

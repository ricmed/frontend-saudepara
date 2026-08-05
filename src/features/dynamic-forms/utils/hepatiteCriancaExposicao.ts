/** Tipo de exposição hepática — ficha única criança exposta (SINAN SES-PA). */
export const TIPO_EXPOSICAO_HEPATITE_KEY = 'notificacao.tipo_exposicao_hepatite';

export const TIPO_EXPOSICAO_HBV = '1';
export const TIPO_EXPOSICAO_HCV = '2';
export const TIPO_EXPOSICAO_AMBOS = '3';

export const TIPO_EXPOSICAO_OPTIONS = [
  { value: TIPO_EXPOSICAO_HBV, label: 'HBV (Hepatite B)' },
  { value: TIPO_EXPOSICAO_HCV, label: 'HCV (Hepatite C)' },
  { value: TIPO_EXPOSICAO_AMBOS, label: 'HBV e HCV (co-infecção)' },
] as const;

export const HEPATITE_CRIANCA_HBV_ONLY_SECTIONS = new Set([
  'section_antecedentes_epidemiologicos_crianca',
  'section_dados_laboratoriais_crianca',
]);

export const HEPATITE_CRIANCA_HCV_ONLY_SECTIONS = new Set(['section_acompanhamento_crianca']);

export function tipoExposicaoMostraHbv(tipo: unknown): boolean {
  const v = String(tipo ?? '').trim();
  return v === TIPO_EXPOSICAO_HBV || v === TIPO_EXPOSICAO_AMBOS;
}

export function tipoExposicaoMostraHcv(tipo: unknown): boolean {
  const v = String(tipo ?? '').trim();
  return v === TIPO_EXPOSICAO_HCV || v === TIPO_EXPOSICAO_AMBOS;
}

export function agravoDoencaPorTipoExposicao(tipo: unknown): string {
  const v = String(tipo ?? '').trim();
  if (v === TIPO_EXPOSICAO_HBV) return 'CRIANÇA EXPOSTA AO HBV';
  if (v === TIPO_EXPOSICAO_HCV) return 'CRIANÇA EXPOSTA AO HCV';
  if (v === TIPO_EXPOSICAO_AMBOS) return 'CRIANÇA EXPOSTA AO HBV / HCV';
  return '';
}

/** CID-10 base (HBV). Co-infecção acrescenta sufixo CO (ata NIVS 14/07/2026). */
export const AGRAVO_CID_HBV = 'Z20.5';
export const AGRAVO_CID_COINFECCAO = 'Z20.5CO';

export function agravoCidPorTipoExposicao(tipo: unknown): string {
  const v = String(tipo ?? '').trim();
  if (v === TIPO_EXPOSICAO_HCV) return '';
  if (v === TIPO_EXPOSICAO_HBV) return AGRAVO_CID_HBV;
  if (v === TIPO_EXPOSICAO_AMBOS) return AGRAVO_CID_COINFECCAO;
  return '';
}

export function agravoCidHintPorTipoExposicao(tipo: unknown): string {
  const v = String(tipo ?? '').trim();
  if (v === TIPO_EXPOSICAO_HCV) {
    return 'Sem CID-10 oficial do MS para criança exposta ao HCV; manter em branco até normativa.';
  }
  if (v === TIPO_EXPOSICAO_HBV) {
    return 'Z20.5 — Contato com e exposição à hepatite viral (criança exposta ao HBV).';
  }
  if (v === TIPO_EXPOSICAO_AMBOS) {
    return 'Z20.5CO — co-infecção HBV/HCV (sufixo CO para diferenciar do HBV isolado).';
  }
  return 'Selecione o tipo de exposição para definir o CID.';
}

export function agravoDoencaHintPorTipoExposicao(): string {
  return 'Atualizado automaticamente conforme o tipo de exposição selecionado.';
}

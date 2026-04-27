/**
 * Cenários de demonstração para o monitor operacional regional (MONITOR_OPER_REGIONAL).
 * Objetivo: preencher o máximo de campos possíveis em `data_json` para relatórios e testes.
 *
 * Uso: Vitest, mocks de API em Playwright, ou seed manual (copiar `data_json` para POST /api/submissions).
 */

/** Alinhar com mocks E2E (`form_version_id` do formulário MONITOR_OPER_REGIONAL). */
export const DEMO_FORM_VERSION_ID = 5011;
export const DEMO_CRS_ID = 42;

/** Competências no mesmo quadrimestre (Q1 2026) para consolidar QDQQ no painel. */
export const DEMO_COMP_Q1_A = '2026-01';
export const DEMO_COMP_Q1_B = '2026-03';

export type DemoSubmissionSeed = {
  id: number;
  status: 'draft' | 'submitted' | 'synced';
  created_by: string;
  created_at: string;
  updated_at: string;
  created_offline: boolean;
  data_json: Record<string, any>;
};

function ts(iso: string) {
  return iso;
}

function cabecalhoQ1(over: Record<string, any> = {}) {
  return {
    crs_id: DEMO_CRS_ID,
    ano: 2026,
    mes: 'FEV',
    competencia_mes_ano: DEMO_COMP_Q1_A,
    ...over,
  };
}

function custoCompleto() {
  return {
    el_339014: 1200.5,
    el_339030: 350.25,
    el_339033: 89.9,
    el_339036: 2000,
    el_339039: 4500.75,
    total: 8241.4,
  };
}

function detalhamentoCompleto() {
  return {
    capacitacao_como: 'treinamento',
    capacitacao_n_realizacoes: '1',
    capacitacao_n_pessoas: 48,
    capacitacao_pop_coberta: 0,
    avaliacao_como: 'supervisao',
    avaliacao_n_realizacoes: '1',
    complementar_descricao: 'investigacao_epidemiologica',
    complementar_detalhe: 'imunizacao',
    complementar_n_realizacoes: '1',
    complementar_pop_coberta: 1200,
    aquisicao_descricao: 'insumos',
    aquisicao_n_realizacoes: '1',
    aquisicao_quantificacao: 250,
    distribuicao_descricao: 'medicamento',
    distribuicao_quantificacao: 90,
    fiscalizacao_descricao: 'inspecao_in_loco_monitoramento',
    fiscalizacao_estabelecimento_id: 1001,
    regulacao_descricao: 'org_vig_processo_preventivo',
  };
}

function impEpiTodas(over: Partial<Record<string, boolean>> = {}) {
  return {
    coleta_processamento_envio: true,
    assistencia_individual: true,
    investigacao_epidemiologica: true,
    promocao_prevencao: true,
    analise_epidemiologica_feedback: true,
    diagnostico_lacen: true,
    ...over,
  };
}

function impSanTodas(over: Partial<Record<string, boolean>> = {}) {
  return {
    fiscalizacao_estabelecimentos: true,
    controle_produtos: true,
    fiscalizacao_servicos_saude: true,
    sistema_informacao_vs: true,
    lacen: true,
    ...over,
  };
}

function impAmbTodas(over: Partial<Record<string, boolean>> = {}) {
  return {
    vigiagua: true,
    vigisolo: true,
    vigiar: true,
    vspea: true,
    vigidesastre: true,
    visat: true,
    coleta_processamento_informacao: true,
    diagnostico_lacen: true,
    inspecoes_ambiente_trabalho: true,
    acidentes_doencas_trabalho: true,
    ...over,
  };
}

function acaoBase(over: Record<string, any> = {}) {
  return {
    data_realizacao: '2026-02-15',
    qtd_programadas_qdqq: '1',
    qtd_realizadas_conforme_programacao: '1',
    qtd_nao_programadas_qdqq: '0',
    municipios_alcancados: [1500800, 1500602],
    programa_alcancado: 'demo_programa_monitor',
    atividade: 'demo_atividade_monitor',
    ...over,
  };
}

/** Cenário 1 — área epidemiológica, Q1, impactos epi variados (um falso). */
export function buildDemoDataJsonEpiVariacao1(): Record<string, any> {
  return {
    cabecalho: cabecalhoQ1({ competencia_mes_ano: DEMO_COMP_Q1_A, mes: 'JAN' }),
    acao: acaoBase({
      area: 'imunopreveniveis',
      atividade: 'Capacitação em imunização (demo)',
      programa_alcancado: 'Calendário vacinal (demo)',
    }),
    detalhamento: detalhamentoCompleto(),
    custo: custoCompleto(),
    resumo: {
      objetivo_alcancado: '1',
      houve_obstaculos: '1',
      qual_obstaculo: 'Indisponibilidade pontual de insumos na regional (texto demo).',
    },
    imp_epi: impEpiTodas({ diagnostico_lacen: false }),
  };
}

/** Cenário 2 — mesma CRS/Q1, outra área epidemiológica, todos impactos epi. */
export function buildDemoDataJsonEpiVariacao2(): Record<string, any> {
  return {
    cabecalho: cabecalhoQ1({ competencia_mes_ano: DEMO_COMP_Q1_B, mes: 'MAR' }),
    acao: acaoBase({
      area: 'controle_endemias',
      data_realizacao: '2026-03-20',
      atividade: 'Ação de controle de vetores (demo)',
      programa_alcancado: 'Arboviroses (demo)',
      qtd_realizadas_conforme_programacao: '0',
    }),
    detalhamento: {
      ...detalhamentoCompleto(),
      capacitacao_como: 'oficina',
      avaliacao_como: 'webnario',
    },
    custo: {
      el_339014: 0,
      el_339030: 100,
      el_339033: 50,
      el_339036: 0,
      el_339039: 0,
      total: 150,
    },
    resumo: { objetivo_alcancado: '1', houve_obstaculos: '0' },
    imp_epi: impEpiTodas(),
  };
}

/** Cenário 3 — vigilância sanitária, Q1, impactos sanitários. */
export function buildDemoDataJsonSanitaria(): Record<string, any> {
  return {
    cabecalho: cabecalhoQ1({ competencia_mes_ano: DEMO_COMP_Q1_A, mes: 'FEV' }),
    acao: acaoBase({
      area: 'vigilancia_sanitaria',
      atividade: 'Fiscalização em estabelecimento (demo)',
      programa_alcancado: 'VISA alimentos (demo)',
    }),
    detalhamento: {
      ...detalhamentoCompleto(),
      fiscalizacao_descricao: 'inspecao_in_loco_investigativa',
      regulacao_descricao: 'org_vig_rede_atencao_primaria',
    },
    custo: { el_339014: 300, el_339030: 0, el_339033: 120, el_339036: 800, el_339039: 0, total: 1220 },
    resumo: { objetivo_alcancado: '0', houve_obstaculos: '1', qual_obstaculo: 'Falta de transporte para equipe (demo).' },
    imp_san: impSanTodas({ lacen: false }),
  };
}

/** Cenário 4 — vigilância ambiental e trabalhador, Q1. */
export function buildDemoDataJsonAmbiental(): Record<string, any> {
  return {
    cabecalho: cabecalhoQ1({ competencia_mes_ano: DEMO_COMP_Q1_B, mes: 'MAR' }),
    acao: acaoBase({
      area: 'vigilancia_ambiental_trabalhador',
      atividade: 'VIGIAGUA — amostragem (demo)',
      programa_alcancado: 'Vigilância da qualidade da água (demo)',
    }),
    detalhamento: detalhamentoCompleto(),
    custo: { el_339014: 0, el_339030: 200, el_339033: 400, el_339036: 0, el_339039: 1500, total: 2100 },
    resumo: { objetivo_alcancado: '1', houve_obstaculos: '0' },
    imp_amb: impAmbTodas({ vigidesastre: false }),
  };
}

/** Cenário 5 — LACEN (epi), competência diferente no mesmo Q1. */
export function buildDemoDataJsonLacen(): Record<string, any> {
  return {
    cabecalho: cabecalhoQ1({ competencia_mes_ano: DEMO_COMP_Q1_A, mes: 'ABR' }),
    acao: acaoBase({
      area: 'lacen',
      atividade: 'Suporte laboratorial (demo)',
      programa_alcancado: 'Rede LACEN (demo)',
    }),
    detalhamento: { ...detalhamentoCompleto(), aquisicao_descricao: 'contratacao_servicos' },
    custo: { el_339014: 50, el_339030: 20, el_339033: 0, el_339036: 300, el_339039: 100, total: 470 },
    resumo: { objetivo_alcancado: '1', houve_obstaculos: '1', qual_obstaculo: 'Demanda excedeu capacidade de processamento (demo).' },
    imp_epi: impEpiTodas({ promocao_prevencao: false }),
  };
}

/** Cenário 6 — ISTs (epi), mesma janela Q1. */
export function buildDemoDataJsonIsts(): Record<string, any> {
  return {
    cabecalho: cabecalhoQ1({ competencia_mes_ano: DEMO_COMP_Q1_B, mes: 'ABR' }),
    acao: acaoBase({
      area: 'dep_controle_doencas_transmissiveis',
      atividade: 'Testagem rápida IST (demo)',
      programa_alcancado: 'IST / HIV (demo)',
      qtd_programadas_qdqq: '0',
      qtd_nao_programadas_qdqq: '1',
    }),
    detalhamento: detalhamentoCompleto(),
    custo: custoCompleto(),
    resumo: { objetivo_alcancado: '0', houve_obstaculos: '0' },
    imp_epi: impEpiTodas(),
  };
}

/**
 * Lista de “submissions” fake para mock de API ou asserts.
 * Todos no mesmo CRS/ano/QDQQ (Q1/2026) para o painel exibir total acumulado único.
 */
export function getMonitorOperDemoSubmissionsForReport(): DemoSubmissionSeed[] {
  const base = {
    form_version_id: DEMO_FORM_VERSION_ID,
    status: 'submitted' as const,
    created_by: 'demo-tecnica',
    created_offline: false,
  };
  return [
    {
      ...base,
      id: 9101,
      created_at: ts('2026-02-01T10:00:00.000Z'),
      updated_at: ts('2026-02-01T10:00:00.000Z'),
      data_json: buildDemoDataJsonEpiVariacao1(),
    },
    {
      ...base,
      id: 9102,
      created_at: ts('2026-02-02T11:00:00.000Z'),
      updated_at: ts('2026-02-02T11:00:00.000Z'),
      data_json: buildDemoDataJsonEpiVariacao2(),
    },
    {
      ...base,
      id: 9103,
      created_at: ts('2026-02-03T12:00:00.000Z'),
      updated_at: ts('2026-02-03T12:00:00.000Z'),
      data_json: buildDemoDataJsonSanitaria(),
    },
    {
      ...base,
      id: 9104,
      created_at: ts('2026-02-04T13:00:00.000Z'),
      updated_at: ts('2026-02-04T13:00:00.000Z'),
      data_json: buildDemoDataJsonAmbiental(),
    },
    {
      ...base,
      id: 9105,
      created_at: ts('2026-02-05T14:00:00.000Z'),
      updated_at: ts('2026-02-05T14:00:00.000Z'),
      data_json: buildDemoDataJsonLacen(),
    },
    {
      ...base,
      id: 9106,
      created_at: ts('2026-02-06T15:00:00.000Z'),
      updated_at: ts('2026-02-06T15:00:00.000Z'),
      data_json: buildDemoDataJsonIsts(),
    },
  ];
}

/** Resumo estatístico dos demos (útil em teste ou log). */
export function summarizeDemoPayloads(rows: Record<string, any>[]) {
  const areas = new Map<string, number>();
  for (const d of rows) {
    const a = String(d?.acao?.area ?? '');
    areas.set(a, (areas.get(a) ?? 0) + 1);
  }
  return { count: rows.length, areas: Object.fromEntries(areas) };
}

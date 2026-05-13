/**
 * Registro das bases de dados disponíveis para campos de seleção.
 *
 * Cada base aparece UMA vez no dropdown do construtor (sem variantes). As relações
 * de cascata (pai/filho) são descritas em `children` e `parents`, e a UI converte
 * essas relações em ações: "Adicionar filho abaixo", "Vincular a pai (existente
 * ou novo, acima)".
 *
 * Para adicionar uma base nova, basta acrescentar uma entrada à lista e (se
 * relevante) declarar suas relações com outras bases.
 */

import type { FormField } from '@/services/FormService';

export interface DatabaseSource {
  /** ID interno, estável. */
  id: string;
  /** Nome exibido no dropdown. */
  label: string;
  /** Linha de ajuda curta (opcional). */
  hint?: string;
  /** Endpoint do backend (ex.: 'crs/select', 'tipo-municipio/select'). */
  endpoint: string;
  /** Query params fixos sempre enviados. */
  defaultStaticParams?: Record<string, string>;
  /**
   * Quando esta base é usada como PAI de cascata, o backend só reconhece estes
   * nomes de query param. O `key` do campo pai precisa estar nesta lista pra a
   * cascata funcionar. O primeiro é o usado ao criar automaticamente.
   *
   * Ex.: `tipo-municipio/select` reconhece `crs_id` e `cabecalho.crs_id` como
   * filtro de regional. Logo o campo de CRS no form precisa ter key `crs_id`.
   */
  acceptedParentKeys?: string[];
  /** Filhos sugeridos: ao escolher esta base, oferecer criar abaixo um campo destes. */
  children?: RelatedSuggestion[];
  /** Pais sugeridos: ao escolher esta base, oferecer vincular a um campo destes (acima). */
  parents?: RelatedSuggestion[];
}

export interface RelatedSuggestion {
  /** ID da outra base envolvida. */
  sourceId: string;
  /** Texto curto da sugestão (botão / banner). */
  promptText: string;
  /** Label inicial pro campo criado, se for o caso. */
  defaultLabel: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Catálogo de bases                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

const SOURCES: DatabaseSource[] = [
  // ── Geográficas com cascata ─────────────────────────────────────────────
  {
    id: 'crs',
    label: 'Regional de Saúde (CRS)',
    hint: 'Lista pronta das Regionais.',
    endpoint: 'crs/select',
    acceptedParentKeys: ['crs_id', 'cabecalho.crs_id'],
    children: [
      {
        sourceId: 'municipio',
        promptText: 'Adicionar abaixo um campo de Município que filtra pela Regional escolhida',
        defaultLabel: 'Município',
      },
    ],
  },
  {
    id: 'municipio',
    label: 'Município',
    hint: 'Cidades do Pará.',
    endpoint: 'tipo-municipio/select',
    parents: [
      {
        sourceId: 'crs',
        promptText: 'Esta lista de Municípios deve filtrar pela Regional escolhida em outra pergunta?',
        defaultLabel: 'Regional',
      },
    ],
  },
  {
    id: 'estado',
    label: 'Estado (UF)',
    hint: 'Lista de estados brasileiros.',
    endpoint: 'tipo-estado/select',
  },
  {
    id: 'bairro',
    label: 'Bairro',
    endpoint: 'tipo-bairro/select',
  },
  {
    id: 'pais',
    label: 'País',
    hint: 'Lista de países.',
    endpoint: 'tipo-pais/select',
  },
  // ── Pessoa / Sócio-demográficas ─────────────────────────────────────────
  {
    id: 'genero',
    label: 'Gênero / Sexo',
    endpoint: 'tipo-genero/select',
  },
  {
    id: 'raca',
    label: 'Raça / Cor',
    endpoint: 'tipo-raca/select',
  },
  {
    id: 'escolaridade',
    label: 'Escolaridade',
    endpoint: 'tipo-escolaridade/select',
  },
  {
    id: 'cbo',
    label: 'Ocupação (CBO)',
    endpoint: 'tipo-cbo/select',
  },
  {
    id: 'cnae',
    label: 'Atividade econômica (CNAE)',
    endpoint: 'tipo-cnae/select',
  },
  // ── Saúde / Estabelecimentos ────────────────────────────────────────────
  {
    id: 'nhe',
    label: 'NHE (Núcleo Hospitalar de Epidemiologia)',
    endpoint: 'nhe/select',
  },
];

export const DATABASE_SOURCES: DatabaseSource[] = SOURCES;

export function getSourceById(id: string): DatabaseSource | null {
  return SOURCES.find((s) => s.id === id) ?? null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Detecção                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Descobre qual base do registry o campo já está usando, ou null se for manual /
 * endpoint customizado / tabela arbitrária.
 *
 * A detecção é puramente pelo endpoint. Se o campo tem `apiSelectEndpointParams`,
 * ele é detectado como a mesma base — a cascata é um adicional, não uma fonte
 * diferente.
 */
export function inferDatabaseSource(field: FormField): DatabaseSource | null {
  if (field.dataSource !== 'api') return null;
  const ep = (field.apiSelectEndpoint || '').trim();
  if (!ep) return null;
  return SOURCES.find((s) => s.endpoint === ep) ?? null;
}

/**
 * Patch de FormField que aplica uma base ao campo. Preserva `apiSelectEndpointParams`
 * (cascata) se já existir — útil pra trocar a base sem perder o vínculo, embora
 * normalmente a UI redefina isso explicitamente.
 */
export function applyDatabaseSource(
  source: DatabaseSource,
  opts?: { preserveCascadeParam?: string | null },
): Partial<FormField> {
  return {
    dataSource: 'api',
    options: undefined,
    dataTable: undefined,
    dataValueColumn: undefined,
    dataLabelColumn: undefined,
    apiSelectEndpoint: source.endpoint,
    apiSelectStaticParams: source.defaultStaticParams,
    apiSelectEndpointParams: opts?.preserveCascadeParam ? [opts.preserveCascadeParam] : undefined,
    apiListGuidedPreset: undefined,
  };
}

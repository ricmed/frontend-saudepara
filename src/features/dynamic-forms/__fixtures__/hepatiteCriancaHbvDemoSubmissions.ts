/**
 * Gerador de ~100 fichas sintéticas para o dashboard HEPATITE_CRIANCA_HBV.
 * Os valores de município (IBGE), raça, escolaridade, sexo e unidade vêm de um
 * catálogo carregado do banco no script de seed — nunca use IDs inventados aqui.
 */

export const HEPATITE_DEMO_SUBMISSION_COUNT = 100;
export const HEPATITE_DEMO_CREATED_BY = 'seed-dev-hepatite-crianca-demo';

export type HepatiteDemoMunicipio = {
  id: number;
  ibge: string;
  nome: string;
  lat: number;
  lng: number;
};

export type HepatiteDemoUnidade = {
  id: number;
  municipioId: number;
  nome: string;
  cnes: string | null;
};

export type HepatiteDemoSelectOption = {
  value: string;
  descricao: string;
};

/** Catálogo resolvido a partir do Prisma (tipo_* + estabelecimento ativo). */
export type HepatiteDemoCatalog = {
  estadoId: number;
  municipios: HepatiteDemoMunicipio[];
  racas: HepatiteDemoSelectOption[];
  escolaridades: HepatiteDemoSelectOption[];
  sexos: HepatiteDemoSelectOption[];
  unidadesByMunicipioId: Record<number, HepatiteDemoUnidade>;
  fallbackUnidade: HepatiteDemoUnidade;
};

export type HepatiteDemoSubmissionRow = {
  data_json: Record<string, unknown>;
};

const TIPO_HBV = '1';
const TIPO_HCV = '2';
const TIPO_AMBOS = '3';

const SINAN_SIM = '1';
const SINAN_NAO = '2';
const SORO_REAGENTE = '1';
const SORO_NAO_REAGENTE = '2';

const MATERNIDADE_ANTES_24H = '1';
const MATERNIDADE_APOS_24H = '2';
const MATERNIDADE_NAO_REALIZADO = '4';

const NAO_REALIZADO_QUAL = ['vacina', 'imunoglobulina', 'ambos'] as const;

const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Ferreira', 'Costa', 'Pereira',
  'Almeida', 'Rodrigues', 'Nascimento', 'Carvalho', 'Gomes', 'Martins', 'Ribeiro',
  'Araujo', 'Melo', 'Barbosa', 'Rocha', 'Dias', 'Teixeira', 'Moura', 'Campos',
  'Correia', 'Monteiro', 'Cardoso', 'Castro', 'Andrade', 'Pinto', 'Freitas',
] as const;

const NOMES_CRIANCA = [
  'Ana', 'Maria', 'Julia', 'Laura', 'Helena', 'Alice', 'Sophia', 'Isabela',
  'Pedro', 'Lucas', 'Miguel', 'Arthur', 'Heitor', 'Bernardo', 'Gabriel', 'Rafael',
  'Enzo', 'Theo', 'Davi', 'Samuel', 'Benicio', 'Noah', 'Lorenzo', 'Gael',
  'Yasmin', 'Larissa', 'Beatriz', 'Camila', 'Emanuelly', 'Livia', 'Manuela', 'Valentina',
] as const;

const NOMES_MAE = [
  'Francisca', 'Raimunda', 'Antonia', 'Maria', 'Ana', 'Juliana', 'Fernanda', 'Patricia',
  'Aline', 'Carla', 'Daniela', 'Eliane', 'Fabiana', 'Gisele', 'Helena', 'Ivone',
  'Jacqueline', 'Karina', 'Luciana', 'Marcela', 'Natalia', 'Olivia', 'Paula', 'Renata',
  'Simone', 'Tatiane', 'Vanessa', 'Wanessa', 'Yara', 'Zilda', 'Bianca', 'Debora',
] as const;

const NOMES_INVESTIGADOR = [
  'Carla Mendes', 'Roberto Alves', 'Juliana Nascimento', 'Marcos Pereira',
  'Fernanda Costa', 'Ricardo Oliveira', 'Patricia Souza', 'Eduardo Lima',
  'Aline Ferreira', 'Bruno Rodrigues', 'Camila Gomes', 'Diego Martins',
  'Eliane Ribeiro', 'Fabio Carvalho', 'Gisele Barbosa', 'Henrique Dias',
] as const;

function nomeCrianca(index: number): string {
  const nome = NOMES_CRIANCA[index % NOMES_CRIANCA.length];
  const sob1 = SOBRENOMES[(index * 3) % SOBRENOMES.length];
  const sob2 = SOBRENOMES[(index * 7 + 5) % SOBRENOMES.length];
  return `${nome} ${sob1} ${sob2}`;
}

function nomeMae(index: number): string {
  const nome = NOMES_MAE[(index * 5 + 2) % NOMES_MAE.length];
  const sob1 = SOBRENOMES[(index * 11) % SOBRENOMES.length];
  const sob2 = SOBRENOMES[(index * 13 + 3) % SOBRENOMES.length];
  return `${nome} ${sob1} ${sob2}`;
}

function nomeInvestigador(index: number): string {
  return NOMES_INVESTIGADOR[index % NOMES_INVESTIGADOR.length];
}

/** Coordenadas aproximadas para pontos no mapa (PA). */
const GEO_PA_REF: Array<{ lat: number; lng: number }> = [
  { lat: -1.4558, lng: -48.4902 },
  { lat: -2.4435, lng: -54.7087 },
  { lat: -1.9988, lng: -47.9292 },
  { lat: -0.0349, lng: -51.0694 },
  { lat: -5.0892, lng: -42.8016 },
  { lat: -3.2012, lng: -52.2189 },
  { lat: -7.2342, lng: -49.9239 },
  { lat: -1.3028, lng: -47.9267 },
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() - months);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function normalizeIbgeCodigo(codigo: string): string {
  // Mesmo valor do tipo_municipio.codigo / select da ficha (ex.: 150140 para Belém).
  return String(codigo ?? '').replace(/\D/g, '').trim();
}

/** PRNG determinístico por índice — variável mas reproduzível entre runs. */
function seededRandom(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function pickFrom<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

/** Municípios com mais peso na distribuição (região metropolitana + eixos). */
const MUNICIPIO_PESO_EXTRA = new Set([
  'Belém',
  'Ananindeua',
  'Marituba',
  'Benevides',
  'Castanhal',
  'Marabá',
  'Santarém',
  'Parauapebas',
  'Altamira',
  'Barcarena',
]);

function pickMunicipio(catalog: HepatiteDemoCatalog, index: number, salt: number): HepatiteDemoMunicipio {
  const rand = seededRandom(index * 2_654_435_761 + salt * 97_409);
  const lista = catalog.municipios;
  if (lista.length === 0) throw new Error('Catálogo sem municípios');

  const pesados = lista.filter((m) => MUNICIPIO_PESO_EXTRA.has(m.nome));
  const pool =
    pesados.length > 0 && rand() < 0.42
      ? pesados
      : lista;
  return pickFrom(rand, pool);
}

export function geoForDemoIndex(index: number): { lat: number; lng: number } {
  const ref = GEO_PA_REF[index % GEO_PA_REF.length];
  const jitter = (index % 11) * 0.008;
  return { lat: ref.lat + jitter * 0.15, lng: ref.lng - jitter * 0.1 };
}

export function mapDbMunicipioToDemo(
  row: { idtipo_municipio: number; codigo: string; descricao: string },
  index: number,
): HepatiteDemoMunicipio {
  const geo = geoForDemoIndex(index);
  return {
    id: row.idtipo_municipio,
    ibge: normalizeIbgeCodigo(row.codigo),
    nome: row.descricao,
    lat: geo.lat,
    lng: geo.lng,
  };
}

function resolveUnidade(
  catalog: HepatiteDemoCatalog,
  municipioId: number,
): HepatiteDemoUnidade {
  return catalog.unidadesByMunicipioId[municipioId] ?? catalog.fallbackUnidade;
}

function tipoExposicao(rand: () => number): string {
  const r = rand();
  if (r < 0.38) return TIPO_HBV;
  if (r < 0.72) return TIPO_HCV;
  return TIPO_AMBOS;
}

function idadeMesesForIndex(rand: () => number): number {
  return randInt(rand, 0, 24);
}

function includesHbv(tipo: string): boolean {
  return tipo === TIPO_HBV || tipo === TIPO_AMBOS;
}

function includesHcv(tipo: string): boolean {
  return tipo === TIPO_HCV || tipo === TIPO_AMBOS;
}

function agravoDoencaPorTipo(tipo: string): string {
  if (tipo === TIPO_HBV) return 'CRIANÇA EXPOSTA AO HBV';
  if (tipo === TIPO_HCV) return 'CRIANÇA EXPOSTA AO HCV';
  if (tipo === TIPO_AMBOS) return 'CRIANÇA EXPOSTA AO HBV / HCV';
  return '';
}

function agravoCidPorTipo(tipo: string): string {
  if (tipo === TIPO_HCV) return '';
  if (tipo === TIPO_HBV || tipo === TIPO_AMBOS) return 'Z20.5';
  return '';
}

function buildMaeLab(rand: () => number, tipo: string): Record<string, string> {
  const lab: Record<string, string> = {};
  if (includesHbv(tipo)) {
    lab.sorologia_reagente_hepatite_b = rand() < 0.18 ? SINAN_NAO : SORO_REAGENTE;
    if (rand() < 0.35) {
      lab.hepatite_b_quando_antes_prenatal = SINAN_SIM;
      lab.hbv_hbsag = SORO_REAGENTE;
      lab.hbv_dna = rand() < 0.55 ? SORO_REAGENTE : SORO_NAO_REAGENTE;
    } else {
      lab.hepatite_b_quando_maternidade = SINAN_SIM;
      if (rand() < 0.4) lab.hbv_hbsag = SORO_REAGENTE;
    }
  }
  if (includesHcv(tipo)) {
    lab.sorologia_reagente_hepatite_c = rand() < 0.15 ? SINAN_NAO : SORO_REAGENTE;
  }
  return lab;
}

function buildVacinaMaternidade(rand: () => number, tipo: string): Record<string, string> {
  if (!includesHbv(tipo)) return {};
  const r = rand();
  if (r < 0.12) {
    return {
      vacina_hepatite_b_maternidade: MATERNIDADE_NAO_REALIZADO,
      maternidade_hbv_hbig_nao_realizado_qual: pickFrom(rand, NAO_REALIZADO_QUAL),
    };
  }
  if (r < 0.28) {
    return { vacina_hepatite_b_maternidade: MATERNIDADE_APOS_24H };
  }
  return { vacina_hepatite_b_maternidade: MATERNIDADE_ANTES_24H };
}

function buildCriancaLab(
  rand: () => number,
  tipo: string,
  idadeMeses: number,
): { lab?: Record<string, unknown> } {
  if (!includesHbv(tipo) || idadeMeses < 9 || idadeMeses > 15) return {};

  const roll = rand();
  const esquema1: Record<string, string> = {};
  if (roll < 0.38) {
    esquema1.hbsag = SORO_NAO_REAGENTE;
    esquema1.anti_hbs = SORO_REAGENTE;
    esquema1.hbv_dna = SORO_NAO_REAGENTE;
  } else if (roll < 0.62) {
    esquema1.hbsag = SORO_NAO_REAGENTE;
    esquema1.anti_hbs = SORO_NAO_REAGENTE;
  } else {
    return {};
  }

  const lab: Record<string, unknown> = { esquema1 };
  if (esquema1.anti_hbs === SORO_NAO_REAGENTE && rand() < 0.55) {
    lab.registrar_esquema_2 = SINAN_SIM;
    lab.esquema2 = {
      hbsag: SORO_NAO_REAGENTE,
      anti_hbs: rand() < 0.5 ? SORO_REAGENTE : SORO_NAO_REAGENTE,
    };
  }

  return { lab };
}

function buildCriancaAcomp(
  rand: () => number,
  tipo: string,
  idadeMeses: number,
): { acomp?: Record<string, unknown> } {
  if (!includesHcv(tipo)) return {};

  const acomp: Record<string, unknown> = {};

  if (idadeMeses >= 3 && idadeMeses <= 6 && rand() < 0.7) {
    acomp.m3_6 = {
      hcv_rna: rand() < 0.5 ? SORO_NAO_REAGENTE : SORO_REAGENTE,
    };
  }

  if (idadeMeses >= 18) {
    if (rand() < 0.55) {
      acomp.anti_hcv = SORO_NAO_REAGENTE;
    } else if (rand() < 0.75) {
      acomp.hcv_rna = SORO_NAO_REAGENTE;
    }
  }

  return Object.keys(acomp).length > 0 ? { acomp } : {};
}

function buildConclusao(rand: () => number, tipo: string, referenceDate: Date): Record<string, string | undefined> {
  if (rand() > 0.34) {
    return {};
  }
  const evolucaoCodes = ['1', '2', '3', '4', '5', '6', '7'];
  const classificacao =
    tipo === TIPO_HBV ? '1' : tipo === TIPO_HCV ? '2' : '3';
  const dtEnc = addDays(referenceDate, -randInt(rand, 5, 400));
  return {
    evolucao_caso: pickFrom(rand, evolucaoCodes),
    classificacao_etiologica: classificacao,
    data_encerramento: formatDate(dtEnc),
  };
}

function buildVacinaDoses(rand: () => number, tipo: string): Record<string, string> {
  if (!includesHbv(tipo)) return {};
  const doses: Record<string, string> = {};
  if (rand() < 0.72) doses['crianca.vacina_hepatite_b_dose_1'] = SINAN_SIM;
  if (rand() < 0.58) doses['crianca.vacina_hepatite_b_dose_2'] = SINAN_SIM;
  if (rand() < 0.45) doses['crianca.vacina_hepatite_b_dose_3'] = SINAN_SIM;
  if (rand() < 0.3) doses['crianca.vacina_hepatite_b_dose_4'] = SINAN_SIM;
  return doses;
}

export function buildHepatiteCriancaHbvDemoDataJson(
  index: number,
  catalog: HepatiteDemoCatalog,
  referenceDate: Date = new Date(),
): Record<string, unknown> {
  const seq = index + 1;
  const rand = seededRandom(index * 1_049_729 + 17_389);
  const tipo = tipoExposicao(rand);
  const idadeMeses = idadeMesesForIndex(rand);
  const munNotif = pickMunicipio(catalog, index, 1);
  const munRes = pickMunicipio(catalog, index, 2);
  const unidade = resolveUnidade(catalog, munNotif.id);

  const dataNascimento = addMonths(referenceDate, idadeMeses);
  const diasAposNascimento = randInt(rand, 5, Math.max(10, Math.min(180, idadeMeses * 20 + 14)));
  let dtNotifClamped = addDays(dataNascimento, diasAposNascimento);
  if (dtNotifClamped.getTime() > referenceDate.getTime()) {
    dtNotifClamped = referenceDate;
  }

  const raca = pickFrom(rand, catalog.racas);
  const escolaridade = pickFrom(rand, catalog.escolaridades);
  const sexo = pickFrom(rand, catalog.sexos);

  const geo =
    rand() < 0.82
      ? { lat: munRes.lat + (rand() - 0.5) * 0.04, lng: munRes.lng + (rand() - 0.5) * 0.04 }
      : null;

  const criancaLab = buildCriancaLab(rand, tipo, idadeMeses);
  const criancaAcomp = buildCriancaAcomp(rand, tipo, idadeMeses);
  const vacinaDoses = buildVacinaDoses(rand, tipo);
  const vacinaMaternidade = buildVacinaMaternidade(rand, tipo);
  const conclusao = buildConclusao(rand, tipo, referenceDate);

  const data: Record<string, unknown> = {
    notificacao: {
      tipo_exposicao_hepatite: tipo,
      tipo_notificacao: '1',
      dt_notificacao: formatDate(dtNotifClamped),
      uf_notificacao: 'PA',
      municipio_notificacao_ibge: munNotif.ibge,
      municipio_id: munNotif.id,
      unidade_id: unidade.id,
      estabelecimento_cnes: unidade.cnes ?? '',
      agravo_doenca: agravoDoencaPorTipo(tipo),
    },
    agravo_cid: agravoCidPorTipo(tipo),
    paciente: {
      nome: nomeCrianca(index),
      data_nascimento: formatDate(dataNascimento),
      idade: idadeMeses,
      sexo: sexo.value,
      raca_cor: raca.value,
      nome_mae: nomeMae(index),
    },
    crianca_hbv: {
      numero_sinan_mae: rand() < 0.28 ? `2026${String(10000 + seq).slice(-5)}` : '',
    },
    residencia: {
      uf: 'PA',
      estado_id: catalog.estadoId,
      municipio_ibge: munRes.ibge,
      municipio_id: munRes.id,
      ...(geo
        ? {
            geo_campo_1: String(geo.lat),
            geo_campo_2: String(geo.lng),
          }
        : {}),
    },
    mae: {
      idade: randInt(rand, 18, 42),
      escolaridade: escolaridade.value,
      raca_cor: pickFrom(rand, catalog.racas).value,
      hiv_aids: rand() < 0.08 ? SINAN_SIM : SINAN_NAO,
      sifilis: rand() < 0.06 ? SINAN_SIM : SINAN_NAO,
      lab: buildMaeLab(rand, tipo),
    },
    prenatal: {
      fez_prenatal: rand() < 0.12 ? SINAN_NAO : SINAN_SIM,
      tratamento_hepatite_b: includesHbv(tipo) && rand() < 0.22 ? SINAN_SIM : SINAN_NAO,
      medicamento_utilizado: rand() < 0.22 ? 'Tenofovir' : '',
    },
    crianca: {
      numero_dnv: String(100000000 + seq).slice(-9),
      nascimento_municipio_ibge: munNotif.ibge,
      nascimento_uf: 'PA',
      nascimento_estado_id: catalog.estadoId,
      ...vacinaMaternidade,
      ...vacinaDoses,
      ...criancaLab,
      ...criancaAcomp,
    },
    investigador: {
      uf: 'PA',
      estado_id: catalog.estadoId,
      municipio_ibge: munNotif.ibge,
      municipio_id: unidade.municipioId,
      unidade_id: unidade.id,
      estabelecimento_cnes: unidade.cnes ?? '',
      estabelecimento_nome: unidade.nome,
      nome: nomeInvestigador(index),
      funcao: 'Enfermeiro epidemiologista',
    },
    conclusao,
  };

  return data;
}

export function getHepatiteCriancaHbvDemoSubmissions(
  catalog: HepatiteDemoCatalog,
  count = HEPATITE_DEMO_SUBMISSION_COUNT,
  startIndex = 0,
): HepatiteDemoSubmissionRow[] {
  const rows: HepatiteDemoSubmissionRow[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({ data_json: buildHepatiteCriancaHbvDemoDataJson(startIndex + i, catalog) });
  }
  return rows;
}

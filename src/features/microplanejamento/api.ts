import axios from '@/utils/axiosRetry';
import { getApiOrigin } from '@/config/apiOrigin';

const base = () => `${getApiOrigin()}/api/microplanejamento`;

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || 'Não foi possível concluir a operação';
  }
  return 'Não foi possível concluir a operação';
}

export type Page<T> = {
  data: T[];
  pagination?: { total: number; pages: number; currentPage: number; perPage: number };
};

async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const response = await axios.get<T>(`${base()}${path}`, { params, withCredentials: true });
  return response.data;
}

export const microplanejamentoApi = {
  health: () => get<{ ok: boolean }>('/health'),
  ciclos: (params?: Record<string, unknown>) => get<Page<Ciclo>>('/ciclos', params),
  criarCiclo: (body: unknown) => axios.post(`${base()}/ciclos`, body, { withCredentials: true }).then((r) => r.data),
  atualizarCiclo: (id: number, body: unknown) => axios.put(`${base()}/ciclos/${id}`, body, { withCredentials: true }).then((r) => r.data),
  localidades: (params?: Record<string, unknown>) => get<Page<Localidade>>('/localidades', params),
  criarLocalidade: (body: unknown) => axios.post(`${base()}/localidades`, body, { withCredentials: true }).then((r) => r.data),
  atualizarLocalidade: (id: number, body: unknown) => axios.put(`${base()}/localidades/${id}`, body, { withCredentials: true }).then((r) => r.data),
  inativar: (recurso: string, id: number) => axios.post(`${base()}/${recurso}/${id}/inativar`, {}, { withCredentials: true }).then((r) => r.data),
  localidadesCiclo: (cicloId: number, estabelecimentoId?: number) =>
    get<{ data: LocalidadeCiclo[] }>(`/ciclos/${cicloId}/localidades`, estabelecimentoId ? { estabelecimentoId } : undefined),
  salvarLocalidadeCiclo: (cicloId: number, localidadeId: number, body: unknown) =>
    axios.put(`${base()}/ciclos/${cicloId}/localidades/${localidadeId}`, body, { withCredentials: true }).then((r) => r.data),
  sala: (estabelecimentoId: number) => get<Sala>(`/salas-vacina/${estabelecimentoId}`),
  salvarSala: (estabelecimentoId: number, body: unknown) =>
    axios.put(`${base()}/salas-vacina/${estabelecimentoId}`, body, { withCredentials: true }).then((r) => r.data),
  listar: <T>(recurso: string, params?: Record<string, unknown>) => get<Page<T> & Record<string, unknown>>(`/${recurso}`, params),
  criar: (recurso: string, body: unknown) => axios.post(`${base()}/${recurso}`, body, { withCredentials: true }).then((r) => r.data),
  atualizar: (recurso: string, id: number, body: unknown) => axios.put(`${base()}/${recurso}/${id}`, body, { withCredentials: true }).then((r) => r.data),
  catalogo: (tipo: string) => get<Catalogo>('/catalogos', { tipo }),
  riscos: (cicloId: number) => get<{ data: Risco[] }>('/riscos', { cicloId }),
  salvarRisco: (body: unknown) => axios.put(`${base()}/riscos`, body, { withCredentials: true }).then((r) => r.data),
  fofa: (cicloId: number, estabelecimentoId?: number) =>
    get<{ data: Fofa[]; componentes: CatalogoItem[] }>('/fofa', { cicloId, estabelecimentoId }),
  salvarFofa: (body: unknown) => axios.put(`${base()}/fofa`, body, { withCredentials: true }).then((r) => r.data),
  abrirChecklist: (body: unknown) => axios.post(`${base()}/checklists/abrir`, body, { withCredentials: true }).then((r) => r.data as Checklist),
  salvarRespostas: (id: number, body: unknown) => axios.put(`${base()}/checklists/${id}/respostas`, body, { withCredentials: true }).then((r) => r.data as Checklist),
  inventario: (cicloId: number, estabelecimentoId: number) =>
    get<{ itens: CatalogoItem[]; registros: Inventario[] }>('/inventarios', { cicloId, estabelecimentoId }),
  salvarInventario: (body: unknown) => axios.put(`${base()}/inventarios`, body, { withCredentials: true }).then((r) => r.data),
  metas: (cicloId: number, estabelecimentoId?: number, mes?: number) =>
    get<{ data: Meta[] }>('/metas', { cicloId, estabelecimentoId, mes }),
  salvarMeta: (body: unknown) => axios.put(`${base()}/metas`, body, { withCredentials: true }).then((r) => r.data),
  necessidades: (cicloId: number, estabelecimentoId: number) =>
    get<{ data: Necessidade[] }>('/necessidades', { cicloId, estabelecimentoId }),
  salvarNecessidades: (body: unknown) => axios.put(`${base()}/necessidades`, body, { withCredentials: true }).then((r) => r.data),
  painel: (cicloId: number, estabelecimentoId?: number) =>
    get<Painel>('/painel', estabelecimentoId ? { cicloId, estabelecimentoId } : { cicloId }),
  resumo: (params?: Record<string, unknown>) => get<ResumoCiclos>('/resumo', params),
  alertas: (cicloId: number) => get<{ data: Alerta[] }>('/alertas', { cicloId }),
  atualizarAlerta: (id: number, status: string) => axios.put(`${base()}/alertas/${id}`, { status }, { withCredentials: true }).then((r) => r.data),
  relatorio: (tipo: string, cicloId: number) => get<{ data: Record<string, unknown>[] }>(`/relatorios/${tipo}`, { cicloId }),
  parametros: () => get<{ data: Parametro[] }>('/parametros'),
  publicarParametro: (body: unknown) => axios.post(`${base()}/parametros`, body, { withCredentials: true }).then((r) => r.data),
  auditoria: (params?: Record<string, unknown>) => get<Page<Auditoria>>('/auditoria', params),
  salvarAvaliacao: (body: unknown) => axios.put(`${base()}/avaliacoes`, body, { withCredentials: true }).then((r) => r.data),
  sincronizar: (body: unknown) => axios.post(`${base()}/sync`, body, { withCredentials: true }).then((r) => r.data as SyncResult),
};

export type Ciclo = {
  id: number;
  ano: number;
  estrategia: string;
  tipo_municipio_id: number;
  nome: string;
  status: string;
  dias_operacionais: number;
  data_inicio?: string | null;
  data_fim?: string | null;
  tipo_municipio?: { descricao: string };
};

export type Localidade = {
  id: number;
  estabelecimento_id: number;
  nome: string;
  bairro?: string | null;
  zona?: 'URBANA' | 'RURAL' | null;
  tipo_territorio?: string | null;
  domicilios?: number | null;
  escolas?: string | null;
  dificuldade_acesso: boolean;
  descricao_acesso?: string | null;
  estabelecimento?: { idestabelecimento?: number; nome: string; cnes?: string | null };
};

export type LocalidadeCiclo = {
  id: number;
  localidade_id: number;
  populacao_alvo: number;
  fonte?: string | null;
  prioridade?: number | null;
  percentual: number;
  localidade: Localidade;
};

export type Sala = {
  possui_sala_vacina: boolean;
  horario_sala?: string | null;
  telefone?: string | null;
  email?: string | null;
  responsavel?: string | null;
};

export type CatalogoItem = {
  id: number;
  codigo: string;
  ordem: number;
  componente?: string | null;
  texto: string;
  doses_por_frasco?: number | null;
  regra_calculo?: string | null;
};

export type Catalogo = { id?: number; tipo: string; itens: CatalogoItem[] };

export type Risco = {
  id: number;
  estabelecimento_id: number;
  pop_urbana: number;
  pop_rural: number;
  pontos: number;
  faixa: string | null;
  estabelecimento?: { nome: string };
};

export type Fofa = {
  id: number;
  componente_codigo: string;
  forca?: string | null;
  oportunidade?: string | null;
  fragilidade?: string | null;
  ameaca?: string | null;
  estrategia?: string | null;
  licao?: string | null;
};

export type Checklist = {
  id: number;
  indice: number;
  classificacao?: string | null;
  status: string;
  catalogo: { tipo: string; itens: CatalogoItem[] };
  respostas: { item_id: number; status: string | null; observacao?: string | null; responsavel?: string | null }[];
};

export type Inventario = {
  item_id: number;
  quantidade: number;
  necessidade_adicional: number;
  observacoes?: string | null;
};

export type Meta = {
  id: number;
  item_id: number;
  populacao_alvo: number;
  doses_por_pessoa: number;
  item?: CatalogoItem;
  grade?: {
    meses: { mes: number; meta_doses: number; doses_aplicadas: number; saldo: number; atingimento: number }[];
    dias: { dia: number; meta_doses: number; doses_aplicadas: number; saldo: number; atingimento: number }[];
  };
};

export type Necessidade = {
  item_id: number;
  meta_doses: number;
  perda_informada: number;
  perda_modo: string;
  saldo_disponivel: number;
  quantidade_manual?: number | null;
  doses_necessarias: number;
  a_solicitar: number;
  frascos: number;
  item: CatalogoItem & { catalogo?: { tipo: string } };
};

export type Alerta = {
  id: number;
  codigo: string;
  severidade: string;
  status: string;
  texto: string;
};

export type Painel = {
  populacao_alvo: number;
  doses_aplicadas: number;
  nao_vacinados: number;
  cobertura: number;
  localidades_prioritarias: number;
  alertas_abertos: number;
  acoes: { status: string; total: number }[];
  prioridades: { total: number; faixa: string; localidade: { nome: string }; detalhe?: unknown }[];
  doses_por_dia: { data: string; doses: number }[];
  custo_comunicacao: number;
  alertas: Alerta[];
};

export type ResumoCiclo = {
  id: number;
  nome: string;
  ano: number;
  status: string;
  estrategia: string;
  municipio?: string | null;
  populacao_alvo: number;
  doses_aplicadas: number;
  cobertura: number;
  alertas_abertos: number;
};

export type ResumoCiclos = {
  totais: {
    ciclos: number;
    populacao_alvo: number;
    doses_aplicadas: number;
    nao_vacinados: number;
    cobertura: number;
    alertas_abertos: number;
  };
  por_status: { status: string; total: number }[];
  ciclos: ResumoCiclo[];
};

export type Parametro = { id: number; chave: string; versao: number; valor: Record<string, unknown>; ativo: boolean };
export type Auditoria = { id: number; entidade: string; entidade_id: string; operacao: string; created_at: string };
export type SyncResult = { aceitos: string[]; rejeitados: { client_uuid: string; message: string }[] };

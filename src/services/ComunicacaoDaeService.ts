import axios from '@/utils/axiosRetry';

const API_URL = '/api';

export type OrigemTipo = 'CRS' | 'NHE' | 'CIEVS';
export type TipoAnexo = 'FICHA_NOTIFICACAO' | 'RELATORIO_INVESTIGACAO';

export interface ComunicacaoDaeAnexo {
  id_anexo: number;
  id_comunicacao: number;
  tipo_anexo: TipoAnexo;
  storage_path: string;
  nome_arquivo_original: string;
  mime_type: string;
  tamanho_bytes: number;
  created_at: string;
  updated_at: string;
}

export type StatusLeituraFiltro = 'todas' | 'lidas' | 'nao_lidas';
export type VisibilidadeArquivamentoFiltro = 'ativas' | 'todas' | 'arquivadas';

export interface ComunicacaoDaeLeitura {
  user_id: string;
  username: string;
  nome: string;
  lido_em: string;
}

export interface ComunicacaoDaeLeituraResumo {
  todas: number;
  nao_lidas: number;
  lidas: number;
}

export interface ComunicacaoDae {
  id_comunicacao: number;
  data_comunicacao: string;
  nome_paciente: string;
  /** Indica se o usuário autenticado já abriu esta ficha. */
  lida?: boolean;
  lido_em?: string;
  /** Indica se o usuário autenticado arquivou esta ficha. */
  arquivada?: boolean;
  arquivada_em?: string;
  observacao_descricao?: string;
  digitador?: string;
  telefone_digitador?: string;
  id_municipio_ocorrencia: number;
  id_municipio_residencia: number;
  origem_tipo: OrigemTipo;
  origem_id: number;
  origem?: {
    origem_tipo: OrigemTipo;
    origem_id: number;
    nome?: string | null;
    codigo?: string | null;
  } | null;
  id_dae: number;
  /** Todos os agravos vinculados (quando a API retorna múltiplos). */
  id_daes?: number[];
  daes?: { id_dae: number; nome: string; codigo?: string }[];
  created_at: string;
  updated_at: string;
  dae?: {
    id_dae: number;
    nome: string;
    codigo?: string;
  };
  tipo_municipio?: {
    idtipo_municipio: number;
    descricao: string;
  };
  tipo_municipio_residencia?: {
    idtipo_municipio: number;
    descricao: string;
  };
  comunicacao_dae_anexo?: ComunicacaoDaeAnexo[];
}

export interface ComunicacaoDaeListResponse {
  data: ComunicacaoDae[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    pages: number;
    total: number;
  };
}

export interface ComunicacaoDaeFilters {
  id_dae?: number;
  origem_tipo?: OrigemTipo;
  origem_id?: number;
  id_municipio_ocorrencia?: number;
  id_municipio_residencia?: number;
  data_inicio?: string;
  data_fim?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  status_leitura?: StatusLeituraFiltro;
  visibilidade?: VisibilidadeArquivamentoFiltro;
  search?: string;
  search_field?: string;
}

export interface CreateComunicacaoDaeData {
  data_comunicacao: string;
  nome_paciente: string;
  observacao_descricao?: string;
  digitador?: string;
  telefone_digitador?: string;
  id_municipio_ocorrencia: number;
  id_municipio_residencia: number;
  origem_tipo: OrigemTipo;
  origem_id: number;
  /** Primeiro agravo — preenchido automaticamente a partir de `id_daes` quando usado. */
  id_dae?: number;
  /** Um ou mais agravos (DAE). */
  id_daes?: number[];
}

export interface UpdateComunicacaoDaeData {
  data_comunicacao?: string;
  nome_paciente?: string;
  observacao_descricao?: string;
  digitador?: string;
  telefone_digitador?: string;
  id_municipio_ocorrencia?: number;
  id_municipio_residencia?: number;
  origem_tipo?: OrigemTipo;
  origem_id?: number;
  id_dae?: number;
  id_daes?: number[];
}

class ComunicacaoDaeService {
  private assertValidId(id: unknown, label: string): asserts id is number {
    const n = typeof id === 'number' ? id : Number(id);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(`${label} inválido`);
    }
  }
  /**
   * Listar todas as comunicações DAE com filtros e paginação
   */
  async getAll(
    page: number = 1,
    limit: number = 10,
    filters?: ComunicacaoDaeFilters
  ): Promise<ComunicacaoDaeListResponse> {
    const response = await axios.get(`${API_URL}/comunicacao-dae`, {
      params: { page, limit, ...filters, _t: Date.now() },
      withCredentials: true,
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    return response.data;
  }

  /**
   * Marca comunicação como lida para o usuário autenticado (idempotente).
   */
  async marcarComoLida(id: number): Promise<{ lida: boolean; lido_em: string }> {
    this.assertValidId(id, 'ID da comunicação');
    const response = await axios.post(
      `${API_URL}/comunicacao-dae/${id}/marcar-lido`,
      {},
      { withCredentials: true }
    );
    return response.data;
  }

  /**
   * Arquiva comunicação para o usuário autenticado (idempotente).
   */
  async arquivar(id: number): Promise<{ arquivada: boolean; arquivada_em: string }> {
    this.assertValidId(id, 'ID da comunicação');
    const response = await axios.post(
      `${API_URL}/comunicacao-dae/${id}/arquivar`,
      {},
      { withCredentials: true }
    );
    return response.data;
  }

  /**
   * Remove arquivamento da comunicação para o usuário autenticado.
   */
  async desarquivar(id: number): Promise<{ arquivada: boolean }> {
    this.assertValidId(id, 'ID da comunicação');
    const response = await axios.post(
      `${API_URL}/comunicacao-dae/${id}/desarquivar`,
      {},
      { withCredentials: true }
    );
    return response.data;
  }

  /**
   * Resumo de leitura: total, não lidas e lidas pelo usuário autenticado.
   */
  async getResumoLeitura(): Promise<ComunicacaoDaeLeituraResumo> {
    const response = await axios.get(`${API_URL}/comunicacao-dae/leitura/contagem`, {
      params: { _t: Date.now() },
      withCredentials: true,
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    return response.data;
  }

  /**
   * Lista quem visualizou a comunicação e quando.
   */
  async getLeituras(id: number): Promise<ComunicacaoDaeLeitura[]> {
    this.assertValidId(id, 'ID da comunicação');
    const response = await axios.get(`${API_URL}/comunicacao-dae/${id}/leituras`, {
      withCredentials: true,
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    return response.data?.data ?? [];
  }

  /**
   * Buscar comunicação DAE por ID
   */
  async getById(id: number): Promise<ComunicacaoDae> {
    this.assertValidId(id, 'ID da comunicação');
    const response = await axios.get(`${API_URL}/comunicacao-dae/${id}`, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Criar nova comunicação DAE
   */
  async create(data: CreateComunicacaoDaeData): Promise<ComunicacaoDae> {
    const response = await axios.post(`${API_URL}/comunicacao-dae`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Atualizar comunicação DAE
   */
  async update(id: number, data: UpdateComunicacaoDaeData): Promise<ComunicacaoDae> {
    this.assertValidId(id, 'ID da comunicação');
    const response = await axios.put(`${API_URL}/comunicacao-dae/${id}`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Deletar comunicação DAE
   */
  async delete(id: number): Promise<void> {
    this.assertValidId(id, 'ID da comunicação');
    await axios.delete(`${API_URL}/comunicacao-dae/${id}`, {
      withCredentials: true
    });
  }

  /**
   * Listar anexos de uma comunicação
   */
  async getAnexos(id_comunicacao: number): Promise<ComunicacaoDaeAnexo[]> {
    this.assertValidId(id_comunicacao, 'ID da comunicação');
    const response = await axios.get(`${API_URL}/comunicacao-dae/${id_comunicacao}/anexos`, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Adicionar anexo a uma comunicação DAE
   */
  async addAnexo(id_comunicacao: number, file: File, tipo_anexo: TipoAnexo): Promise<ComunicacaoDaeAnexo> {
    this.assertValidId(id_comunicacao, 'ID da comunicação');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo_anexo', tipo_anexo);

    const response = await axios.post(
      `${API_URL}/comunicacao-dae/${id_comunicacao}/anexo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true
      }
    );
    return response.data;
  }

  /**
   * Remover anexo
   */
  async removeAnexo(id_anexo: number): Promise<void> {
    await axios.delete(`${API_URL}/comunicacao-dae/anexo/${id_anexo}`, {
      withCredentials: true
    });
  }

  /**
   * Download de anexo
   */
  async downloadAnexo(id_anexo: number): Promise<Blob> {
    const response = await axios.get(`${API_URL}/comunicacao-dae/anexo/${id_anexo}/download`, {
      responseType: 'blob',
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Helper para fazer download de anexo com nome correto
   */
  async downloadAnexoWithName(anexo: ComunicacaoDaeAnexo): Promise<void> {
    const blob = await this.downloadAnexo(anexo.id_anexo);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', anexo.nome_arquivo_original);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export function isComunicacaoDaeForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

export function getComunicacaoDaeApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const payload = error.response?.data;
  if (typeof payload === 'object' && payload !== null) {
    const message = Reflect.get(payload, 'message') ?? Reflect.get(payload, 'error');
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export default new ComunicacaoDaeService();

import axios from 'axios';

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

export interface ComunicacaoDae {
  id_comunicacao: number;
  data_comunicacao: string;
  nome_paciente: string;
  observacao_descricao?: string;
  digitador?: string;
  telefone_digitador?: string;
  id_municipio_ocorrencia: number;
  origem_tipo: OrigemTipo;
  origem_id: number;
  id_dae: number;
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
  data_inicio?: string;
  data_fim?: string;
}

export interface CreateComunicacaoDaeData {
  data_comunicacao: string;
  nome_paciente: string;
  observacao_descricao?: string;
  digitador?: string;
  telefone_digitador?: string;
  id_municipio_ocorrencia: number;
  origem_tipo: OrigemTipo;
  origem_id: number;
  id_dae: number;
}

export interface UpdateComunicacaoDaeData {
  data_comunicacao?: string;
  nome_paciente?: string;
  observacao_descricao?: string;
  digitador?: string;
  telefone_digitador?: string;
  id_municipio_ocorrencia?: number;
  origem_tipo?: OrigemTipo;
  origem_id?: number;
  id_dae?: number;
}

class ComunicacaoDaeService {
  /**
   * Listar todas as comunicações DAE com filtros e paginação
   */
  async getAll(
    page: number = 1,
    limit: number = 10,
    filters?: ComunicacaoDaeFilters
  ): Promise<ComunicacaoDaeListResponse> {
    const response = await axios.get(`${API_URL}/comunicacao-dae`, {
      params: { page, limit, ...filters },
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Buscar comunicação DAE por ID
   */
  async getById(id: number): Promise<ComunicacaoDae> {
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
    const response = await axios.put(`${API_URL}/comunicacao-dae/${id}`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Deletar comunicação DAE
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`${API_URL}/comunicacao-dae/${id}`, {
      withCredentials: true
    });
  }

  /**
   * Listar anexos de uma comunicação
   */
  async getAnexos(id_comunicacao: number): Promise<ComunicacaoDaeAnexo[]> {
    const response = await axios.get(`${API_URL}/comunicacao-dae/${id_comunicacao}/anexos`, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Adicionar anexo a uma comunicação DAE
   */
  async addAnexo(id_comunicacao: number, file: File, tipo_anexo: TipoAnexo): Promise<ComunicacaoDaeAnexo> {
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

export default new ComunicacaoDaeService();

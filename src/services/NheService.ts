import axios from 'axios';

const API_URL = '/api';

export interface Nhe {
  id_nhe: number;
  nome: string;
  codigo?: string;
  created_at: string;
  updated_at: string;
}

export interface NheListResponse {
  data: Nhe[];
  total: number;
  page: number;
  limit: number;
}

class NheService {
  /**
   * Listar todos os NHEs com paginação
   */
  async getAll(page: number = 1, limit: number = 100): Promise<NheListResponse> {
    const response = await axios.get(`${API_URL}/nhe`, {
      params: { page, limit },
      withCredentials: true
    });
    // Mapear resposta do backend para o formato esperado
    return {
      data: response.data.data,
      total: response.data.pagination.total,
      page: response.data.pagination.currentPage,
      limit: response.data.pagination.itemsPerPage
    };
  }

  /**
   * Buscar NHE por ID
   */
  async getById(id: number): Promise<Nhe> {
    const response = await axios.get(`${API_URL}/nhe/${id}`, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Criar novo NHE
   */
  async create(data: { nome: string; codigo?: string }): Promise<Nhe> {
    const response = await axios.post(`${API_URL}/nhe`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Atualizar NHE
   */
  async update(id: number, data: { nome?: string; codigo?: string }): Promise<Nhe> {
    const response = await axios.put(`${API_URL}/nhe/${id}`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Deletar NHE
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`${API_URL}/nhe/${id}`, {
      withCredentials: true
    });
  }

  /**
   * Buscar todos os NHEs com informações de localização do estabelecimento vinculado
   */
  async getAllWithLocation(): Promise<any[]> {
    const response = await axios.get(`${API_URL}/nhe/with-location/all`, {
      withCredentials: true
    });
    return response.data;
  }
}

export default new NheService();

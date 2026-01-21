import axios from 'axios';

const API_URL = '/api';

export interface Dae {
  id_dae: number;
  nome: string;
  codigo?: string;
  created_at: string;
  updated_at: string;
}

export interface DaeListResponse {
  data: Dae[];
  total: number;
  page: number;
  limit: number;
}

class DaeService {
  /**
   * Listar todos os DAEs com paginação
   */
  async getAll(page: number = 1, limit: number = 100): Promise<DaeListResponse> {
    const response = await axios.get(`${API_URL}/dae`, {
      params: { page, limit },
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Buscar DAE por ID
   */
  async getById(id: number): Promise<Dae> {
    const response = await axios.get(`${API_URL}/dae/${id}`, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Criar novo DAE
   */
  async create(data: { nome: string; codigo?: string }): Promise<Dae> {
    const response = await axios.post(`${API_URL}/dae`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Atualizar DAE
   */
  async update(id: number, data: { nome?: string; codigo?: string }): Promise<Dae> {
    const response = await axios.put(`${API_URL}/dae/${id}`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Deletar DAE
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`${API_URL}/dae/${id}`, {
      withCredentials: true
    });
  }
}

export default new DaeService();

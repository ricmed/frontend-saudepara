import axios from 'axios';

const API_URL = '/api';

export interface Cievs {
  id_cievs: number;
  nome: string;
  codigo?: string;
  created_at: string;
  updated_at: string;
}

export interface CievsListResponse {
  data: Cievs[];
  total: number;
  page: number;
  limit: number;
}

class CievsService {
  /**
   * Listar todos os CIEVS com paginação
   */
  async getAll(page: number = 1, limit: number = 100): Promise<CievsListResponse> {
    const response = await axios.get(`${API_URL}/cievs`, {
      params: { page, limit },
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Buscar CIEVS por ID
   */
  async getById(id: number): Promise<Cievs> {
    const response = await axios.get(`${API_URL}/cievs/${id}`, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Criar novo CIEVS
   */
  async create(data: { nome: string; codigo?: string }): Promise<Cievs> {
    const response = await axios.post(`${API_URL}/cievs`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Atualizar CIEVS
   */
  async update(id: number, data: { nome?: string; codigo?: string }): Promise<Cievs> {
    const response = await axios.put(`${API_URL}/cievs/${id}`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Deletar CIEVS
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`${API_URL}/cievs/${id}`, {
      withCredentials: true
    });
  }
}

export default new CievsService();

import axios from 'axios';

const API_URL = '/api';

export interface Crs {
  id_crs: number;
  nome: string;
  codigo?: string;
  created_at: string;
  updated_at: string;
}

export interface CrsListResponse {
  data: Crs[];
  total: number;
  page: number;
  limit: number;
}

class CrsService {
  /**
   * Listar todos os CRS com paginação
   */
  async getAll(page: number = 1, limit: number = 100): Promise<CrsListResponse> {
    const response = await axios.get(`${API_URL}/crs`, {
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
   * Buscar CRS por ID
   */
  async getById(id: number): Promise<Crs> {
    const response = await axios.get(`${API_URL}/crs/${id}`, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Criar novo CRS
   */
  async create(data: { nome: string; codigo?: string }): Promise<Crs> {
    try {
      console.log('📤 Criando CRS:', data);
      const response = await axios.post(`${API_URL}/crs`, data, {
        withCredentials: true
      });
      console.log('✅ CRS criado com sucesso:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar CRS:', error);
      console.error('Detalhes do erro:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Atualizar CRS
   */
  async update(id: number, data: { nome?: string; codigo?: string }): Promise<Crs> {
    const response = await axios.put(`${API_URL}/crs/${id}`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Deletar CRS
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`${API_URL}/crs/${id}`, {
      withCredentials: true
    });
  }
}

export default new CrsService();

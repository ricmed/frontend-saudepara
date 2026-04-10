import axios from 'axios';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_URL = `${server}:${port}/api`;

// Instância do axios com credenciais (cookies de autenticação)
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // ✅ Envia cookies de autenticação automaticamente
});

// Types
export interface CodeList {
  id: number;
  name: string;
  description?: string;
  version?: string;
  updated_at: string;
  created_at: string;
}

export interface CodeListItem {
  id: number;
  list_id: number;
  code: string;
  label: string;
  parent_code?: string;
  metadata?: Record<string, any>;
  active: boolean;
  order?: number;
  created_at: string;
  updated_at: string;
}

export interface CodeListSearchParams {
  q?: string;
  parent_code?: string;
  active?: boolean;
  limit?: number;
}

// Service
class CodeListService {
  // Listar todas as listas
  async getAllLists(): Promise<CodeList[]> {
    try {
      const response = await api.get('/code-lists');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar listas de códigos:', error);
      throw error;
    }
  }

  // Buscar lista por nome
  async getListByName(name: string): Promise<CodeList> {
    try {
      const response = await api.get(`/code-lists/${name}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar lista:', error);
      throw error;
    }
  }

  // Buscar itens (typeahead/search)
  async searchItems(listName: string, params: CodeListSearchParams = {}): Promise<CodeListItem[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.append('q', params.q);
      if (params.parent_code) searchParams.append('parent_code', params.parent_code);
      if (params.active !== undefined) searchParams.append('active', String(params.active));
      if (params.limit) searchParams.append('limit', String(params.limit));

      const response = await api.get(`/code-lists/${listName}/search?${searchParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      throw error;
    }
  }

  // Buscar todos os itens de uma lista
  async getItems(listName: string): Promise<CodeListItem[]> {
    try {
      const response = await api.get(`/code-lists/${listName}/items`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      throw error;
    }
  }

  // Criar novo item
  async createItem(data: {
    list_id: number;
    code: string;
    label: string;
    parent_code?: string;
    metadata?: Record<string, any>;
    active?: boolean;
    order?: number;
  }): Promise<CodeListItem> {
    try {
      const response = await api.post('/code-lists/items', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar item:', error);
      throw error;
    }
  }

  // Criar múltiplos itens (bulk)
  async bulkCreateItems(items: Array<{
    list_id: number;
    code: string;
    label: string;
    parent_code?: string;
    metadata?: Record<string, any>;
    active?: boolean;
    order?: number;
  }>): Promise<any> {
    try {
      const response = await api.post('/code-lists/items/bulk', { items });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar itens em lote:', error);
      throw error;
    }
  }
}

export default new CodeListService();

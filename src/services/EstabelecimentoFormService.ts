import axios from 'axios';
import { 
  OptionItem, 
  EstabelecimentoData 
} from '@/features/forms/types/index';

// Importação das funções adaptadoras
import {
  formatFromBackend,
  formatToBackend
} from '@/utils/adapters';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
// URL base para o backend
const API_BASE_URL = `${server}:${port}`;

// Mapeamento de endpoints (usando as rotas EXATAS do backend)
const ENDPOINTS = {
  ESTABELECIMENTOS: `${API_BASE_URL}/api/estabelecimentos`,
  TIPO_ESTABELECIMENTO: `${API_BASE_URL}/api/tipo-estabelecimento`,
  TIPO_NATUREZA: `${API_BASE_URL}/api/tipo-natureza`,
  TIPO_TURNO: `${API_BASE_URL}/api/tipo-turno`,
  TIPO_HABILITACAO: `${API_BASE_URL}/api/tipo-habilitacao`,
  TIPO_QUALIFICACAO: `${API_BASE_URL}/api/tipo-qualificacao`
};

const api = axios.create({
  baseURL: ENDPOINTS.ESTABELECIMENTOS,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

interface DuplicateCheckResponse {
  isDuplicate: boolean;
  field: string;
}

// Função para extrair o array de dados da resposta da API
function unwrapApiResponse<T>(response: any): T[] {
  // Se a resposta já for um array, apenas retorna
  if (Array.isArray(response)) {
    return response;
  }
  
  // Se a resposta tiver uma propriedade data que é um array, retorna esse array
  if (response && response.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  // Caso contrário, retorna um array vazio
  console.warn('Resposta da API em formato inesperado:', response);
  return [];
}

const handleApiError = (error: any): never => {
  console.error('Erro completo:', error);
  
  if (error.response) {
    console.error('Dados do erro:', error.response.data);
    console.error('Status:', error.response.status);
    
    if (error.response.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    if (error.response.status === 400) {
      const errorData = error.response.data;
      if (typeof errorData === 'string') {
        throw new Error(errorData);
      } else if (errorData?.error) {
        throw new Error(errorData.error);
      }
      throw new Error('Erro de validação nos dados. Verifique os campos obrigatórios.');
    }
  }

  throw new Error(`Erro na requisição: ${error.message}`);
};

// Função para buscar todos os itens paginados
async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  let allItems: T[] = [];
  let page = 1;
  let hasMore = true;
  
  try {
    while (hasMore) {
      // Tenta primeiro com parâmetro limit grande
      const response = await axios.get(`${endpoint}?limit=500&page=${page}`);
      const items = unwrapApiResponse<T>(response.data);
      
      if (items.length === 0) {
        hasMore = false;
      } else {
        allItems = [...allItems, ...items];
        
        // Verifica se há mais páginas baseado na paginação
        const pagination = response.data.pagination;
        if (pagination && pagination.totalPages && page >= pagination.totalPages) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      // Limite de segurança para evitar loops infinitos
      if (page > 10) break;
    }
    
    return allItems;
  } catch (error) {
    console.error(`Erro ao buscar todas as páginas de ${endpoint}:`, error);
    return [];
  }
}

export const EstabelecimentoFormService = {
  // Obter tipos de estabelecimento
  async getTiposEstabelecimento(): Promise<OptionItem[]> {
    try {
      console.log(`Buscando tipos de estabelecimento em: ${ENDPOINTS.TIPO_ESTABELECIMENTO}`);
      
      // Buscar todos os itens
      const items = await fetchAllPages<OptionItem>(ENDPOINTS.TIPO_ESTABELECIMENTO);
      console.log('Todos os tipos estabelecimento:', items);
      
      return items;
    } catch (error) {
      console.error('Erro ao buscar tipos de estabelecimento:', error);
      return [];
    }
  },

  // Obter tipos de natureza
  async getTiposNatureza(): Promise<OptionItem[]> {
    try {
      console.log(`Buscando tipos de natureza em: ${ENDPOINTS.TIPO_NATUREZA}`);
      
      // Buscar todos os itens
      const items = await fetchAllPages<OptionItem>(ENDPOINTS.TIPO_NATUREZA);
      console.log('Todos os tipos natureza:', items);
      
      return items;
    } catch (error) {
      console.error('Erro ao buscar tipos de natureza:', error);
      return [];
    }
  },

  // Obter tipos de turno
  async getTiposTurno(): Promise<OptionItem[]> {
    try {
      console.log(`Buscando tipos de turno em: ${ENDPOINTS.TIPO_TURNO}`);
      
      // Buscar todos os itens
      const items = await fetchAllPages<OptionItem>(ENDPOINTS.TIPO_TURNO);
      console.log('Todos os tipos turno:', items);
      
      return items;
    } catch (error) {
      console.error('Erro ao buscar tipos de turno:', error);
      return [];
    }
  },

  // Obter habilitações
  async getHabilitacoes(): Promise<OptionItem[]> {
    try {
      console.log(`Buscando habilitações em: ${ENDPOINTS.TIPO_HABILITACAO}`);
      
      // Buscar todos os itens
      const items = await fetchAllPages<OptionItem>(ENDPOINTS.TIPO_HABILITACAO);
      console.log('Todas as habilitações:', items);
      
      return items;
    } catch (error) {
      console.error('Erro ao buscar habilitações:', error);
      return [];
    }
  },

  // Obter qualificações
  async getQualificacoes(): Promise<OptionItem[]> {
    try {
      console.log(`Buscando qualificações em: ${ENDPOINTS.TIPO_QUALIFICACAO}`);
      
      // Buscar todos os itens
      const items = await fetchAllPages<OptionItem>(ENDPOINTS.TIPO_QUALIFICACAO);
      console.log('Todas as qualificações:', items);
      
      return items;
    } catch (error) {
      console.error('Erro ao buscar qualificações:', error);
      return [];
    }
  },

  // Obter estabelecimento por ID
  async getById(id: number): Promise<EstabelecimentoData> {
    try {
      // Usar a instância de API que já tem a baseURL configurada
      const response = await api.get(`/${id}`);
      console.log('Dados originais:', response.data);
      
      // Usar o adaptador para formatar os dados
      const formattedData = formatFromBackend(response.data) as EstabelecimentoData;
      console.log('Dados formatados:', formattedData);
      
      return formattedData;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Criar estabelecimento
  async create(data: EstabelecimentoData): Promise<any> {
    try {
      if (!data.nome) {
        throw new Error('O nome do estabelecimento é obrigatório');
      }
      
      // Usar o adaptador para converter para o formato do backend
      const payload = formatToBackend(data, false); // false = criação
      console.log('Payload create:', payload);
      
      const response = await api.post("/", payload);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Atualizar estabelecimento
  async update(id: number, data: EstabelecimentoData): Promise<any> {
    try {
      // Usar o adaptador para converter para o formato do backend (com flag de atualização)
      const payload = formatToBackend(data, true); // true = atualização
      
      console.log('ID da atualização:', id);
      console.log('Payload completo:', payload);
      
      const response = await api.put(`/${id}`, payload);
      return response.data;
    } catch (error) {
      const err = error as any;
      console.log('Erro detalhado:', {
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      });
      
      if (err.response?.data?.errors?.[0]) {
        throw new Error(err.response.data.errors[0]);
      }
      throw new Error(err.message || 'Erro ao atualizar estabelecimento');
    }
  },

  // Excluir estabelecimento
  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Verificar duplicidade
  async checkDuplicate(
    field: 'codigo_unidade' | 'cnes' | 'cnpj',
    value: string,
    id?: number
  ): Promise<DuplicateCheckResponse> {
    try {
      const response = await api.post("/check-duplicate", {
        field,
        value: value.trim(),
        excludeId: id,
      });
      
      return {
        isDuplicate: response.data.isDuplicate,
        field: field
      };
    } catch (error) {
      return handleApiError(error);
    }
  }
};
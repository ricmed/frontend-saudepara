import axios, { AxiosError } from 'axios';
import { 
  Estabelecimento, 
  PaginationMeta, 
  SearchParams 
} from '@/features/list/types/estabelecimento';

// Importação das funções adaptadoras
import { 
  formatFromBackend, 
  formatListResponse
} from '@/utils/adapters';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_URL = `${server}:${port}/api/estabelecimentos`;


interface PaginatedResponse {
  data: Estabelecimento[];
  meta: PaginationMeta;
}

interface APIError {
  message: string;
  code?: string;
  details?: string;
}

// Tratamento de erros
const handleApiError = (error: AxiosError<APIError>) => {
  console.error('API Error:', error);

  if (error.response?.status === 400) {
    if (error.response.data.message?.includes('CNES')) {
      throw new Error('CNES já cadastrado no sistema');
    }
    if (error.response.data.message?.includes('CNPJ')) {
      throw new Error('CNPJ já cadastrado no sistema');
    }
    if (error.response.data.message?.includes('código')) {
      throw new Error('Código já cadastrado no sistema');
    }
  }

  throw new Error(
    error.response?.data?.message || 
    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  );
};

// Serviço principal
export const ListaDeEstabelecimentoService = {
  // Listagem paginada com busca
  async getAllPaginated(
    page: number,
    limit: number,
    search: SearchParams,
    sortKey: string,
    sortOrder: "asc" | "desc"
  ): Promise<PaginatedResponse> {
    try {
      // Construir parâmetros de requisição
      const params: Record<string, any> = {
        page,
        limit,
        orderBy: sortKey,
        orderDir: sortOrder
      };
      
      // Adicionar parâmetros de busca se tiver termo
      if (search && search.term) {
        params.search = search.term.trim();
        
        if (search.field !== 'all') {
          params.searchField = search.field;
        }
      }
      
      console.log("Parâmetros de busca:", params);

      // Fazer requisição
      const response = await axios.get(API_URL, {
        params,
        timeout: 5000
      });

      console.log("Resposta da API:", response.data);

      // Se a resposta não tiver o formato esperado, formatar manualmente
      if (!response.data.data && response.data.items) {
        response.data = {
          data: response.data.items,
          meta: response.data.meta || {
            total: 0,
            totalPages: 1,
            page: page,
            limit: limit
          }
        };
      }

      // Usar a função adaptadora para formatar os dados
      return formatListResponse(response.data);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        return handleApiError(error as AxiosError<APIError>);
      }
      console.error("Erro ao buscar estabelecimentos:", error);
      return {
        data: [],
        meta: {
          total: 0,
          totalPages: 1,
          page,
          limit
        }
      };
    }
  },

  // Buscar todos os estabelecimentos (sem paginação)
  async getAll(): Promise<Estabelecimento[]> {
    try {
      const response = await axios.get(API_URL, {
        timeout: 5000
      });
      
      // Formatar os dados usando o adaptador e extrair o array de dados
      let data = response.data;
      if (data && data.data && Array.isArray(data.data)) {
        data = data.data;
      }
      
      return (Array.isArray(data) ? data : []).map((item: any) => formatFromBackend(item) as Estabelecimento);
    } catch (error) {
      console.error("Erro ao buscar todos estabelecimentos:", error);
      return [];
    }
  },

  // Buscar estabelecimento por ID
  async getById(id: number): Promise<Estabelecimento | null> {
    try {
      const response = await axios.get(`${API_URL}/${id}`, {
        timeout: 5000
      });
      
      // Formatar usando o adaptador
      return formatFromBackend(response.data) as Estabelecimento;
    } catch (error) {
      console.error(`Erro ao buscar estabelecimento ID ${id}:`, error);
      return null;
    }
  },

  // Excluir estabelecimento
  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/${id}`, {
        timeout: 5000
      });
    } catch (error) {
      console.error(`Erro ao excluir estabelecimento ID ${id}:`, error);
      throw new Error('Erro ao excluir estabelecimento');
    }
  },

  // Exportar dados
  async exportData(
    search: SearchParams,
    sortKey: string,
    sortOrder: "asc" | "desc",
    format: "csv" | "excel" = "csv"
  ): Promise<Blob> {
    try {
      // Construção dos parâmetros de busca
      const params: Record<string, any> = {
        format
      };
      
      // Adicionar parâmetros de busca se tiver termo
      if (search && search.term) {
        params.search = search.term.trim();
        
        if (search.field !== 'all') {
          params.searchField = search.field;
        }
      }
      
      // Adicionar parâmetros de ordenação
      params.orderBy = sortKey;
      params.orderDir = sortOrder;

      const response = await axios.get(`${API_URL}/export`, {
        params,
        responseType: 'blob',
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      throw new Error("Não foi possível exportar os dados. Tente novamente mais tarde.");
    }
  }
};
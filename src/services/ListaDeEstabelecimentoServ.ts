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

// ✅ ADICIONAR IMPORT PARA OFFLINE
import syncService from '@/services/syncService';

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
export const ListaDeEstabelecimentoService = {  // Listagem paginada com busca
  async getAllPaginated(
    page: number,
    limit: number,
    search: SearchParams,
    sortKey: string,
    sortOrder: "asc" | "desc"
  ): Promise<PaginatedResponse> {
    // ✅ TENTAR ONLINE PRIMEIRO
    if (navigator.onLine) {
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

        console.log('✅ Dados carregados online');
        // Usar a função adaptadora para formatar os dados
        return formatListResponse(response.data);

      } catch (error) {
        console.warn('Falha na busca online, usando dados offline:', error);
      }
    }

    // ✅ FALLBACK OFFLINE
    console.log('📱 Usando dados offline...');
    try {
      const results = await syncService.searchEstabelecimentos(search?.term || '');
      
      // ✅ SIMULAR ORDENAÇÃO
      const sortedResults = [...results].sort((a, b) => {
        const aValue = a[sortKey] || '';
        const bValue = b[sortKey] || '';
        
        if (sortOrder === 'asc') {
          return aValue.toString().localeCompare(bValue.toString());
        } else {
          return bValue.toString().localeCompare(aValue.toString());
        }
      });
      
      // ✅ SIMULAR PAGINAÇÃO
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = sortedResults.slice(startIndex, endIndex);

      console.log(`📱 Retornando ${paginatedResults.length} de ${sortedResults.length} estabelecimentos offline`);

      return {
        data: paginatedResults.map(item => formatFromBackend(item) as Estabelecimento),
        meta: {
          total: sortedResults.length,
          totalPages: Math.ceil(sortedResults.length / limit),
          page,
          limit
        }
      };

    } catch (error) {
      console.error("Erro ao buscar estabelecimentos offline:", error);
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
    // ✅ TENTAR ONLINE PRIMEIRO
    if (navigator.onLine) {
      try {
        const response = await axios.get(API_URL, {
          timeout: 5000
        });
        
        // Formatar os dados usando o adaptador e extrair o array de dados
        let data = response.data;
        if (data && data.data && Array.isArray(data.data)) {
          data = data.data;
        }
        
        console.log('✅ Todos os estabelecimentos carregados online');
        return (Array.isArray(data) ? data : []).map((item: any) => formatFromBackend(item) as Estabelecimento);
      } catch (error) {
        console.warn("Falha ao buscar todos estabelecimentos online, usando offline:", error);
      }
    }

    // ✅ FALLBACK OFFLINE
    console.log('📱 Usando todos os estabelecimentos offline...');
    try {
      const results = await syncService.searchEstabelecimentos(''); // Busca vazia retorna todos
      return results.map(item => formatFromBackend(item) as Estabelecimento);
    } catch (error) {
      console.error("Erro ao buscar estabelecimentos offline:", error);
      return [];
    }
  },
  // Buscar estabelecimento por ID
  async getById(id: number): Promise<Estabelecimento | null> {
    // ✅ TENTAR ONLINE PRIMEIRO
    if (navigator.onLine) {
      try {
        const response = await axios.get(`${API_URL}/${id}`, {
          timeout: 5000
        });
        
        console.log('✅ Estabelecimento carregado online');
        return formatFromBackend(response.data) as Estabelecimento;
      } catch (error) {
        console.warn(`Falha ao buscar estabelecimento ID ${id} online, tentando offline:`, error);
      }
    }

    // ✅ FALLBACK OFFLINE
    try {
      const estabelecimento = await syncService.getEstabelecimentoById(id);
      if (estabelecimento) {
        console.log('📱 Estabelecimento encontrado offline');
        return formatFromBackend(estabelecimento) as Estabelecimento;
      }
    } catch (error) {
      console.error(`Erro ao buscar estabelecimento ID ${id} offline:`, error);
    }

    return null;
  },
  // Excluir estabelecimento
  async delete(id: number): Promise<void> {
    // ✅ DELETE só funciona online
    if (!navigator.onLine) {
      throw new Error('Exclusão requer conexão com a internet');
    }

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
    // ✅ EXPORT só funciona online
    if (!navigator.onLine) {
      throw new Error('Exportação requer conexão com a internet');
    }

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
  },

  /**
   * Ativa/desativa estabelecimentos em lote
   * @param estabelecimentoIds - Array de IDs dos estabelecimentos que devem ficar ativos
   * @returns Resultado da operação com contadores
   */
  async bulkActivation(estabelecimentoIds: number[]): Promise<{
    ativados: number;
    desativados: number;
    total: number;
  }> {
    // ✅ BULK ACTIVATION só funciona online
    if (!navigator.onLine) {
      throw new Error('Ativação em lote requer conexão com a internet');
    }

    try {
      console.log(`🔄 Enviando bulk activation para ${estabelecimentoIds.length} estabelecimentos`);
      
      const response = await axios.patch(
        `${API_URL}/bulk-activation`,
        { estabelecimentoIds },
        {
          timeout: 30000, // 30 segundos para operações em lote
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Bulk activation concluído:', response.data);
      
      return response.data.data;
    } catch (error) {
      console.error("❌ Erro ao executar bulk activation:", error);
      
      if (axios.isAxiosError(error)) {
        handleApiError(error as AxiosError<APIError>);
      }
      
      throw new Error("Não foi possível atualizar a ativação dos estabelecimentos. Tente novamente.");
    }
  }
};
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

// ✅ ADICIONAR IMPORTS PARA OFFLINE
import syncService from '@/services/syncService';
import indexedDBService from '@/services/indexedDB';

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

// 🔒 PROTEÇÃO CONTRA REQUISIÇÕES DUPLICADAS
let isCreatingEstablishment = false;

const api = axios.create({
  baseURL: ENDPOINTS.ESTABELECIMENTOS,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Para enviar cookies de autenticação automaticamente
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

export const EstabelecimentoFormService = {  // Obter tipos de estabelecimento
  async getTiposEstabelecimento(): Promise<OptionItem[]> {
    try {
      // ✅ USAR indexedDBService para cache offline
      const cachedData = await indexedDBService.getOpcoes('estabelecimentos-tipos');
      if (cachedData && cachedData.length > 0) {
        console.log('📱 Usando tipos de estabelecimento do cache');
        return cachedData;
      }

      if (navigator.onLine) {
        console.log(`Buscando tipos de estabelecimento em: ${ENDPOINTS.TIPO_ESTABELECIMENTO}`);
        const items = await fetchAllPages<OptionItem>(ENDPOINTS.TIPO_ESTABELECIMENTO);
        
        // Salvar no cache
        await indexedDBService.saveOpcoes('estabelecimentos-tipos', items);
        console.log('✅ Tipos de estabelecimento salvos no cache');
        
        return items;
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar tipos de estabelecimento:', error);
      return [];
    }
  },

  // Obter tipos de natureza
  async getTiposNatureza(): Promise<OptionItem[]> {
    try {
      // ✅ USAR indexedDBService para cache offline
      const cachedData = await indexedDBService.getOpcoes('naturezas');
      if (cachedData && cachedData.length > 0) {
        console.log('📱 Usando tipos de natureza do cache');
        return cachedData;
      }

      if (navigator.onLine) {
        console.log(`Buscando tipos de natureza em: ${ENDPOINTS.TIPO_NATUREZA}`);
        const items = await fetchAllPages<OptionItem>(ENDPOINTS.TIPO_NATUREZA);
        
        // Salvar no cache
        await indexedDBService.saveOpcoes('naturezas', items);
        console.log('✅ Tipos de natureza salvos no cache');
        
        return items;
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar tipos de natureza:', error);
      return [];
    }
  },

  // Obter tipos de turno
  async getTiposTurno(): Promise<OptionItem[]> {
    try {
      // ✅ USAR indexedDBService para cache offline
      const cachedData = await indexedDBService.getOpcoes('turnos');
      if (cachedData && cachedData.length > 0) {
        console.log('📱 Usando tipos de turno do cache');
        return cachedData;
      }

      if (navigator.onLine) {
        console.log(`Buscando tipos de turno em: ${ENDPOINTS.TIPO_TURNO}`);
        const items = await fetchAllPages<OptionItem>(ENDPOINTS.TIPO_TURNO);
        
        // Salvar no cache
        await indexedDBService.saveOpcoes('turnos', items);
        console.log('✅ Tipos de turno salvos no cache');
        
        return items;
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar tipos de turno:', error);
      return [];
    }
  },

  // Obter habilitações
  async getHabilitacoes(): Promise<OptionItem[]> {
    try {
      // ✅ USAR indexedDBService para cache offline
      const cachedData = await indexedDBService.getOpcoes('habilitacoes');
      if (cachedData && cachedData.length > 0) {
        console.log('📱 Usando habilitações do cache');
        return cachedData;
      }

      if (navigator.onLine) {
        console.log(`Buscando habilitações em: ${ENDPOINTS.TIPO_HABILITACAO}`);
        const items = await fetchAllPages<OptionItem>(ENDPOINTS.TIPO_HABILITACAO);
        
        // Salvar no cache
        await indexedDBService.saveOpcoes('habilitacoes', items);
        console.log('✅ Habilitações salvas no cache');
        
        return items;
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar habilitações:', error);
      return [];
    }
  },

  // Obter qualificações
  async getQualificacoes(): Promise<OptionItem[]> {
    try {
      // ✅ USAR indexedDBService para cache offline
      const cachedData = await indexedDBService.getOpcoes('qualificacoes');
      if (cachedData && cachedData.length > 0) {
        console.log('📱 Usando qualificações do cache');
        return cachedData;
      }

      if (navigator.onLine) {
        console.log(`Buscando qualificações em: ${ENDPOINTS.TIPO_QUALIFICACAO}`);
        const items = await fetchAllPages<OptionItem>(ENDPOINTS.TIPO_QUALIFICACAO);
        
        // Salvar no cache
        await indexedDBService.saveOpcoes('qualificacoes', items);
        console.log('✅ Qualificações salvas no cache');
        
        return items;
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar qualificações:', error);
      return [];
    }
  },
  // Obter estabelecimento por ID
  async getById(id: number): Promise<EstabelecimentoData> {
    // ✅ TENTAR ONLINE PRIMEIRO
    if (navigator.onLine) {
      try {
        // Usar a instância de API que já tem a baseURL configurada
        const response = await api.get(`/${id}`);
        console.log('Dados originais:', response.data);
        
        // Usar o adaptador para formatar os dados
        const formattedData = formatFromBackend(response.data) as EstabelecimentoData;
        console.log('Dados formatados:', formattedData);
        
        return formattedData;
      } catch (error) {
        console.warn('Falha ao buscar estabelecimento online, tentando offline:', error);
      }
    }

    // ✅ FALLBACK OFFLINE
    try {
      const estabelecimento = await syncService.getEstabelecimentoById(id);
      if (estabelecimento) {
        return formatFromBackend(estabelecimento) as EstabelecimentoData;
      }
    } catch (error) {
      console.error('Erro ao buscar estabelecimento offline:', error);
    }

    throw new Error('Estabelecimento não encontrado');
  },
  // Criar estabelecimento
  async create(data: EstabelecimentoData): Promise<any> {
    // 🔒 PROTEÇÃO: Bloquear requisições duplicadas
    if (isCreatingEstablishment) {
      console.warn('⚠️ Criação já em andamento, bloqueando requisição duplicada');
      throw new Error('Já existe uma criação de estabelecimento em andamento. Por favor, aguarde.');
    }
    
    if (!data.nome) {
      throw new Error('O nome do estabelecimento é obrigatório');
    }

    try {
      isCreatingEstablishment = true; // Bloquear novas requisições
      
      // ✅ TENTAR ONLINE PRIMEIRO
      if (navigator.onLine) {
        try {
          const payload = formatToBackend(data, false);
          console.log('📤 Enviando payload create:', payload);
          
          const response = await api.post("/", payload);
          console.log('✅ Estabelecimento criado online com sucesso');
          return response.data;
        } catch (error) {
          console.warn('⚠️ Falha ao criar estabelecimento online, salvando offline:', error);
          // Se falhar online, tentar offline
        }
      }

      // ✅ FALLBACK OFFLINE
      console.log('📱 Salvando estabelecimento offline...');
      return await syncService.saveEstabelecimento(data);
      
    } finally {
      // Liberar o bloqueio após conclusão ou erro
      setTimeout(() => {
        isCreatingEstablishment = false;
      }, 500); // Pequeno delay para evitar cliques muito rápidos
    }
  },

  // Atualizar estabelecimento
  async update(id: number, data: EstabelecimentoData): Promise<any> {
    // ✅ TENTAR ONLINE PRIMEIRO
    if (navigator.onLine) {
      try {
        const payload = formatToBackend(data, true);
        
        console.log('ID da atualização:', id);
        console.log('Payload completo:', payload);
        
        const response = await api.put(`/${id}`, payload);
        console.log('✅ Estabelecimento atualizado online');
        return response.data;
      } catch (error) {
        console.warn('Falha ao atualizar estabelecimento online:', error);
        
        const err = error as any;
        if (err.response?.data?.errors?.[0]) {
          throw new Error(err.response.data.errors[0]);
        }
        throw new Error(err.message || 'Erro ao atualizar estabelecimento');
      }
    }

    // ✅ Para atualizações offline, seria necessário implementar lógica específica
    throw new Error('Atualização offline não implementada ainda');
  },

  async delete(id: number): Promise<void> {
    // ✅ DELETE só funciona online por enquanto
    if (!navigator.onLine) {
      throw new Error('Exclusão requer conexão com a internet');
    }

    try {
      await api.delete(`/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ✅ VERIFICAÇÃO DE DUPLICATAS COM CACHE OFFLINE
  async checkDuplicate(
    field: 'codigo_unidade' | 'cnes' | 'cnpj',
    value: string,
    id?: number
  ): Promise<DuplicateCheckResponse> {
    // ✅ TENTAR ONLINE PRIMEIRO
    if (navigator.onLine) {
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
        console.warn('Falha na verificação online, usando cache offline:', error);
      }
    }

    // ✅ FALLBACK OFFLINE
    if (field === 'cnes') {
      try {
        const exists = await syncService.checkCNESExists(value.trim());
        return { isDuplicate: exists, field };
      } catch (error) {
        console.error('Erro na verificação offline de CNES:', error);
        return { isDuplicate: false, field };
      }
    }

    // Para outros campos, assumir que não existe (por segurança)
    console.warn(`Verificação offline para ${field} não implementada, assumindo não duplicado`);
    return { isDuplicate: false, field };
  }
};
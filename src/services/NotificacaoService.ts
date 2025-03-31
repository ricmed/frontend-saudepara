import axios from 'axios';
import { FormData } from '@/features/notificationForms/NotificationForm';
import { formatFromBackend, formatToBackend, formatListResponse } from '@/utils/notificacaoAdapter';

// Interfaces para os tipos de dados usados nos dropdowns e checkboxes
export interface BaseOption {
  id: number;
  descricao: string;
}

export interface EventoOption extends BaseOption {
  idtipo_evento: number;
}

export interface PublicoOption extends BaseOption {
  idtipo_publico: number;
}

export interface PaisOption extends BaseOption {
  idtipo_pais: number;
}

export interface EstadoOption extends BaseOption {
  idtipo_estado: number;
}

export interface MunicipioOption extends BaseOption {
  idtipo_municipio: number;
}

export interface BairroOption extends BaseOption {
  idbairro: number;
}

export interface GeneroOption extends BaseOption {
  idtipo_genero: number;
}

export interface RacaOption extends BaseOption {
  idtipo_raca: number;
}

export interface EscolaridadeOption extends BaseOption {
  idtipo_escolaridade: number;
}

export interface AtendimentoOption extends BaseOption {
  idtipo_atendimento: number;
}

export interface SintomaOption extends BaseOption {
  idtipo_sintoma: number;
}

export interface HipoteseDiagOption extends BaseOption {
  idtipo_hipotese_diag: number;
}

export interface TraumaOption extends BaseOption {
  idtipo_trauma: number;
}

export interface EstabelecimentoOption extends BaseOption {
  idestabelecimento: number;
}

export interface EncerramentoOption extends BaseOption {
  idtipo_encerramento: number;
}

// Interface para resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
// URL base para o backend
const API_BASE_URL = `${server}:${port}/api/notificacao`;

// Endpoints corretos para buscar tipos - usando o padrão de nomenclatura do backend
const TIPO_ENDPOINTS = {
  EVENTO: `${server}:${port}/api/tipo-evento`,
  PUBLICO: `${server}:${port}/api/tipo-publico`,
  PAIS: `${server}:${port}/api/tipo-pais`,
  ESTADO: `${server}:${port}/api/tipo-estado`,
  MUNICIPIO: `${server}:${port}/api/tipo-municipio`,
  GENERO: `${server}:${port}/api/tipo-genero`,
  RACA: `${server}:${port}/api/tipo-raca`,
  ESCOLARIDADE: `${server}:${port}/api/tipo-escolaridade`,
  ATENDIMENTO: `${server}:${port}/api/tipo-atendimento`,
  SINTOMA: `${server}:${port}/api/tipo-sintoma`,
  HIPOTESE_DIAG: `${server}:${port}/api/tipo-hipotese-diag`,
  TRAUMA: `${server}:${port}/api/tipo-trauma`,
  ESTABELECIMENTO: `${server}:${port}/api/estabelecimentos`, // Nota o uso do plural, conforme o backend
  ENCERRAMENTO: `${server}:${port}/api/tipo-encerramento`,
};

// Instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Função para tratar erros da API
const handleApiError = (error: any): never => {
  console.error('Erro completo:', error);
  
  if (error.response) {
    console.error('Dados do erro:', error.response.data);
    console.error('Status:', error.response.status);
    
    // Tratar diferentes formatos de resposta de erro
    if (error.response.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    if (error.response.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    if (error.response.status === 400) {
      const errorData = error.response.data;
      
      if (errorData?.errors) {
        // Para erros de validação Zod
        const messages = errorData.errors.map((e: any) => 
          `${e.field}: ${e.message}`
        ).join('; ');
        throw new Error(`Erros de validação: ${messages}`);
      }
      
      if (errorData?.status === 'error') {
        throw new Error(errorData.message || 'Erro na requisição');
      }
    }
    
    if (error.response.status === 404) {
      throw new Error('Notificação não encontrada');
    }
  }

  throw new Error(`Erro na requisição: ${error.message}`);
};

export const NotificacaoService = {
  // Property to track active município fetch requests
  municipioAbortController: null as AbortController | null,
  
  // Método genérico para buscar opções de dropdown
  async fetchOptions<T>(endpoint: string, limit: number = 100): Promise<T[]> {
    try {
      // Adicionar parâmetro de limite para obter mais itens
      const paginatedEndpoint = `${endpoint}?limit=${limit}`;
      const response = await axios.get(paginatedEndpoint);
      
      // Tratamento para diferentes formatos de resposta
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (response.data) {
        // Tentar extrair as propriedades data ou items
        const possibleData = response.data.data || response.data.items;
        if (Array.isArray(possibleData)) {
          return possibleData;
        }
      }
      
      // Se nenhuma das verificações acima for bem-sucedida, retornar array vazio
      console.warn(`Resposta inesperada do endpoint ${endpoint}:`, response.data);
      return [];
    } catch (error) {
      console.error(`Erro ao buscar opções de ${endpoint}:`, error);
      
      // Fingir/mockar dados caso o endpoint não exista ainda
      // Você pode personalizar esses dados fictícios conforme necessário
      // Ou remover esta parte se todos os endpoints já estiverem implementados
      if (endpoint.includes('tipo-evento')) {
        return [
          { id: 1, idtipo_evento: 1, descricao: "COP30" },
          { id: 2, idtipo_evento: 2, descricao: "Carnaval" }
        ] as unknown as T[];
      }
      
      if (endpoint.includes('tipo-publico')) {
        return [
          { id: 1, idtipo_publico: 1, descricao: "Visitante" },
          { id: 2, idtipo_publico: 2, descricao: "Trabalhador" }
        ] as unknown as T[];
      }
      
      // Dados padrão para outros endpoints não implementados
      return [
        { id: 1, descricao: "Opção 1" },
        { id: 2, descricao: "Opção 2" }
      ] as unknown as T[];
    }
  },

  // Métodos para buscar cada tipo de opção
  async getEventoOptions(): Promise<EventoOption[]> {
    return this.fetchOptions<EventoOption>(TIPO_ENDPOINTS.EVENTO);
  },

  async getPublicoOptions(): Promise<PublicoOption[]> {
    return this.fetchOptions<PublicoOption>(TIPO_ENDPOINTS.PUBLICO);
  },

  async getPaisOptions(): Promise<PaisOption[]> {
    return this.fetchOptions<PaisOption>(TIPO_ENDPOINTS.PAIS);
  },

  async getEstadoOptions(): Promise<EstadoOption[]> {
    return this.fetchOptions<EstadoOption>(TIPO_ENDPOINTS.ESTADO);
  },

  async getMunicipioOptions(estadoId?: number): Promise<MunicipioOption[]> {
    if (!estadoId) {
      return [];
    }
    
    try {
      // Implementar um timeout e cancelamento de requisições anteriores
      // para evitar race conditions
      if (this.municipioAbortController) {
        this.municipioAbortController.abort();
      }
      
      this.municipioAbortController = new AbortController();
      const signal = this.municipioAbortController.signal;
      
      // Garantir que o estadoId seja um número
      const idEstado = Number(estadoId);
      
      // Usar o parâmetro correto e garantir que seja passado como número
      const endpoint = `${TIPO_ENDPOINTS.MUNICIPIO}?tipo_estado_idtipo_estado=${idEstado}`;
      
      console.log(`Buscando municípios para o estado ID: ${idEstado} (${typeof idEstado})`);
      
      // Usar axios diretamente em vez do método genérico fetchOptions para ter mais controle
      const response = await axios.get(endpoint, { signal });
      
      // Validar a resposta e garantir que estamos retornando apenas dados válidos
      let municipios = [];
      
      if (Array.isArray(response.data)) {
        municipios = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        municipios = response.data.data;
      } else if (response.data) {
        const possibleData = response.data.data || response.data.items;
        if (Array.isArray(possibleData)) {
          municipios = possibleData;
        }
      }
      
      console.log(`Encontrados ${municipios.length} municípios para o estado ${idEstado}`);
      
      // Verificar se os municípios retornados realmente pertencem ao estado selecionado
      // Isso pode ajudar a identificar problemas na API
      if (municipios.length > 0 && 'tipo_estado_idtipo_estado' in municipios[0]) {
        const municipiosDoEstado = municipios.filter((m: { tipo_estado_idtipo_estado: number | string }) => 
          Number(m.tipo_estado_idtipo_estado) === idEstado
        );
        
        if (municipiosDoEstado.length !== municipios.length) {
          console.warn(`API retornou ${municipios.length} municípios, mas apenas ${municipiosDoEstado.length} são do estado ${idEstado}`);
          return municipiosDoEstado;
        }
      }
      
      return municipios;
    } catch (error) {
      // Não tratar erros de abort como erros reais
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        console.log('Requisição de municípios cancelada devido a nova seleção de UF');
        return [];
      }
      
      console.error(`Erro ao buscar municípios para o estado ${estadoId}:`, error);
      return [];
    } finally {
      // Limpar o controlador após a conclusão
      this.municipioAbortController = null;
    }
  },

  async getGeneroOptions(): Promise<GeneroOption[]> {
    return this.fetchOptions<GeneroOption>(TIPO_ENDPOINTS.GENERO);
  },

  async getRacaOptions(): Promise<RacaOption[]> {
    return this.fetchOptions<RacaOption>(TIPO_ENDPOINTS.RACA);
  },

  async getEscolaridadeOptions(): Promise<EscolaridadeOption[]> {
    return this.fetchOptions<EscolaridadeOption>(TIPO_ENDPOINTS.ESCOLARIDADE);
  },

  async getAtendimentoOptions(): Promise<AtendimentoOption[]> {
    return this.fetchOptions<AtendimentoOption>(TIPO_ENDPOINTS.ATENDIMENTO);
  },

  async getSintomaOptions(): Promise<SintomaOption[]> {
    return this.fetchOptions<SintomaOption>(TIPO_ENDPOINTS.SINTOMA, 200);
  },

  async getHipoteseDiagOptions(): Promise<HipoteseDiagOption[]> {
    return this.fetchOptions<HipoteseDiagOption>(TIPO_ENDPOINTS.HIPOTESE_DIAG);
  },

  async getTraumaOptions(): Promise<TraumaOption[]> {
    return this.fetchOptions<TraumaOption>(TIPO_ENDPOINTS.TRAUMA);
  },

  async getEstabelecimentoOptions(): Promise<EstabelecimentoOption[]> {
    return this.fetchOptions<EstabelecimentoOption>(TIPO_ENDPOINTS.ESTABELECIMENTO);
  },

  async getEncerramentoOptions(): Promise<EncerramentoOption[]> {
    return this.fetchOptions<EncerramentoOption>(TIPO_ENDPOINTS.ENCERRAMENTO);
  },

  // Obter notificação por ID
  async getById(id: number): Promise<FormData> {
    try {
      const response = await api.get(`/${id}`);
      const formData = formatFromBackend(response.data);
      
      if (!formData) {
        throw new Error('Erro ao formatar dados da notificação');
      }
      
      return formData;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Obter todas as notificações paginadas
  async getAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await api.get(`?page=${page}&limit=${limit}`);
      return formatListResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Criar nova notificação
  async create(formData: FormData): Promise<any> {
    try {
      // Converter formData para o formato da API
      const apiData = formatToBackend(formData, false);
      console.log("Dados enviados para API (create):", apiData);
      
      const response = await api.post('', apiData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Atualizar notificação existente
  async update(id: number, formData: FormData): Promise<any> {
    try {
      // Converter formData para o formato da API
      const apiData = formatToBackend(formData, true);
      console.log(`Atualizando notificação ${id} com dados:`, apiData);
      
      const response = await api.put(`/${id}`, apiData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Excluir notificação
  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Buscar notificações por paciente
  async getByPaciente(pacienteId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await api.get(`/paciente/${pacienteId}?page=${page}&limit=${limit}`);
      return formatListResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Buscar notificações por período
  async getByPeriodo(dataInicio: string, dataFim: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await api.get(`/periodo?dataInicio=${dataInicio}&dataFim=${dataFim}&page=${page}&limit=${limit}`);
      return formatListResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Buscar notificações para select/dropdown
  async getAllForSelect(): Promise<any[]> {
    try {
      const response = await api.get('/select');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações para seleção:', error);
      return [];
    }
  }
};

export default NotificacaoService;
import axios from 'axios';

// Interface para opções de dropdown
export interface OptionItem {
  id: number;
  descricao: string;
  [key: string]: any; // Para outras propriedades que possam existir
}

// Interfaces para o Paciente
export interface Paciente {
  idpaciente?: number;
  nome: string;
  nome_mae?: string | null;
  data_nascimento: string;
  cpf?: string | null;
  tipo_genero_idtipo_genero: number;
  gestante?: string | null;
  tipo_raca_idtipo_raca: number;
  escolaridade_idescolaridade?: number | null;
  cbo_idcbo?: number | null;
  ddi?: string;
  contato?: string | null;
  tipo_genero?: { idtipo_genero: number; descricao: string };
  tipo_raca?: { idtipo_raca: number; descricao: string };
  tipo_escolaridade?: { idescolaridade: number; descricao: string } | null;
  tipo_cbo?: { idcbo: number; descricao: string } | null;
}

// Interface para resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    perPage: number;
  };
}

// Interface para paciente em lista de seleção
export interface PacienteSelectOption {
  idpaciente: number;
  nome: string;
  data_nascimento: string;
  cpf: string | null;
}

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
// URL base para o backend
const API_BASE_URL = `${server}:${port}`;

// Endpoint específico para pacientes e tipos relacionados
const ENDPOINTS = {
  PACIENTE: `${API_BASE_URL}/api/paciente`,
  TIPO_GENERO: `${API_BASE_URL}/api/tipo-genero`,  // Endpoint para tipos de gênero
  TIPO_RACA: `${API_BASE_URL}/api/tipo-raca`,      // Endpoint para tipos de raça
  TIPO_ESCOLARIDADE: `${API_BASE_URL}/api/tipo-escolaridade`, // Endpoint para escolaridades
  TIPO_CBO: `${API_BASE_URL}/api/cbo`,             // Endpoint para CBOs
};

// Instância do axios com configurações padrão
const api = axios.create({
  baseURL: ENDPOINTS.PACIENTE,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

// Função para tratar erros da API
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
      } else if (errorData?.details) {
        // Erro de validação Zod
        const messages = errorData.details.map((d: any) => 
          `${d.field}: ${d.message}`
        ).join('; ');
        throw new Error(`Erros de validação: ${messages}`);
      }
      throw new Error('Erro de validação nos dados. Verifique os campos obrigatórios.');
    }
    
    if (error.response.status === 404) {
      throw new Error('Paciente não encontrado');
    }
  }

  throw new Error(`Erro na requisição: ${error.message}`);
};

export const PacienteService = {
  // Obter todos os pacientes paginados
  async getAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Paciente>> {
    try {
      const response = await api.get(`?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Obter paciente por ID
  async getById(id: number): Promise<Paciente> {
    try {
      const response = await api.get(`/${id}`);
      console.log("Dados retornados do getById:", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Buscar pacientes por termo
  async search(query: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Paciente>> {
    try {
      if (!query || query.length < 3) {
        throw new Error('Digite pelo menos 3 caracteres para realizar a busca');
      }
      
      const response = await api.get(`/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Obter lista simplificada para select/dropdown
  async getAllForSelect(): Promise<PacienteSelectOption[]> {
    try {
      const response = await api.get('/select');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pacientes para seleção:', error);
      return [];
    }
  },

  // Criar paciente
  async create(data: Omit<Paciente, 'idpaciente'>): Promise<Paciente> {
    try {
      // Validações mínimas antes de enviar para a API
      if (!data.nome || data.nome.trim() === '') {
        throw new Error('O nome do paciente é obrigatório');
      }
      
      if (!data.data_nascimento) {
        throw new Error('A data de nascimento é obrigatória');
      }
      
      if (!data.tipo_genero_idtipo_genero) {
        throw new Error('O tipo de gênero é obrigatório');
      }
      
      if (!data.tipo_raca_idtipo_raca) {
        throw new Error('O tipo de raça é obrigatório');
      }
      
      // Formatação da data se necessário
      const formattedData = {
        ...data,
        // Garantir que null seja enviado em vez de strings vazias
        nome_mae: data.nome_mae?.trim() || null,
        cpf: data.cpf?.trim() || null,
        gestante: data.gestante?.trim() || null,
        contato: data.contato?.trim() || null,
      };
      
      const response = await api.post('/', formattedData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Adicione esta função auxiliar para depuração
  logObject(title: string, obj: any) {
    console.log(`=== ${title} ===`);
    console.log(JSON.stringify(obj, null, 2));
    console.log("====================");
  },

  // Atualizar paciente
  async update(id: number, data: Partial<Paciente>): Promise<Paciente> {
    try {
      if (data.nome !== undefined && !data.nome.trim()) {
        throw new Error('O nome do paciente não pode estar vazio');
      }
      
      this.logObject("Dados recebidos para update", data);
      
      // Tratamos os dados para garantir que valores vazios/nulos sejam tratados corretamente
      const formattedData: any = {
        ...data,
        nome_mae: data.nome_mae?.trim() || null,
        cpf: data.cpf?.trim() || null,
        gestante: data.gestante?.trim() || null,
        contato: data.contato?.trim() || null,
      };
      
      // Tratamento explícito para escolaridade
      if (data.hasOwnProperty('escolaridade_idescolaridade')) {
        if (data.escolaridade_idescolaridade === null || 
            data.escolaridade_idescolaridade === undefined || 
            data.escolaridade_idescolaridade === 0 || 
            String(data.escolaridade_idescolaridade) === "") {
          formattedData.escolaridade_idescolaridade = null;
        } else {
          formattedData.escolaridade_idescolaridade = Number(data.escolaridade_idescolaridade);
        }
      }
      
      // Tratamento explícito para CBO
      if (data.hasOwnProperty('cbo_idcbo')) {
        if (data.cbo_idcbo === null || 
            data.cbo_idcbo === undefined ||
            data.cbo_idcbo === 0 ||
            String(data.cbo_idcbo).trim() === "") {
          formattedData.cbo_idcbo = null;
        } else {
          formattedData.cbo_idcbo = Number(data.cbo_idcbo);
        }
      }
      
      this.logObject("Dados formatados para update", formattedData);
      
      // Uma única chamada para a API
      const response = await api.put(`/${id}`, formattedData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Adicione um método específico para limpar campos opcionais, se necessário
  async clearOptionalFields(id: number, fields: string[]): Promise<Paciente> {
    try {
      console.log(`Tentando limpar campos específicos para paciente ${id}: ${fields.join(', ')}`);
      
      // Crie um objeto com os campos para limpar
      const updateData: any = {};
      fields.forEach(field => {
        updateData[field] = 0;  // Tente com 0 em vez de null
      });
      
      this.logObject("Dados para limpar campos", updateData);
      
      const response = await api.patch(`/${id}/clear-fields`, updateData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Excluir paciente
  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ------------------------------------------------------------------------
  // Métodos para buscar opções para os dropdowns
  // ------------------------------------------------------------------------

  // Buscar tipos de gênero
  async getTiposGenero(): Promise<OptionItem[]> {
    try {
      console.log(`Buscando tipos de gênero em: ${ENDPOINTS.TIPO_GENERO}`);
      
      // Buscar todos os itens
      const items = await fetchAllPages<any>(ENDPOINTS.TIPO_GENERO);
      
      // Mapear os items sem duplicar as propriedades
      return items.map(item => {
        // Identificar a propriedade de ID correta
        const itemId = item.id || item.idtipo_genero;
        
        // Retornar um novo objeto com as propriedades normalizadas
        return {
          id: itemId,
          descricao: item.descricao,
          // Adicionar outras propriedades necessárias, exceto as já mapeadas
          ...(item.idtipo_genero !== undefined && { idtipo_genero: item.idtipo_genero })
        };
      });
    } catch (error) {
      console.error('Erro ao buscar tipos de gênero:', error);
      return [];
    }
  },

  // Buscar tipos de raça
  async getTiposRaca(): Promise<OptionItem[]> {
    try {
      console.log(`Buscando tipos de raça em: ${ENDPOINTS.TIPO_RACA}`);
      
      // Buscar todos os itens
      const items = await fetchAllPages<any>(ENDPOINTS.TIPO_RACA);
      
      // Mapear os items sem duplicar as propriedades
      return items.map(item => {
        // Identificar a propriedade de ID correta
        const itemId = item.id || item.idtipo_raca;
        
        // Retornar um novo objeto com as propriedades normalizadas
        return {
          id: itemId,
          descricao: item.descricao,
          // Adicionar outras propriedades necessárias, exceto as já mapeadas
          ...(item.idtipo_raca !== undefined && { idtipo_raca: item.idtipo_raca })
        };
      });
    } catch (error) {
      console.error('Erro ao buscar tipos de raça:', error);
      return [];
    }
  },

  // Buscar tipos de escolaridade
  async getTiposEscolaridade(): Promise<OptionItem[]> {
    try {
      console.log(`Buscando tipos de escolaridade em: ${ENDPOINTS.TIPO_ESCOLARIDADE}`);
      
      // Buscar todos os itens
      const items = await fetchAllPages<any>(ENDPOINTS.TIPO_ESCOLARIDADE);
      
      // Aqui está o problema - precisamos mapear corretamente os campos
      // Mudando de idtipo_escolaridade para id para manter consistência
      return items.map(item => {
        // Log para debug do objeto original
        console.log('Item escolaridade original:', item);
        
        // Criar novo objeto com a estrutura esperada
        return {
          id: item.idtipo_escolaridade,  // Usar idtipo_escolaridade como id
          descricao: item.descricao,
          // Preservar o campo original também se necessário
          idtipo_escolaridade: item.idtipo_escolaridade
        };
      });
    } catch (error) {
      console.error('Erro ao buscar tipos de escolaridade:', error);
      return [];
    }
  },

  // Verificar disponibilidade de CPF (retorna verdadeiro se o CPF está disponível)
  async checkCpfAvailable(cpf: string, excludeId?: number): Promise<boolean> {
    try {
      // Verificar se o CPF está formatado corretamente
      if (!cpf || cpf.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos');
      }
      
      // Estrutura para verificação de duplicidade, seguindo o padrão do backend
      const payload = {
        cpf: cpf.trim(),
        excludeId: excludeId
      };
      
      // Endpoint deve ser ajustado conforme implementação do backend
      // Este é um exemplo, use o endpoint correto
      const response = await api.post('/check-cpf', payload);
      
      // Assumindo que a API retorna { available: true/false }
      return response.data.available;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade de CPF:', error);
      // Em caso de erro, é mais seguro assumir que não está disponível
      return false;
    }
  }
};

export default PacienteService;
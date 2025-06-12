import axios from 'axios';
import indexedDBService from './indexedDB';

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
    }  },

  // ✅ CORRIGIDO: Obter contagem total usando rota existente /api/paciente
  async getTotalCount(): Promise<number> {
    try {
      console.log('📊 Descobrindo total usando rota existente...');
      
      // ✅ Usar sua rota existente /api/paciente com parâmetros de teste
      const response = await this.getAll(1, 1); // Página 1, apenas 1 item
      
      // Verificar se tem informação de paginação
      if (response.pagination && response.pagination.total) {
        const total = response.pagination.total;
        console.log(`📊 Total encontrado via paginação: ${total}`);
        return total;
      }
      
      // Fallback: tentar descobrir fazendo uma busca maior
      console.log('ℹ️ Paginação não disponível, tentando descobrir total...');
      const bigResponse = await this.getAll(1, 10000); // Tentar buscar muitos
      
      if (bigResponse.data && Array.isArray(bigResponse.data)) {
        const count = bigResponse.data.length;
        console.log(`📊 Total descoberto via busca: ${count}`);
        
        // Se retornou exatamente 10000, pode haver mais
        if (count === 10000) {
          console.log('⚠️ Pode haver mais de 10.000 pacientes');
          return count + 5000; // Estimativa conservadora
        }
        
        return count;
      }
      
      console.log('⚠️ Não foi possível descobrir total');
      return 0;
      
    } catch (error) {
      console.error('❌ Erro ao obter contagem de pacientes:', error);
      return 0;
    }
  },
  // ✅ CORRIGIDO: Baixar CPFs usando rota existente
  async getAllCPFs(): Promise<string[]> {
    try {
      console.log('📥 Extraindo CPFs de todos os pacientes...');
      
      // ✅ Usar método existente que já funciona
      const allPatients = await this.getAllPatientsForOffline();
      
      // Extrair apenas CPFs válidos
      const cpfs = allPatients
        .map(patient => patient.cpf)
        .filter((cpf): cpf is string => cpf != null && cpf.trim() !== '')
        .map(cpf => cpf.replace(/\D/g, '')) // Limpar formatação
        .filter(cpf => cpf.length === 11); // Apenas CPFs com 11 dígitos
      
      // Remover duplicatas
      const uniqueCpfs = Array.from(new Set(cpfs));
      
      // ✅ Salvar CPFs no cache para verificação rápida
      if (uniqueCpfs.length > 0) {
        await indexedDBService.saveCpfsCacheBatch(uniqueCpfs);
        console.log(`✅ ${uniqueCpfs.length} CPFs salvos no cache`);
      }
      
      console.log(`✅ Extraídos ${uniqueCpfs.length} CPFs únicos`);
      return uniqueCpfs;
      
    } catch (error) {
      console.error('❌ Erro ao extrair CPFs:', error);
      return [];
    }
  },

  // ✅ CORRIGIDO: Download de todos os pacientes usando apenas rota existente
  async getAllPatientsForOffline(
    onProgress?: (current: number, total: number, percentage: number) => void
  ): Promise<Paciente[]> {
    try {
      console.log('📥 Iniciando download usando método adaptado...');
      
      // ✅ 1. Tentar descobrir total primeiro
      let estimatedTotal = 0;
      try {
        estimatedTotal = await this.getTotalCount();
        console.log(`📊 Total estimado: ${estimatedTotal}`);
      } catch (error) {
        console.warn('⚠️ Não conseguiu obter total, continuando...');
      }
      
      // ✅ 2. Download página por página
      const batchSize = 500;
      let allPatients: Paciente[] = [];
      let page = 1;
      let hasMore = true;
      let consecutiveEmptyPages = 0;
      
      while (hasMore && page <= 50) { // Limite de segurança: máximo 50 páginas
        try {
          console.log(`📥 Baixando página ${page} (${batchSize} registros)...`);
          
          const response = await this.getAll(page, batchSize);
          const batch = response.data || [];
          
          if (batch.length === 0) {
            consecutiveEmptyPages++;
            console.log(`⚠️ Página ${page} vazia (${consecutiveEmptyPages} consecutivas)`);
            
            // Parar se tiver 2 páginas vazias consecutivas
            if (consecutiveEmptyPages >= 2) {
              hasMore = false;
              break;
            }
          } else {
            consecutiveEmptyPages = 0; // Reset contador
            allPatients = [...allPatients, ...batch];
            
            // ✅ Callback de progresso
            const currentTotal = estimatedTotal > 0 ? estimatedTotal : allPatients.length + 1000;
            const percentage = Math.min((allPatients.length / currentTotal) * 100, 95);
            onProgress?.(allPatients.length, currentTotal, percentage);
            
            console.log(`✅ Página ${page}: +${batch.length} pacientes (total: ${allPatients.length})`);
            
            // Se a página retornou menos que o limite, provavelmente é a última
            if (batch.length < batchSize) {
              console.log('📄 Última página detectada (retornou menos que o limite)');
              hasMore = false;
            }
          }
          
          page++;
          
          // Pequena pausa para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (pageError) {
          console.error(`❌ Erro na página ${page}:`, pageError);
          consecutiveEmptyPages++;
          
          // Se falhou em muitas páginas consecutivas, parar
          if (consecutiveEmptyPages >= 3) {
            console.log('❌ Muitas falhas consecutivas, parando...');
            hasMore = false;
          } else {
            page++; // Tentar próxima página
          }
        }
      }
      
      // ✅ Progresso final
      if (onProgress) {
        onProgress(allPatients.length, allPatients.length, 100);
      }
      
      console.log(`✅ Download concluído: ${allPatients.length.toLocaleString()} pacientes`);
      return allPatients;
      
    } catch (error) {
      console.error('❌ Erro geral no download:', error);
      throw error;
    }
  },

  // ✅ CORRIGIDO: Pacientes recentes usando filtro local
  async getRecentPatientsForOffline(
    months: number = 12,
    onProgress?: (current: number, total: number, percentage: number) => void
  ): Promise<Paciente[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      
      console.log(`📥 Baixando todos e filtrando últimos ${months} meses...`);
      
      // ✅ Baixar todos os pacientes primeiro
      const allPatients = await this.getAllPatientsForOffline(onProgress);
      
      // ✅ Filtrar por data (se não tiver data de criação, incluir por segurança)
      const recentPatients = allPatients.filter(patient => {
        // Se não tem data de nascimento, incluir por segurança
        if (!patient.data_nascimento) return true;
        
        try {
          const patientDate = new Date(patient.data_nascimento);
          
          // Se a data é muito antiga (antes de 1900), provavelmente é data de nascimento,
          // não de criação, então incluir por segurança
          if (patientDate.getFullYear() < 1950) return true;
          
          // Se a data é recente, pode ser data de criação
          return patientDate >= cutoffDate;
          
        } catch (dateError) {
          console.warn('Erro ao processar data:', dateError);
          return true; // Incluir por segurança
        }
      });
      
      console.log(`✅ Filtrados ${recentPatients.length} de ${allPatients.length} pacientes recentes`);
      return recentPatients;
      
    } catch (error) {
      console.error('❌ Erro ao baixar pacientes recentes:', error);
      throw error;
    }
  },

  // ✅ CORRIGIDO: Recomendação usando métodos que funcionam
  async getDownloadRecommendation(): Promise<{
    totalPatients: number;
    estimatedSizeMB: number;
    recommendation: 'full' | 'recent' | 'cpfs-only';
    reason: string;
  }> {
    try {
      // ✅ Usar método corrigido
      const totalCount = await this.getTotalCount();
      
      if (totalCount === 0) {
        return {
          totalPatients: 0,
          estimatedSizeMB: 0,
          recommendation: 'cpfs-only',
          reason: 'Nenhum paciente encontrado ou erro de acesso'
        };
      }
      
      // Estimar tamanho (aproximadamente 500 bytes por paciente completo)
      const estimatedFullSizeMB = (totalCount * 500) / (1024 * 1024);
      
      let recommendation: 'full' | 'recent' | 'cpfs-only' = 'full';
      let reason = '';
      
      if (totalCount > 50000) {
        recommendation = 'cpfs-only';
        reason = `Base muito grande (${totalCount.toLocaleString()} pacientes). Recomendado baixar apenas CPFs para verificação rápida.`;
      } else if (totalCount > 15000) {
        recommendation = 'recent';
        reason = `Base grande (${totalCount.toLocaleString()} pacientes, ~${Math.round(estimatedFullSizeMB)}MB). Considere baixar apenas pacientes recentes.`;
      } else if (estimatedFullSizeMB > 25) {
        recommendation = 'recent';
        reason = `Tamanho estimado grande (~${Math.round(estimatedFullSizeMB)}MB). Pacientes recentes podem ser suficientes.`;
      } else {
        recommendation = 'full';
        reason = `Base pequena (${totalCount.toLocaleString()} pacientes, ~${Math.round(estimatedFullSizeMB)}MB). Download completo viável.`;
      }
      
      return {
        totalPatients: totalCount,
        estimatedSizeMB: estimatedFullSizeMB,
        recommendation,
        reason
      };
      
    } catch (error) {
      console.error('❌ Erro ao analisar download:', error);
      return {
        totalPatients: 0,
        estimatedSizeMB: 0,
        recommendation: 'cpfs-only',
        reason: 'Erro ao analisar base de dados - usando estratégia conservadora'
      };
    }
  },

  // ✅ NOVO: Função de conveniência para download inteligente
  async downloadPatientsIntelligent(
    onProgress?: (progress: number, current: string, phase?: string) => void
  ): Promise<{ success: boolean; count: number; strategy: string; error?: string }> {
    try {
      onProgress?.(0, 'Analisando melhor estratégia...', 'Análise');
      
      const recommendation = await this.getDownloadRecommendation();
      
      onProgress?.(10, recommendation.reason, 'Estratégia Escolhida');
      
      let result: { success: boolean; count: number; error?: string };
      let strategy: string;
      
      switch (recommendation.recommendation) {
        case 'full':
          strategy = 'Download Completo';
          const allPatients = await this.getAllPatientsForOffline(
            (current, total, percentage) => {
              onProgress?.(10 + (percentage * 0.9), `${current}/${total} pacientes`, strategy);
            }
          );
          result = { success: true, count: allPatients.length };
          break;
          
        case 'recent':
          strategy = 'Pacientes Recentes';
          const recentPatients = await this.getRecentPatientsForOffline(
            12, // 12 meses
            (current, total, percentage) => {
              onProgress?.(10 + (percentage * 0.9), `${current}/${total} pacientes`, strategy);
            }
          );
          result = { success: true, count: recentPatients.length };
          break;
          
        case 'cpfs-only':
          strategy = 'Apenas CPFs';
          onProgress?.(50, 'Extraindo CPFs...', strategy);
          const cpfs = await this.getAllCPFs();
          onProgress?.(100, `${cpfs.length} CPFs extraídos`, strategy);
          result = { success: true, count: cpfs.length };
          break;
          
        default:
          throw new Error('Estratégia não implementada');
      }
      
      return { ...result, strategy };
      
    } catch (error: any) {
      console.error('❌ Erro no download inteligente:', error);
      return {
        success: false,
        count: 0,
        strategy: 'Erro',
        error: error.message || 'Erro desconhecido'
      };
    }
  },
};

export default PacienteService;
// NotificacaoService.ts - VERSÃO ATUALIZADA com funções de arquivo
import axios from 'axios';
import type { FormData } from '@/features/notificationForms/types/index2';
import { formatFromBackend, formatToBackend, formatListResponse } from '@/utils/notificacaoAdapter';
import indexedDBService from '@/services/indexedDB';

// ... todas as interfaces existentes permanecem iguais ...
export interface CboOption extends BaseOption {
  idtipo_cbo: number;
}
export interface BaseOption {
  id: number;
  descricao: string;
}

export interface EventoOption extends BaseOption {
  idtipo_evento: number;
  ativo?: string; // 🆕 CAMPO ADICIONADO para compatibilidade
  created_at?: string;
  updated_at?: string;
  // 🆕 NOVA ESTRUTURA: Abrangência com relacionamento N:N
  abrangencia?: Array<{
    municipio: {
      idtipo_municipio: number;
      descricao: string;
    };
  }>;
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
  idtipo_bairro: number; 
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
  BAIRRO: `${server}:${port}/api/tipo-bairro`,
  GENERO: `${server}:${port}/api/tipo-genero`,
  RACA: `${server}:${port}/api/tipo-raca`,
  ESCOLARIDADE: `${server}:${port}/api/tipo-escolaridade`,
  CBO: `${server}:${port}/api/tipo-cbo`,
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
  // Aumenta timeout para 60s para operações mais demoradas
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Para enviar cookies de autenticação automaticamente
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
  
  // ... TODAS AS FUNÇÕES EXISTENTES PERMANECEM IGUAIS ...
  
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
    try {
      // 🔄 MODIFICADO: Usar endpoint de eventos ativos apenas
      const response = await axios.get<EventoOption[]>(`${TIPO_ENDPOINTS.EVENTO}/ativos`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar eventos ativos:', error);
      // Fallback para o método original se o endpoint /ativos não existir ainda
      return NotificacaoService.fetchOptions<EventoOption>(TIPO_ENDPOINTS.EVENTO);
    }
  },

  async getPublicoOptions(): Promise<PublicoOption[]> {
    return NotificacaoService.fetchOptions<PublicoOption>(TIPO_ENDPOINTS.PUBLICO);
  },

  async getPaisOptions(): Promise<PaisOption[]> {
    return NotificacaoService.fetchOptions<PaisOption>(TIPO_ENDPOINTS.PAIS, 300); // Especificar limite de 300
  },

  async getEstadoOptions(): Promise<EstadoOption[]> {
    return NotificacaoService.fetchOptions<EstadoOption>(TIPO_ENDPOINTS.ESTADO);
  },

  async getMunicipioOptions(estadoId?: number): Promise<MunicipioOption[]> {
    // Se não tiver estadoId, baixar TODOS os municípios para uso offline
    if (!estadoId) {
      try {
        const endpoint = `${TIPO_ENDPOINTS.MUNICIPIO}?limit=10000`;
        const response = await axios.get(endpoint);
        
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
        
        console.log(`✅ Baixados ${municipios.length} municípios (todos os estados)`);
        return municipios;
      } catch (error) {
        console.error('Erro ao baixar todos os municípios:', error);
        return [];
      }
    }
    
    // Resto do código existente para busca por estado específico
    try {
      // Implementar um timeout e cancelamento de requisições anteriores
      // para evitar race conditions
      if (NotificacaoService.municipioAbortController) {
        NotificacaoService.municipioAbortController.abort();
      }
      
      NotificacaoService.municipioAbortController = new AbortController();
      const signal = NotificacaoService.municipioAbortController.signal;
      
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
      NotificacaoService.municipioAbortController = null;
    }
  },

  async getBairroOptions(): Promise<BairroOption[]> {
    return NotificacaoService.fetchOptions<BairroOption>(TIPO_ENDPOINTS.BAIRRO, 1000);
  },

  async getGeneroOptions(): Promise<GeneroOption[]> {
    return NotificacaoService.fetchOptions<GeneroOption>(TIPO_ENDPOINTS.GENERO);
  },

  async getRacaOptions(): Promise<RacaOption[]> {
    return NotificacaoService.fetchOptions<RacaOption>(TIPO_ENDPOINTS.RACA);
  },

  async getEscolaridadeOptions(): Promise<EscolaridadeOption[]> {
    return NotificacaoService.fetchOptions<EscolaridadeOption>(TIPO_ENDPOINTS.ESCOLARIDADE);
  },

  async getCboOptions(): Promise<BaseOption[]> {
    try {
      const response = await axios.get(`${server}:${port}/api/tipo-cbo?limit=20000`);
      
      // Verificar diferentes formatos de resposta
      const data = response.data?.data || response.data || [];
      
      // Mapear para o formato correto
      return data.map((cbo: any) => ({
        id: cbo.idtipo_cbo || cbo.id,  // Campo alternativo caso o backend use outro nome
        descricao: cbo.descricao || cbo.nome || "Descrição não disponível"
      }));
      
    } catch (error) {
      console.error('Erro ao buscar opções de CBO:', error);
      return [];
    }
  },

  async getAtendimentoOptions(): Promise<AtendimentoOption[]> {
    return NotificacaoService.fetchOptions<AtendimentoOption>(TIPO_ENDPOINTS.ATENDIMENTO);
  },

  async getSintomaOptions(): Promise<SintomaOption[]> {
    return NotificacaoService.fetchOptions<SintomaOption>(TIPO_ENDPOINTS.SINTOMA, 500);
  },

  async getHipoteseDiagOptions(): Promise<HipoteseDiagOption[]> {
    return NotificacaoService.fetchOptions<HipoteseDiagOption>(TIPO_ENDPOINTS.HIPOTESE_DIAG, 200);
  },

  async getTraumaOptions(): Promise<TraumaOption[]> {
    return NotificacaoService.fetchOptions<TraumaOption>(TIPO_ENDPOINTS.TRAUMA);
  },

  async getEstabelecimentoOptions(): Promise<EstabelecimentoOption[]> {
    try {
      // 🔄 CORRIGIDO: Buscar com limite adequado - backend não filtra por ativo na query
      const endpoint = `${TIPO_ENDPOINTS.ESTABELECIMENTO}?limit=15000`;
      const response = await axios.get(endpoint);
      
      let estabelecimentos = [];
      if (Array.isArray(response.data)) {
        estabelecimentos = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        estabelecimentos = response.data.data;
      } else if (response.data) {
        const possibleData = response.data.data || response.data.items;
        if (Array.isArray(possibleData)) {
          estabelecimentos = possibleData;
        }
      }
      
      // 🔍 FILTRAR MANUALMENTE: apenas estabelecimentos ativos, com nome válido e CNES
      const estabelecimentosAtivos = estabelecimentos.filter((est: any) => {
        const isAtivo = est.ativo === 'S' || est.ativo === '1' || est.ativo === true || est.ativo === 1;
        const temNome = est.nome && est.nome.trim() !== '';
        const temCnes = est.cnes && est.cnes.trim() !== '';
        return isAtivo && temNome && temCnes;
      });
      
      // 🏥 MAPEAR para a estrutura esperada pelo frontend (usar 'nome' ao invés de 'descricao')
      const estabelecimentosFormatados = estabelecimentosAtivos.map((est: any) => ({
        idestabelecimento: est.idestabelecimento,
        id: est.idestabelecimento, // Compatibilidade com BaseOption
        descricao: est.nome, // ← IMPORTANTE: usar 'nome' do backend como 'descricao' no frontend
        cnes: est.cnes,
        ativo: est.ativo
      }));
      
      // 📊 ORDENAR ALFABETICAMENTE por nome
      estabelecimentosFormatados.sort((a: EstabelecimentoOption, b: EstabelecimentoOption) => 
        a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })
      );
      
      const percentual = estabelecimentos.length > 0 
        ? Math.round(estabelecimentosFormatados.length / estabelecimentos.length * 100)
        : 0;
      
      console.log(`✅ Estabelecimentos: ${estabelecimentos.length} total → ${estabelecimentosFormatados.length} ativos válidos (${percentual}%)`);
      
      return estabelecimentosFormatados;
    } catch (error) {
      console.error('❌ Erro ao buscar estabelecimentos:', error);
      return []; // Retornar array vazio em caso de erro
    }
  },

  async getEncerramentoOptions(): Promise<EncerramentoOption[]> {
    return NotificacaoService.fetchOptions<EncerramentoOption>(TIPO_ENDPOINTS.ENCERRAMENTO);
  },

  // Obter notificação por ID
  async getById(id: number): Promise<FormData> {
    try {
      // ✅ REABILITADO: Tentar buscar do IndexedDB primeiro (notificações offline)
      // Isso é especialmente importante para notificações criadas/editadas offline
      const offlineData = await indexedDBService.getNotificacao(id);
      if (offlineData) {
        console.log(`📱 [OFFLINE MODE] Carregando notificação ${id} do cache local`);
        
        // ✅ DEBUG ESPECÍFICO: Log dos campos de trauma do IndexedDB
        console.log('🩹 [DEBUG TRAUMA] Dados do IndexedDB:', {
          tipoTrauma: offlineData.tipoTrauma,
          observacaoTrauma: offlineData.observacaoTrauma,
          observacaoSintomas: offlineData.observacaoSintomas,
          observacaoHipotese: offlineData.observacaoHipotese
        });
        
        return offlineData;
      }

      // Se não encontrou offline, buscar da API (se online)
      console.log(`🌐 [ONLINE MODE] Buscando notificação ${id} da API`);
      const response = await api.get(`/${id}`);
      
      const formData = await formatFromBackend(response.data);
      
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
      console.log("Dados enviados para API (create):", JSON.stringify(apiData, null, 2));
      
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
      console.log(`Atualizando notificação ${id} com dados:`, JSON.stringify(apiData, null, 2));
      
      const response = await api.put(`/${id}`, apiData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Excluir notificação
  async delete(id: number): Promise<void> {
    try {
      // Usa timeout maior explicitamente se necessário
      await api.delete(`/${id}`, { timeout: 60000 });
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
  },

  // 🆕 ================================
  // NOVAS FUNÇÕES PARA GERENCIAMENTO DE ARQUIVOS
  // ================================

  /**
   * Upload de arquivos para uma notificação
   */
  async uploadArquivos(notificacaoId: number, arquivos: File[]): Promise<any> {
    try {
      if (!arquivos || arquivos.length === 0) {
        throw new Error('Nenhum arquivo selecionado');
      }

      // Preparar FormData para upload
      const formData = new FormData();
      arquivos.forEach((arquivo) => {
        formData.append('arquivos', arquivo);
      });

      // Fazer upload
      const response = await axios.post(
        `${server}:${port}/api/notificacao/${notificacaoId}/arquivos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minutos para uploads grandes
          onUploadProgress: (progressEvent) => {
            // Callback opcional para progresso
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log(`Upload: ${percentCompleted}%`);
            }
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Erro no upload de arquivos:', error);
      
      if (error.response?.status === 413) {
        throw new Error('Arquivo muito grande. Limite máximo de 10MB por arquivo.');
      }
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      throw new Error('Erro ao fazer upload dos arquivos');
    }
  },

  /**
   * Listar arquivos de uma notificação
   */
  async getArquivos(notificacaoId: number): Promise<any[]> {
    try {
      const response = await axios.get(
        `${server}:${port}/api/notificacao/${notificacaoId}/arquivos`
      );
      
      return response.data || [];
    } catch (error: any) {
      console.error('Erro ao listar arquivos:', error);
      
      if (error.response?.status === 404) {
        return []; // Retorna array vazio se notificação não existir
      }
      
      throw new Error('Erro ao carregar lista de arquivos');
    }
  },

  /**
   * Deletar um arquivo específico
   */
  async deleteArquivo(arquivoId: number): Promise<void> {
    try {
      await axios.delete(`${server}:${port}/api/arquivos/${arquivoId}`);
    } catch (error: any) {
      console.error('Erro ao deletar arquivo:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Arquivo não encontrado');
      }
      
      throw new Error('Erro ao deletar arquivo');
    }
  },

  /**
   * Obter estatísticas de upload de uma notificação
   */
  async getArquivosStats(notificacaoId: number): Promise<any> {
    try {
      const response = await axios.get(
        `${server}:${port}/api/notificacao/${notificacaoId}/arquivos/stats`
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Erro ao obter estatísticas:', error);
      
      // Retornar estatísticas padrão em caso de erro
      return {
        total_arquivos: 0,
        tamanho_total: 0,
        limite_arquivos: 10,
        limite_tamanho: 50 * 1024 * 1024,
        espaco_disponivel: {
          arquivos: 10,
          bytes: 50 * 1024 * 1024
        }
      };
    }
  },

  /**
   * Função utilitária para download de arquivo
   */
  getDownloadUrl(arquivoId: number): string {
    return `${server}:${port}/api/arquivos/${arquivoId}/download`;
  }
};

export default NotificacaoService;
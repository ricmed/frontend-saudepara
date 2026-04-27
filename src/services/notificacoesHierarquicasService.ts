import axios from 'axios';

// Tipos para as responses dos endpoints
export interface NotificacaoHierarquica {
  idnotificacao: number;
  data_atendimento: string;
  created_at: string;
  paciente: {
    idpaciente: number;
    nome: string;
    data_nascimento?: string;
    idade?: number;
  };
  tipo_evento: {
    idtipo_evento: number;
    descricao: string;
  };
  estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento: {
    idestabelecimento: number;
    nome: string;
    tipo_municipio?: {
      idtipo_municipio: number;
      descricao: string;
    };
  };
  tipo_encerramento: {
    idtipo_encerramento: number;
    descricao: string;
  };
}

export interface PaginationInfo {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

export interface NotificacoesEstabelecimentoResponse {
  data: NotificacaoHierarquica[];
  pagination: PaginationInfo;
  estabelecimento: {
    id: number;
    nome: string;
  };
}

export interface NotificacoesMunicipioResponse {
  data: NotificacaoHierarquica[];
  pagination: PaginationInfo;
  municipio: {
    id: number;
    nome: string;
    estado: string;
  };
  estabelecimentos_count: number;
}

export interface NotificacoesEstadoResponse {
  data: NotificacaoHierarquica[];
  pagination: PaginationInfo;
  estado: {
    id: number;
    nome: string;
    codigo: string;
  };
  municipios_count: number;
  estabelecimentos_count: number;
}

export interface NotificacoesParams {
  page?: number;
  limit?: number;
}

class NotificacoesHierarquicasService {
  private api = axios.create({
    // Normaliza para evitar URLs como ".../api/api/..." quando VITE_API_BASE_URL já vem com /api
    baseURL: String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/api\/?$/, ''),
    withCredentials: true, // Para enviar cookies automaticamente
  });

  /**
   * Buscar notificações por estabelecimento
   */
  async getNotificacoesByEstabelecimento(
    estabelecimentoId: number,
    params: NotificacoesParams = {}
  ): Promise<NotificacoesEstabelecimentoResponse> {
    try {
      const { page = 1, limit = 10 } = params;
      
      const response = await this.api.get(
        `/api/notificacoes/estabelecimento/${estabelecimentoId}`,
        {
          params: { page, limit }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações do estabelecimento:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Buscar notificações por município
   */
  async getNotificacoesByMunicipio(
    municipioId: number,
    params: NotificacoesParams = {}
  ): Promise<NotificacoesMunicipioResponse> {
    try {
      const { page = 1, limit = 10 } = params;
      
      const response = await this.api.get(
        `/api/notificacoes/municipio/${municipioId}`,
        {
          params: { page, limit }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações do município:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Buscar notificações por estado
   */
  async getNotificacoesByEstado(
    estadoId: number,
    params: NotificacoesParams = {}
  ): Promise<NotificacoesEstadoResponse> {
    try {
      const { page = 1, limit = 10 } = params;
      
      const response = await this.api.get(
        `/api/notificacoes/estado/${estadoId}`,
        {
          params: { page, limit }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações do estado:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Tratamento de erros padronizado
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      const status = error.response?.status || 500;
      
      switch (status) {
        case 400:
          return new Error(`Parâmetros inválidos: ${message}`);
        case 404:
          return new Error(`Registro não encontrado: ${message}`);
        case 403:
          return new Error(`Sem permissão para acessar este recurso: ${message}`);
        case 401:
          return new Error(`Não autorizado: ${message}`);
        case 500:
        default:
          return new Error(`Erro do servidor: ${message}`);
      }
    }
    
    return new Error('Erro desconhecido ao processar a requisição');
  }

  /**
   * Formatação de data para exibição
   */
  static formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Calcular idade a partir da data de nascimento
   */
  static calculateAge(birthDate: string): number {
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Obter resumo estatístico das notificações
   */
  static getNotificationsSummary(notifications: NotificacaoHierarquica[]) {
    const total = notifications.length;
    
    // Contar por tipo de evento
    const eventosCounts = notifications.reduce((acc, notif) => {
      const evento = notif.tipo_evento.descricao;
      acc[evento] = (acc[evento] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Contar por status de encerramento
    const encerramentosCounts = notifications.reduce((acc, notif) => {
      const encerramento = notif.tipo_encerramento.descricao;
      acc[encerramento] = (acc[encerramento] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Notificações recentes (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentes = notifications.filter(notif => {
      const createdDate = new Date(notif.created_at);
      return createdDate >= sevenDaysAgo;
    }).length;

    return {
      total,
      recentes,
      eventosCounts,
      encerramentosCounts,
      eventoMaisFrequente: Object.entries(eventosCounts).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'N/A',
    };
  }
}

// Instância singleton do serviço
export const notificacoesHierarquicasService = new NotificacoesHierarquicasService();

export default NotificacoesHierarquicasService;

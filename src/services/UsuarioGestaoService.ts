import axios from 'axios';

// Configurações das APIs
const KEYCLOAK_API_URL = 'http://localhost:4000/api-auth';
const BACKEND_API_URL = `${import.meta.env.VITE_API_SERVER}:${import.meta.env.VITE_API_PORT}`;

// Interfaces
export interface Usuario {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  createdTimestamp?: number;
  attributes?: Record<string, string[]>;
}

export interface UsuarioAcesso {
  id: number;
  user_id: string;
  nivel_acesso: 'unidade' | 'municipio' | 'estado';
  estabelecimento_id?: number;
  tipo_municipio_id?: number;
  tipo_estado_id?: number;
  permissoes: number;
  ativo: 'S' | 'N';
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  estabelecimento?: {
    idestabelecimento: number;
    nome: string;
  };
  tipo_municipio?: {
    idtipo_municipio: number;
    descricao: string;
  };
  tipo_estado?: {
    idtipo_estado: number;
    descricao: string;
  };
}

export interface CreateUsuarioRequest {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
}

export interface CreateUsuarioAcessoRequest {
  userId: string;
  nivel_acesso: 'unidade' | 'municipio' | 'estado';
  estabelecimentoId?: number;
  municipioId?: number;
  estadoId?: number;
  permissoes?: number;
}

export interface UpdateUsuarioAcessoRequest {
  nivel_acesso?: 'unidade' | 'municipio' | 'estado';
  estabelecimentoId?: number;
  municipioId?: number;
  estadoId?: number;
  permissoes?: number;
  ativo?: 'S' | 'N';
}

// Constantes de Permissões (sistema octal)
export const PERMISSOES = {
  READ: 4,        // Apenas leitura
  WRITE: 2,       // Apenas escrita (raro)
  EXECUTE: 1,     // Apenas execução (raro)
  READ_WRITE: 6,  // Leitura + Escrita
  ALL: 7,         // Todas as permissões
} as const;

export const PERMISSOES_LABELS = {
  [PERMISSOES.READ]: 'Apenas Leitura',
  [PERMISSOES.READ_WRITE]: 'Leitura e Escrita',
  [PERMISSOES.ALL]: 'Todas as Permissões',
} as const;

class UsuarioGestaoService {
  private keycloakApi = axios.create({
    baseURL: KEYCLOAK_API_URL,
    withCredentials: true, // Para enviar cookies automaticamente
  });

  private backendApi = axios.create({
    baseURL: `${BACKEND_API_URL}/api`,
    withCredentials: true,
  });

  // ================================
  // MÉTODOS KEYCLOAK (Usuários)
  // ================================

  /**
   * Listar todos os usuários do Keycloak
   */
  async getUsuarios(): Promise<Usuario[]> {
    try {
      const response = await this.keycloakApi.get('/admin/users');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao carregar usuários'));
    }
  }

  /**
   * Criar novo usuário no Keycloak
   */
  async createUsuario(userData: CreateUsuarioRequest): Promise<void> {
    try {
      await this.keycloakApi.post('/admin/users', userData);
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao criar usuário'));
    }
  }

  /**
   * Ativar/Desativar usuário no Keycloak
   */
  async toggleUsuarioStatus(userId: string, enabled: boolean): Promise<void> {
    try {
      // Assumindo que há um endpoint para atualizar status do usuário
      await this.keycloakApi.put(`/admin/users/${userId}`, { enabled });
    } catch (error: any) {
      console.error('Erro ao alterar status do usuário:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao alterar status do usuário'));
    }
  }

  /**
   * Resetar senha do usuário
   */
  async resetarSenhaUsuario(userId: string, novaSenha: string): Promise<void> {
    try {
      await this.keycloakApi.put(`/admin/users/${userId}/reset-password`, {
        password: novaSenha
      });
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao resetar senha'));
    }
  }

  /**
   * Excluir usuário do Keycloak
   */
  async excluirUsuario(userId: string): Promise<void> {
    try {
      await this.keycloakApi.delete(`/admin/users/${userId}`);
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao excluir usuário'));
    }
  }

  // ================================
  // MÉTODOS BACKEND (Controle de Acesso)
  // ================================

  /**
   * Listar acessos de um usuário específico
   */
  async getUsuarioAcessos(userId: string): Promise<UsuarioAcesso[]> {
    try {
      const response = await this.backendApi.get(`/usuario-acesso/usuario/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar acessos do usuário:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao carregar acessos do usuário'));
    }
  }

  /**
   * Listar todos os acessos (com paginação)
   */
  async getAllAcessos(page: number = 1, limit: number = 50): Promise<{
    data: UsuarioAcesso[];
    meta: { total: number; totalPages: number; page: number; limit: number; };
  }> {
    try {
      const response = await this.backendApi.get(`/usuario-acesso?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar todos os acessos:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao carregar acessos'));
    }
  }

  /**
   * Criar acesso para unidade
   */
  async createAcessoUnidade(userId: string, estabelecimentoId: number, permissoes: number = PERMISSOES.READ_WRITE): Promise<UsuarioAcesso> {
    try {
      const response = await this.backendApi.post('/usuario-acesso/unidade', {
        userId,
        estabelecimentoId,
        permissoes
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao criar acesso à unidade:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao criar acesso à unidade'));
    }
  }

  /**
   * Criar acesso para município
   */
  async createAcessoMunicipio(userId: string, municipioId: number, permissoes: number = PERMISSOES.READ_WRITE): Promise<UsuarioAcesso> {
    try {
      const response = await this.backendApi.post('/usuario-acesso/municipio', {
        userId,
        municipioId,
        permissoes
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao criar acesso ao município:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao criar acesso ao município'));
    }
  }

  /**
   * Criar acesso para estado
   */
  async createAcessoEstado(userId: string, estadoId: number, permissoes: number = PERMISSOES.ALL): Promise<UsuarioAcesso> {
    try {
      const response = await this.backendApi.post('/usuario-acesso/estado', {
        userId,
        estadoId,
        permissoes
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao criar acesso ao estado:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao criar acesso ao estado'));
    }
  }

  /**
   * Atualizar acesso existente
   */
  async updateAcesso(acessoId: number, dados: UpdateUsuarioAcessoRequest): Promise<UsuarioAcesso> {
    try {
      const response = await this.backendApi.put(`/usuario-acesso/${acessoId}`, dados);
      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao atualizar acesso:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao atualizar acesso'));
    }
  }

  /**
   * Excluir acesso
   */
  async excluirAcesso(acessoId: number): Promise<void> {
    try {
      await this.backendApi.delete(`/usuario-acesso/${acessoId}`);
    } catch (error: any) {
      console.error('Erro ao excluir acesso:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao excluir acesso'));
    }
  }

  // ================================
  // MÉTODOS AUXILIARES
  // ================================

  /**
   * Buscar opções para dropdowns
   */
  async getEstabelecimentos(): Promise<Array<{id: number; nome: string}>> {
    try {
      // Primeiro tenta o endpoint específico para mapa que retorna TODOS os estabelecimentos ativos
      try {
        const response = await this.backendApi.get('/estabelecimentos/mapa');
        const data = response.data || [];
        console.log(`✅ Carregados ${data.length} estabelecimentos ativos do endpoint /mapa`);
        return data.map((est: any) => ({
          id: est.idestabelecimento,
          nome: est.nome
        }));
      } catch (error) {
        console.error('Erro ao carregar do endpoint /mapa, tentando endpoint normal:', error);
      }

      // Fallback para o endpoint normal com limite alto (seguindo padrão do UnidadeNotificadoraField)
      const response = await this.backendApi.get('/estabelecimentos', {
        params: {
          limit: 11000, // Limite alto para carregar todos
          ativo: 'S',   // Apenas estabelecimentos ativos
          orderBy: 'nome',
          orderDir: 'asc'
        }
      });
      
      const data = response.data?.data || response.data || [];
      const estabelecimentosAtivos = data.filter((est: any) => est.ativo === 'S');
      console.log(`✅ Carregados ${estabelecimentosAtivos.length} estabelecimentos ativos`);
      
      return estabelecimentosAtivos.map((est: any) => ({
        id: est.idestabelecimento,
        nome: est.nome
      }));
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error);
      return [];
    }
  }

  async getMunicipios(): Promise<Array<{id: number; descricao: string}>> {
    try {
      // Usar limite alto para carregar todos os municípios (seguindo padrão do LocationInput)
      const response = await this.backendApi.get('/tipo-municipio', {
        params: {
          limit: 1000, // Limite usado no LocationInput
          orderBy: 'descricao',
          orderDir: 'asc'
        }
      });
      const data = response.data?.data || response.data || [];
      console.log(`✅ Carregados ${data.length} municípios`);
      return data.map((mun: any) => ({
        id: mun.idtipo_municipio,
        descricao: mun.descricao
      }));
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      return [];
    }
  }

  async getMunicipiosPorEstado(estadoId: number): Promise<Array<{id: number; descricao: string}>> {
    try {
      // Buscar municípios filtrados por estado (seguindo padrão do LocationInput)
      const response = await this.backendApi.get('/tipo-municipio', {
        params: {
          tipo_estado_idtipo_estado: estadoId, // Parâmetro correto usado no LocationInput
          limit: 1000,
          orderBy: 'descricao',
          orderDir: 'asc'
        }
      });
      const data = response.data?.data || response.data || [];
      console.log(`✅ Carregados ${data.length} municípios para estado ${estadoId}`);
      return data.map((mun: any) => ({
        id: mun.idtipo_municipio,
        descricao: mun.descricao
      }));
    } catch (error) {
      console.error('Erro ao buscar municípios por estado:', error);
      return [];
    }
  }

  async getEstados(): Promise<Array<{id: number; descricao: string}>> {
    try {
      // Carregar todos os estados (seguindo padrão do LocationInput)
      const response = await this.backendApi.get('/tipo-estado', {
        params: {
          limit: 1000, // Limite para todos os estados
          orderBy: 'descricao',
          orderDir: 'asc'
        }
      });
      const data = response.data?.data || response.data || [];
      console.log(`✅ Carregados ${data.length} estados`);
      return data.map((est: any) => ({
        id: est.idtipo_estado,
        descricao: est.descricao
      }));
    } catch (error) {
      console.error('Erro ao buscar estados:', error);
      return [];
    }
  }

  /**
   * Verificar se usuário pode fazer operações administrativas
   */
  async verificarPermissaoAdmin(userId: string): Promise<boolean> {
    try {
      const response = await this.backendApi.get(`/usuario-acesso/verificar-admin/${userId}`);
      return response.data?.isAdmin || false;
    } catch (error) {
      console.error('Erro ao verificar permissão admin:', error);
      return false;
    }
  }

  /**
   * Extrair mensagem de erro amigável
   */
  private getErrorMessage(error: any, fallback: string): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return fallback;
  }

  // ========== MÉTODOS DE FILTRAGEM HIERÁRQUICA ==========

  /**
   * Buscar estabelecimento por ID com dados hierárquicos
   */
  async getEstabelecimentoComHierarquia(id: number) {
    try {
      const response = await axios.get(`${BACKEND_API_URL}/api/estabelecimentos/${id}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estabelecimento com hierarquia:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar estabelecimento'));
    }
  }

  /**
   * Buscar estabelecimentos por município
   */
  async getEstabelecimentosPorMunicipio(municipioId: number) {
    try {
      const response = await axios.get(`${BACKEND_API_URL}/api/estabelecimentos/municipio/${municipioId}`, {
        withCredentials: true
      });
      // Formatar para o padrão esperado pelo frontend
      return response.data.map((est: any) => ({
        id: est.idestabelecimento,
        nome: est.nome || `Estabelecimento ${est.cnes}` // Fallback para nome vazio
      }));
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos por município:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar estabelecimentos'));
    }
  }

  /**
   * Buscar estabelecimentos por estado
   */
  async getEstabelecimentosPorEstado(estadoId: number) {
    try {
      const response = await axios.get(`${BACKEND_API_URL}/api/estabelecimentos/estado/${estadoId}`, {
        withCredentials: true
      });
      // Formatar para o padrão esperado pelo frontend
      return response.data.map((est: any) => ({
        id: est.idestabelecimento,
        nome: est.nome || `Estabelecimento ${est.cnes}` // Fallback para nome vazio
      }));
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos por estado:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar estabelecimentos'));
    }
  }

  /**
   * Buscar município por ID com estado
   */
  async getMunicipioComEstado(municipioId: number) {
    try {
      const response = await axios.get(`${BACKEND_API_URL}/api/municipios/${municipioId}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar município com estado:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar município'));
    }
  }
}

export const usuarioGestaoService = new UsuarioGestaoService();
export default usuarioGestaoService;

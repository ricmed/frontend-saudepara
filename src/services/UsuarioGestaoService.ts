import axios from 'axios';
import useFilteredRequests from '@/hooks/useFilteredRequests';

// Configurações das APIs
const KEYCLOAK_API_URL = '/api-auth'; // Usar proxy do Vite
const BACKEND_API_URL = ''; // Usar proxy do Vite (apenas se o backend estiver em porta diferente)

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
      console.log('🔄 Fazendo requisição para /admin/users...');
      const response = await this.keycloakApi.get('/admin/users');
      console.log('📡 Resposta recebida:', {
        status: response.status,
        dataLength: Array.isArray(response.data) ? response.data.length : 'não é array',
        data: response.data
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao carregar usuários'));
    }
  }

  /**
   * Criar novo usuário no Keycloak
   */
  async createUsuario(userData: CreateUsuarioRequest): Promise<string | null> {
    try {
      console.log('🚀 Tentando criar usuário:', userData);
      const response = await this.keycloakApi.post('/admin/users', userData);
      
      console.log('📊 Resposta da criação:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      let userId: string | null = null;
      
      // Primeiro, verificar se a API intermediária retornou o userId no JSON
      if (response.data && response.data.userId) {
        userId = response.data.userId;
        console.log('✅ Usuário criado com ID retornado pela API intermediária:', userId);
        return userId;
      }
      
      // Fallback: tentar extrair do header Location (se disponível)
      if (response.status === 201 && response.headers.location) {
        const locationMatch = response.headers.location.match(/\/admin\/users\/([^\/]+)$/);
        console.log('🔍 Location header:', response.headers.location);
        console.log('🔍 Regex match:', locationMatch);
        if (locationMatch) {
          userId = locationMatch[1];
          console.log('✅ Usuário criado com ID extraído do Location:', userId);
          return userId;
        }
      }
      
      // Fallback: buscar por username se não conseguir extrair o ID
      if (userData.username) {
        console.log('🔄 Tentando buscar usuário por username:', userData.username);
        try {
          const usuarios = await this.keycloakApi.get('/admin/users', {
            params: { username: userData.username, exact: true }
          });
          
          console.log('🔍 Resultado da busca:', usuarios.data);
          
          if (usuarios.data && usuarios.data.length > 0) {
            userId = usuarios.data[0].id;
            console.log('✅ Usuário criado, ID encontrado via busca:', userId);
            return userId;
          }
        } catch (searchError) {
          console.warn('⚠️ Aviso: não foi possível buscar o usuário criado:', searchError);
        }
      }
      
      console.warn('❌ Usuário criado, mas não foi possível obter o ID');
      return null;
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
   * Atualizar dados do usuário no Keycloak
   */
  async updateUsuario(userId: string, userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    enabled?: boolean;
  }): Promise<void> {
    try {
      console.log('Atualizando usuário via API:', userId, userData);
      await this.keycloakApi.put(`/admin/users/${userId}`, userData);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao atualizar usuário'));
    }
  }

  /**
   * Resetar senha do usuário
   */
  async resetarSenhaUsuario(userId: string, novaSenha: string): Promise<void> {
    try {
      await this.keycloakApi.put(`/admin/users/${userId}/reset-password`, {
        type: 'password',
        value: novaSenha,
        temporary: false
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
      console.log('🔑 URL da API para busca de acesso do usuário:', `/usuario-acesso/user/${userId}`);
      const response = await this.backendApi.get(`/usuario-acesso/user/${userId}`);
      console.log('✅ Dados de acesso do usuário:', response.data);
      
      // A API retorna { status: "success", data: [] }, então extrair apenas os dados
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // Se a resposta for diretamente um array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Se não houver dados, retornar array vazio
      return [];
      
    } catch (error: any) {
      console.error('Erro ao buscar acessos do usuário:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao carregar acessos do usuário'));
    }
  }

  /**
   * Deletar todos os acessos de um usuário (para atualização)
   */
  async deleteUserAccess(userId: string): Promise<void> {
    try {
      console.log('🗑️ Deletando acessos do usuário:', userId);
      await this.backendApi.delete(`/usuario-acesso/user/${userId}`);
      console.log('✅ Acessos do usuário deletados');
    } catch (error: any) {
      console.error('Erro ao deletar acessos do usuário:', error);
      // Não lançar erro se o usuário não tiver acessos (404) ou endpoint não existir
      if (error.response?.status === 404) {
        console.log('ℹ️ Nenhum acesso existente para deletar ou endpoint não disponível');
      } else {
        throw new Error(this.getErrorMessage(error, 'Erro ao deletar acessos do usuário'));
      }
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
      
      // Normalizar paginação: backend usa 'pagination', frontend espera 'meta'
      const { data, pagination } = response.data;
      return {
        data,
        meta: {
          total: pagination.total,
          totalPages: pagination.pages,
          page: pagination.currentPage,
          limit: pagination.perPage
        }
      };
    } catch (error: any) {
      console.error('Erro ao buscar todos os acessos:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao carregar acessos'));
    }
  }

  /**
   * Criar acesso para unidade
   */
  async createAcessoUnidade(userId: string, estabelecimentoId: number, permissoes: number = PERMISSOES.READ_WRITE, municipioId?: number, estadoId?: number): Promise<UsuarioAcesso> {
    try {
      console.log('🔧 UsuarioGestaoService.createAcessoUnidade chamado com:', {
        userId,
        estabelecimentoId,
        municipioId,
        estadoId,
        permissoes
      });
      
      // Validação básica dos parâmetros obrigatórios
      if (!userId) {
        throw new Error('userId é obrigatório');
      }
      
      if (!estabelecimentoId || isNaN(estabelecimentoId)) {
        throw new Error('estabelecimentoId é obrigatório e deve ser um número válido');
      }
      
      const payload: any = {
        userId,
        estabelecimentoId,
        permissoes
      };
      
      console.log('🔍 Valores antes da validação:', {
        municipioId, 
        estadoId, 
        'typeof municipioId': typeof municipioId,
        'typeof estadoId': typeof estadoId,
        'municipioId == null': municipioId == null,
        'estadoId == null': estadoId == null
      });
      
      // Adicionar município e estado se fornecidos
      if (municipioId) {
        payload.municipioId = municipioId;
        console.log('✅ MunicipioId adicionado ao payload:', municipioId);
      } else {
        console.log('❌ MunicipioId NÃO adicionado - valor:', municipioId);
      }
      
      if (estadoId) {
        payload.estadoId = estadoId;
        console.log('✅ EstadoId adicionado ao payload:', estadoId);
      } else {
        console.log('❌ EstadoId NÃO adicionado - valor:', estadoId);
      }
      
      console.log('📤 Payload final sendo enviado:', payload);
      
      const response = await this.backendApi.post('/usuario-acesso/unidade', payload);
      
      console.log('✅ Acesso de unidade criado com sucesso:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar acesso à unidade:', error);
      console.error('  - Dados enviados:', { userId, estabelecimentoId, municipioId, estadoId, permissoes });
      throw new Error(this.getErrorMessage(error, 'Erro ao criar acesso à unidade'));
    }
  }

  /**
   * Criar acesso para município
   */
  async createAcessoMunicipio(userId: string, municipioId: number, permissoes: number = PERMISSOES.READ_WRITE): Promise<UsuarioAcesso> {
    try {
      console.log('🔧 UsuarioGestaoService.createAcessoMunicipio chamado com:', {
        userId,
        municipioId,
        permissoes
      });
      
      const response = await this.backendApi.post('/usuario-acesso/municipio', {
        userId,
        municipioId,
        permissoes
      });
      
      console.log('✅ Acesso de município criado com sucesso:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar acesso ao município:', error);
      console.error('  - Dados enviados:', { userId, municipioId, permissoes });
      throw new Error(this.getErrorMessage(error, 'Erro ao criar acesso ao município'));
    }
  }

  /**
   * Criar acesso para estado
   */
  async createAcessoEstado(userId: string, estadoId: number, permissoes: number = PERMISSOES.ALL): Promise<UsuarioAcesso> {
    try {
      console.log('🔧 UsuarioGestaoService.createAcessoEstado chamado com:', {
        userId,
        estadoId,
        permissoes
      });
      
      const response = await this.backendApi.post('/usuario-acesso/estado', {
        userId,
        estadoId,
        permissoes
      });
      
      console.log('✅ Acesso de estado criado com sucesso:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar acesso ao estado:', error);
      console.error('  - Dados enviados:', { userId, estadoId, permissoes });
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
   * Buscar opções para dropdowns - usando o mesmo padrão do UnidadeNotificadoraField
   */
  // Método para buscar estabelecimentos com filtro por usuário
  async getEstabelecimentosFiltrados(userPermissions?: any): Promise<Array<{id: number; nome: string; cnes?: string}>> {
    try {
      let apiUrl = `${BACKEND_API_URL}/api/estabelecimentos`;
      const params: any = {
        limit: 1000,
        ativo: 'S'
      };

      // Aplicar filtros baseado no nível de acesso do usuário
      if (userPermissions?.isEstabelecimento && userPermissions.estabelecimentoId) {
        // Usuário de estabelecimento só vê seu próprio estabelecimento
        apiUrl = `${BACKEND_API_URL}/api/estabelecimentos/${userPermissions.estabelecimentoId}`;
      } else if (userPermissions?.isMunicipio && userPermissions.municipioId) {
        // Usuário de município só vê estabelecimentos do seu município
        params.municipio_id = userPermissions.municipioId;
      } else if (userPermissions?.isEstado && userPermissions.estadoId) {
        // Usuário de estado só vê estabelecimentos do seu estado
        params.estado_id = userPermissions.estadoId;
      }

      console.log('🏥 URL da API para busca de estabelecimentos filtrados:', apiUrl, params);
      
      const response = await axios.get(apiUrl, {
        params: apiUrl.includes('/estabelecimentos/') ? undefined : params,
        headers: { 'Accept': 'application/json' },
        withCredentials: true
      });
      
      let data = response.data?.data || response.data || [];
      
      // Se é busca por ID específico, transformar em array
      if (apiUrl.includes('/estabelecimentos/') && !Array.isArray(data)) {
        data = [data];
      }
      
      console.log(`✅ Carregados ${data.length} estabelecimentos filtrados`);
      return data.map((est: any) => ({
        id: est.idestabelecimento,
        nome: est.nome,
        cnes: est.cnes || undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos filtrados:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar estabelecimentos'));
    }
  }

  async getEstabelecimentos(): Promise<Array<{id: number; nome: string; cnes?: string}>> {
    try {
      // Usar axios diretamente como no UnidadeNotificadoraField que funciona
      const apiUrl = `${BACKEND_API_URL}/api/estabelecimentos`;
      console.log('🌐 URL da API para busca de estabelecimentos:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        params: {
          limit: 11000, // Limite alto para carregar todos
          ativo: 'S',   // Apenas estabelecimentos ativos
          orderBy: 'nome',
          orderDir: 'asc'
        },
        headers: {
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('Resposta da API de estabelecimentos:', response);
      
      let estabelecimentosAtivos: any[] = [];
      
      // A resposta do backend tem formato { data: [...], pagination: {...} }
      if (response && response.data && response.data.data) {
        estabelecimentosAtivos = response.data.data.filter((est: any) => 
          est.ativo === 'S'
        );
      } else if (response && response.data && Array.isArray(response.data)) {
        // Caso a API retorne diretamente um array
        estabelecimentosAtivos = response.data.filter((est: any) => 
          est.ativo === 'S'
        );
      }
      
      console.log(`✅ Carregados ${estabelecimentosAtivos.length} estabelecimentos ativos`);
      
      return estabelecimentosAtivos.map((est: any) => ({
        id: est.idestabelecimento,
        nome: est.nome,
        cnes: est.cnes || undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar estabelecimentos'));
    }
  }

  async getMunicipios(): Promise<Array<{id: number; descricao: string}>> {
    try {
      // Usar axios diretamente como no padrão que funciona
      const apiUrl = `${BACKEND_API_URL}/api/tipo-municipio`;
      console.log('🌐 URL da API para busca de municípios:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        params: {
          limit: 20000, // Limite aumentado para carregar TODOS os municípios
          orderBy: 'descricao',
          orderDir: 'asc'
        },
        headers: {
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      const data = response.data?.data || response.data || [];
      console.log(`✅ Carregados ${data.length} municípios`);
      return data.map((mun: any) => ({
        id: mun.idtipo_municipio,
        descricao: mun.descricao
      }));
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar municípios'));
    }
  }

  async getMunicipiosPorEstado(estadoId: number): Promise<Array<{id: number; descricao: string}>> {
    try {
      // Usar axios diretamente e o endpoint correto que funciona
      const apiUrl = `${BACKEND_API_URL}/api/municipios/estado/${estadoId}`;
      console.log('🌐 URL da API para busca de municípios por estado:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      // A resposta já vem no formato correto do novo endpoint
      const data = response.data || [];
      console.log(`✅ Carregados ${data.length} municípios para estado ${estadoId}`);
      return data.map((mun: any) => ({
        id: mun.id || mun.idtipo_municipio,
        descricao: mun.descricao
      }));
    } catch (error) {
      console.error('Erro ao buscar municípios por estado:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar municípios por estado'));
    }
  }

  async getEstados(): Promise<Array<{id: number; descricao: string}>> {
    try {
      // Usar axios diretamente como no padrão que funciona
      const apiUrl = `${BACKEND_API_URL}/api/tipo-estado`;
      console.log('🌐 URL da API para busca de estados:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        params: {
          limit: 1000, // Limite para todos os estados
          orderBy: 'descricao',
          orderDir: 'asc'
        },
        headers: {
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      const data = response.data?.data || response.data || [];
      console.log(`✅ Carregados ${data.length} estados`);
      return data.map((est: any) => ({
        id: est.idtipo_estado,
        descricao: est.descricao
      }));
    } catch (error) {
      console.error('Erro ao buscar estados:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar estados'));
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

  // ========== MÉTODOS DE DADOS GEOGRÁFICOS ==========

  /**
   * 🚀 Buscar toda a hierarquia (estados, municípios, estabelecimentos) de forma otimizada
   * Este método usa o endpoint /api/hierarquia/slim que retorna tudo em uma única requisição
   * com mapeamento correto de relacionamentos para filtros instantâneos em memória
   */
  async getHierarquiaCompleta(): Promise<{
    estados: Array<{id: number; sigla: string; descricao: string}>;
    municipios: Array<{id: number; descricao: string; estadoId: number}>;
    estabelecimentos: Array<{id: number; nome: string; cnes?: string; municipioId: number; estadoId: number}>;
  }> {
    try {
      console.log('🏗️ Carregando hierarquia completa (método otimizado)...');
      
      const apiUrl = `${BACKEND_API_URL}/api/hierarquia/slim`;
      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      const data = response.data;
      
      console.log('✅ Hierarquia completa carregada:', {
        estados: data.estados.length,
        municipios: data.municipios.length,
        estabelecimentos: data.estabelecimentos.length
      });
      
      return data;
    } catch (error) {
      console.warn('⚠️ Endpoint slim não disponível, usando métodos individuais como fallback...');
      
      // Fallback: usar os métodos individuais existentes
      try {
        const [estados, municipios, estabelecimentos] = await Promise.all([
          this.getEstados(),
          this.getMunicipios(),
          this.getEstabelecimentos()
        ]);
        
        // Converter para o formato esperado (sem mapeamento de relacionamentos)
        return {
          estados: estados.map(e => ({ ...e, sigla: '' })), // sigla não disponível no fallback
          municipios: municipios.map(m => ({ ...m, estadoId: 0 })), // estadoId não disponível no fallback
          estabelecimentos: estabelecimentos.map(est => ({ 
            id: est.id, 
            nome: est.nome, 
            cnes: est.cnes,
            municipioId: 0, // relacionamentos não disponíveis no fallback
            estadoId: 0
          }))
        };
      } catch (fallbackError) {
        console.error('❌ Erro no fallback para hierarquia:', fallbackError);
        throw new Error(this.getErrorMessage(fallbackError, 'Erro ao carregar dados geográficos'));
      }
    }
  }

  // ========== MÉTODOS DE FILTRAGEM HIERÁRQUICA ==========

  /**
   * Buscar estabelecimento por ID com dados hierárquicos
   */
  async getEstabelecimentoComHierarquia(id: number) {
    try {
      const apiUrl = `${BACKEND_API_URL}/api/estabelecimentos/${id}`;
      console.log('🌐 URL da API para busca de estabelecimento com hierarquia:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json'
        },
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
      const apiUrl = `${BACKEND_API_URL}/api/estabelecimentos/municipio/${municipioId}`;
      console.log('🌐 URL da API para busca de estabelecimentos por município:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      // Formatar para o padrão esperado pelo frontend
      return response.data.map((est: any) => ({
        id: est.idestabelecimento,
        nome: est.nome || `Estabelecimento ${est.cnes}`, // Fallback para nome vazio
        cnes: est.cnes || undefined
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
      const apiUrl = `${BACKEND_API_URL}/api/estabelecimentos/estado/${estadoId}`;
      console.log('🌐 URL da API para busca de estabelecimentos por estado:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      // Formatar para o padrão esperado pelo frontend
      return response.data.map((est: any) => ({
        id: est.idestabelecimento,
        nome: est.nome || `Estabelecimento ${est.cnes}`, // Fallback para nome vazio
        cnes: est.cnes || undefined
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
      const apiUrl = `${BACKEND_API_URL}/api/municipios/${municipioId}`;
      console.log('🌐 URL da API para busca de município com estado:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar município com estado:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar município'));
    }
  }

  // Método para obter dados de acesso do usuário (usuario_acesso)
  async getUserAccess(userId?: string): Promise<any> {
    try {
      const apiUrl = userId
        ? `${BACKEND_API_URL}/api/usuario-acesso/user/${userId}`
        : `${BACKEND_API_URL}/api/usuario-acesso/current`;
      
      console.log('🔑 URL da API para busca de acesso do usuário:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: { 'Accept': 'application/json' },
        withCredentials: true
      });
      
      const payload = response.data?.data ?? response.data;
      console.log('✅ Dados de acesso do usuário (payload):', payload);
      
      // Pega o primeiro se vier lista
      const acesso = Array.isArray(payload) ? payload[0] : payload;
      console.log('✅ Dados de acesso processados:', acesso);
      
      return {
        estabelecimentoId: acesso?.estabelecimento_id ?? acesso?.estabelecimentoId ?? null,
        municipioId: acesso?.tipo_municipio_id ?? acesso?.municipioId ?? null,
        estadoId: acesso?.tipo_estado_id ?? acesso?.estadoId ?? null,
        nivel: acesso?.nivel_acesso ?? acesso?.nivel ?? 'unidade',
        isEstabelecimento: (acesso?.nivel_acesso ?? acesso?.nivel) === 'unidade',
        isMunicipio: (acesso?.nivel_acesso ?? acesso?.nivel) === 'municipio',
        isEstado: (acesso?.nivel_acesso ?? acesso?.nivel) === 'estado',
      };
    } catch (error) {
      console.warn('Aviso: não foi possível buscar dados de acesso do usuário:', error);
      return null;
    }
  }

  // Método para buscar comunicados filtrados por usuário
  async getComunicadosFiltrados(userPermissions?: any): Promise<any[]> {
    try {
      const apiUrl = `${BACKEND_API_URL}/api/comunicacao-realizada`;
      const params: any = {
        limit: 1000,
        orderBy: 'data_criacao',
        orderDir: 'desc'
      };

      // Aplicar filtros baseado no nível de acesso do usuário
      if (userPermissions?.isEstabelecimento && userPermissions.estabelecimentoId) {
        params.estabelecimento_id = userPermissions.estabelecimentoId;
      } else if (userPermissions?.isMunicipio && userPermissions.municipioId) {
        params.municipio_id = userPermissions.municipioId;
      } else if (userPermissions?.isEstado && userPermissions.estadoId) {
        params.estado_id = userPermissions.estadoId;
      }

      console.log('📢 URL da API para busca de comunicados filtrados:', apiUrl, params);
      
      const response = await axios.get(apiUrl, {
        params,
        headers: { 'Accept': 'application/json' },
        withCredentials: true
      });
      
      const data = response.data?.data || response.data || [];
      console.log(`✅ Carregados ${data.length} comunicados filtrados`);
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar comunicados filtrados:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar comunicados'));
    }
  }

  // Método para buscar eventos filtrados por usuário
  async getEventosFiltrados(userPermissions?: any): Promise<any[]> {
    try {
      const apiUrl = `${BACKEND_API_URL}/api/eventos`;
      const params: any = {
        limit: 1000,
        orderBy: 'data_criacao',
        orderDir: 'desc'
      };

      // Aplicar filtros baseado no nível de acesso do usuário
      if (userPermissions?.isEstabelecimento && userPermissions.estabelecimentoId) {
        params.estabelecimento_id = userPermissions.estabelecimentoId;
      } else if (userPermissions?.isMunicipio && userPermissions.municipioId) {
        params.municipio_id = userPermissions.municipioId;
      } else if (userPermissions?.isEstado && userPermissions.estadoId) {
        params.estado_id = userPermissions.estadoId;
      }

      console.log('📅 URL da API para busca de eventos filtrados:', apiUrl, params);
      
      const response = await axios.get(apiUrl, {
        params,
        headers: { 'Accept': 'application/json' },
        withCredentials: true
      });
      
      const data = response.data?.data || response.data || [];
      console.log(`✅ Carregados ${data.length} eventos filtrados`);
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar eventos filtrados:', error);
      throw new Error(this.getErrorMessage(error, 'Erro ao buscar eventos'));
    }
  }
}

export const usuarioGestaoService = new UsuarioGestaoService();
export default usuarioGestaoService;

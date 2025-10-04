import { PacienteService, Paciente, OptionItem, PaginatedResponse } from '@/services/PacienteService';
import indexedDBService from './indexedDB';
import syncService from './syncService';
import { toast } from 'react-toastify';

/**
 * Versão do PacienteService com suporte para operações offline
 * Implementa os mesmos métodos do serviço original
 */
export const OfflinePacienteService = {
  // Função auxiliar para logs
  logObject(title: string, obj: any) {
    PacienteService.logObject(title, obj);
  },

  /**
   * Método genérico para buscar opções com suporte offline
   */
  async getOptionsWithOfflineSupport<T>(
    serviceFn: () => Promise<T[]>,
    cacheKey: string
  ): Promise<T[]> {
    // Tentar buscar do cache primeiro
    try {
      const cachedData = await indexedDBService.getOpcoes(cacheKey);
      if (cachedData) {
        console.log(`Usando dados em cache para ${cacheKey}`);
        return cachedData as T[];
      }
    } catch (e) {
      console.error(`Erro ao buscar ${cacheKey} do cache:`, e);
    }

    // Se não tem cache e está online, busca da API
    if (syncService.isNetworkAvailable()) {
      try {
        const apiData = await serviceFn();
        
        // Salvar no cache para uso offline
        if (apiData && apiData.length > 0) {
          await indexedDBService.saveOpcoes(cacheKey, apiData);
        }
        
        return apiData;
      } catch (error) {
        console.error(`Erro ao buscar ${cacheKey} da API:`, error);
        
        // Se falhou, tenta o cache novamente
        const cachedData = await indexedDBService.getOpcoes(cacheKey);
        if (cachedData) {
          toast.warning(`Usando dados em cache para ${cacheKey} devido a erro na API`);
          return cachedData as T[];
        }
        
        throw error;
      }
    } else {
      // Se está offline, busca apenas do cache
      const cachedData = await indexedDBService.getOpcoes(cacheKey);
      if (cachedData) {
        toast.info(`Modo offline: usando dados em cache para ${cacheKey}`);
        return cachedData as T[];
      }
      
      // Se não tem cache e está offline, retorna array vazio
      console.warn(`Não há dados em cache para ${cacheKey} e está offline`);
      return [] as T[];
    }
  },

  /**
   * Obter todos os pacientes paginados
   */
  async getAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Paciente>> {
    if (!syncService.isNetworkAvailable()) {
      toast.warning('Você está offline. Não é possível carregar a lista completa de pacientes.');
      return {
        data: [],
        pagination: {
          total: 0,
          pages: 1,
          currentPage: page,
          perPage: limit
        }
      };
    }
    
    return PacienteService.getAll(page, limit);
  },

  /**
   * Buscar paciente por ID com suporte offline
   */
  async getById(id: number): Promise<Paciente> {
    // Se offline, buscar do cache local
    if (!syncService.isNetworkAvailable()) {
      const paciente = await indexedDBService.getPaciente(id);
      if (paciente) {
        toast.info('Você está offline. Carregando dados locais do paciente.');
        return paciente;
      }
      
      toast.warning('Você está offline e este paciente não está disponível localmente.');
      throw new Error('Paciente não disponível offline');
    }
    
    // Se online, buscar da API e atualizar cache
    try {
      const paciente = await PacienteService.getById(id);
      
      // Salvar no cache para acesso offline futuro
      if (paciente) {
        await indexedDBService.savePaciente(paciente);
      }
      
      return paciente;
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      
      // Tentar buscar do cache como fallback
      const paciente = await indexedDBService.getPaciente(id);
      if (paciente) {
        toast.warning('Erro ao buscar do servidor. Usando dados em cache.');
        return paciente;
      }
      
      throw error;
    }
  },

  /**
   * Buscar pacientes por termo
   */
  async search(query: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Paciente>> {
    if (!query || query.length < 3) {
      throw new Error('Digite pelo menos 3 caracteres para realizar a busca');
    }
    
    // Se offline, buscar do cache local
    if (!syncService.isNetworkAvailable()) {
      try {
        const pacientes = await indexedDBService.searchPacientes(query);
        toast.info('Você está offline. Buscando em dados locais.');
        
        // Simular paginação local
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = pacientes.slice(startIndex, endIndex);
        
        return {
          data: paginatedData,
          pagination: {
            total: pacientes.length,
            pages: Math.ceil(pacientes.length / limit),
            currentPage: page,
            perPage: limit
          }
        };
      } catch (error) {
        console.error('Erro ao buscar pacientes localmente:', error);
        throw new Error('Não foi possível buscar pacientes no modo offline');
      }
    }
    
    // Se online, usar o serviço original
    try {
      const result = await PacienteService.search(query, page, limit);
      
      // Armazenar os resultados no cache
      for (const paciente of result.data) {
        await indexedDBService.savePaciente(paciente);
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      throw error;
    }
  },

  /**
   * Buscar pacientes pelo nome (método especial para o componente de formulário)
   */
  async searchByName(name: string): Promise<Paciente[]> {
    if (name.length < 3) return [];
    
    // Se offline, buscar do cache local
    if (!syncService.isNetworkAvailable()) {
      const pacientes = await indexedDBService.searchPacientes(name);
      toast.info('Você está offline. Buscando pacientes armazenados localmente.');
      return pacientes;
    }
    
    // Se online, fazer pesquisa e salvar resultados
    try {
      const result = await PacienteService.search(name, 1, 50);
      
      // Salvar cada paciente no cache
      for (const paciente of result.data) {
        await indexedDBService.savePaciente(paciente);
      }
      
      return result.data;
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      
      // Tentar buscar do cache como fallback
      const pacientes = await indexedDBService.searchPacientes(name);
      if (pacientes.length > 0) {
        toast.warning('Erro ao buscar do servidor. Usando dados em cache.');
        return pacientes;
      }
      
      return [];
    }
  },

  /**
   * Obter lista simplificada para select/dropdown
   */
  async getAllForSelect(): Promise<any[]> {
    try {
      // Verificar cache primeiro
      const cachedData = await indexedDBService.getOpcoes('pacientesSelect');
      
      // Se offline e temos cache, usar o cache
      if (!syncService.isNetworkAvailable() && cachedData) {
        toast.info('Você está offline. Usando lista de pacientes em cache.');
        return cachedData;
      }
      
      // Se online, buscar nova lista e atualizar cache
      if (syncService.isNetworkAvailable()) {
        try {
          const pacientes = await PacienteService.getAllForSelect();
          
          // Salvar no cache para uso offline futuro
          if (pacientes.length > 0) {
            await indexedDBService.saveOpcoes('pacientesSelect', pacientes);
          }
          
          return pacientes;
        } catch (error) {
          console.error('Erro ao buscar lista de pacientes:', error);
          
          // Se temos cache, usar como fallback
          if (cachedData) {
            toast.warning('Erro ao buscar do servidor. Usando dados em cache.');
            return cachedData;
          }
          
          throw error;
        }
      }
      
      // Se offline e não temos cache, retornar array vazio
      toast.warning('Você está offline e não há lista de pacientes em cache.');
      return [];
    } catch (error) {
      console.error('Erro ao buscar pacientes para seleção:', error);
      return [];
    }
  },

  /**
   * Criar paciente com suporte offline
   */
  async create(data: Omit<Paciente, 'idpaciente'>): Promise<Paciente> {
    // Validações mínimas
    if (!data.nome || data.nome.trim() === '') {
      throw new Error('O nome do paciente é obrigatório');
    }
    
    if (!data.data_nascimento) {
      throw new Error('A data de nascimento é obrigatória');
    }
    
    // ✅ CORRIGIDO: Remover validação obrigatória para gênero e raça
    // if (!data.tipo_genero_idtipo_genero) {
    //   throw new Error('O tipo de gênero é obrigatório');
    // }
    
    // if (!data.tipo_raca_idtipo_raca) {
    //   throw new Error('O tipo de raça é obrigatório');
    // }
    
    // Formatação da data se necessário
    const formattedData = {
      ...data,
      // Garantir que null seja enviado em vez de strings vazias, mas preservar valores válidos
      nome_mae: data.nome_mae?.trim() || null,
      cpf: data.cpf?.trim() || null,
      gestante: data.gestante?.trim() || null,
      contato: data.contato?.trim() || null,
    };
    
    // ✅ DEBUG: Log dos dados do paciente sendo salvos offline
    console.log('🔍 DEBUG OfflinePacienteServiceProxy.create - Dados originais:', {
      gestante: data.gestante,
      gestante_tipo: typeof data.gestante,
      idade: data.idade,
      idade_tipo: typeof data.idade
    });
    console.log('🔍 DEBUG OfflinePacienteServiceProxy.create - Dados formatados:', {
      gestante: formattedData.gestante,
      gestante_tipo: typeof formattedData.gestante,
      idade: formattedData.idade,
      idade_tipo: typeof formattedData.idade
    });
    
    // Gera um ID temporário negativo para identificar pacientes não sincronizados
    const tempId = -Date.now();
    const pacienteWithTempId = { ...formattedData, idpaciente: tempId };
    
    // Sempre salvar localmente primeiro
    await indexedDBService.savePaciente(pacienteWithTempId);
    
    // Se offline, retornar com ID temporário
    if (!syncService.isNetworkAvailable()) {
      toast.info('Você está offline. Paciente salvo localmente e será sincronizado quando houver conexão.');
      return pacienteWithTempId;
    }
    
    // Se online, tentar criar no servidor
    try {
      const createdPaciente = await PacienteService.create(formattedData);
      
      // Salvar o paciente com ID real no cache, substituindo o temporário
      await indexedDBService.savePaciente(createdPaciente);
      
      // Sincronizar notificações pendentes que possam usar este paciente
      syncService.forceSyncData();
      
      return createdPaciente;
    } catch (error) {
      console.error('Erro ao criar paciente no servidor:', error);
      toast.warning('Não foi possível criar paciente no servidor. Dados salvos localmente.');
      return pacienteWithTempId;
    }
  },

  /**
   * Atualizar paciente com suporte offline
   */
  async update(id: number, data: Partial<Paciente>): Promise<Paciente> {
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
    
    // Paciente completo com ID
    const pacienteWithId = { ...formattedData, idpaciente: id };
    
    // Sempre salvar localmente primeiro
    await indexedDBService.savePaciente(pacienteWithId);
    
    // Se offline, retornar e notificar
    if (!syncService.isNetworkAvailable()) {
      toast.info('Você está offline. Alterações salvas localmente e serão sincronizadas quando houver conexão.');
      return pacienteWithId;
    }
    
    // Se online, tentar atualizar no servidor
    try {
      const updatedPaciente = await PacienteService.update(id, formattedData);
      
      // Atualizar o cache com os dados atualizados do servidor
      await indexedDBService.savePaciente(updatedPaciente);
      
      return updatedPaciente;
    } catch (error) {
      console.error('Erro ao atualizar paciente no servidor:', error);
      toast.warning('Não foi possível atualizar paciente no servidor. Alterações salvas localmente.');
      return pacienteWithId;
    }
  },

  /**
   * Limpar campos opcionais específicos
   */
  async clearOptionalFields(id: number, fields: string[]): Promise<Paciente> {
    // Se offline, não permitir esta operação
    if (!syncService.isNetworkAvailable()) {
      toast.warning('Não é possível limpar campos específicos no modo offline.');
      throw new Error('Operação não disponível offline');
    }
    
    // Se online, usar o serviço original
    return PacienteService.clearOptionalFields(id, fields);
  },

  /**
   * Excluir paciente
   */
  async delete(id: number): Promise<void> {
    // Se offline, não permitir esta operação destrutiva
    if (!syncService.isNetworkAvailable()) {
      toast.warning('Não é possível excluir pacientes no modo offline.');
      throw new Error('Operação não disponível offline');
    }
    
    // Se online, usar o serviço original
    await PacienteService.delete(id);
    
    // Remover do cache local também
    try {
      // Implementar método para remover paciente do IndexedDB
      // indexedDBService.removePaciente(id);
    } catch (error) {
      console.error('Erro ao remover paciente do cache local:', error);
    }
  },

  /**
   * Verificar disponibilidade de CPF
   */
  async checkCpfAvailable(cpf: string, excludeId?: number): Promise<boolean> {
    // Se offline, assumir que está disponível para não bloquear o usuário
    if (!syncService.isNetworkAvailable()) {
      toast.warning('Não é possível verificar disponibilidade de CPF no modo offline.');
      return true;
    }
    
    // Se online, usar o serviço original
    return PacienteService.checkCpfAvailable(cpf, excludeId);
  },

  /**
   * Buscar tipos de gênero com suporte offline
   */
  async getTiposGenero(): Promise<OptionItem[]> {
    return this.getOptionsWithOfflineSupport(
      PacienteService.getTiposGenero,
      'generos'
    );
  },

  /**
   * Buscar tipos de raça com suporte offline
   */
  async getTiposRaca(): Promise<OptionItem[]> {
    return this.getOptionsWithOfflineSupport(
      PacienteService.getTiposRaca,
      'racas'
    );
  },

  /**
   * Buscar tipos de escolaridade com suporte offline
   */
  async getTiposEscolaridade(): Promise<OptionItem[]> {
    return this.getOptionsWithOfflineSupport(
      PacienteService.getTiposEscolaridade,
      'escolaridades'
    );
  },

  /**
   * Buscar CBOs (para integração com componentes existentes)
   */
  async searchCbo(term: string): Promise<OptionItem[]> {
    // Se não tiver termo ou for muito curto, retornar vazio
    if (!term || term.length < 2) return [];
    
    // Se offline, tentar buscar do cache
    if (!syncService.isNetworkAvailable()) {
      try {
        const cachedCbos = await indexedDBService.getOpcoes('cbos');
        if (cachedCbos) {
          // Filtrar CBOs que contenham o termo de busca
          const normalizedTerm = term.toUpperCase();
          const filteredCbos = cachedCbos.filter((cbo: any) => 
            cbo.descricao && typeof cbo.descricao === 'string' &&
            cbo.descricao.toUpperCase().includes(normalizedTerm)
          );
          return filteredCbos.slice(0, 20); // Limitar resultados
        }
      } catch (e) {
        console.error('Erro ao buscar CBOs do cache:', e);
      }
      
      toast.warning('Você está offline. Busca de profissões limitada ao cache disponível.');
      return [];
    }
    
    // Online - fazer requisição e adicionar ao cache
    try {
      // Assumindo que existe um método de busca de CBO no PacienteService
      // Se não existir, ajuste conforme necessário ou use axios diretamente
      const response = await fetch(`${import.meta.env.VITE_API_SERVER}:${import.meta.env.VITE_API_PORT}/api/cbo/search?query=${encodeURIComponent(term)}`);
      
      if (!response.ok) {
        throw new Error('Falha ao buscar CBOs');
      }
      
      const data = await response.json();
      const cbos = Array.isArray(data) ? data : (data.data || []);
      
      // Formatar os resultados de acordo com a estrutura OptionItem
      const formattedCbos = cbos.map((cbo: any) => ({
        id: cbo.idcbo || cbo.id,
        descricao: cbo.descricao || '',
        idcbo: cbo.idcbo || cbo.id
      }));
      
      // Atualizar cache parcialmente
      try {
        const existingCbos = await indexedDBService.getOpcoes('cbos') || [];
        
        // Adicionar novos CBOs ao cache sem duplicação
        const updatedCbos = [...existingCbos];
        
        formattedCbos.forEach((cbo: OptionItem) => {
          if (!updatedCbos.some((existing: any) => existing.id === cbo.id)) {
            updatedCbos.push(cbo);
          }
        });
        
        await indexedDBService.saveOpcoes('cbos', updatedCbos);
      } catch (cacheError) {
        console.error('Erro ao atualizar cache de CBOs:', cacheError);
      }
      
      return formattedCbos;
    } catch (error) {
      console.error('Erro ao buscar CBOs:', error);
      
      // Tentar buscar do cache como fallback
      try {
        const cachedCbos = await indexedDBService.getOpcoes('cbos');
        if (cachedCbos) {
          const normalizedTerm = term.toUpperCase();
          const filteredCbos = cachedCbos.filter((cbo: any) => 
            cbo.descricao && typeof cbo.descricao === 'string' &&
            cbo.descricao.toUpperCase().includes(normalizedTerm)
          );
          toast.warning('Erro ao buscar profissões do servidor. Usando dados em cache.');
          return filteredCbos.slice(0, 20);
        }
      } catch (cacheError) {
        console.error('Erro ao buscar CBOs do cache:', cacheError);
      }
      
      toast.error('Erro ao buscar profissões. Tente novamente.');
      return [];
    }
  }
};

export default OfflinePacienteService;
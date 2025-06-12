import indexedDBService from './indexedDB';
import { NotificacaoService } from '@/services/NotificacaoService';
import PacienteService from '@/services/PacienteService';
import { salvarNotificacaoCompleta } from '@/utils/notificacaoAdapter';
import { toast } from 'react-toastify';

class SyncService {
  private isOnline: boolean;
  private syncInterval: number | null = null;
  private isSyncing: boolean = false;

  constructor() {
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncData();
      
      // Notificar o usuário
      toast.success('Conexão de internet restaurada! Sincronizando dados...');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      
      // Notificar o usuário
      toast.info('Você está offline. Os dados serão salvos localmente.');
    });
  }

  // Iniciar verificação periódica
  startPeriodicSync(intervalMs = 60000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncData();
      }
    }, intervalMs);
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ✅ CORRIGIDO: Sincronizar apenas dados criados localmente
  async syncData() {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // ===== 1. SINCRONIZAR APENAS PACIENTES CRIADOS LOCALMENTE =====
      const unsyncedPacientes = await indexedDBService.getUnsyncedPacientes();
      const pacienteIdMapping: Map<number, number> = new Map();
      
      console.log(`🔄 Sincronizando ${unsyncedPacientes.length} pacientes criados localmente...`);
      
      // ✅ LOG: Verificar quais pacientes estão sendo sincronizados
      console.log('📋 Pacientes para sincronizar:', unsyncedPacientes.map(p => ({
        id: p.idpaciente,
        nome: p.nome,
        source: p.source,
        synced: p.synced
      })));
        
      for (const paciente of unsyncedPacientes) {
        try {
          console.log(`👤 Sincronizando paciente local: ${paciente.nome} (ID temp: ${paciente.idpaciente})`);
          
          // ✅ VERIFICAÇÃO EXTRA: Confirmar que é paciente criado localmente
          if (paciente.source !== 'local_creation' && paciente.source) {
            console.log(`⚠️ Pulando paciente ${paciente.nome} - source: ${paciente.source} (não é criação local)`);
            continue;
          }
          
          // ✅ REMOVER CAMPOS QUE NÃO DEVEM SER ENVIADOS
          const { idpaciente, synced, savedAt, syncedAt, savedOffline, source, ...pacienteData } = paciente;
          
          // ✅ VERIFICAR SE idpaciente EXISTE ANTES DE USAR
          if (!idpaciente) {
            console.error(`❌ Paciente ${paciente.nome} não tem ID válido, pulando...`);
            errorCount++;
            continue;
          }
          
          console.log(`📤 Enviando paciente para servidor:`, {
            nome: pacienteData.nome,
            cpf: pacienteData.cpf,
            source_original: paciente.source
          });
          
          // Criar paciente no servidor
          const result = await PacienteService.create(pacienteData);
          const newPatientId = result.idpaciente;
          
          // ✅ VERIFICAR SE newPatientId EXISTE
          if (!newPatientId) {
            console.error(`❌ Servidor não retornou ID para paciente ${paciente.nome}`);
            errorCount++;
            continue;
          }
          
          console.log(`✅ Paciente criado no servidor: ID temp ${idpaciente} → ID perm ${newPatientId}`);
          
          // ✅ AGORA É SEGURO USAR NO MAPEAMENTO
          pacienteIdMapping.set(idpaciente, newPatientId);
          
          // Marcar como sincronizado
          await indexedDBService.markPacienteAsSynced(idpaciente);
          syncedCount++;
          
          console.log(`✅ Paciente ${paciente.nome} sincronizado com sucesso`);
          
        } catch (error) {
          console.error(`❌ Erro ao sincronizar paciente ${paciente.idpaciente}:`, error);
          errorCount++;
        }
      }

      // ===== 2. SINCRONIZAR NOTIFICAÇÕES (com IDs atualizados) =====
      const pendingNotificacoes = await indexedDBService.getPendingNotificacoes();
      console.log(`🔄 Sincronizando ${pendingNotificacoes.length} notificações...`);
      
      for (const { id, formData } of pendingNotificacoes) {
        try {
          console.log(`📋 Sincronizando notificação ID: ${id}`);
          
          // ✅ CRIAR CÓPIA DOS DADOS PARA MODIFICAR
          let formDataAtualizada = { ...formData } as any;
            
          // ✅ ATUALIZAR ID DO PACIENTE SE NECESSÁRIO
          const pacienteIdAtual = formDataAtualizada.pacienteId || formDataAtualizada.paciente_idpaciente;
          
          // ✅ VERIFICAR SE É UM NÚMERO VÁLIDO ANTES DE USAR NO MAPEAMENTO
          if (pacienteIdAtual && typeof pacienteIdAtual === 'number' && pacienteIdMapping.has(pacienteIdAtual)) {
            const novoIdPaciente = pacienteIdMapping.get(pacienteIdAtual)!;
            
            console.log(`🔄 Atualizando referência: paciente ID ${pacienteIdAtual} → ${novoIdPaciente}`);
            
            // Atualizar ambos os campos possíveis
            formDataAtualizada.pacienteId = novoIdPaciente;
            formDataAtualizada.paciente_idpaciente = novoIdPaciente;
            
            // ✅ SALVAR A NOTIFICAÇÃO ATUALIZADA NO INDEXEDDB
            await indexedDBService.saveNotificacao(formDataAtualizada, true, id);
          }
          
          // ✅ VERIFICAR SE TEM ID VÁLIDO DE PACIENTE ANTES DE SINCRONIZAR
          const pacienteIdFinal = formDataAtualizada.pacienteId || formDataAtualizada.paciente_idpaciente;
          
          if (!pacienteIdFinal || pacienteIdFinal < 0) {
            console.error(`❌ Notificação ${id} não tem ID válido de paciente:`, formDataAtualizada);
            
            // ✅ TENTAR ENCONTRAR PACIENTE PELO NOME
            if (formDataAtualizada.paciente) {
              console.log(`🔍 Tentando encontrar paciente pelo nome: ${formDataAtualizada.paciente}`);
              
              try {
                const pacientesEncontrados = await PacienteService.search(formDataAtualizada.paciente);
                
                if (pacientesEncontrados.data && pacientesEncontrados.data.length > 0) {
                  const pacienteEncontrado = pacientesEncontrados.data.find((p: any) => 
                    p.nome.toUpperCase().trim() === formDataAtualizada.paciente.toUpperCase().trim()
                  );
                  
                  if (pacienteEncontrado) {
                    console.log(`👤 Paciente encontrado: ${pacienteEncontrado.nome} (ID: ${pacienteEncontrado.idpaciente})`);
                    
                    formDataAtualizada.pacienteId = pacienteEncontrado.idpaciente;
                    formDataAtualizada.paciente_idpaciente = pacienteEncontrado.idpaciente;
                    
                    // Salvar atualização
                    await indexedDBService.saveNotificacao(formDataAtualizada, true, id);
                  } else {
                    throw new Error(`Paciente "${formDataAtualizada.paciente}" não encontrado`);
                  }
                } else {
                  throw new Error(`Nenhum paciente encontrado para "${formDataAtualizada.paciente}"`);
                }
              } catch (searchError) {
                console.error(`❌ Erro ao buscar paciente: ${searchError}`);
                errorCount++;
                continue; // Pular para próxima notificação
              }
            } else {
              console.error(`❌ Notificação ${id} não tem nome de paciente`);
              errorCount++;
              continue;
            }
          }
          
          // ✅ SINCRONIZAR NOTIFICAÇÃO
          const isEdit = !!(formDataAtualizada as any).id && (formDataAtualizada as any).id > 0;
          const editId = isEdit ? Number((formDataAtualizada as any).id) : undefined;
          
          await salvarNotificacaoCompleta(
            formDataAtualizada as any, 
            isEdit, 
            editId
          );

          await indexedDBService.markNotificacaoAsSynced(id);
          syncedCount++;
          console.log(`✅ Notificação ${id} sincronizada`);
          
        } catch (error) {
          console.error(`❌ Erro ao sincronizar notificação ${id}:`, error);
          errorCount++;
        }
      }

      // ===== 3. FEEDBACK PARA O USUÁRIO =====
      if (syncedCount > 0) {
        toast.success(`${syncedCount} registro(s) sincronizado(s)!`);
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} registro(s) com erro. Tentaremos novamente.`);
      }

      // ===== 4. LIMPEZA =====
      await indexedDBService.cleanup();
      
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      toast.error('Erro na sincronização. Tentaremos novamente.');
    } finally {
      this.isSyncing = false;
    }
  }

  // ===== MÉTODO AUXILIAR PARA DEBUG MELHORADO =====
  async debugPendingData(): Promise<void> {
    try {
      const pendingNotificacoes = await indexedDBService.getPendingNotificacoes();
      const unsyncedPacientes = await indexedDBService.getUnsyncedPacientes();
      const cacheStats = await indexedDBService.getCacheStats();
      
      console.log('=== 🔍 DEBUG: DADOS PENDENTES ===');
      console.log(`📋 Notificações pendentes: ${pendingNotificacoes.length}`);
      
      pendingNotificacoes.forEach((notif, index) => {
        const pacienteId = (notif.formData as any).pacienteId || (notif.formData as any).paciente_idpaciente;
        console.log(`  ${index + 1}. ID: ${notif.id}`);
        console.log(`     Paciente: ${(notif.formData as any).paciente}`);
        console.log(`     PacienteID: ${pacienteId || 'VAZIO'}`);
        console.log(`     Tipo: ${pacienteId && pacienteId < 0 ? 'Temporário' : 'Permanente'}`);
      });
      
      console.log(`👤 Pacientes não sincronizados (criados localmente): ${unsyncedPacientes.length}`);
      unsyncedPacientes.forEach((pac, index) => {
        console.log(`  ${index + 1}. ID: ${pac.idpaciente}, Nome: ${pac.nome}, Source: ${pac.source}, Synced: ${pac.synced}`);
      });
      
      console.log('📊 Stats do cache:');
      console.log(`  - Verificação: ${cacheStats.verificacao} registros`);
      console.log(`  - Locais: ${cacheStats.locais} registros`);
      console.log(`  - Pendentes: ${cacheStats.pendentes} registros`);
      
      if (pendingNotificacoes.length === 0 && unsyncedPacientes.length === 0) {
        console.log('✅ Nenhum dado pendente de sincronização!');
      }
      
    } catch (error) {
      console.error('❌ Erro no debug:', error);
    }
  }

  // *** MÉTODOS PARA USAR NOS FORMULÁRIOS ***
    
  // Salvar notificação (online ou offline)
  async saveNotificacao(formData: any): Promise<void> {
    if (this.isOnline) {
      try {
        // Tentar salvar online primeiro
        await salvarNotificacaoCompleta(formData, false);
        toast.success('✅ Notificação salva!');
        return;
      } catch (error) {
        console.warn('Falha online, salvando offline:', error);
      }
    }

    // ✅ GARANTIR QUE O ID DO PACIENTE ESTÁ CORRETO
    const formDataParaSalvar = { ...formData };
    
    // Garantir consistência entre pacienteId e paciente_idpaciente
    if (formDataParaSalvar.pacienteId && !formDataParaSalvar.paciente_idpaciente) {
      formDataParaSalvar.paciente_idpaciente = formDataParaSalvar.pacienteId;
    } else if (formDataParaSalvar.paciente_idpaciente && !formDataParaSalvar.pacienteId) {
      formDataParaSalvar.pacienteId = formDataParaSalvar.paciente_idpaciente;
    }

    // Salvar offline usando IndexedDBService
    await indexedDBService.saveNotificacao(formDataParaSalvar, false);
    
    const message = this.isOnline 
      ? '📡 Erro na conexão - Salvo offline!'
      : '📱 Salvo offline! Sincronizará quando voltar online.';
    
    toast.success(message);
  }

  // ✅ CORRIGIDO: Salvar paciente com marcação correta
  async savePaciente(pacienteData: any): Promise<any> {
    if (this.isOnline) {
      try {
        // Tentar salvar online primeiro
        const result = await PacienteService.create(pacienteData);
        toast.success('✅ Paciente salvo!');
        return result;
      } catch (error) {
        console.warn('Falha online, salvando offline:', error);
      }
    }

    // ✅ IMPORTANTE: Marcar corretamente como criação local
    const tempId = -Math.abs(Date.now()); // Garantir que seja negativo
    const pacienteComId = { 
      ...pacienteData, 
      idpaciente: tempId,
      synced: 'false',
      source: 'local_creation', // ✅ CRUCIAL: Marcar como criação local
      savedOffline: true,
      savedAt: Date.now()
    };
    
    console.log(`💾 Salvando paciente offline como criação local:`, {
      nome: pacienteComId.nome,
      source: pacienteComId.source,
      synced: pacienteComId.synced
    });
    
    await indexedDBService.savePaciente(pacienteComId);
    
    const message = this.isOnline 
      ? '📡 Erro na conexão - Paciente salvo offline!'
      : '📱 Paciente salvo offline! Sincronizará quando voltar online.';
    
    toast.success(message);
    return pacienteComId;
  }

  // Buscar pacientes (online ou offline)
  async searchPacientes(query: string): Promise<any[]> {
    if (this.isOnline) {
      try {
        const result = await PacienteService.search(query);
        return result.data || [];
      } catch (error) {
        console.warn('Falha na busca online, usando cache:', error);
      }
    }

    // ✅ USAR BUSCA MELHORADA QUE INCLUI CACHE DE VERIFICAÇÃO
    return await indexedDBService.searchPacientesExtended(query);
  }

  // ✅ CORRIGIDO: Verificar CPF com cache melhorado
  async checkCpfExists(cpf: string): Promise<boolean> {
    if (!cpf || cpf.length !== 11) return false;

    // ✅ SEMPRE VERIFICAR CACHE PRIMEIRO (mais rápido e inclui verificação + locais)
    try {
      const existsInCache = await indexedDBService.checkCpfExists(cpf);
      if (existsInCache) {
        console.log('✅ CPF encontrado no cache (verificação ou local)');
        return true;
      }
    } catch (cacheError) {
      console.warn('⚠️ Erro ao verificar cache, continuando...', cacheError);
    }

    // ✅ SE OFFLINE, parar aqui
    if (!this.isOnline) {
      console.log('📱 Modo offline: CPF não encontrado no cache');
      return false;
    }

    // ✅ SE ONLINE, tentar API com timeout e fallback robusto
    try {
      console.log('🌐 Verificando CPF na API...');
      
      // ✅ CRIAR PROMISE COM TIMEOUT
      const apiPromise = PacienteService.checkCpfAvailable(cpf);
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('API_TIMEOUT')), 3000) // 3s timeout
      );
      
      const available = await Promise.race([apiPromise, timeoutPromise]);
      const exists = !available; // Inverter pois retorna disponibilidade
      
      console.log('✅ Verificação API concluída:', exists);
      return exists;
      
    } catch (error: any) {
      console.error('❌ Erro na verificação online de CPF:', error);
      
      // ✅ CLASSIFICAR TIPOS DE ERRO
      const isNetworkError = (
        error?.code === 'ERR_NETWORK' ||
        error?.code === 'ERR_INTERNET_DISCONNECTED' ||
        error?.message?.includes('Network Error') ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('no-response') ||
        error?.message === 'API_TIMEOUT' ||
        error?.name === 'TypeError'
      );
      
      if (isNetworkError) {
        console.log('⚠️ Erro de rede detectado, assumindo CPF não existe');
        
        // ✅ PARA ERROS DE REDE: assumir que CPF não existe (permitir cadastro)
        return false;
      }
      
      // ✅ PARA OUTROS ERROS: assumir que não existe para permitir continuidade
      console.log('⚠️ Erro não relacionado à rede, assumindo CPF não existe');
      return false;
    }
  }

  // *** MÉTODOS EXISTENTES (não mexer) ***
  
  async syncOpcoes(
    tipo: string, 
    fetchFn: () => Promise<any[]>, 
    forceRefresh: boolean = false
  ): Promise<any[]> {
    let data;
    
    // Primeiro, tenta obter dados do cache se não forçar atualização
    if (!forceRefresh) {
      data = await indexedDBService.getOpcoes(tipo);
      if (data) {
        return data;
      }
    }
    
    // Se estiver online, busca novos dados
    if (this.isOnline) {
      try {
        data = await fetchFn();
        
        // Salvar no cache
        await indexedDBService.saveOpcoes(tipo, data);
        return data;
      } catch (error) {
        console.error(`Erro ao buscar opções de ${tipo}:`, error);
        
        // Se falhar e tiver cache, usa o cache
        const cachedData = await indexedDBService.getOpcoes(tipo);
        if (cachedData) {
          console.log(`Usando dados em cache para ${tipo}`);
          return cachedData;
        }
        
        // Se não tiver cache, propaga o erro
        throw error;
      }
    } else {
      // Se offline, tenta usar o cache
      data = await indexedDBService.getOpcoes(tipo);
      if (data) {
        return data;
      }
      
      // Se não tiver cache, lança erro
      throw new Error(`Você está offline e não há dados em cache para ${tipo}`);
    }
  }

  isNetworkAvailable() {
    return this.isOnline;
  }

  isSyncInProgress() {
    return this.isSyncing;
  }

  async getPendingCount() {
    return await indexedDBService.getPendingCount();
  }

  async forceSyncData() {
    if (!this.isOnline) {
      toast.warning('Você está offline. Não é possível sincronizar agora.');
      return false;
    }
    
    if (this.isSyncing) {
      toast.info('Sincronização já está em andamento.');
      return false;
    }
    
    await this.syncData();
    return true;
  }
}

// Exportar uma instância para uso em toda a aplicação
const syncService = new SyncService();
export default syncService;
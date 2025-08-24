/**
 * Utilitário para resolver problema de notificações pendentes
 * 
 * Como usar:
 * 1. Abra o DevTools (F12)
 * 2. Vá para a aba Console
 * 3. Execute as funções conforme necessário
 */

import syncService from '@/services/syncService';

declare global {
  interface Window {
    pendingUtils: {
      debug: () => Promise<void>;
      clearOrphaned: () => Promise<void>;
      forceClearAll: () => Promise<void>;
      checkStats: () => Promise<void>;
    };
  }
}

class PendingNotificationUtils {
  
  /**
   * Debug completo dos dados pendentes
   */
  async debug() {
    console.log('🔍 === DEBUG NOTIFICAÇÕES PENDENTES ===');
    
    try {
      await syncService.debugPendingData();
      
      const pendingCount = await syncService.getPendingCount();
      console.log('\n📊 Resumo:', pendingCount);
      
      if (pendingCount.notificacoes > 0) {
        console.log('\n💡 Soluções disponíveis:');
        console.log('1. pendingUtils.clearOrphaned() - Remove apenas dados órfãos');
        console.log('2. pendingUtils.forceClearAll() - Remove TODAS as notificações pendentes');
      }
      
    } catch (error) {
      console.error('❌ Erro no debug:', error);
    }
  }

  /**
   * Limpa apenas dados órfãos/corrompidos
   */
  async clearOrphaned() {
    console.log('🧹 Limpando dados órfãos...');
    
    try {
      await syncService.clearOrphanedData();
      
      // Verificar resultado
      setTimeout(async () => {
        const newCount = await syncService.getPendingCount();
        console.log('📊 Contadores após limpeza:', newCount);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
    }
  }

  /**
   * Força a limpeza de TODAS as notificações pendentes (use com cuidado!)
   */
  async forceClearAll() {
    const confirmed = confirm(
      '⚠️ ATENÇÃO: Isso vai remover TODAS as notificações pendentes!\n\n' +
      'Essa ação não pode ser desfeita. Tem certeza?'
    );
    
    if (!confirmed) {
      console.log('❌ Operação cancelada pelo usuário');
      return;
    }
    
    console.log('🗑️ Removendo TODAS as notificações pendentes...');
    
    try {
      // Importar IndexedDB service dinamicamente
      const { default: indexedDBService } = await import('@/services/indexedDB');
      
      const pendingNotificacoes = await indexedDBService.getPendingNotificacoes();
      
      console.log(`🔄 Marcando ${pendingNotificacoes.length} notificações como sincronizadas...`);
      
      for (const notif of pendingNotificacoes) {
        await indexedDBService.markNotificacaoAsSynced(notif.id);
      }
      
      console.log('✅ Todas as notificações pendentes foram removidas');
      
      // Verificar resultado
      setTimeout(async () => {
        const newCount = await syncService.getPendingCount();
        console.log('📊 Contadores após limpeza forçada:', newCount);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro na limpeza forçada:', error);
    }
  }

  /**
   * Verifica estatísticas gerais
   */
  async checkStats() {
    try {
      const pendingCount = await syncService.getPendingCount();
      
      console.log('📊 === ESTATÍSTICAS ATUAIS ===');
      console.log(`📋 Notificações pendentes: ${pendingCount.notificacoes}`);
      console.log(`👤 Pacientes pendentes: ${pendingCount.pacientes}`);
      console.log(`🏥 Estabelecimentos pendentes: ${pendingCount.estabelecimentos}`);
      
      const isOnline = syncService.isNetworkAvailable();
      const isSyncing = syncService.isSyncInProgress();
      
      console.log(`🌐 Status da rede: ${isOnline ? 'Online' : 'Offline'}`);
      console.log(`🔄 Sincronização em progresso: ${isSyncing ? 'Sim' : 'Não'}`);
      
    } catch (error) {
      console.error('❌ Erro ao verificar estatísticas:', error);
    }
  }
}

// Criar instância e expor no window para uso no console
const pendingUtils = new PendingNotificationUtils();

if (typeof window !== 'undefined') {
  window.pendingUtils = {
    debug: () => pendingUtils.debug(),
    clearOrphaned: () => pendingUtils.clearOrphaned(),
    forceClearAll: () => pendingUtils.forceClearAll(),
    checkStats: () => pendingUtils.checkStats()
  };
  
  console.log('🔧 === PENDING UTILS CARREGADO ===');
  console.log('Use as seguintes funções no console:');
  console.log('• pendingUtils.debug() - Debug completo');
  console.log('• pendingUtils.clearOrphaned() - Limpar dados órfãos');
  console.log('• pendingUtils.forceClearAll() - Limpar TUDO (cuidado!)');
  console.log('• pendingUtils.checkStats() - Ver estatísticas');
}

export default pendingUtils;

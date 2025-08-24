// Script para debug e limpeza de dados pendentes no IndexedDB
// Execute este script no console do navegador

// ✅ SOLUÇÃO RÁPIDA: Execute esta função para resolver o problema imediatamente
async function fixPendingNotificationIssue() {
  console.log('🚀 === RESOLVENDO PROBLEMA DA NOTIFICAÇÃO PENDENTE ===');
  
  try {
    // Verificar se syncService está disponível
    if (typeof window !== 'undefined' && window.syncService) {
      console.log('📱 Usando syncService...');
      await window.syncService.forceRemovePendingNotification(-1);
      return;
    }
    
    // Fallback: Acesso direto ao IndexedDB
    console.log('🔧 Acessando IndexedDB diretamente...');
    await clearNotification(-1);
    
    console.log('✅ Problema resolvido! Recarregue a página para confirmar.');
    
  } catch (error) {
    console.error('❌ Erro ao resolver problema:', error);
    console.log('🔄 Tentando limpeza completa...');
    await clearAllPendingNotifications();
  }
}

// Função para abrir o IndexedDB
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NotificacaoOfflineDB', 4);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Função para listar notificações pendentes
async function listPendingNotifications() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['notificacoes'], 'readonly');
    const store = transaction.objectStore('notificacoes');
    const index = store.index('by-sync-status');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => {
        const pendingNotifications = request.result;
        console.log('🔍 Notificações pendentes encontradas:', pendingNotifications.length);
        
        pendingNotifications.forEach((notif, i) => {
          console.log(`📋 ${i + 1}. ID: ${notif.id}, Timestamp: ${new Date(notif.timestamp).toLocaleString()}`);
          console.log(`   Dados:`, notif.formData);
        });
        
        resolve(pendingNotifications);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erro ao listar notificações:', error);
    return [];
  }
}

// Função para limpar notificação específica
async function clearNotification(id) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['notificacoes'], 'readwrite');
    const store = transaction.objectStore('notificacoes');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`✅ Notificação ID ${id} removida`);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`❌ Erro ao remover notificação ${id}:`, error);
    return false;
  }
}

// Função para limpar todas as notificações pendentes
async function clearAllPendingNotifications() {
  try {
    const pending = await listPendingNotifications();
    
    if (pending.length === 0) {
      console.log('✅ Nenhuma notificação pendente encontrada');
      return;
    }
    
    console.log(`🗑️ Removendo ${pending.length} notificações pendentes...`);
    
    for (const notif of pending) {
      await clearNotification(notif.id);
    }
    
    console.log('✅ Todas as notificações pendentes foram removidas');
    
    // Verificar se ainda existem
    const remainingPending = await listPendingNotifications();
    console.log(`📊 Notificações pendentes restantes: ${remainingPending.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao limpar notificações:', error);
  }
}

// Função para verificar stats gerais
async function checkGeneralStats() {
  try {
    const db = await openIndexedDB();
    
    // Verificar notificações
    const notifTransaction = db.transaction(['notificacoes'], 'readonly');
    const notifStore = notifTransaction.objectStore('notificacoes');
    
    const totalNotifications = await new Promise((resolve, reject) => {
      const request = notifStore.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const pendingNotifications = await new Promise((resolve, reject) => {
      const request = notifStore.index('by-sync-status').count('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const syncedNotifications = await new Promise((resolve, reject) => {
      const request = notifStore.index('by-sync-status').count('synced');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Verificar pacientes
    const pacienteTransaction = db.transaction(['pacientes'], 'readonly');
    const pacienteStore = pacienteTransaction.objectStore('pacientes');
    
    const totalPacientes = await new Promise((resolve, reject) => {
      const request = pacienteStore.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log('📊 === ESTATÍSTICAS GERAIS ===');
    console.log(`📋 Notificações total: ${totalNotifications}`);
    console.log(`⏳ Notificações pendentes: ${pendingNotifications}`);
    console.log(`✅ Notificações sincronizadas: ${syncedNotifications}`);
    console.log(`👤 Pacientes total: ${totalPacientes}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar estatísticas:', error);
  }
}

// Executar debug completo
async function runFullDebug() {
  console.log('🚀 === INICIANDO DEBUG COMPLETO ===');
  
  await checkGeneralStats();
  await listPendingNotifications();
  
  console.log('\n💡 Para limpar todas as notificações pendentes, execute:');
  console.log('clearAllPendingNotifications()');
  
  console.log('\n💡 Para limpar uma notificação específica, execute:');
  console.log('clearNotification(ID_DA_NOTIFICACAO)');
}

// Expor funções globalmente para uso no console
window.debugPending = {
  fixPendingNotificationIssue,  // ✅ FUNÇÃO PRINCIPAL PARA RESOLVER O PROBLEMA
  runFullDebug,
  listPendingNotifications,
  clearNotification,
  clearAllPendingNotifications,
  checkGeneralStats
};

console.log('🔧 Script de debug carregado!');
console.log('');
console.log('🚀 === PARA RESOLVER O PROBLEMA RAPIDAMENTE ===');
console.log('Execute: debugPending.fixPendingNotificationIssue()');
console.log('');
console.log('📋 Outras funções disponíveis:');
console.log('• debugPending.runFullDebug() - Debug completo');
console.log('• debugPending.clearAllPendingNotifications() - Limpar todas');
console.log('• debugPending.checkGeneralStats() - Ver estatísticas');

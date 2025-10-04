// Teste rápido da nova funcionalidade de tratamento de erros de sincronização

import syncService from '@/services/syncService';
import indexedDBService from '@/services/indexedDB';

console.log('🧪 === TESTE DE FUNCIONALIDADE DE ERROS DE SINCRONIZAÇÃO ===');

async function testErrorHandling() {
  try {
    console.log('1. Verificando se há notificações com erro...');
    
    const errorNotifications = await syncService.getErrorNotifications();
    console.log(`📊 Notificações com erro: ${errorNotifications.length}`);
    
    if (errorNotifications.length > 0) {
      console.log('📋 Lista de notificações com erro:');
      errorNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ID: ${notif.id}`);
        console.log(`      Erro: ${notif.errorInfo.message}`);
        console.log(`      Data: ${new Date(notif.errorInfo.timestamp).toLocaleString()}`);
        console.log(`      Tentativas: ${notif.errorInfo.retryCount || 1}`);
      });
    } else {
      console.log('✅ Nenhuma notificação com erro encontrada');
    }
    
    console.log('\n2. Verificando contador de pendências...');
    const counts = await syncService.getPendingCount();
    console.log(`📊 Contadores:`, {
      notificacoes: counts.notificacoes,
      pacientes: counts.pacientes,
      errors: counts.errors || 0,
      estabelecimentos: counts.estabelecimentos || 0
    });
    
    console.log('\n3. Testando marcação de erro (simulação)...');
    // Simular erro - vamos criar uma notificação de teste se não houver nenhuma
    const pendingNotifications = await indexedDBService.getPendingNotificacoes();
    
    if (pendingNotifications.length > 0) {
      const testNotificationId = pendingNotifications[0].id;
      console.log(`📝 Testando com notificação ID: ${testNotificationId}`);
      
      // Marcar como erro
      await indexedDBService.markNotificacaoAsError(
        testNotificationId, 
        'Teste de erro de sincronização', 
        { test: true, timestamp: Date.now() }
      );
      
      console.log('✅ Notificação marcada como erro');
      
      // Verificar se apareceu na lista de erros
      const errorsAfterTest = await syncService.getErrorNotifications();
      const testError = errorsAfterTest.find(e => e.id === testNotificationId);
      
      if (testError) {
        console.log('✅ Notificação aparece na lista de erros');
        console.log(`   Mensagem: ${testError.errorInfo.message}`);
        
        // Resetar para pending
        await indexedDBService.retryNotificacao(testNotificationId);
        console.log('✅ Notificação resetada para pending');
      } else {
        console.log('❌ Notificação não apareceu na lista de erros');
      }
      
    } else {
      console.log('📝 Não há notificações pendentes para testar');
    }
    
    console.log('\n✅ === TESTE CONCLUÍDO ===');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testErrorHandling();
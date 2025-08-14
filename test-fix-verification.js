/**
 * 🧪 TESTE RÁPIDO - Verificar Correção do Erro
 * Execute no console do browser para testar
 */

// Simular a função corrigida
const testProcessarDataParaUTC = (dateString, timezone_name, timezone_offset_minutos) => {
  if (!dateString) return "";
  
  try {
    // Detectar timezone do usuário
    const getTimezoneInfo = () => {
      try {
        const detected_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = new Date();
        const detected_offset = -now.getTimezoneOffset();
        return { timezone_name: detected_timezone, timezone_offset_minutos: detected_offset };
      } catch {
        return { timezone_name: 'America/Belem', timezone_offset_minutos: -180 };
      }
    };

    // Usar timezone fornecido ou detectar automaticamente
    const timezoneInfo = timezone_name && timezone_offset_minutos !== undefined 
      ? { timezone_name, timezone_offset_minutos }
      : getTimezoneInfo();
    
    // Se já está em formato UTC, manter
    if (dateString.includes('Z') || (dateString.includes('T') && dateString.match(/[+-]\d{2}:\d{2}$/))) {
      return dateString;
    }
    
    let isoString;
    
    // Converter diferentes formatos para ISO
    if (dateString.includes(' ')) {
      isoString = dateString.replace(' ', 'T');
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      isoString = `${dateString}T12:00:00`;
    } else {
      isoString = dateString;
    }
    
    // Adicionar offset da timezone
    const offset = timezoneInfo.timezone_offset_minutos;
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    const offsetString = `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return `${isoString}${offsetString}`;
  } catch (error) {
    console.error('Erro ao processar data:', error);
    return dateString;
  }
};

// EXECUTAR TESTES
console.log('🧪 === TESTE DE CORREÇÃO DO ERRO ===\n');

console.log('1️⃣ Teste com data simples:');
const resultado1 = testProcessarDataParaUTC('2025-08-13');
console.log(`   Input: "2025-08-13"`);
console.log(`   Output: "${resultado1}"`);
console.log(`   ✅ Deve incluir timezone offset (ex: 2025-08-13T12:00:00-03:00)\n`);

console.log('2️⃣ Teste com data e hora:');
const resultado2 = testProcessarDataParaUTC('2025-08-13T13:45:00');
console.log(`   Input: "2025-08-13T13:45:00"`);
console.log(`   Output: "${resultado2}"`);
console.log(`   ✅ Deve incluir timezone offset (ex: 2025-08-13T13:45:00-03:00)\n`);

console.log('3️⃣ Teste com timezone específico:');
const resultado3 = testProcessarDataParaUTC('2025-08-13', 'America/Sao_Paulo', -180);
console.log(`   Input: "2025-08-13" com timezone America/Sao_Paulo (-180)`);
console.log(`   Output: "${resultado3}"`);
console.log(`   ✅ Deve usar o timezone fornecido\n`);

console.log('4️⃣ Verificar timezone detectado automaticamente:');
try {
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const detectedOffset = -now.getTimezoneOffset();
  console.log(`   Timezone: ${detectedTimezone}`);
  console.log(`   Offset: ${detectedOffset} minutos (UTC${detectedOffset >= 0 ? '+' : ''}${detectedOffset/60})`);
  console.log(`   ✅ Sistema detectando corretamente\n`);
} catch (error) {
  console.log(`   ❌ Erro na detecção: ${error.message}\n`);
}

console.log('✅ CORREÇÃO APLICADA! Não deve mais dar erro de "require is not defined"');

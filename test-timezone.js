// Teste rápido das funções de timezone

// Função de detecção de timezone (versão JS)
const detectUserTimezone = () => {
  try {
    const timezone_name = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const timezone_offset_minutos = -now.getTimezoneOffset();
    
    console.log(`🌍 Timezone detectado: ${timezone_name} (${timezone_offset_minutos} min)`);
    
    return {
      timezone_name,
      timezone_offset_minutos
    };
  } catch (error) {
    console.error('Erro ao detectar timezone:', error);
    
    return {
      timezone_name: 'America/Belem',
      timezone_offset_minutos: -180
    };
  }
};

// Função de formatação de data com timezone (versão JS)
const formatDateWithTimezone = (
  dateString, 
  timezone_name,
  timezone_offset_minutos
) => {
  if (!dateString) return '';
  
  // Se a data já tem timezone (formato ISO completo), manter como está
  if (dateString.includes('T') && (dateString.includes('+') || dateString.match(/-\d{2}:\d{2}$/))) {
    return dateString;
  }
  
  try {
    // Detectar se é só data (YYYY-MM-DD) ou data-hora (YYYY-MM-DD HH:mm:ss)
    let isoDate;
    
    if (dateString.includes(' ')) {
      // Formato: "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
      isoDate = dateString.replace(' ', 'T');
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Formato: "YYYY-MM-DD" -> "YYYY-MM-DDTHH:mm:ss" (assumindo meio-dia)
      isoDate = `${dateString}T12:00:00`;
    } else {
      // Se já tem T, manter formato
      isoDate = dateString;
    }
    
    // Adicionar timezone offset se fornecido
    if (timezone_offset_minutos !== undefined) {
      const hours = Math.floor(Math.abs(timezone_offset_minutos) / 60);
      const minutes = Math.abs(timezone_offset_minutos) % 60;
      const sign = timezone_offset_minutos >= 0 ? '+' : '-';
      const offset = `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const result = `${isoDate}${offset}`;
      console.log(`📅 Data formatada: ${dateString} -> ${result}`);
      return result;
    }
    
    return isoDate;
    
  } catch (error) {
    console.error('Erro ao formatar data com timezone:', error);
    return dateString;
  }
};

console.log('🧪 Testando funções de timezone...\n');

// Simular dados de timezone
const timezone_name = 'America/Sao_Paulo';
const timezone_offset_minutos = -180; // UTC-3

console.log('1️⃣ Testando formatação de data simples:');
const data1 = '2025-01-15';
const resultado1 = formatDateWithTimezone(data1, timezone_name, timezone_offset_minutos);
console.log(`   Input: ${data1}`);
console.log(`   Output: ${resultado1}`);
console.log(`   Esperado: 2025-01-15T12:00:00-03:00\n`);

console.log('2️⃣ Testando formatação de data com hora:');
const data2 = '2025-01-15 14:30:00';
const resultado2 = formatDateWithTimezone(data2, timezone_name, timezone_offset_minutos);
console.log(`   Input: ${data2}`);
console.log(`   Output: ${resultado2}`);
console.log(`   Esperado: 2025-01-15T14:30:00-03:00\n`);

console.log('3️⃣ Testando detecção automática de timezone:');
const timezoneInfo = detectUserTimezone();
console.log(`   Timezone detectado: ${timezoneInfo.timezone_name}`);
console.log(`   Offset em minutos: ${timezoneInfo.timezone_offset_minutos}`);

const data3 = '2025-01-15';
const resultado3 = formatDateWithTimezone(data3, timezoneInfo.timezone_name, timezoneInfo.timezone_offset_minutos);
console.log(`   Data formatada: ${data3} -> ${resultado3}\n`);

console.log('✅ Teste concluído!');

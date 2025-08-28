/**
 * 🌍 TIMEZONE HELPER - Versão Simplificada para Produção
 * Utilitário inline para evitar problemas de import
 */

// Função para detectar timezone do usuário
export const detectUserTimezoneRobust = () => {
  try {
    const timezone_name = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const timezone_offset_minutos = -now.getTimezoneOffset();
    
    console.log(`🌍 Timezone detectado: ${timezone_name} (UTC${timezone_offset_minutos >= 0 ? '+' : ''}${timezone_offset_minutos / 60})`);
    
    // Para o Brasil, normalizar alguns nomes de timezone
    let normalizedTimezone = timezone_name;
    if (timezone_name === 'America/Sao_Paulo' || timezone_name === 'America/Bahia') {
      // São Paulo e Bahia são UTC-3 (mesmo que Belém)
      normalizedTimezone = 'America/Sao_Paulo';
    } else if (timezone_name === 'America/Manaus') {
      // Manaus é UTC-4
      normalizedTimezone = 'America/Manaus';
    } else if (timezone_name === 'America/Rio_Branco') {
      // Acre é UTC-5
      normalizedTimezone = 'America/Rio_Branco';
    }
    
    return {
      timezone_name: normalizedTimezone,
      timezone_offset_minutos
    };
  } catch (error) {
    console.warn('Erro ao detectar timezone, usando Belém como fallback:', error);
    
    return {
      timezone_name: 'America/Belem',
      timezone_offset_minutos: -180 // UTC-3
    };
  }
};

// Função para converter data local para formato UTC com timezone
export const formatLocalDateForBackend = (
  dateString: string, 
  timezone_name?: string, 
  timezone_offset_minutos?: number
): string => {
  if (!dateString) return '';
  
  try {
    // Usar timezone fornecido ou detectar automaticamente
    const timezoneInfo = timezone_name && timezone_offset_minutos !== undefined 
      ? { timezone_name, timezone_offset_minutos }
      : detectUserTimezoneRobust();
    
    // Se já está em formato UTC, manter
    if (dateString.includes('Z') || (dateString.includes('T') && dateString.match(/[+-]\d{2}:\d{2}$/))) {
      return dateString;
    }
    
    let isoString: string;
    
    // Converter diferentes formatos para ISO
    if (dateString.includes(' ')) {
      // "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
      isoString = dateString.replace(' ', 'T');
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // "YYYY-MM-DD" -> "YYYY-MM-DDTHH:mm:ss" (horário atual como padrão)
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0]; // "HH:mm:ss"
      isoString = `${dateString}T${currentTime}`;
    } else if (dateString.includes('/')) {
      // "DD/MM/YYYY" -> "YYYY-MM-DD"
      const [day, month, year] = dateString.split('/');
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0]; // "HH:mm:ss"
      isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${currentTime}`;
    } else {
      isoString = dateString;
    }
    
    // Adicionar offset da timezone
    const offset = timezoneInfo.timezone_offset_minutos;
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    const offsetString = `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    const result = `${isoString}${offsetString}`;
    console.log(`📤 Formatando para backend: ${dateString} -> ${result} (${timezoneInfo.timezone_name})`);
    
    return result;
  } catch (error) {
    console.error('Erro ao formatar data para backend:', error);
    return dateString;
  }
};

// Função para converter data UTC (do backend) para exibição local
export const displayUTCInLocalTimezone = (utcDateString: string): string => {
  if (!utcDateString) return '';
  
  try {
    const date = new Date(utcDateString);
    const { timezone_name } = detectUserTimezoneRobust();
    
    return date.toLocaleString('pt-BR', {
      timeZone: timezone_name,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao converter UTC para local:', error);
    return 'Data inválida';
  }
};

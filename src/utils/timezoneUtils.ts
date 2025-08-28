/**
 * 🌍 FRONTEND TIMEZONE UTILS - Versão Otimizada
 * Utilitários para manejo de timezone no frontend
 */

/**
 * Detecta timezone do usuário com fallback robusto
 */
export const getTimezoneInfo = () => {
  try {
    const timezone_name = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const timezone_offset_minutos = -now.getTimezoneOffset();
    
    console.log(`🌍 Timezone detectado: ${timezone_name} (UTC${timezone_offset_minutos >= 0 ? '+' : ''}${timezone_offset_minutos / 60})`);
    
    return {
      timezone_name,
      timezone_offset_minutos
    };
  } catch (error) {
    console.warn('Erro ao detectar timezone, usando Belém como fallback:', error);
    
    return {
      timezone_name: 'America/Belem',
      timezone_offset_minutos: -180
    };
  }
};

/**
 * Converte data UTC (do backend) para timezone local do usuário
 * Para EXIBIÇÃO na interface
 */
export const displayUTCDateInLocalTimezone = (utcDateString: string): string => {
  if (!utcDateString) return '';
  
  try {
    const date = new Date(utcDateString);
    const { timezone_name } = getTimezoneInfo();
    
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

/**
 * Converte data local para UTC para ENVIO ao backend
 * Sempre envia em formato ISO com timezone
 */
export const convertLocalDateToUTC = (localDateString: string): string => {
  if (!localDateString) return '';
  
  try {
    const { timezone_offset_minutos } = getTimezoneInfo();
    
    // Se já está em formato UTC, manter
    if (localDateString.includes('Z') || localDateString.includes('T') && localDateString.match(/[+-]\d{2}:\d{2}$/)) {
      return localDateString;
    }
    
    let isoString: string;
    
    // Converter diferentes formatos para ISO
    if (localDateString.includes(' ')) {
      // "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
      isoString = localDateString.replace(' ', 'T');
    } else if (localDateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // "YYYY-MM-DD" -> "YYYY-MM-DDTHH:mm:ss" (horário atual como padrão)
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0]; // "HH:mm:ss"
      isoString = `${localDateString}T${currentTime}`;
    } else if (localDateString.includes('/')) {
      // "DD/MM/YYYY" -> "YYYY-MM-DD"
      const [day, month, year] = localDateString.split('/');
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0]; // "HH:mm:ss"
      isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${currentTime}`;
    } else {
      isoString = localDateString;
    }
    
    // Adicionar offset da timezone
    const hours = Math.floor(Math.abs(timezone_offset_minutos) / 60);
    const minutes = Math.abs(timezone_offset_minutos) % 60;
    const sign = timezone_offset_minutos >= 0 ? '+' : '-';
    const offsetString = `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    const result = `${isoString}${offsetString}`;
    console.log(`📤 Convertendo para backend: ${localDateString} -> ${result}`);
    
    return result;
  } catch (error) {
    console.error('Erro ao converter data local para UTC:', error);
    return localDateString;
  }
};

/**
 * Formata data para input de formulário (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const { timezone_name } = getTimezoneInfo();
    
    // Aplicar timezone do usuário antes de formatar
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone_name }));
    
    const year = localDate.getFullYear();
    const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
    const day = localDate.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao formatar data para input:', error);
    return '';
  }
};

/**
 * Converte data de input (YYYY-MM-DD) para formato de exibição brasileiro
 */
export const formatDisplayDate = (inputDate: string): string => {
  if (!inputDate) return '';
  
  try {
    const [year, month, day] = inputDate.split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data para exibição:', error);
    return inputDate;
  }
};

/**
 * Valida se uma string de data é válida
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * Obtém data atual no timezone do usuário formatada para backend
 */
export const getCurrentDateForBackend = (): string => {
  const now = new Date();
  return convertLocalDateToUTC(now.toISOString());
};

/**
 * Obtém data atual formatada para exibição
 */
export const getCurrentDateForDisplay = (): string => {
  const now = new Date();
  const { timezone_name } = getTimezoneInfo();
  
  return now.toLocaleString('pt-BR', {
    timeZone: timezone_name,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

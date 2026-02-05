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

/**
 * 🕐 DATETIME-LOCAL UTILS
 * Funções específicas para inputs do tipo datetime-local
 */

/**
 * Obtém data/hora atual no fuso horário local formatada para input datetime-local
 * @returns String no formato YYYY-MM-DDTHH:MM
 */
export const getLocalDateTime = (date: Date = new Date()): string => {
  const { timezone_name } = getTimezoneInfo();
  
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone_name,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

/**
 * Converte data UTC (do backend) para fuso local e formata para datetime-local input
 * @param utcDateString - String de data em UTC (ex: "2026-02-05T14:00:00Z")
 * @returns String formatada para datetime-local (ex: "2026-02-05T11:00")
 */
export const convertUTCToLocalDateTime = (utcDateString: string | null | undefined): string => {
  if (!utcDateString) return getLocalDateTime();
  
  try {
    // Garante que a string seja interpretada como UTC
    let dateStr = utcDateString.trim();
    
    console.log('🔍 convertUTCToLocalDateTime - Input:', dateStr);
    
    // Se for apenas uma data sem horário nem timezone, adiciona horário
    if (!dateStr.includes('T')) {
      dateStr = dateStr + 'T00:00:00Z';
    } 
    // Se tem horário mas não tem timezone, adiciona Z (UTC)
    else if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
      dateStr = dateStr + 'Z';
    }
    
    console.log('🔍 convertUTCToLocalDateTime - DateStr com Z:', dateStr);
    
    const date = new Date(dateStr);
    
    console.log('🔍 convertUTCToLocalDateTime - Date object:', date.toISOString());
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Data inválida:', utcDateString);
      return getLocalDateTime();
    }
    
    const result = getLocalDateTime(date);
    console.log('🔍 convertUTCToLocalDateTime - Result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao converter UTC para datetime-local:', error);
    return getLocalDateTime();
  }
};

/**
 * Converte datetime-local (YYYY-MM-DDTHH:MM) para UTC ISO string
 * @param localDateTimeString - String do input datetime-local (ex: "2026-02-05T11:00")
 * @returns String ISO UTC (ex: "2026-02-05T14:00:00.000Z")
 */
export const convertLocalDateTimeToUTC = (localDateTimeString: string): string => {
  if (!localDateTimeString) return new Date().toISOString();
  
  try {
    console.log('📤 convertLocalDateTimeToUTC - Input:', localDateTimeString);
    
    // Parse da string local
    const parts = localDateTimeString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    
    if (!parts) {
      console.warn('⚠️ Formato de datetime inválido:', localDateTimeString);
      return new Date().toISOString();
    }
    
    const [, year, month, day, hour, minute] = parts;
    
    // Criar string de data completa com segundos (sem timezone)
    const dateString = `${year}-${month}-${day}T${hour}:${minute}:00`;
    console.log('📤 DateString criada:', dateString);
    
    // ✅ CORREÇÃO: new Date() sem timezone interpreta como horário LOCAL do navegador
    // e toISOString() já converte automaticamente para UTC!
    const localDate = new Date(dateString);
    const utcString = localDate.toISOString();
    
    console.log('📤 Data local do navegador:', localDate.toString());
    console.log('📤 Convertido para UTC:', utcString);
    
    return utcString;
  } catch (error) {
    console.error('❌ Erro ao converter datetime-local para UTC:', error);
    return new Date().toISOString();
  }
};

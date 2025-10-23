/**
 * 🔍 UTILIDADES PARA OFFLINE_ID
 * Funções para extrair e formatar informações do offline_id
 */

/**
 * Extrai o timestamp de criação do offline_id
 * Formato do offline_id: fp-{deviceFingerprint}-{timestamp}-{random}
 * Exemplo: fp-745c3969866938f4-1760638161081-1e59
 * 
 * @param offlineId - O ID único da notificação offline
 * @returns Timestamp em milissegundos ou null se inválido
 */
export function extractTimestampFromOfflineId(offlineId: string | null | undefined): number | null {
  if (!offlineId) return null;
  
  try {
    // Formato: fp-{fingerprint}-{timestamp}-{random}
    const parts = offlineId.split('-');
    
    if (parts.length >= 3) {
      const timestamp = parseInt(parts[2]);
      
      // Validar se é um timestamp válido (entre 2020 e 2050)
      if (!isNaN(timestamp) && timestamp > 1577836800000 && timestamp < 2524608000000) {
        return timestamp;
      }
    }
  } catch (error) {
    console.error('Erro ao extrair timestamp do offline_id:', error);
  }
  
  return null;
}

/**
 * Extrai o device fingerprint do offline_id
 * 
 * @param offlineId - O ID único da notificação offline
 * @returns Device fingerprint ou null se inválido
 */
export function extractDeviceFingerprintFromOfflineId(offlineId: string | null | undefined): string | null {
  if (!offlineId) return null;
  
  try {
    const parts = offlineId.split('-');
    
    if (parts.length >= 2) {
      return parts[1];
    }
  } catch (error) {
    console.error('Erro ao extrair fingerprint do offline_id:', error);
  }
  
  return null;
}

/**
 * Converte o timestamp extraído do offline_id em objeto Date
 * 
 * @param offlineId - O ID único da notificação offline
 * @returns Date object ou null se inválido
 */
export function getOfflineCreationDate(offlineId: string | null | undefined): Date | null {
  const timestamp = extractTimestampFromOfflineId(offlineId);
  
  if (timestamp) {
    return new Date(timestamp);
  }
  
  return null;
}

/**
 * Formata a data de criação offline em formato legível
 * 
 * @param offlineId - O ID único da notificação offline
 * @param options - Opções de formatação Intl.DateTimeFormat
 * @returns String formatada ou null se inválido
 */
export function formatOfflineCreationDate(
  offlineId: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo'
  }
): string | null {
  const date = getOfflineCreationDate(offlineId);
  
  if (date) {
    return new Intl.DateTimeFormat('pt-BR', options).format(date);
  }
  
  return null;
}

/**
 * Retorna a data/hora real de criação da notificação
 * Se foi criada offline, usa o timestamp do offline_id
 * Se foi criada online, usa created_at
 * 
 * @param notificacao - Objeto da notificação com created_offline, offline_id e created_at
 * @returns Date object com a data real de criação
 */
export function getRealCreationDate(notificacao: {
  created_offline?: boolean;
  offline_id?: string | null;
  created_at?: string | Date | null;
}): Date {
  // Se foi criada offline e tem offline_id, extrair timestamp dele
  if (notificacao.created_offline && notificacao.offline_id) {
    const offlineDate = getOfflineCreationDate(notificacao.offline_id);
    
    if (offlineDate) {
      console.log('📱 Usando data de criação offline:', offlineDate);
      return offlineDate;
    }
  }
  
  // Caso contrário, usar created_at (criação online ou fallback)
  const createdAt = notificacao.created_at;
  
  if (createdAt) {
    const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    console.log('🌐 Usando data de criação online:', date);
    return date;
  }
  
  // Fallback: data atual (não deveria acontecer)
  console.warn('⚠️ Notificação sem data válida, usando data atual');
  return new Date();
}

/**
 * Formata a data real de criação em formato legível
 * 
 * @param notificacao - Objeto da notificação
 * @param options - Opções de formatação
 * @returns String formatada com a data/hora real de criação
 */
export function formatRealCreationDate(
  notificacao: {
    created_offline?: boolean;
    offline_id?: string | null;
    created_at?: string | Date | null;
  },
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  }
): string {
  const date = getRealCreationDate(notificacao);
  return new Intl.DateTimeFormat('pt-BR', options).format(date);
}

/**
 * Comparador para ordenar notificações pela data REAL de criação
 * Use com array.sort()
 * 
 * @param a - Primeira notificação
 * @param b - Segunda notificação
 * @param order - 'asc' para crescente, 'desc' para decrescente (padrão)
 * @returns Número para ordenação
 */
export function compareByRealCreationDate(
  a: {
    created_offline?: boolean;
    offline_id?: string | null;
    created_at?: string | Date | null;
  },
  b: {
    created_offline?: boolean;
    offline_id?: string | null;
    created_at?: string | Date | null;
  },
  order: 'asc' | 'desc' = 'desc'
): number {
  const dateA = getRealCreationDate(a);
  const dateB = getRealCreationDate(b);
  
  const comparison = dateA.getTime() - dateB.getTime();
  
  return order === 'asc' ? comparison : -comparison;
}

/**
 * Retorna informações completas sobre a criação da notificação
 * Útil para exibir badges ou tooltips
 * 
 * @param notificacao - Objeto da notificação
 * @returns Objeto com informações detalhadas
 */
export function getCreationInfo(notificacao: {
  created_offline?: boolean;
  offline_id?: string | null;
  device_id?: string | null;
  created_at?: string | Date | null;
  sincronizado?: boolean;
  synced_at?: string | Date | null;
}) {
  const isOffline = notificacao.created_offline === true;
  const realDate = getRealCreationDate(notificacao);
  const formattedDate = formatRealCreationDate(notificacao);
  
  let status = '';
  let badge = '';
  let color = '';
  
  if (isOffline) {
    if (notificacao.sincronizado) {
      status = 'Criada offline e sincronizada';
      badge = '📱✅ Offline';
      color = 'green';
    } else {
      status = 'Criada offline (pendente sincronização)';
      badge = '📱⏳ Offline';
      color = 'orange';
    }
  } else {
    status = 'Criada online';
    badge = '🌐 Online';
    color = 'blue';
  }
  
  return {
    isOffline,
    realDate,
    formattedDate,
    status,
    badge,
    color,
    offlineId: notificacao.offline_id || null,
    deviceId: notificacao.device_id || null,
    syncedAt: notificacao.synced_at || null
  };
}

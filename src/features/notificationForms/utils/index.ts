// src/features/notificationForms/utils/index.ts
import { Notificacao } from "../types";
import { detectUserTimezone } from "../types/index2";

/**
 * Normaliza texto removendo acentos, cedilhas e convertendo para minúsculas
 * @param text Texto a ser normalizado
 * @returns Texto normalizado
 */
export const normalizeText = (text: string = ''): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Formata data para exibição no formato brasileiro DD/MM/YYYY
 * 🆕 ATUALIZADA: Agora com suporte a timezone
 */
export const formatDate = (dateString: string | null | undefined): string => {
  try {
    if (!dateString) return "";
    
    // Extrair apenas a parte da data (YYYY-MM-DD)
    const datePart = dateString.split('T')[0];
    
    // Criar objeto Date e aplicar timezone do usuário
    const date = new Date(datePart);
    const { timezone_name } = detectUserTimezone();
    
    // Retornar formatado com timezone correto
    return date.toLocaleDateString("pt-BR", {
      timeZone: timezone_name,
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return "Data inválida";
  }
};

/**
 * Ajusta datas para timezone local e formato ISO (YYYY-MM-DD)  
 * 🆕 ATUALIZADA: Agora com suporte a timezone automático
 */
export const adjustDatesForExport = (data: any[]): any[] => {
  const { timezone_name } = detectUserTimezone();
  
  return data.map(item => {
    const formattedItem = { ...item };
    // Lista de campos de data a ajustar
    const dateFields = [
      'data_ocorrencia',
      'data_atendimento',
      'data_encerramento',
      'data_inicio_sintomas',
      'data_nascimento',
      'created_at',
      'updated_at',
    ];
    
    dateFields.forEach(field => {
      if (formattedItem[field]) {
        const date = new Date(formattedItem[field]);
        // Ajustar para timezone do usuário
        const adjustedDate = new Date(date.toLocaleString("en-US", { timeZone: timezone_name }));
        formattedItem[field] = adjustedDate.toISOString().split('T')[0];
      }
    });
    return formattedItem;
  });
};

/**
 * Função de comparação para ordenação de dados
 * 🆕 ATUALIZADO: Tratamento especial para valores vazios e timestamps ISO
 */
export const compareValues = (valA: any, valB: any, sortOrder: "asc" | "desc"): number => {
  // 🛡️ TRATAR VALORES VAZIOS/NULL/UNDEFINED primeiro
  const isEmptyA = !valA || valA === "" || valA === null || valA === undefined;
  const isEmptyB = !valB || valB === "" || valB === null || valB === undefined;
  
  // Se ambos vazios, são iguais
  if (isEmptyA && isEmptyB) return 0;
  
  // Valores vazios sempre vão para o final
  if (isEmptyA) return 1;  // A vai para o final
  if (isEmptyB) return -1; // B vai para o final
  
  // 🆕 Para timestamps ISO (formato: 2025-10-12T14:30:25.000Z)
  if (typeof valA === 'string' && typeof valB === 'string') {
    // Detectar se é um timestamp ISO completo
    const isISOA = valA.includes('T') && (valA.includes('Z') || valA.includes('+') || valA.match(/-\d{2}:\d{2}$/));
    const isISOB = valB.includes('T') && (valB.includes('Z') || valB.includes('+') || valB.match(/-\d{2}:\d{2}$/));
    
    if (isISOA && isISOB) {
      try {
        const dateA = new Date(valA);
        const dateB = new Date(valB);
        
        // Verificar se as datas são válidas
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          const diff = dateA.getTime() - dateB.getTime();
          return sortOrder === "asc" ? diff : -diff;
        }
      } catch (error) {
        console.warn('Erro ao comparar timestamps ISO:', error);
      }
    }
    
    // Para datas brasileiras DD/MM/YYYY
    if (valA.includes('/') && valB.includes('/')) {
      const partsA = valA.split('/');
      const partsB = valB.split('/');
      
      if (partsA.length === 3 && partsB.length === 3) {
        const dateA = new Date(+partsA[2], +partsA[1] - 1, +partsA[0]);
        const dateB = new Date(+partsB[2], +partsB[1] - 1, +partsB[0]);
        
        return sortOrder === "asc" 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      }
    }
    
    // Para strings normais
    return sortOrder === "asc"
      ? valA.localeCompare(valB, "pt-BR")
      : valB.localeCompare(valA, "pt-BR");
  }
  
  // Para outros tipos (números, etc)
  if (valA < valB) return sortOrder === "asc" ? -1 : 1;
  if (valA > valB) return sortOrder === "asc" ? 1 : -1;
  return 0;
};

/**
 * Extrai valor para comparação com base na chave de ordenação
 * 🆕 ATUALIZADO: Suporte para created_at com timestamp REAL (offline_id ou created_at)
 */
export const getValueForSorting = (notificacao: Notificacao, sortKey: keyof Notificacao): any => {
  if (sortKey === "paciente") {
    return notificacao.paciente || "";
  } else if (sortKey === "tipo_evento") {
    return notificacao.tipoEvento || "";
  } else if (sortKey === "data_ocorrencia") {
    return notificacao.dataOcorrencia || "";
  } else if (sortKey === "data_atendimento") {
    return notificacao.original?.data_atendimento || "";
  } else if (sortKey === "tipo_atendimento") {
    return notificacao.tipoAtendimento || "";
  } else if (sortKey === "tipo_encerramento") {
    return notificacao.tipoEncerramento || "";
  } else if (sortKey === "unidade_notificadora") {
    // 🆕 Ordenar por nome do estabelecimento notificador
    return notificacao.original
      ?.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento
      ?.nome || "";
  } else if (sortKey === "created_at") {
    // 🆕 PRIORIDADE: synced_at > offline_id timestamp > created_at
    const original = notificacao.original;
    
    // 1️⃣ Se tem synced_at (foi sincronizado), usar essa data
    if (original?.synced_at) {
      return new Date(original.synced_at).toISOString();
    }
    
    // 2️⃣ Se foi criado offline, usar timestamp do offline_id
    if (original?.created_offline && original?.offline_id) {
      // Extrair timestamp do offline_id (formato: fp-XXXX-TIMESTAMP-XXXX)
      const parts = original.offline_id.split('-');
      if (parts.length >= 3) {
        const timestamp = parseInt(parts[2], 10);
        if (!isNaN(timestamp)) {
          // Retornar como ISO string para comparação consistente
          return new Date(timestamp).toISOString();
        }
      }
    }
    
    // 3️⃣ Fallback: usar created_at normal
    return original?.created_at || "";
  } else if (sortKey === "updated_at") {
    // 🆕 Retornar timestamp completo para ordenação precisa
    return notificacao.original?.updated_at || "";
  } else if (sortKey === "created_by_userid") {
    return notificacao.original?.created_by_userid || "";
  } else if (sortKey === "updated_by_userid") {
    return notificacao.original?.updated_by_userid || "";
  } else if (sortKey === "created_offline") {
    // 🆕 Ordenar por origem: offline (1) vem antes de online (0)
    return notificacao.original?.created_offline ? "1-offline" : "0-online";
  } else {
    return notificacao[sortKey] || "";
  }
};
// src/features/notificationForms/utils/index.ts
import { Notificacao } from "../types";
import { detectUserTimezone } from "../types/index2";

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
 */
export const compareValues = (valA: any, valB: any, sortOrder: "asc" | "desc"): number => {
  // Para datas, converter para objetos Date
  if (typeof valA === 'string' && valA.includes('/') && 
      typeof valB === 'string' && valB.includes('/')) {
    // Formato data brasileira DD/MM/YYYY
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
  
  // Para strings
  if (typeof valA === "string" && typeof valB === "string") {
    return sortOrder === "asc"
      ? valA.localeCompare(valB, "pt-BR")
      : valB.localeCompare(valA, "pt-BR");
  } else {
    // Para outros tipos
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  }
};

/**
 * Extrai valor para comparação com base na chave de ordenação
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
  } else {
    return notificacao[sortKey] || "";
  }
};
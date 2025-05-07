// src/utils/formatters.ts
export const formatBrazilianPhone = (phoneNumber: string): string => {
    // Remover todos os caracteres não numéricos
    const numericOnly = phoneNumber.replace(/\D/g, '');
    
    // Se não houver números, retornar string vazia
    if (!numericOnly) return '';
    
    // Se começar com +55, remover
    const nationalNumber = numericOnly.startsWith('55') ? 
      numericOnly.substring(2) : numericOnly;
    
    // Formatar com base no tamanho
    if (nationalNumber.length === 10) { // Telefone fixo
      return `(${nationalNumber.slice(0, 2)}) ${nationalNumber.slice(2, 6)}-${nationalNumber.slice(6)}`;
    } else if (nationalNumber.length === 11) { // Celular
      return `(${nationalNumber.slice(0, 2)}) ${nationalNumber.slice(2, 7)}-${nationalNumber.slice(7)}`;
    }
    
    // Se não se encaixar nos padrões, retornar como está
    return nationalNumber;
  };
// src/features/apps/components/shared/utils/textFormat.ts

export const formatText = (value: string): string => {
    return value
      .replace(/^\s+/, '') // Remove espaços no início
      .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um único
      .replace(/\s+$/, ''); // Remove espaços no final
  };
  
  export const capitalizeFirstLetter = (value: string): string => {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  };
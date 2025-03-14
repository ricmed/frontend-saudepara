// Constantes de validação baseadas no banco
export const FIELD_LENGTHS = {
    CODIGO_UNIDADE: 15,
    NOME: 80,
    CNES: 7,  // Atualizado para 7 dígitos
    CNPJ: 18, // XX.XXX.XXX/XXXX-XX
    CIDADE: 70,
    LOGRADOURO: 100,
    BAIRRO: 50,
    NUMERO: 10,
    LATITUDE: 45,
    LONGITUDE: 45
  } as const;
  
  export interface ValidationResult {
    isValid: boolean;
    message?: string;
  }
  
  // Validadores específicos
  export const validateLength = (value: string, maxLength: number): ValidationResult => {
    if (value.length > maxLength) {
      return {
        isValid: false,
        message: `O campo deve ter no máximo ${maxLength} caracteres`
      };
    }
    return { isValid: true };
  };

  export const validateCNPJ = (cnpj: string): ValidationResult => {
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/;
    if (!cnpj.match(cnpjRegex)) {
      return {
        isValid: false,
        message: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'
      };
    }
    return { isValid: true };
  };
  
  export const validateCNES = (cnes: string): ValidationResult => {
    const cnesRegex = /^\d{7}$/;
    if (!cnes.match(cnesRegex)) {
      return {
        isValid: false,
        message: 'CNES deve conter exatamente 7 dígitos'
      };
    }
    return { isValid: true };
  };
  
  export const validateCoordinates = (value: string, type: 'lat' | 'lng'): ValidationResult => {
    const num = Number(value);
    if (isNaN(num)) {
      return {
        isValid: false,
        message: 'Coordenada deve ser um número válido'
      };
    }
    if (type === 'lat' && (num < -90 || num > 90)) {
      return {
        isValid: false,
        message: 'Latitude deve estar entre -90 e 90'
      };
    }
    if (type === 'lng' && (num < -180 || num > 180)) {
      return {
        isValid: false,
        message: 'Longitude deve estar entre -180 e 180'
      };
    }
    return { isValid: true };
  };
  
  export const validateNumber = (value: string): ValidationResult => {
    if (!/^\d+$/.test(value)) {
      return {
        isValid: false,
        message: 'Este campo deve conter apenas números'
      };
    }
    return { isValid: true };
  };
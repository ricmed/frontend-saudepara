/**
 * Valida CPF usando o algoritmo oficial dos dígitos verificadores (Receita Federal).
 * Impede CPF digitado ao acaso: os dois últimos dígitos devem bater com o cálculo sobre os 9 primeiros.
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;

  const cleanCPF = cpf.replace(/[^\d]/g, '');

  if (cleanCPF.length !== 11) return false;

  // Rejeita sequências inválidas (todos os dígitos iguais)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;
  if (digit1 !== parseInt(cleanCPF.charAt(9), 10)) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;
  if (digit2 !== parseInt(cleanCPF.charAt(10), 10)) return false;

  return true;
}

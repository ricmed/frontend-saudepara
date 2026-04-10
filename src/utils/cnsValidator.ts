/**
 * Valida CNS (Cartão Nacional de Saúde) usando o algoritmo oficial.
 * Impede CNS digitado ao acaso: definitivo (1 ou 2) e provisório (7, 8 ou 9) têm dígitos verificadores.
 */
export function validateCNS(cns: string): boolean {
  if (!cns) return false;

  const cleanCNS = cns.replace(/\D/g, '');
  if (cleanCNS.length !== 15) return false;

  // CNS provisório (começa com 7, 8 ou 9): soma ponderada, resto da divisão por 11 deve ser 0
  if (/^[789]/.test(cleanCNS)) {
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      sum += parseInt(cleanCNS.charAt(i), 10) * (15 - i);
    }
    return sum % 11 === 0;
  }

  // CNS definitivo (começa com 1 ou 2): 11 dígitos PIS + 4 dígitos verificadores
  if (/^[12]/.test(cleanCNS)) {
    const pis = cleanCNS.substring(0, 11);
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(pis.charAt(i), 10) * (15 - i);
    }
    const resto = sum % 11;
    const dv = resto === 0 ? 0 : 11 - resto;
    const calculatedCNS = pis + dv.toString().padStart(4, '0');
    return calculatedCNS === cleanCNS;
  }

  return false;
}

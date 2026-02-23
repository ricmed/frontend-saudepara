/**
 * Valida número de passaporte (padrão brasileiro: 2 letras + 6 dígitos = 8 caracteres).
 * Ex.: AB123456, CS265436. Impede digitação aleatória fora do formato.
 */
export function validatePassaporte(passaporte: string): boolean {
  if (!passaporte) return false;
  const clean = String(passaporte).trim().replace(/\s/g, '').toUpperCase();
  return /^[A-Z]{2}\d{6}$/.test(clean);
}

/** Normaliza para exibição/gravação: 2 letras + 6 dígitos, maiúsculas, até 8 caracteres. */
export function normalizePassaporte(passaporte: string): string {
  const s = String(passaporte).trim().replace(/\s/g, '').toUpperCase();
  const letters = s.replace(/\d/g, '').slice(0, 2);
  const digits = s.replace(/\D/g, '').slice(0, 6);
  return (letters + digits).slice(0, 8);
}

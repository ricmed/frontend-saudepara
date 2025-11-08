/**
 * Utilitários de Criptografia para Autenticação Offline
 * 
 * Usa Web Crypto API para criptografia AES-256-GCM
 * Seguro para armazenar tokens e dados sensíveis
 */

/**
 * Gera uma chave de criptografia a partir de uma senha/PIN
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Importar senha como chave
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derivar chave usando PBKDF2
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000, // 100k iterações para segurança
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Criptografa dados usando AES-256-GCM
 */
export async function encryptData(data: string, password: string): Promise<string> {
  try {
    // Gerar salt e IV aleatórios
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derivar chave
    const key = await deriveKey(password, salt);

    // Criptografar
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBuffer
    );

    // Combinar salt + iv + dados criptografados
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const resultArray = new Uint8Array(salt.length + iv.length + encryptedArray.length);
    resultArray.set(salt, 0);
    resultArray.set(iv, salt.length);
    resultArray.set(encryptedArray, salt.length + iv.length);

    // Converter para Base64
    return btoa(String.fromCharCode(...resultArray));
  } catch (error) {
    console.error('❌ Erro ao criptografar:', error);
    throw new Error('Falha na criptografia');
  }
}

/**
 * Descriptografa dados usando AES-256-GCM
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  try {
    // Decodificar Base64
    const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extrair salt, iv e dados
    const salt = encryptedArray.slice(0, 16);
    const iv = encryptedArray.slice(16, 28);
    const data = encryptedArray.slice(28);

    // Derivar chave
    const key = await deriveKey(password, salt);

    // Descriptografar
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    // Converter para string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('❌ Erro ao descriptografar:', error);
    throw new Error('Falha na descriptografia - PIN incorreto ou dados corrompidos');
  }
}

/**
 * Gera hash SHA-256 de uma string (para validar PIN)
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida se um PIN corresponde ao hash armazenado
 */
export async function validatePinHash(pin: string, storedHash: string): Promise<boolean> {
  const pinHash = await hashString(pin);
  return pinHash === storedHash;
}

/**
 * Gera um ID único para identificar a sessão offline
 */
export function generateSessionId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

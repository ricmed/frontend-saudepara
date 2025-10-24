/**
 * 🔐 Serviço de Criptografia para Dados Sensíveis Offline
 * 
 * Usa Web Crypto API (AES-GCM 256-bit) para criptografar dados sensíveis
 * armazenados no IndexedDB, prevenindo vazamento de dados.
 * 
 * IMPORTANTE: A chave é derivada do ID do usuário + salt fixo.
 * Para produção, considere usar chaves gerenciadas pelo servidor.
 */

class EncryptionService {
  private algorithm = 'AES-GCM';
  private keyLength = 256;
  private saltPhrase = 'saude-para-offline-2025'; // ✅ Salt fixo (mudar para ambiente)
  
  /**
   * Gera uma chave de criptografia baseada em uma senha/identificador
   * @param userIdentifier - Identificador único do usuário (ex: userId)
   */
  private async deriveKey(userIdentifier: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    
    // Combinar identificador do usuário com salt
    const keyMaterial = encoder.encode(userIdentifier + this.saltPhrase);
    
    // Importar como chave base
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derivar chave AES-GCM
    const salt = encoder.encode(this.saltPhrase);
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // 100k iterações para segurança
        hash: 'SHA-256'
      },
      importedKey,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
    
    return key;
  }
  
  /**
   * Obtém identificador do usuário atual (fallback para deviceId)
   */
  private async getUserIdentifier(): Promise<string> {
    try {
      // Tentar buscar userId do localStorage/sessionStorage
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (userId) return userId;
      
      // Fallback: usar deviceId (já existe no sistema)
      const deviceId = localStorage.getItem('device_fingerprint');
      if (deviceId) return deviceId;
      
      // Último fallback: ID único do browser
      const browserId = localStorage.getItem('browser_id');
      if (browserId) return browserId;
      
      // Se não existe, criar um
      const newBrowserId = `browser-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('browser_id', newBrowserId);
      return newBrowserId;
    } catch (error) {
      console.error('Erro ao obter identificador:', error);
      // Fallback extremo
      return 'default-user-id';
    }
  }
  
  /**
   * Criptografa dados
   * @param data - Dados a serem criptografados (objeto ou string)
   * @returns Base64 string criptografada
   */
  async encrypt(data: any): Promise<string> {
    try {
      // 1. Serializar dados
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);
      
      // 2. Gerar IV (Initialization Vector) único
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits para GCM
      
      // 3. Obter chave
      const userIdentifier = await this.getUserIdentifier();
      const key = await this.deriveKey(userIdentifier);
      
      // 4. Criptografar
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        dataBuffer
      );
      
      // 5. Combinar IV + dados criptografados
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv, 0);
      combined.set(encryptedArray, iv.length);
      
      // 6. Converter para Base64 (sem spread operator para evitar stack overflow)
      let binary = '';
      const len = combined.length;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      const base64 = btoa(binary);
      
      console.log('🔐 Dados criptografados com sucesso');
      return base64;
    } catch (error) {
      console.error('❌ Erro ao criptografar:', error);
      throw new Error('Falha na criptografia');
    }
  }
  
  /**
   * Descriptografa dados
   * @param encryptedBase64 - String Base64 criptografada
   * @returns Dados originais
   */
  async decrypt(encryptedBase64: string): Promise<any> {
    try {
      // 1. Decodificar Base64
      const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
      
      // 2. Separar IV e dados criptografados
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);
      
      // 3. Obter chave
      const userIdentifier = await this.getUserIdentifier();
      const key = await this.deriveKey(userIdentifier);
      
      // 4. Descriptografar
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encryptedData
      );
      
      // 5. Decodificar e parsear JSON
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedBuffer);
      const data = JSON.parse(jsonString);
      
      console.log('🔓 Dados descriptografados com sucesso');
      return data;
    } catch (error) {
      console.error('❌ Erro ao descriptografar:', error);
      throw new Error('Falha na descriptografia');
    }
  }
  
  /**
   * Verifica se os dados estão criptografados
   * @param data - Dados para verificar
   * @returns true se parecem estar criptografados
   */
  isEncrypted(data: any): boolean {
    // Verifica se é uma string Base64 válida
    if (typeof data !== 'string') return false;
    
    try {
      // Tentar decodificar Base64
      atob(data);
      
      // Se conseguiu decodificar e tem tamanho razoável, provavelmente está criptografado
      return data.length > 50; // Dados criptografados são sempre grandes
    } catch {
      return false;
    }
  }
  
  /**
   * Criptografa array de objetos
   * @param items - Array de itens
   * @returns Array criptografado (cada item individual)
   */
  async encryptArray(items: any[]): Promise<string[]> {
    const encrypted: string[] = [];
    
    for (const item of items) {
      const encryptedItem = await this.encrypt(item);
      encrypted.push(encryptedItem);
    }
    
    return encrypted;
  }
  
  /**
   * Descriptografa array de strings criptografadas
   * @param encryptedItems - Array de strings Base64
   * @returns Array de objetos originais
   */
  async decryptArray(encryptedItems: string[]): Promise<any[]> {
    const decrypted: any[] = [];
    
    for (const encryptedItem of encryptedItems) {
      try {
        const decryptedItem = await this.decrypt(encryptedItem);
        decrypted.push(decryptedItem);
      } catch (error) {
        console.warn('⚠️ Erro ao descriptografar item, pulando...');
        // Continuar com os outros itens
      }
    }
    
    return decrypted;
  }
}

// Exportar instância singleton
const encryptionService = new EncryptionService();

// ✅ EXPOR GLOBALMENTE PARA DEBUG (apenas em desenvolvimento)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).encryptionService = encryptionService;
  console.log('🔐 encryptionService disponível globalmente para debug');
}

export default encryptionService;


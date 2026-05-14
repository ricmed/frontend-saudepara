/**
 * Serviço para gerar e gerenciar Device ID (fingerprint do navegador)
 * Usa características do navegador/dispositivo para identificação única
 */

class DeviceIdService {
  private deviceId: string | null = null;
  private readonly STORAGE_KEY = 'sp.device.id.v2';
  private readonly LEGACY_STORAGE_KEY = 'saude-para-device-id';
  private readonly TAB_NONCE_KEY = 'sp.device.tab.nonce';

  /**
   * Gera ou recupera o Device ID do dispositivo
   */
  async getDeviceId(): Promise<string> {
    // Se já temos em memória, retornar
    if (this.deviceId) {
      return this.deviceId;
    }

    // Tentar recuperar do sessionStorage (escopo por aba)
    const storedId = sessionStorage.getItem(this.STORAGE_KEY);
    if (storedId) {
      this.deviceId = storedId;
      console.log('📱 Device ID recuperado do storage:', storedId);
      return storedId;
    }

    // Limpar legado persistente para reduzir rastreamento cross-tab/sessão
    localStorage.removeItem(this.LEGACY_STORAGE_KEY);

    // Gerar novo Device ID (escopo de sessão/aba)
    const newId = await this.generateDeviceId();
    this.deviceId = newId;
    sessionStorage.setItem(this.STORAGE_KEY, newId);
    console.log('🆔 Novo Device ID gerado:', newId);
    
    return newId;
  }

  /**
   * Gera Device ID baseado em características do navegador/dispositivo
   */
  private async generateDeviceId(): Promise<string> {
    const components: string[] = [];

    try {
      // Identificador efêmero por aba (evita fingerprint estável entre abas/sessões)
      let tabNonce = sessionStorage.getItem(this.TAB_NONCE_KEY);
      if (!tabNonce) {
        tabNonce = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        sessionStorage.setItem(this.TAB_NONCE_KEY, tabNonce);
      }

      // 1. Nonce da aba
      components.push(tabNonce);

      // 2. Idioma
      components.push(navigator.language || 'unknown');

      // 3. Resolução da tela
      components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

      // 4. Timezone
      try {
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
      } catch {
        components.push('unknown-tz');
      }

      // 5. Hardware Concurrency (número de CPUs)
      components.push(String(navigator.hardwareConcurrency || 0));

      // Combinar tudo e gerar hash
      const combined = components.join('|');
      const hash = await this.hashString(combined);
      
      return `fp-${hash.substring(0, 16)}`;
    } catch (error) {
      console.warn('⚠️ Erro ao gerar Device ID, usando fallback:', error);
      // Fallback: timestamp + random
      return `fp-fallback-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }
  }

  /**
   * Gera hash SHA-256 de uma string
   */
  private async hashString(str: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.warn('⚠️ Erro ao gerar hash, usando fallback:', error);
      // Fallback simples se crypto.subtle não estiver disponível
      return this.simpleHash(str);
    }
  }

  /**
   * Hash simples como fallback
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Gera Offline ID único: {deviceId}-{timestamp}-{random}
   * Exemplo: fp-a1b2c3d4e5f6-1697398765432-x9y8
   */
  async generateOfflineId(): Promise<string> {
    const deviceId = await this.getDeviceId();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    
    const offlineId = `${deviceId}-${timestamp}-${random}`;
    console.log('🆔 Offline ID gerado:', offlineId);
    
    return offlineId;
  }

  /**
   * Verifica se um ID é offline (contém deviceId pattern)
   */
  isOfflineId(id: string): boolean {
    return id.startsWith('fp-') && id.includes('-') && id.split('-').length >= 3;
  }

  /**
   * Extrai o Device ID de um Offline ID
   */
  extractDeviceIdFromOfflineId(offlineId: string): string | null {
    try {
      const parts = offlineId.split('-');
      if (parts.length >= 3 && parts[0] === 'fp') {
        return `${parts[0]}-${parts[1]}`; // fp-xxxxx
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extrai o timestamp de um Offline ID
   */
  extractTimestampFromOfflineId(offlineId: string): number | null {
    try {
      const parts = offlineId.split('-');
      if (parts.length >= 3) {
        return parseInt(parts[2]);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Limpa Device ID (útil para testes)
   */
  clearDeviceId(): void {
    this.deviceId = null;
    sessionStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.TAB_NONCE_KEY);
    localStorage.removeItem(this.LEGACY_STORAGE_KEY);
    console.log('🗑️ Device ID limpo');
  }

  /**
   * Obtém informações sobre o dispositivo (para debug)
   */
  async getDeviceInfo(): Promise<{
    deviceId: string;
    userAgent: string;
    platform: string;
    language: string;
    screen: string;
    timezone: string;
  }> {
    const deviceId = await this.getDeviceId();
    
    return {
      deviceId,
      userAgent: navigator.userAgent,
      platform: navigator.platform || 'unknown',
      language: navigator.language || 'unknown',
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
}

export const deviceIdService = new DeviceIdService();
export default deviceIdService;

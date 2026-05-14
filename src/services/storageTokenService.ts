/**
 * Serviço para gerenciar tokens do Storage API
 * Lida com autenticação, renovação e expiração de tokens
 */

interface StorageTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // timestamp em milissegundos
}

class StorageTokenService {
  private static instance: StorageTokenService;
  private tokens: StorageTokens | null = null;
  private readonly STORAGE_KEY = 'sp.auth.storage.tokens.v1';
  private readonly LEGACY_STORAGE_KEY = 'storage_tokens';
  private readonly TOKEN_BUFFER = 5 * 60 * 1000; // 5 minutos de buffer antes da expiração
  private renewalPromise: Promise<string> | null = null;

  // URLs da API (do .env)
  private readonly STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_BASE_URL || 'https://api.hml.saude.pa.gov.br/storage-api';
  private readonly OAUTH_CLIENT_ID = 'sespaweb'; // Do backend .env
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  private constructor() {
    this.loadTokensFromStorage();
  }

  static getInstance(): StorageTokenService {
    if (!StorageTokenService.instance) {
      StorageTokenService.instance = new StorageTokenService();
    }
    return StorageTokenService.instance;
  }

  /**
   * Carrega tokens do sessionStorage (com migração de legado)
   */
  private loadTokensFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.tokens = JSON.parse(stored);
        console.log('🔑 Tokens carregados do storage');
        return;
      }

      const legacyStored = localStorage.getItem(this.LEGACY_STORAGE_KEY);
      if (legacyStored) {
        this.tokens = JSON.parse(legacyStored);
        sessionStorage.setItem(this.STORAGE_KEY, legacyStored);
        localStorage.removeItem(this.LEGACY_STORAGE_KEY);
        console.log('🔑 Tokens legados migrados para sessionStorage');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tokens:', error);
      this.tokens = null;
    }
  }

  /**
   * Salva tokens no sessionStorage
   */
  private saveTokensToStorage(tokens: StorageTokens): void {
    try {
      this.tokens = tokens;
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
      console.log('💾 Tokens salvos no storage');
    } catch (error) {
      console.error('❌ Erro ao salvar tokens:', error);
    }
  }

  /**
   * Remove tokens do storage
   */
  private clearTokens(): void {
    this.tokens = null;
    sessionStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.LEGACY_STORAGE_KEY);
    console.log('🗑️ Tokens removidos');
  }

  /**
   * Verifica se o token está expirado ou próximo de expirar
   */
  private isTokenExpired(): boolean {
    if (!this.tokens) return true;
    
    const now = Date.now();
    const expiresWithBuffer = this.tokens.expiresAt - this.TOKEN_BUFFER;
    
    return now >= expiresWithBuffer;
  }

  /**
   * Obtém token válido (renova se necessário)
   */
  async getValidToken(): Promise<string> {
    // Se já tem um token válido, retornar
    if (this.tokens && !this.isTokenExpired()) {
      console.log('✅ Token ainda válido');
      return this.tokens.accessToken;
    }

    // Se já está renovando, aguardar a renovação em andamento
    if (this.renewalPromise) {
      console.log('⏳ Aguardando renovação em andamento...');
      return this.renewalPromise;
    }

    // Iniciar nova renovação
    console.log('🔄 Token expirado ou inexistente, obtendo novo...');
    this.renewalPromise = this.requestNewToken();

    try {
      const token = await this.renewalPromise;
      return token;
    } finally {
      this.renewalPromise = null;
    }
  }

  /**
   * Solicita novo token ao backend (que faz OAuth com Storage API)
   */
  private async requestNewToken(): Promise<string> {
    try {
      console.log('📡 Solicitando novo token ao backend...');
      
      // O backend tem um endpoint que faz OAuth com o Storage API
      // e retorna o token para o frontend
      const response = await fetch(`${this.API_BASE_URL}/storage/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Incluir cookies de autenticação
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.accessToken) {
        throw new Error('Token não retornado pelo servidor');
      }

      // Calcular quando o token expira
      const expiresIn = data.expiresIn || 3600; // Padrão: 1 hora
      const expiresAt = Date.now() + (expiresIn * 1000);

      const tokens: StorageTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt,
      };

      this.saveTokensToStorage(tokens);
      
      console.log(`✅ Novo token obtido (expira em ${expiresIn}s)`);
      return tokens.accessToken;

    } catch (error) {
      console.error('❌ Erro ao obter token:', error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Renova token usando refresh token (se disponível)
   */
  private async refreshToken(): Promise<string> {
    if (!this.tokens?.refreshToken) {
      console.log('⚠️ Sem refresh token, solicitando novo token');
      return this.requestNewToken();
    }

    try {
      console.log('🔄 Renovando token com refresh token...');
      
      const response = await fetch(`${this.API_BASE_URL}/storage/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          refreshToken: this.tokens.refreshToken,
        }),
      });

      if (!response.ok) {
        console.warn('⚠️ Refresh falhou, solicitando novo token');
        return this.requestNewToken();
      }

      const data = await response.json();
      
      const expiresIn = data.expiresIn || 3600;
      const expiresAt = Date.now() + (expiresIn * 1000);

      const tokens: StorageTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || this.tokens.refreshToken,
        expiresAt,
      };

      this.saveTokensToStorage(tokens);
      
      console.log(`✅ Token renovado (expira em ${expiresIn}s)`);
      return tokens.accessToken;

    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      return this.requestNewToken();
    }
  }

  /**
   * Força renovação do token
   */
  async forceRefresh(): Promise<string> {
    this.clearTokens();
    return this.getValidToken();
  }

  /**
   * Limpa tokens (logout)
   */
  logout(): void {
    this.clearTokens();
  }
}

export default StorageTokenService.getInstance();

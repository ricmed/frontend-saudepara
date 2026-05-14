/**
 * Serviço de Autenticação Offline
 * 
 * Funcionalidades:
 * - Configuração de PIN para login offline
 * - Armazenamento seguro de tokens criptografados
 * - Validação de sessão offline
 * - Controle de expiração (7 dias)
 * - Revalidação automática quando online
 */

import { encryptData, decryptData, hashString, validatePinHash, generateSessionId } from '@/utils/cryptoUtils';

interface OfflineAuthData {
  pinHash: string; // Hash SHA-256 do PIN
  encryptedToken: string; // Token criptografado com o PIN
  encryptedUserData: string; // Dados do usuário criptografados
  sessionId: string; // ID único da sessão
  createdAt: number; // Timestamp de criação
  lastAccess: number; // Último acesso
  expiresAt: number; // Data de expiração (7 dias)
  failedAttempts?: number; // Tentativas de PIN inválidas
  lockoutUntil?: number; // Timestamp de lockout
}

interface MultiUserOfflineData {
  users: {
    [userId: string]: OfflineAuthData;
  };
}

class OfflineAuthService {
  private readonly STORAGE_KEY = 'sp.auth.offline.users.v2';
  private readonly LEGACY_STORAGE_KEY = 'offline_auth_data_multi';
  private readonly EXPIRATION_DAYS = 7;
  private readonly MAX_PIN_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

  /**
   * Obtém todos os dados de usuários offline
   */
  private getAllUsersData(): MultiUserOfflineData {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        const legacyData = localStorage.getItem(this.LEGACY_STORAGE_KEY);
        if (!legacyData) return { users: {} };

        const parsedLegacy = JSON.parse(legacyData);
        const migrated = this.normalizeUsersData(parsedLegacy);
        this.saveAllUsersData(migrated);
        localStorage.removeItem(this.LEGACY_STORAGE_KEY);
        return migrated;
      }
      return this.normalizeUsersData(JSON.parse(data));
    } catch {
      return { users: {} };
    }
  }

  /**
   * Salva dados de todos os usuários
   */
  private saveAllUsersData(data: MultiUserOfflineData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private normalizeUsersData(data: any): MultiUserOfflineData {
    const users = data?.users && typeof data.users === 'object' ? data.users : {};

    for (const userId of Object.keys(users)) {
      const current = users[userId];
      users[userId] = {
        ...current,
        failedAttempts: Number(current?.failedAttempts || 0) || 0,
        lockoutUntil: Number(current?.lockoutUntil || 0) || 0,
      };
    }

    return { users };
  }

  /**
   * Obtém os dados de um usuário específico
   */
  private getUserData(userId: string): OfflineAuthData | null {
    const allData = this.getAllUsersData();
    return allData.users[userId] || null;
  }

  /**
   * Verifica se o login offline está configurado para um usuário
   */
  isOfflineAuthEnabled(userId: string): boolean {
    try {
      const data = this.getUserData(userId);
      return data !== null && !this.isExpired(data);
    } catch {
      return false;
    }
  }

  /**
   * Lista todos os usuários com login offline configurado
   */
  getAvailableOfflineUsers(): Array<{ userId: string; userData: any; lastAccess: Date }> {
    const allData = this.getAllUsersData();
    const users: Array<{ userId: string; userData: any; lastAccess: Date }> = [];

    for (const [userId, authData] of Object.entries(allData.users)) {
      if (!this.isExpired(authData)) {
        try {
          // Não podemos descriptografar sem o PIN, mas podemos retornar info básica
          users.push({
            userId,
            userData: null, // Será preenchido após login
            lastAccess: new Date(authData.lastAccess)
          });
        } catch {
          continue;
        }
      }
    }

    return users;
  }

  hasAnyOfflineUsers(): boolean {
    const allData = this.getAllUsersData();
    return Object.values(allData.users).some((authData) => !this.isExpired(authData));
  }

  getMostRecentOfflineUserId(): string | null {
    const allData = this.getAllUsersData();
    const validEntries = Object.entries(allData.users).filter(([, authData]) => !this.isExpired(authData));
    if (validEntries.length === 0) return null;

    validEntries.sort(([, a], [, b]) => (b.lastAccess || 0) - (a.lastAccess || 0));
    return validEntries[0][0];
  }

  /**
   * Configura o PIN para login offline (após primeiro login online)
   */
  async setupOfflineAuth(userId: string, pin: string, token: string, userData: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Validar PIN (6 dígitos)
      if (!/^\d{6}$/.test(pin)) {
        return { success: false, error: 'PIN deve ter 6 dígitos numéricos' };
      }

      // Gerar hash do PIN
      const pinHash = await hashString(pin);

      // Criptografar token e dados do usuário
      const encryptedToken = await encryptData(token, pin);
      const encryptedUserData = await encryptData(JSON.stringify(userData), pin);

      // Criar dados de autenticação offline
      const now = Date.now();
      const authData: OfflineAuthData = {
        pinHash,
        encryptedToken,
        encryptedUserData,
        sessionId: generateSessionId(),
        createdAt: now,
        lastAccess: now,
        expiresAt: now + (this.EXPIRATION_DAYS * 24 * 60 * 60 * 1000),
        failedAttempts: 0,
        lockoutUntil: 0,
      };

      // Obter todos os dados e adicionar/atualizar este usuário
      const allData = this.getAllUsersData();
      allData.users[userId] = authData;
      this.saveAllUsersData(allData);

      console.log(`✅ Login offline configurado com sucesso para usuário ${userId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Erro ao configurar login offline:', error);
      return { success: false, error: error.message || 'Erro desconhecido' };
    }
  }

  /**
   * Valida o PIN e retorna os dados descriptografados
   */
  async validateOfflineLogin(userId: string, pin: string): Promise<{ 
    success: boolean; 
    token?: string; 
    userData?: any; 
    error?: string 
  }> {
    try {
      console.log(`🔐 Iniciando validação de login offline para usuário ${userId}...`);
      
      // Verificar se está bloqueado por tentativas excessivas
      if (this.isLockedOut(userId)) {
        const remainingTime = this.getRemainingLockoutTime(userId);
        console.log('🔒 Usuário bloqueado por tentativas excessivas');
        return { 
          success: false, 
          error: `Muitas tentativas incorretas. Tente novamente em ${Math.ceil(remainingTime / 60000)} minutos.` 
        };
      }

      // Obter dados armazenados
      console.log('📦 Buscando dados armazenados...');
      const authData = this.getUserData(userId);
      if (!authData) {
        console.log('❌ Nenhum dado offline encontrado');
        return { success: false, error: 'Login offline não configurado para este usuário' };
      }
      console.log('✅ Dados offline encontrados:', { sessionId: authData.sessionId, createdAt: new Date(authData.createdAt) });

      // Verificar expiração
      if (this.isExpired(authData)) {
        console.log('⏰ Sessão expirada');
        this.clearOfflineAuth(userId);
        return { success: false, error: 'Sessão offline expirada. Faça login online novamente.' };
      }
      console.log('✅ Sessão válida (expira em:', new Date(authData.expiresAt), ')');

      // Validar PIN
      console.log('🔑 Validando PIN...');
      const pinValid = await validatePinHash(pin, authData.pinHash);
      if (!pinValid) {
        console.log('❌ PIN incorreto');
        this.recordFailedAttempt(userId);
        const remainingAttempts = this.getRemainingAttempts(userId);
        return { 
          success: false, 
          error: `PIN incorreto. ${remainingAttempts} tentativas restantes.` 
        };
      }
      console.log('✅ PIN válido!');

      // PIN correto - limpar tentativas falhas
      this.clearFailedAttempts(userId);

      // Descriptografar token e dados do usuário
      console.log('🔓 Descriptografando dados...');
      const token = await decryptData(authData.encryptedToken, pin);
      console.log('✅ Token descriptografado');
      
      const userDataStr = await decryptData(authData.encryptedUserData, pin);
      console.log('✅ UserData descriptografado');
      
      const userData = JSON.parse(userDataStr);
      console.log('✅ UserData parseado:', userData);

      // Atualizar último acesso
      authData.lastAccess = Date.now();
      const allData = this.getAllUsersData();
      allData.users[userId] = authData;
      this.saveAllUsersData(allData);

      console.log('✅ Login offline validado com sucesso');
      return { success: true, token, userData };
    } catch (error: any) {
      console.error('❌ Erro ao validar login offline:', error);
      console.error('Stack trace:', error.stack);
      return { success: false, error: 'PIN incorreto ou dados corrompidos' };
    }
  }

  /**
   * Atualiza o token quando o usuário faz login online
   */
  async updateToken(userId: string, pin: string, newToken: string): Promise<boolean> {
    try {
      const authData = this.getUserData(userId);
      if (!authData) return false;

      // Validar PIN
      const pinValid = await validatePinHash(pin, authData.pinHash);
      if (!pinValid) return false;

      // Criptografar novo token
      authData.encryptedToken = await encryptData(newToken, pin);
      authData.lastAccess = Date.now();

      // Salvar
      const allData = this.getAllUsersData();
      allData.users[userId] = authData;
      this.saveAllUsersData(allData);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar token:', error);
      return false;
    }
  }

  /**
   * Altera o PIN do usuário
   */
  async changePin(userId: string, oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validar novo PIN
      if (!/^\d{6}$/.test(newPin)) {
        return { success: false, error: 'PIN deve ter 6 dígitos numéricos' };
      }

      const authData = this.getUserData(userId);
      if (!authData) {
        return { success: false, error: 'Login offline não configurado' };
      }

      // Validar PIN antigo
      const oldPinValid = await validatePinHash(oldPin, authData.pinHash);
      if (!oldPinValid) {
        return { success: false, error: 'PIN atual incorreto' };
      }

      // Descriptografar dados com PIN antigo
      const token = await decryptData(authData.encryptedToken, oldPin);
      const userDataStr = await decryptData(authData.encryptedUserData, oldPin);

      // Criptografar novamente com novo PIN
      const newPinHash = await hashString(newPin);
      const newEncryptedToken = await encryptData(token, newPin);
      const newEncryptedUserData = await encryptData(userDataStr, newPin);

      // Atualizar dados
      authData.pinHash = newPinHash;
      authData.encryptedToken = newEncryptedToken;
      authData.encryptedUserData = newEncryptedUserData;
      authData.lastAccess = Date.now();

      const allData = this.getAllUsersData();
      allData.users[userId] = authData;
      this.saveAllUsersData(allData);

      console.log('✅ PIN alterado com sucesso');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Erro ao alterar PIN:', error);
      return { success: false, error: error.message || 'Erro ao alterar PIN' };
    }
  }

  /**
   * Remove a configuração de login offline para um usuário
   */
  clearOfflineAuth(userId: string): void {
    const allData = this.getAllUsersData();
    delete allData.users[userId];
    this.saveAllUsersData(allData);
    this.clearFailedAttempts(userId);
    console.log(`🗑️ Login offline removido para usuário ${userId}`);
  }

  /**
   * Obtém informações sobre a sessão offline de um usuário
   */
  getSessionInfo(userId: string): {
    isEnabled: boolean;
    createdAt?: Date;
    lastAccess?: Date;
    expiresAt?: Date;
    daysRemaining?: number;
  } {
    const authData = this.getUserData(userId);
    if (!authData) {
      return { isEnabled: false };
    }

    const now = Date.now();
    const daysRemaining = Math.ceil((authData.expiresAt - now) / (24 * 60 * 60 * 1000));

    return {
      isEnabled: true,
      createdAt: new Date(authData.createdAt),
      lastAccess: new Date(authData.lastAccess),
      expiresAt: new Date(authData.expiresAt),
      daysRemaining: Math.max(0, daysRemaining)
    };
  }

  // ==================== Métodos Privados ====================

  private isExpired(authData: OfflineAuthData): boolean {
    return Date.now() > authData.expiresAt;
  }

  // Controle de tentativas falhas (escopado por usuário no blob de auth)
  private updateUserAuthData(userId: string, updater: (current: OfflineAuthData) => OfflineAuthData): void {
    const allData = this.getAllUsersData();
    const current = allData.users[userId];
    if (!current) return;

    allData.users[userId] = updater(current);
    this.saveAllUsersData(allData);
  }

  private recordFailedAttempt(userId: string): void {
    const attempts = this.getFailedAttempts(userId);
    const newAttempts = attempts + 1;
    const lockoutUntil = newAttempts >= this.MAX_PIN_ATTEMPTS ? Date.now() + this.LOCKOUT_TIME : 0;

    this.updateUserAuthData(userId, (current) => ({
      ...current,
      failedAttempts: newAttempts,
      lockoutUntil,
      lastAccess: Date.now(),
    }));
  }

  private getFailedAttempts(userId: string): number {
    const authData = this.getUserData(userId);
    return Number(authData?.failedAttempts || 0) || 0;
  }

  private getRemainingAttempts(userId: string): number {
    return Math.max(0, this.MAX_PIN_ATTEMPTS - this.getFailedAttempts(userId));
  }

  private clearFailedAttempts(userId: string): void {
    this.updateUserAuthData(userId, (current) => ({
      ...current,
      failedAttempts: 0,
      lockoutUntil: 0,
      lastAccess: Date.now(),
    }));
  }

  private isLockedOut(userId: string): boolean {
    const lockoutTime = Number(this.getUserData(userId)?.lockoutUntil || 0) || 0;
    return lockoutTime > 0 && Date.now() < lockoutTime;
  }

  private getRemainingLockoutTime(userId: string): number {
    const lockoutTime = Number(this.getUserData(userId)?.lockoutUntil || 0) || 0;
    if (!lockoutTime) return 0;

    return Math.max(0, lockoutTime - Date.now());
  }
}

// Exportar instância singleton
export const offlineAuthService = new OfflineAuthService();
export default offlineAuthService;

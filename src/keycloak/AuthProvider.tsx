import { createContext, useContext, useEffect, useState } from 'react';
import axios from '../utils/axiosRetry'; // Usar axios com retry configurado

const AuthContext = createContext<any>(null);
const USE_INTERNAL_AUTH = (import.meta as any).env?.VITE_USE_INTERNAL_AUTH === 'true';
const OFFLINE_MODE_KEY = 'sp.auth.offline.mode.v1';
const OFFLINE_USER_DATA_KEY = 'sp.auth.offline.user-data.v1';
const LEGACY_OFFLINE_MODE_KEY = 'offline_mode';
const LEGACY_OFFLINE_USER_DATA_KEY = 'user_data';
const USER_IDENTIFIER_KEY = 'sp.user.id.v1';

const resolveUserIdentifier = (user: any): string | null =>
  user?.id || user?.sub || user?.email || user?.cpf || null;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    // Rotas públicas de formulário não devem disparar verificação de sessão (evita 401 + refresh desnecessário)
    try {
      const path = window.location?.pathname ?? '';
      if (path.startsWith('/f/')) {
        setUser(null);
        setLoading(false);
        return () => {
          alive = false;
        };
      }
    } catch {
      // ignore
    }

    // 🆕 Verificar se há login offline ativo
    const offlineMode = localStorage.getItem(OFFLINE_MODE_KEY) ?? localStorage.getItem(LEGACY_OFFLINE_MODE_KEY);
    const userData = localStorage.getItem(OFFLINE_USER_DATA_KEY) ?? localStorage.getItem(LEGACY_OFFLINE_USER_DATA_KEY);
    
    if (offlineMode === 'true' && userData) {
      console.log('🔄 Detectado login offline, carregando usuário...');
      try {
        const parsedUser = JSON.parse(userData);
        if (alive) {
          setUser(parsedUser);
          setLoading(false);
          const userIdentifier = resolveUserIdentifier(parsedUser);
          if (userIdentifier) {
            sessionStorage.setItem(USER_IDENTIFIER_KEY, String(userIdentifier));
          }
          localStorage.setItem(OFFLINE_MODE_KEY, 'true');
          localStorage.setItem(OFFLINE_USER_DATA_KEY, userData);
          localStorage.removeItem(LEGACY_OFFLINE_MODE_KEY);
          localStorage.removeItem(LEGACY_OFFLINE_USER_DATA_KEY);
        }
        return;
      } catch (error) {
        console.error('Erro ao carregar dados offline:', error);
      }
    }
    
    // Tentar login normal via API
    // Em homologação, SW/proxy às vezes pode deixar a request "pendurada".
    // Para evitar loop infinito no login, forçamos timeout e um fallback de segurança.
    const safetyTimer = window.setTimeout(() => {
      if (!alive) return;
      console.warn('⏳ Timeout ao verificar autenticação. Prosseguindo como não autenticado.');
      setUser(null);
      setLoading(false);
    }, 12_000);

    axios
      .get(USE_INTERNAL_AUTH ? '/api/auth/profile' : '/api-auth/protected/profile', {
        withCredentials: true,
        timeout: 10_000,
      })
      .then((res) => {
        if (!alive) return;
        setUser(res.data);
        const userIdentifier = resolveUserIdentifier(res.data);
        if (userIdentifier) {
          sessionStorage.setItem(USER_IDENTIFIER_KEY, String(userIdentifier));
        }
        // Limpar modo offline se conseguir conectar
        localStorage.removeItem(OFFLINE_MODE_KEY);
        localStorage.removeItem(OFFLINE_USER_DATA_KEY);
        localStorage.removeItem(LEGACY_OFFLINE_MODE_KEY);
        localStorage.removeItem(LEGACY_OFFLINE_USER_DATA_KEY);
      })
      .catch((err) => {
        if (!alive) return;
        setUser(null);
        // não travar o app em homologação quando o backend responde 401/erro
        console.warn('Falha ao verificar autenticação:', err);
      })
      .finally(() => {
        window.clearTimeout(safetyTimer);
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // 🆕 Listener para evento de login offline
  useEffect(() => {
    const handleOfflineLogin = (event: any) => {
      console.log('📥 Evento de login offline recebido:', event.detail);
      setUser(event.detail);
    };

    window.addEventListener('offline-login-success', handleOfflineLogin);
    return () => window.removeEventListener('offline-login-success', handleOfflineLogin);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setRetryMessage(null);
      
      await axios.post(USE_INTERNAL_AUTH ? '/api/auth/login' : '/api-auth/auth/login', { username, password }, { withCredentials: true });
      const res = await axios.get(USE_INTERNAL_AUTH ? '/api/auth/profile' : '/api-auth/protected/profile', { withCredentials: true });
      
      setUser(res.data);
      const userIdentifier = resolveUserIdentifier(res.data);
      if (userIdentifier) {
        sessionStorage.setItem(USER_IDENTIFIER_KEY, String(userIdentifier));
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        setRetryMessage('Muitas tentativas de login. O sistema está fazendo nova tentativa automaticamente...');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post(USE_INTERNAL_AUTH ? '/api/auth/logout' : '/api-auth/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.warn('Erro no logout, mas prosseguindo...', error);
    } finally {
      setUser(null);
      setRetryMessage(null);
      sessionStorage.removeItem(USER_IDENTIFIER_KEY);
      // 🆕 Limpar modo offline ao fazer logout
      localStorage.removeItem(OFFLINE_MODE_KEY);
      localStorage.removeItem(OFFLINE_USER_DATA_KEY);
      localStorage.removeItem(LEGACY_OFFLINE_MODE_KEY);
      localStorage.removeItem(LEGACY_OFFLINE_USER_DATA_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, retryMessage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

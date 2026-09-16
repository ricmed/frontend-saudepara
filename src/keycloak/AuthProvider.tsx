import { createContext, useContext, useEffect, useRef, useState } from 'react';
import axios from '../utils/axiosRetry'; // Usar axios com retry configurado
import {
  clearLastKnownUser,
  persistLastKnownUser,
  readLastKnownUser,
  shouldKeepLastKnownSession,
} from '@/services/lastKnownAuthSession';

const AuthContext = createContext<any>(null);
const USE_INTERNAL_AUTH = (import.meta as any).env?.VITE_USE_INTERNAL_AUTH === 'true';
const OFFLINE_MODE_KEY = 'sp.auth.offline.mode.v1';
const OFFLINE_USER_DATA_KEY = 'sp.auth.offline.user-data.v1';
const LEGACY_OFFLINE_MODE_KEY = 'offline_mode';
const LEGACY_OFFLINE_USER_DATA_KEY = 'user_data';
const USER_IDENTIFIER_KEY = 'sp.user.id.v1';

const resolveUserIdentifier = (user: any): string | null =>
  user?.id || user?.sub || user?.email || user?.cpf || user?.username || null;

const applyUserToClient = (nextUser: any, setUser: (user: any) => void) => {
  setUser(nextUser);
  const userIdentifier = resolveUserIdentifier(nextUser);
  if (userIdentifier) {
    sessionStorage.setItem(USER_IDENTIFIER_KEY, String(userIdentifier));
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const authGenerationRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const generation = authGenerationRef.current;

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

    // PIN legado: se alguém ainda tiver no dispositivo, não quebra. Sairé/Círio não usam este caminho.
    const offlineMode = localStorage.getItem(OFFLINE_MODE_KEY) ?? localStorage.getItem(LEGACY_OFFLINE_MODE_KEY);
    const userData = localStorage.getItem(OFFLINE_USER_DATA_KEY) ?? localStorage.getItem(LEGACY_OFFLINE_USER_DATA_KEY);
    
    if (offlineMode === 'true' && userData) {
      console.log('🔄 Detectado login offline, carregando usuário...');
      try {
        const parsedUser = JSON.parse(userData);
        if (alive) {
          applyUserToClient(parsedUser, setUser);
          persistLastKnownUser(parsedUser);
          setLoading(false);
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

    const cachedUser = readLastKnownUser();
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    // Só hidrata na hora se estiver sem rede. Com rede, espera o /profile como hoje
    // (401 continua deslogando; evita tela logada fantasma).
    if (cachedUser && isOffline) {
      applyUserToClient(cachedUser, setUser);
      setLoading(false);
    }
    
    const safetyTimer = window.setTimeout(() => {
      if (!alive || generation !== authGenerationRef.current) return;
      console.warn('⏳ Timeout ao verificar autenticação. Mantendo sessão local se houver.');
      const fallback = readLastKnownUser();
      if (fallback) {
        applyUserToClient(fallback, setUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    }, 12_000);

    axios
      .get(USE_INTERNAL_AUTH ? '/api/auth/profile' : '/api-auth/protected/profile', {
        withCredentials: true,
        timeout: 10_000,
      })
      .then((res) => {
        if (!alive || generation !== authGenerationRef.current) return;
        applyUserToClient(res.data, setUser);
        persistLastKnownUser(res.data);
        localStorage.removeItem(OFFLINE_MODE_KEY);
        localStorage.removeItem(OFFLINE_USER_DATA_KEY);
        localStorage.removeItem(LEGACY_OFFLINE_MODE_KEY);
        localStorage.removeItem(LEGACY_OFFLINE_USER_DATA_KEY);
      })
      .catch((err) => {
        if (!alive || generation !== authGenerationRef.current) return;
        const fallback = readLastKnownUser();
        if (fallback && shouldKeepLastKnownSession(err)) {
          applyUserToClient(fallback, setUser);
          console.warn('Falha de rede ao verificar autenticação; sessão local mantida:', err);
          return;
        }
        clearLastKnownUser();
        setUser(null);
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
      
      const loginRes = await axios.post(
        USE_INTERNAL_AUTH ? '/api/auth/login' : '/api-auth/auth/login',
        { username, password },
        { withCredentials: true }
      );
      const loggedUser = loginRes.data?.user;
      authGenerationRef.current += 1;
      if (loggedUser) {
        applyUserToClient(loggedUser, setUser);
        persistLastKnownUser(loggedUser);
      }

      try {
        const res = await axios.get(USE_INTERNAL_AUTH ? '/api/auth/profile' : '/api-auth/protected/profile', { withCredentials: true });
        applyUserToClient(res.data, setUser);
        persistLastKnownUser(res.data);
        return { user: res.data };
      } catch (profileError) {
        if (loggedUser && shouldKeepLastKnownSession(profileError)) {
          return { user: loggedUser };
        }
        if (loggedUser) return { user: loggedUser };
        throw profileError;
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
      authGenerationRef.current += 1;
      setUser(null);
      setRetryMessage(null);
      sessionStorage.removeItem(USER_IDENTIFIER_KEY);
      clearLastKnownUser();
      localStorage.removeItem(OFFLINE_MODE_KEY);
      localStorage.removeItem(OFFLINE_USER_DATA_KEY);
      localStorage.removeItem(LEGACY_OFFLINE_MODE_KEY);
      localStorage.removeItem(LEGACY_OFFLINE_USER_DATA_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, retryMessage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

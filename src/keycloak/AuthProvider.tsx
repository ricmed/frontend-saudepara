import { createContext, useContext, useEffect, useState } from 'react';
import axios from '../utils/axiosRetry'; // Usar axios com retry configurado

const AuthContext = createContext<any>(null);
const USE_INTERNAL_AUTH = (import.meta as any).env?.VITE_USE_INTERNAL_AUTH === 'true';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  useEffect(() => {
    // 🆕 Verificar se há login offline ativo
    const offlineMode = localStorage.getItem('offline_mode');
    const userData = localStorage.getItem('user_data');
    
    if (offlineMode === 'true' && userData) {
      console.log('🔄 Detectado login offline, carregando usuário...');
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Erro ao carregar dados offline:', error);
      }
    }
    
    // Tentar login normal via API
    axios.get(USE_INTERNAL_AUTH ? '/api/auth/profile' : '/api-auth/protected/profile', { withCredentials: true })
      .then(res => {
        setUser(res.data);
        // Limpar modo offline se conseguir conectar
        localStorage.removeItem('offline_mode');
        localStorage.removeItem('user_data');
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
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
      // 🆕 Limpar modo offline ao fazer logout
      localStorage.removeItem('offline_mode');
      localStorage.removeItem('user_data');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, retryMessage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

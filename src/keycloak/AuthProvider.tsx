import { createContext, useContext, useEffect, useState } from 'react';
import axios from '../utils/axiosRetry'; // Usar axios com retry configurado

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  useEffect(() => {
    axios.get('/api-auth/protected/profile', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setRetryMessage(null);
      
      await axios.post('/api-auth/auth/login', { username, password }, { withCredentials: true });
      const res = await axios.get('/api-auth/protected/profile', { withCredentials: true });
      
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
      await axios.post('/api-auth/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.warn('Erro no logout, mas prosseguindo...', error);
    } finally {
      setUser(null);
      setRetryMessage(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, retryMessage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

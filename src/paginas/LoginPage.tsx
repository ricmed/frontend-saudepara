import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../keycloak/AuthProvider';
import { User, Lock, Shield, WifiOff } from 'lucide-react';
import { Header } from '../features/desktop/components/Header';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/i18n/useTranslations';
import { offlineAuthService } from '@/services/offlineAuthService';
import SetupPinModal from '@/features/auth/components/SetupPinModal';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login, loading, retryMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation(selectedLanguage);
  
  // 🆕 Estados para login offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [loginResult, setLoginResult] = useState<{ token: string; userData: any } | null>(null);
  const [hasOfflineAuth, setHasOfflineAuth] = useState(false);

  // Monitorar conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verificar se login offline está configurado
  useEffect(() => {
    // Verificar se HÁ QUALQUER usuário com PIN configurado (não precisa estar logado)
    const checkOfflineAuth = () => {
      try {
        const allData = localStorage.getItem('offline_auth_data_multi');
        if (allData) {
          const parsed = JSON.parse(allData);
          const hasUsers = Object.keys(parsed.users || {}).length > 0;
          setHasOfflineAuth(hasUsers);
        } else {
          setHasOfflineAuth(false);
        }
      } catch {
        setHasOfflineAuth(false);
      }
    };
    
    checkOfflineAuth();
  }, []);

  // Se já estiver logado, redireciona
  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    }
  }, [user, loading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = await login(username, password);
      
      // 🆕 Login online bem-sucedido!
      // Verificar se deve oferecer configuração de PIN
      if (result && result.user) {
        const userId = result.user.email || result.user.cpf || result.user.id || 'default';
        const hasPinConfigured = offlineAuthService.isOfflineAuthEnabled(userId);
        
        if (!hasPinConfigured) {
          // Salvar resultado do login para usar no modal de PIN
          setLoginResult({
            token: result.token || '',
            userData: result.user || {}
          });
          
          // Mostrar modal de configuração de PIN
          setShowPinSetup(true);
        }
      }
      // Se já tem PIN configurado, o useEffect acima vai redirecionar quando user for atualizado
    } catch (err) {
      setError(t('login.error.invalid'));
    }
  };

  // 🆕 Handler para quando usuário configurar PIN com sucesso
  const handlePinSetupSuccess = () => {
    setShowPinSetup(false);
    // Usuário já está logado, apenas fechar o modal
    // O useEffect vai redirecionar
  };

  // 🆕 Handler para login offline
  const handleOfflineLogin = () => {
    navigate('/offline-login');
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('login.verifying')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        onMenuToggle={handleMenuToggle} 
        isMobile={false} 
        selectedLanguage={selectedLanguage} 
      />
      
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg mx-4 sm:mx-auto">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-blue-600">{t('login.title')}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('login.subtitle')}
            </p>
          </div>
          
          {/* 🆕 Alert de conexão offline + botão de login offline */}
          {!isOnline && hasOfflineAuth && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <WifiOff className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900 mb-2">
                    Sem Conexão
                  </p>
                  <p className="text-xs text-orange-800 mb-3">
                    Você está offline, mas pode entrar usando seu PIN.
                  </p>
                  <button
                    onClick={handleOfflineLogin}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Entrar com PIN Offline
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {retryMessage && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">⚠️ {retryMessage}</span>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-blue-600" />
                </div>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-t-md relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-600 focus:border-blue-600 focus:z-10"
                  placeholder={t('login.username.placeholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!isOnline}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-blue-600" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-b-md relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-600 focus:border-blue-600 focus:z-10"
                  placeholder={t('login.password.placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!isOnline}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
                  disabled={!isOnline}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  {t('login.rememberMe')}
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
                  {t('login.forgotPassword')}
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={!isOnline}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('login.button')}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer selectedLanguage={selectedLanguage} />
      <SideMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      
      {/* 🆕 Modal de configuração de PIN */}
      {loginResult && (
        <SetupPinModal
          isOpen={showPinSetup}
          onClose={() => setShowPinSetup(false)}
          onSuccess={handlePinSetupSuccess}
          token={loginResult.token}
          userData={loginResult.userData}
        />
      )}
    </div>
  );
};

export default LoginPage;
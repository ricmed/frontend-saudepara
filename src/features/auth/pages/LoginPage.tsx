import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/keycloak/AuthProvider';
import { User, Lock } from 'lucide-react';
import { Header } from '@/features/desktop/components/Header';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/i18n/useTranslations';
import axios from '@/utils/axiosRetry';

const USE_INTERNAL_AUTH = (import.meta as any).env?.VITE_USE_INTERNAL_AUTH === 'true';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const { user, login, loading, retryMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation(selectedLanguage);

  // Estados para login offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Se já estiver logado, redireciona
  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    }
  }, [user, loading, navigate, location]);

  const mapLoginError = (err: any): string => {
    const code = err?.response?.data?.code as string | undefined;
    if (code === 'USER_NOT_FOUND') return t('login.error.userNotFound');
    if (code === 'INVALID_PASSWORD') return t('login.error.wrongPassword');
    if (code === 'PASSWORD_SETUP_REQUIRED') return t('login.passwordSetup.instruction');
    return t('login.error.invalid');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!navigator.onLine) {
      setError(t('login.error.offline'));
      return;
    }

    try {
      await login(username, password);
    } catch (err: any) {
      const code = err?.response?.data?.code as string | undefined;
      if (code === 'PASSWORD_SETUP_REQUIRED') {
        setShowPasswordSetup(true);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        return;
      }
      setError(mapLoginError(err));
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!navigator.onLine) {
      setError(t('login.error.offline'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('login.passwordSetup.mismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('login.error.invalid'));
      return;
    }

    setSetupSubmitting(true);
    try {
      await axios.post(
        USE_INTERNAL_AUTH ? '/api/auth/set-initial-password' : '/api-auth/auth/set-initial-password',
        {
          username: username.trim(),
          newPassword,
          confirmPassword,
        },
        { withCredentials: true }
      );
      setShowPasswordSetup(false);
      setNewPassword('');
      setConfirmPassword('');
      setPassword('');
      setSuccessMessage(t('login.passwordSetup.success'));
    } catch (err: any) {
      const code = err?.response?.data?.code as string | undefined;
      if (code === 'USER_NOT_FOUND') {
        setError(t('login.error.userNotFound'));
      } else if (err?.response?.data?.message) {
        setError(String(err.response.data.message));
      } else {
        setError(t('login.error.invalid'));
      }
    } finally {
      setSetupSubmitting(false);
    }
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
            <h2 className="mt-6 text-3xl font-bold text-blue-600">
              {showPasswordSetup ? t('login.passwordSetup.title') : t('login.title')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {showPasswordSetup ? t('login.passwordSetup.instruction') : t('login.subtitle')}
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}

          {retryMessage && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">⚠️ {retryMessage}</span>
            </div>
          )}

          {showPasswordSetup ? (
            <form className="mt-8 space-y-6" onSubmit={handlePasswordSetup}>
              <div className="rounded-md shadow-sm space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-blue-600" />
                  </div>
                  <input
                    type="text"
                    required
                    data-testid="setup-username"
                    className="appearance-none rounded-md relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 bg-gray-50 focus:outline-none focus:ring-blue-600 focus:border-blue-600"
                    placeholder={t('login.username.placeholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isOnline || setupSubmitting}
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-blue-600" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    data-testid="setup-new-password"
                    className="appearance-none rounded-md relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-600 focus:border-blue-600"
                    placeholder={t('login.passwordSetup.newPassword')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={!isOnline || setupSubmitting}
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-blue-600" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    data-testid="setup-confirm-password"
                    className="appearance-none rounded-md relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-600 focus:border-blue-600"
                    placeholder={t('login.passwordSetup.confirmPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!isOnline || setupSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  data-testid="setup-password-submit"
                  disabled={!isOnline || setupSubmitting}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('login.passwordSetup.button')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSetup(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  className="w-full text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {t('login.passwordSetup.back')}
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-blue-600" />
                  </div>
                  <input
                    type="text"
                    required
                    data-testid="login-username"
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
                    data-testid="login-password"
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
                  data-testid="login-submit"
                  disabled={!isOnline}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('login.button')}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer selectedLanguage={selectedLanguage} />
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
};

export default LoginPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/features/desktop/components/Header';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { 
  ArrowLeft, 
  Key, 
  Eye, 
  EyeOff, 
  Save,
  AlertCircle,
  Check,
  User as UserIcon
} from 'lucide-react';
import type { 
  User as AdminUser, 
  PasswordResetData, 
  Notification 
} from './types/admin.types';

const PasswordReset: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PasswordResetData>({
    password: '',
    confirmPassword: '',
    temporary: false,
  });

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api-auth/admin/users/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Usuário não encontrado');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      showNotification(t('admin.passwordReset.userNotFound'), 'error');
      setTimeout(() => navigate('/admin/users'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: Notification['type']) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = t('admin.passwordReset.validation.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('admin.passwordReset.validation.passwordMinLength');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('admin.passwordReset.validation.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api-auth/admin/users/${id}/reset-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
          temporary: formData.temporary,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao redefinir senha');
      }

      showNotification(t('admin.passwordReset.success'), 'success');
      
      // Limpar formulário
      setFormData({
        password: '',
        confirmPassword: '',
        temporary: false,
      });

      setTimeout(() => {
        navigate('/admin/users');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      showNotification(error.message || t('admin.passwordReset.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header 
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
          isMobile={false}
          selectedLanguage={selectedLanguage}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('admin.passwordReset.loading')}</p>
          </div>
        </main>
        <Footer selectedLanguage={selectedLanguage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho */}
      <Header 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        isMobile={false}
        selectedLanguage={selectedLanguage}
      />

      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
          notification.type === 'success' ? 'bg-green-100 border-green-500 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 border-red-500 text-red-700' :
          notification.type === 'warning' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
          'bg-blue-100 border-blue-500 text-blue-700'
        } border rounded-lg p-4 shadow-lg`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <Check className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Cabeçalho da página */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/admin/users')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('admin.passwordReset.title')}
              </h1>
              <p className="text-gray-600">
                {t('admin.passwordReset.subtitle')}
              </p>
            </div>
          </div>

          {/* Informações do usuário */}
          {user && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                {t('admin.passwordReset.userInfo')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t('admin.passwordReset.username')}
                  </label>
                  <p className="text-gray-900">{user.username}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t('admin.passwordReset.email')}
                  </label>
                  <p className="text-gray-900">{user.email || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t('admin.passwordReset.fullName')}
                  </label>
                  <p className="text-gray-900">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : '-'
                    }
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t('admin.passwordReset.status')}
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.enabled 
                      ? t('admin.passwordReset.enabled')
                      : t('admin.passwordReset.disabled')
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Formulário de redefinição de senha */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              {t('admin.passwordReset.newPassword')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.passwordReset.password')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('admin.passwordReset.passwordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.passwordReset.confirmPassword')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('admin.passwordReset.confirmPasswordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Gerador de senha */}
              <div>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {t('admin.passwordReset.generatePassword')}
                </button>
              </div>

              {/* Configurações */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="temporary"
                    checked={formData.temporary}
                    onChange={(e) => setFormData(prev => ({ ...prev, temporary: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="temporary" className="ml-2 text-sm text-gray-700">
                    {t('admin.passwordReset.temporaryPassword')}
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  {t('admin.passwordReset.temporaryPasswordHelp')}
                </p>
              </div>

              {/* Aviso de segurança */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      {t('admin.passwordReset.securityWarning')}
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {t('admin.passwordReset.securityWarningText')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  {t('admin.passwordReset.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving 
                    ? t('admin.passwordReset.resetting')
                    : t('admin.passwordReset.resetPassword')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <Footer selectedLanguage={selectedLanguage} />
      
      {/* Menu lateral */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={() => {}}
      />
    </div>
  );
};

export default PasswordReset;
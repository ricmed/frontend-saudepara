import { useState } from 'react';
import { useAuth } from '../AuthProvider';
import { Header } from '../../features/desktop/components/Header';
import Footer from '@/features/desktop/components/Footer';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosRetry';

const ChangePassword = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validação de requisitos da senha (mesma regra da criação de usuário)
  const isPasswordValid = formData.newPassword.length >= 6;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo ao digitar
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Limpar mensagens gerais
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Senha atual é obrigatória';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'A senha deve ter no mínimo 6 caracteres';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'A nova senha deve ser diferente da senha atual';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      await axios.post('/api-auth/protected/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }, { 
        withCredentials: true 
      });
      
      setSuccessMessage('Senha alterada com sucesso! Redirecionando...');
      
      // Limpar formulário
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Redirecionar para perfil após 2 segundos
      setTimeout(() => {
        navigate('/perfil');
      }, 2000);
      
    } catch (error: any) {
      if (error.response?.status === 401) {
        setErrors({ general: error.response.data?.message || 'Senha atual incorreta' });
      } else if (error.response?.status === 400) {
        setErrors({ general: error.response.data?.message || 'Dados inválidos' });
      } else if (error.response?.status === 429) {
        setErrors({ general: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
      } else if (error.response?.status === 500) {
        const mensagemErro = error.response.data?.message || error.response.data?.error || 'Erro interno do servidor';
        setErrors({ general: `Erro no servidor: ${mensagemErro}` });
      } else {
        setErrors({ general: 'Erro ao alterar senha. Tente novamente mais tarde.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded shadow text-center">
          <p className="mb-4">Você precisa estar logado para alterar a senha.</p>
          <a href="/login" className="text-blue-600 underline">Ir para login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho */}
      <Header 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        isMobile={false}
        selectedLanguage={'pt-BR'}
      />

      {/* Conteúdo principal */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center shadow">
              <Lock size={32} className="text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-600 text-center mb-2">
            Alterar Senha
          </h2>
          
          <p className="text-gray-600 text-center mb-6">
            Altere sua senha de acesso ao sistema
          </p>

          {/* Mensagens de sucesso/erro gerais */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}
          
          {errors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Senha Atual */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Senha Atual *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 pr-12 ${
                    errors.currentPassword 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            {/* Nova Senha */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 pr-12 ${
                    errors.newPassword 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
              
              {/* Requisito da senha */}
              {formData.newPassword && (
                <div className="mt-2 text-sm text-gray-600">
                  {formData.newPassword.length >= 6 ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle size={16} />
                      <span>Senha válida (mínimo 6 caracteres)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <XCircle size={16} />
                      <span>Mínimo de 6 caracteres</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 pr-12 ${
                    errors.confirmPassword 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/perfil')}
                className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || formData.newPassword.length < 6}
                className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Rodapé */}
      <Footer />
    </div>
  );
};

export default ChangePassword;

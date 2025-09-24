import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/keycloak/AuthProvider';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { AdminHeader } from './components/AdminHeader';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Building
} from 'lucide-react';

// Importar service de gestão de usuários
import {
  usuarioGestaoService,
  CreateUsuarioRequest
} from '@/services/UsuarioGestaoService';

interface UserFormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  emailVerified: boolean;
  password?: string;
  confirmPassword?: string;
  temporaryPassword: boolean;
}

const UserFormUnidade: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const { user } = useAuth();
  const userPermissions = useUserPermissions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isEditMode = !!id;
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    enabled: true,
    emailVerified: false,
    password: '',
    confirmPassword: '',
    temporaryPassword: true
  });

  // Obter informações da unidade do admin logado
  const adminEstabelecimentoId = userPermissions.estabelecimentoId;
  const adminUnidadeNome = user?.unidadeNome || 'Unidade do Administrador';

  useEffect(() => {
    if (isEditMode && id) {
      loadUser(id);
    }
  }, [id, isEditMode]);

  const loadUser = async (userId: string) => {
    try {
      setLoading(true);
      console.log('🔄 Carregando dados do usuário para edição...');
      
      const response = await fetch(`/api-auth/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const userData = await response.json();
      console.log('📝 Dados do usuário carregados:', userData);

      setFormData({
        username: userData.username || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        enabled: userData.enabled !== false,
        emailVerified: userData.emailVerified !== false,
        password: '',
        confirmPassword: '',
        temporaryPassword: true
      });

    } catch (error) {
      console.error('💥 Erro ao carregar usuário:', error);
      setNotification({
        message: `Erro ao carregar dados do usuário: ${error}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar username
    if (!formData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      newErrors.username = 'Nome de usuário pode conter apenas letras, números, pontos, hífens e underscores';
    }

    // Validar nome
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    }

    // Validar sobrenome
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Sobrenome é obrigatório';
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter um formato válido';
    }

    // Validar senha (apenas para criação ou se foi preenchida na edição)
    if (!isEditMode || formData.password) {
      if (!formData.password) {
        newErrors.password = 'Senha é obrigatória';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirmação de senha não confere';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setNotification({
        message: 'Por favor, corrija os erros no formulário',
        type: 'error'
      });
      return;
    }

    setSaving(true);
    
    try {
      setErrors({});
      setNotification(null);

      console.log('💾 Salvando usuário da unidade...');

      // Verificar se os dados de permissão foram carregados
      if (userPermissions.loading) {
        throw new Error('Aguardando carregamento dos dados de acesso do usuário...');
      }

      if (isEditMode && id) {
        // Editar usuário existente
        console.log('✏️ Modo edição - atualizando usuário existente');
        
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          enabled: formData.enabled,
          emailVerified: formData.emailVerified
        };

        const response = await fetch(`/api-auth/admin/users/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        // Se senha foi informada, atualizar também
        if (formData.password) {
          await fetch(`/api-auth/admin/users/${id}/reset-password`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'password',
              value: formData.password,
              temporary: formData.temporaryPassword
            })
          });
        }

        // 🔥 HARD DELETE: Limpar todos os acessos existentes antes de criar novos
        console.log('🗑️ Removendo todos os acessos existentes do usuário (hard delete)...');
        await usuarioGestaoService.hardDeleteTodosAcessosUsuario(id);
        
        // 🆕 Recriar o acesso específico para esta unidade
        console.log('🔗 Recriando acesso à unidade...');
        if (!adminEstabelecimentoId) {
          throw new Error('ID do estabelecimento não disponível para o admin logado');
        }
        
        await usuarioGestaoService.createAcessoUnidade(id, adminEstabelecimentoId);

        console.log('✅ Usuário atualizado com sucesso');
        setNotification({
          message: 'Usuário atualizado com sucesso!',
          type: 'success'
        });

      } else {
        // Criar novo usuário
        console.log('➕ Modo criação - criando novo usuário');
        
        const createRequest: CreateUsuarioRequest = {
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password!
        };

        console.log('📤 Dados para criação:', createRequest);

        // 1. Criar o usuário
        const novoUsuarioId = await usuarioGestaoService.createUsuario(createRequest);
        console.log('👤 Usuário criado com ID:', novoUsuarioId);

        if (!novoUsuarioId) {
          throw new Error('Falha ao criar usuário - ID não retornado');
        }

        // 2. Criar acesso para a unidade
        console.log('🔗 Criando acesso à unidade...');
        
        // Verificar se temos o ID do estabelecimento
        if (!adminEstabelecimentoId) {
          throw new Error('ID do estabelecimento não disponível para o admin logado');
        }
        
        await usuarioGestaoService.createAcessoUnidade(novoUsuarioId, adminEstabelecimentoId);

        console.log('✅ Usuário e acesso criados com sucesso');
        setNotification({
          message: 'Usuário criado com sucesso! Role "notificador" atribuída automaticamente.',
          type: 'success'
        });
      }

      // Aguardar 2 segundos para mostrar a mensagem, depois navegar
      setTimeout(() => {
        navigate('/admin/unidade/users');
      }, 2000);

    } catch (error: any) {
      console.error('💥 Erro ao salvar usuário:', error);
      
      let errorMessage = 'Erro desconhecido ao salvar usuário';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setNotification({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <AdminHeader 
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
          selectedLanguage={selectedLanguage}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados do usuário...</p>
          </div>
        </main>
        <Footer selectedLanguage={selectedLanguage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        selectedLanguage={selectedLanguage}
      />

      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/admin/unidade/users')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditMode ? 'Editar Usuário' : 'Criar Usuário'}
              </h1>
              <p className="text-gray-600">
                {isEditMode 
                  ? 'Atualize as informações do usuário da sua unidade'
                  : 'Adicione um novo usuário notificador à sua unidade'
                }
              </p>
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <div className={`mb-6 p-4 rounded-lg border ${
              notification.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
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

          {/* Informações do Contexto Administrativo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Building className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h3 className="font-medium text-blue-800">Contexto Administrativo</h3>
                <p className="text-sm text-blue-700">
                  Criando usuário para: <strong>{adminUnidadeNome}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  • Role automaticamente definida: <strong>notificador</strong><br/>
                  • Usuário será vinculado à sua unidade automaticamente
                </p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome de Usuário *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={isEditMode} // Username não pode ser alterado na edição
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.username ? 'border-red-500' : 'border-gray-300'
                    } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Ex: joao.silva"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="usuario@exemplo.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="João"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sobrenome *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Silva"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Status toggles */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => handleInputChange('enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
                    Conta habilitada
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailVerified"
                    checked={formData.emailVerified}
                    onChange={(e) => handleInputChange('emailVerified', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emailVerified" className="ml-2 block text-sm text-gray-700">
                    Email verificado
                  </label>
                </div>
              </div>
            </div>

            {/* Seção de Senha */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <Key className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditMode ? 'Alterar Senha (Opcional)' : 'Definir Senha'}
                </h2>
              </div>

              {isEditMode && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Deixe os campos de senha vazios se não quiser alterar a senha atual.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isEditMode ? 'Nova Senha' : 'Senha *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password || ''}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Digite a senha"
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
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword || ''}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirme a senha"
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

              <div className="mt-4 flex items-center">
                <input
                  type="checkbox"
                  id="temporaryPassword"
                  checked={formData.temporaryPassword}
                  onChange={(e) => handleInputChange('temporaryPassword', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="temporaryPassword" className="ml-2 block text-sm text-gray-700">
                  Senha temporária (usuário deve alterar no primeiro login)
                </label>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin/unidade/users')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Atualizar Usuário' : 'Criar Usuário'}
                  </>
                )}
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
    </div>
  );
};

export default UserFormUnidade;
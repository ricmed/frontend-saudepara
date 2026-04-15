import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/keycloak/AuthProvider';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useRoles } from './hooks/useAdminApi';
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
  MapPin
} from 'lucide-react';

// Importar service de gestão de usuários
import {
  usuarioGestaoService,
  CreateUsuarioRequest
} from '@/services/UsuarioGestaoService';

// Componente para seleção de estabelecimentos com pesquisa integrada
interface EstabelecimentoComboBoxProps {
  estabelecimentos: Array<{id: number; nome: string; cnes?: string; municipio?: string}>;
  value?: number;
  onChange: (value: number | undefined) => void;
  error?: string;
  placeholder?: string;
}

const EstabelecimentoComboBox: React.FC<EstabelecimentoComboBoxProps> = ({
  estabelecimentos,
  value,
  onChange,
  error,
  placeholder = "Digite para pesquisar..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayText, setDisplayText] = useState('');

  // Encontrar o estabelecimento selecionado
  const selectedEstabelecimento = estabelecimentos.find(est => est.id === value);

  // Filtrar estabelecimentos baseado na pesquisa
  const filteredEstabelecimentos = estabelecimentos.filter(est => {
    if (!searchTerm) return true;
    const termo = searchTerm.toLowerCase();
    const nome = est.nome?.toLowerCase() || '';
    const cnes = est.cnes?.toLowerCase() || '';
    const municipio = est.municipio?.toLowerCase() || '';
    return nome.includes(termo) || cnes.includes(termo) || municipio.includes(termo);
  });

  // Atualizar texto exibido quando valor muda
  useEffect(() => {
    if (selectedEstabelecimento) {
      setDisplayText(`${selectedEstabelecimento.nome}${selectedEstabelecimento.cnes ? ` (CNES: ${selectedEstabelecimento.cnes})` : ''}`);
      setSearchTerm('');
    } else {
      setDisplayText('');
      setSearchTerm('');
    }
  }, [selectedEstabelecimento]);

  const handleSelect = (estabelecimento: {id: number; nome: string; cnes?: string; municipio?: string}) => {
    onChange(estabelecimento.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <div className={`relative w-full border rounded-md focus-within:ring-2 focus-within:ring-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}>
        <input
          type="text"
          value={isOpen ? searchTerm : displayText}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 outline-none rounded-md"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 hover:text-gray-600"
          >
            ▼
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredEstabelecimentos.length > 0 ? (
            <>
              <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                {filteredEstabelecimentos.length} de {estabelecimentos.length} estabelecimentos
              </div>
              {filteredEstabelecimentos.map((est) => (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => handleSelect(est)}
                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 ${
                    value === est.id ? 'bg-blue-100 text-blue-800' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{est.nome}</div>
                  {est.cnes && (
                    <div className="text-sm text-gray-500">CNES: {est.cnes}</div>
                  )}
                  {est.municipio && (
                    <div className="text-sm text-gray-500">Município: {est.municipio}</div>
                  )}
                </button>
              ))}
            </>
          ) : (
            <div className="px-3 py-4 text-center text-gray-500">
              {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Nenhum estabelecimento encontrado'}
            </div>
          )}
        </div>
      )}

      {/* Overlay para fechar quando clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

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
  // Campos para seleção de nível de acesso
  nivelAcesso: 'unidade' | 'municipio' | 'estado';
  estabelecimentoId?: number;
  municipioId?: number;
  roles: Array<'notificador' | 'comunicacao.dae'>;
}

const UserFormEstado: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  useAuth();
  const userPermissions = useUserPermissions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { listRoles, addUserRoles } = useRoles();
  const [availableRoleReps, setAvailableRoleReps] = useState<any[]>([]);
  
  // Estados para dados de dropdowns
  const [estabelecimentos, setEstabelecimentos] = useState<Array<{id: number; nome: string; cnes?: string; municipio?: string}>>([]);
  const [municipios, setMunicipios] = useState<Array<{id: number; nome: string}>>([]);
  const [loadingEstabelecimentos, setLoadingEstabelecimentos] = useState(false);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);

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
    temporaryPassword: true,
    nivelAcesso: 'estado', // Padrão para estado (pré-selecionado)
    estabelecimentoId: undefined,
    municipioId: undefined,
    roles: []
  });

  // Obter informações do estado do admin logado usando userPermissions
  const adminEstadoId = userPermissions.estadoId;
  const adminEstadoNome = 'Estado do Administrador'; // TODO: buscar nome real do estado

  useEffect(() => {
    // Carregar representações das roles para poder atribuir via API (/users/:id/roles)
    (async () => {
      try {
        const all = await listRoles();
        const allow = new Set(['notificador', 'comunicacao.dae']);
        const reps = (Array.isArray(all) ? all : []).filter((r: any) => allow.has(r?.name));
        setAvailableRoleReps(reps);
      } catch (e) {
        console.warn('⚠️ Não foi possível carregar roles disponíveis', e);
        setAvailableRoleReps([]);
      }
    })();
  }, [listRoles]);

  useEffect(() => {
    if (isEditMode && id) {
      loadUser(id);
    }
    
    // Carregar estabelecimentos e municípios do estado quando o componente inicializar
    if (adminEstadoId) {
      loadEstabelecimentosEstado();
      loadMunicipiosEstado();
    }
  }, [id, isEditMode, adminEstadoId]);

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

      // Buscar acessos do usuário para determinar o nível correto
      console.log('🔍 Buscando acessos do usuário...');
      const userAcessos = await usuarioGestaoService.getUsuarioAcessos(userId);
      console.log('🔐 Acessos encontrados:', userAcessos);

      // Determinar nível de acesso e IDs
      let nivelAcesso: 'unidade' | 'municipio' | 'estado' = 'estado';
      let estabelecimentoId: number | undefined = undefined;
      let municipioId: number | undefined = undefined;

      if (userAcessos && userAcessos.length > 0) {
        // Procurar primeiro por acesso de unidade
        const acessoUnidade = userAcessos.find(acesso => 
          acesso.nivel_acesso === 'unidade' && 
          acesso.estabelecimento_id
        );
        
        if (acessoUnidade) {
          nivelAcesso = 'unidade';
          estabelecimentoId = acessoUnidade.estabelecimento_id;
          console.log('✅ Usuário tem acesso de unidade:', {
            estabelecimentoId,
            nomeEstabelecimento: acessoUnidade.estabelecimento?.nome
          });
        } else {
          // Verificar se tem acesso de município
          const acessoMunicipio = userAcessos.find(acesso => 
            acesso.nivel_acesso === 'municipio' && 
            acesso.tipo_municipio_id
          );
          
          if (acessoMunicipio) {
            nivelAcesso = 'municipio';
            municipioId = acessoMunicipio.tipo_municipio_id;
            console.log('✅ Usuário tem acesso de município:', {
              municipioId,
              nomeMunicipio: acessoMunicipio.tipo_municipio?.descricao
            });
          } else {
            // Verificar se tem acesso de estado
            const acessoEstado = userAcessos.find(acesso => 
              acesso.nivel_acesso === 'estado'
            );
            
            if (acessoEstado) {
              nivelAcesso = 'estado';
              console.log('✅ Usuário tem acesso de estado');
            }
          }
        }
      }

      setFormData({
        username: userData.username || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        enabled: userData.enabled !== false,
        emailVerified: userData.emailVerified !== false,
        password: '',
        confirmPassword: '',
        temporaryPassword: true,
        nivelAcesso: nivelAcesso,
        estabelecimentoId: estabelecimentoId,
        municipioId: municipioId,
        roles: [],
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

  const loadEstabelecimentosEstado = async () => {
    if (!adminEstadoId) return;
    
    try {
      setLoadingEstabelecimentos(true);
      console.log('🏥 Carregando estabelecimentos do estado:', adminEstadoId);
      
      // Usar endpoint que busca todos os estabelecimentos do estado
      const response = await fetch(`/api/estabelecimentos/estado/${adminEstadoId}`, { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const estabelecimentosDoEstado = await response.json();
        const estabelecimentosFormatados = estabelecimentosDoEstado.map((est: any) => ({
          id: est.idestabelecimento,
          nome: est.nome,
          cnes: est.cnes || undefined,
          municipio: est.municipio?.nome || 'Município não informado'
        }));
        setEstabelecimentos(estabelecimentosFormatados);
        console.log('✅ Estabelecimentos do estado carregados:', estabelecimentosFormatados.length);
      } else {
        console.warn('⚠️ Nenhum estabelecimento encontrado para o estado');
        setEstabelecimentos([]);
      }
    } catch (error) {
      console.error('💥 Erro ao carregar estabelecimentos:', error);
      setEstabelecimentos([]);
    } finally {
      setLoadingEstabelecimentos(false);
    }
  };

  const loadMunicipiosEstado = async () => {
    if (!adminEstadoId) return;
    
    try {
      setLoadingMunicipios(true);
      console.log('🏘️ Carregando municípios do estado:', adminEstadoId);
      
      // Usar endpoint que busca municípios por estado
      const response = await fetch(`/api/municipios/estado/${adminEstadoId}`, { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const municipiosDoEstado = await response.json();
        const municipiosFormatados = municipiosDoEstado.map((mun: any) => ({
          id: mun.idtipo_municipio,
          nome: mun.descricao
        }));
        setMunicipios(municipiosFormatados);
        console.log('✅ Municípios do estado carregados:', municipiosFormatados.length);
      } else {
        console.warn('⚠️ Nenhum município encontrado para o estado');
        setMunicipios([]);
      }
    } catch (error) {
      console.error('💥 Erro ao carregar municípios:', error);
      setMunicipios([]);
    } finally {
      setLoadingMunicipios(false);
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

    // Validar nível de acesso
    if (!formData.nivelAcesso) {
      newErrors.nivelAcesso = 'Nível de acesso é obrigatório';
    }

    if (formData.nivelAcesso === 'unidade' && !formData.estabelecimentoId) {
      newErrors.estabelecimentoId = 'Estabelecimento é obrigatório para nível de acesso Unidade';
    }

    if (formData.nivelAcesso === 'municipio' && !formData.municipioId) {
      newErrors.municipioId = 'Município é obrigatório para nível de acesso Município';
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
      console.log('💾 Salvando usuário do estado...');

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
          const errorData = await response.json();
          console.error('❌ Erro ao atualizar usuário:', errorData);
          
          // Mensagem de erro amigável
          let errorMessage = 'Erro ao atualizar usuário';
          
          if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
            errorMessage = errorData.details[0].message;
            
            // Destacar o campo com erro
            const errorField = errorData.details[0].field;
            if (errorField) {
              setErrors(prev => ({
                ...prev,
                [errorField]: errorData.details[0].message
              }));
            }
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.details) {
            errorMessage = errorData.details;
          }
          
          throw new Error(errorMessage);
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
        
        // 🆕 Recriar o acesso baseado no nível selecionado
        console.log('🔗 Recriando acesso baseado no nível:', formData.nivelAcesso);

        if (formData.nivelAcesso === 'estado') {
          if (!adminEstadoId) {
            throw new Error('ID do estado do administrador não encontrado');
          }
          await usuarioGestaoService.createAcessoEstado(id, adminEstadoId);
        } else if (formData.nivelAcesso === 'municipio' && formData.municipioId) {
          await usuarioGestaoService.createAcessoMunicipio(id, formData.municipioId);
        } else if (formData.nivelAcesso === 'unidade' && formData.estabelecimentoId) {
          await usuarioGestaoService.createAcessoUnidade(id, formData.estabelecimentoId);
        }

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
          password: formData.password!,
          enabled: true // Usuário habilitado por padrão
        };

        console.log('📤 Dados para criação:', createRequest);

        // 1. Criar o usuário
        const novoUsuarioId = await usuarioGestaoService.createUsuario(createRequest);
        console.log('👤 Usuário criado com ID:', novoUsuarioId);

        if (!novoUsuarioId) {
          throw new Error('Falha ao criar usuário - ID não retornado');
        }

        // 2. Criar acesso baseado no nível selecionado
        console.log('🔗 Criando acesso baseado no nível:', formData.nivelAcesso);

        if (formData.nivelAcesso === 'estado') {
          // Verificar se adminEstadoId está definido
          if (!adminEstadoId) {
            throw new Error('ID do estado do administrador não encontrado');
          }
          await usuarioGestaoService.createAcessoEstado(novoUsuarioId, adminEstadoId);
        } else if (formData.nivelAcesso === 'municipio' && formData.municipioId) {
          await usuarioGestaoService.createAcessoMunicipio(novoUsuarioId, formData.municipioId);
        } else if (formData.nivelAcesso === 'unidade' && formData.estabelecimentoId) {
          await usuarioGestaoService.createAcessoUnidade(novoUsuarioId, formData.estabelecimentoId);
        }

        // 3. Atribuir roles escolhidas (admin estadual não atribui role automática)
        if (!formData.roles || formData.roles.length === 0) {
          throw new Error('Selecione ao menos uma role para o usuário (notificador e/ou comunicacao.dae)');
        }
        const repsToAssign = availableRoleReps.filter((r: any) => formData.roles.includes(r?.name));
        if (repsToAssign.length !== formData.roles.length) {
          throw new Error('Não foi possível resolver todas as roles selecionadas. Recarregue a página e tente novamente.');
        }
        await addUserRoles(novoUsuarioId, repsToAssign);

        console.log('✅ Usuário e acesso criados com sucesso');
        setNotification({
          message: `Usuário criado com sucesso! Roles atribuídas: ${formData.roles.join(', ')}`,
          type: 'success'
        });
      }

      // Aguardar 2 segundos para mostrar a mensagem, depois navegar
      setTimeout(() => {
        navigate('/admin/estado/users');
      }, 2000);

    } catch (error: any) {
      console.error('💥 Erro ao salvar usuário:', error);
      
      // Extrair mensagem de erro mais específica
      let errorMessage = 'Erro ao salvar usuário';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        // Se há detalhes de validação, mostrar o primeiro erro
        if (Array.isArray(error.response.data.details) && error.response.data.details.length > 0) {
          errorMessage = error.response.data.details[0].message;
          
          // Destacar o campo com erro
          const errorField = error.response.data.details[0].field;
          if (errorField) {
            setErrors(prev => ({
              ...prev,
              [errorField]: error.response.data.details[0].message
            }));
          }
        } else {
          errorMessage = error.response.data.details;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setNotification({
        message: errorMessage,
        type: 'error'
      });
      
      // Scroll para o topo para ver o erro
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const toggleRole = (role: 'notificador' | 'comunicacao.dae') => {
    setFormData(prev => {
      const has = prev.roles.includes(role);
      const next = has ? prev.roles.filter(r => r !== role) : [...prev.roles, role];
      return { ...prev, roles: next };
    });
    if (errors.roles) {
      setErrors(prev => ({ ...prev, roles: '' }));
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
              onClick={() => navigate('/admin/estado/users')}
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
                  ? 'Atualize as informações do usuário do seu estado'
                  : 'Adicione um novo usuário ao seu estado'
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
              <MapPin className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h3 className="font-medium text-blue-800">Contexto Administrativo</h3>
                <p className="text-sm text-blue-700">
                  Criando usuário para: <strong>{adminEstadoNome}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  • Selecione as roles do usuário abaixo<br/>
                  • Usuário será vinculado ao seu estado automaticamente
                </p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Roles */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Roles do Usuário</h2>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Selecione uma ou mais roles para este usuário.
              </p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes('notificador')}
                    onChange={() => toggleRole('notificador')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">notificador</div>
                    <div className="text-sm text-gray-600">Acesso às notificações e rotinas de notificação.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes('comunicacao.dae')}
                    onChange={() => toggleRole('comunicacao.dae')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">comunicacao.dae</div>
                    <div className="text-sm text-gray-600">Acesso ao módulo de Comunicação DAE.</div>
                  </div>
                </label>
              </div>

              {errors.roles && (
                <p className="mt-2 text-sm text-red-600">{errors.roles}</p>
              )}
            </div>

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

            {/* Seção de Controle de Acesso */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Controle de Acesso</h2>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Estado:</strong> {adminEstadoNome} (ID: {adminEstadoId})
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  O usuário criado terá acesso baseado no nível selecionado abaixo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nível de Acesso */}
                <div>
                  <label htmlFor="nivelAcesso" className="block text-sm font-medium text-gray-700 mb-2">
                    Nível de Acesso *
                  </label>
                  <select
                    id="nivelAcesso"
                    value={formData.nivelAcesso}
                    onChange={(e) => {
                      const novoNivel = e.target.value as 'unidade' | 'municipio' | 'estado';
                      handleInputChange('nivelAcesso', novoNivel);
                      // Limpar campos quando muda o nível
                      if (novoNivel !== 'unidade') {
                        handleInputChange('estabelecimentoId', undefined);
                      }
                      if (novoNivel !== 'municipio') {
                        handleInputChange('municipioId', undefined);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nivelAcesso ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="estado">Nível Estado - {adminEstadoNome}</option>
                    <option value="municipio">Nível Município - Escolher Município</option>
                    <option value="unidade">Nível Unidade - Escolher Estabelecimento</option>
                  </select>
                  {errors.nivelAcesso && (
                    <p className="mt-1 text-sm text-red-600">{errors.nivelAcesso}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.nivelAcesso === 'estado' 
                      ? 'Acesso a todo o estado (pré-selecionado)'
                      : formData.nivelAcesso === 'municipio'
                      ? 'Acesso limitado a um município específico'
                      : 'Acesso limitado a um estabelecimento específico'
                    }
                  </p>
                </div>

                {/* Município - Mostrar apenas se nível for 'municipio' */}
                {formData.nivelAcesso === 'municipio' && (
                  <div>
                    <label htmlFor="municipioId" className="block text-sm font-medium text-gray-700 mb-2">
                      Município *
                    </label>
                    
                    {loadingMunicipios ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                        Carregando municípios...
                      </div>
                    ) : (
                      <select
                        id="municipioId"
                        value={formData.municipioId || ''}
                        onChange={(e) => handleInputChange('municipioId', Number(e.target.value) || undefined)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.municipioId ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Selecione um município...</option>
                        {municipios.map(municipio => (
                          <option key={municipio.id} value={municipio.id}>
                            {municipio.nome}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.municipioId && (
                      <p className="mt-1 text-sm text-red-600">{errors.municipioId}</p>
                    )}
                    {municipios.length === 0 && !loadingMunicipios && (
                      <p className="mt-1 text-sm text-orange-600">
                        Nenhum município encontrado para este estado
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Apenas municípios do estado {adminEstadoNome}
                    </p>
                  </div>
                )}

                {/* Estabelecimento - Mostrar apenas se nível for 'unidade' */}
                {formData.nivelAcesso === 'unidade' && (
                  <div>
                    <label htmlFor="estabelecimentoId" className="block text-sm font-medium text-gray-700 mb-2">
                      Estabelecimento *
                    </label>
                    
                    {loadingEstabelecimentos ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                        Carregando estabelecimentos...
                      </div>
                    ) : (
                      <EstabelecimentoComboBox
                        estabelecimentos={estabelecimentos}
                        value={formData.estabelecimentoId}
                        onChange={(value) => handleInputChange('estabelecimentoId', value)}
                        error={errors.estabelecimentoId}
                        placeholder="🔍 Digite para pesquisar ou clique para ver todos..."
                      />
                    )}
                    {errors.estabelecimentoId && (
                      <p className="mt-1 text-sm text-red-600">{errors.estabelecimentoId}</p>
                    )}
                    {estabelecimentos.length === 0 && !loadingEstabelecimentos && (
                      <p className="mt-1 text-sm text-orange-600">
                        Nenhum estabelecimento encontrado para este estado
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Todos os estabelecimentos do estado {adminEstadoNome}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin/estado/users')}
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

export default UserFormEstado;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminHeader } from './components/AdminHeader';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Key, 
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Building,
  MapPin,
  Globe
} from 'lucide-react';

// Importar service de gestão de usuários
import {
  usuarioGestaoService,
  PERMISSOES
} from '@/services/UsuarioGestaoService';

// 💡 Para permitir busca por CNES
type EstabelecimentoOption = { id: number; nome: string; cnes?: string };

// 🔤 Normalizador para busca acento/case-insensitive
const norm = (s?: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

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
  // Campos de controle de acesso
  nivelAcesso: 'unidade' | 'municipio' | 'estado';
  estabelecimentoId?: number;
  municipioId?: number;
  estadoId?: number;
  permissoes: number;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Estados para opções de dropdown
  const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoOption[]>([]);
  const [municipios, setMunicipios] = useState<Array<{id: number; descricao: string; estadoId?: number}>>([]);
  const [estados, setEstados] = useState<Array<{id: number; descricao: string}>>([]);

  // Bases para reuso/reset
  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<Array<{id: number; descricao: string; estadoId?: number}>>([]);

  // Estados para pesquisa nos dropdowns
  const [searchEstabelecimento, setSearchEstabelecimento] = useState('');
  const [searchMunicipio, setSearchMunicipio] = useState('');
  const [searchEstado, setSearchEstado] = useState('');

  // Estados filtrados para exibição
  const [estabelecimentosFiltrados, setEstabelecimentosFiltrados] = useState<EstabelecimentoOption[]>([]);
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState<Array<{id: number; descricao: string}>>([]);
  const [estadosFiltrados, setEstadosFiltrados] = useState<Array<{id: number; descricao: string}>>([]);

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
    temporaryPassword: false,
    // Valores padrão para controle de acesso
    nivelAcesso: 'unidade',
    permissoes: PERMISSOES.READ_WRITE,
  });

  useEffect(() => {
    loadRoles();
    loadDropdownData();
    if (isEditMode) {
      loadUser();
      loadUserRoles();
    }
  }, [id]);

  // Estabelecimentos: por nome (acento-insensitive) e CNES (numérico)
  useEffect(() => {
    const q = norm(searchEstabelecimento);
    const onlyDigits = searchEstabelecimento.replace(/\D/g, '');
    const filtrados = estabelecimentos.filter(est => {
      const byName = norm(est.nome).includes(q);
      const byCnes = onlyDigits ? (est.cnes || '').includes(onlyDigits) : false;
      return q ? (byName || byCnes) : true;
    });
    setEstabelecimentosFiltrados(filtrados);
  }, [estabelecimentos, searchEstabelecimento]);

  // Municípios: acento-insensitive, sobre os "disponíveis" (dependem do estado selecionado)
  useEffect(() => {
    if (!searchMunicipio) {
      setMunicipiosFiltrados(municipiosDisponiveis);
    } else {
      const q = norm(searchMunicipio);
      setMunicipiosFiltrados(
        municipiosDisponiveis.filter(m => norm(m.descricao).includes(q))
      );
    }
  }, [municipiosDisponiveis, searchMunicipio]);

  // Estados: acento-insensitive
  useEffect(() => {
    const q = norm(searchEstado);
    setEstadosFiltrados(
      q ? estados.filter(est => norm(est.descricao).includes(q)) : estados
    );
  }, [estados, searchEstado]);

  // COMENTADO: Este useEffect estava causando filtragem automática indesejada
  // Quando o estado muda, recarregar municípios se necessário
  // useEffect(() => {
  //   if (formData.estadoId && formData.nivelAcesso !== 'estado') {
  //     loadMunicipiosPorEstado(formData.estadoId);
  //   }
  // }, [formData.estadoId, formData.nivelAcesso]);

  // FUNÇÃO REMOVIDA: loadMunicipiosPorEstado era usada apenas pelo useEffect problemático comentado acima

  const loadDropdownData = async () => {
    try {
      console.log('🚀 Carregando dados com hierarquia otimizada...');
      
      // Tentar usar o método otimizado primeiro
      try {
        const hierarquia = await usuarioGestaoService.getHierarquiaCompleta();
        
        console.log('✅ Hierarquia completa carregada:', {
          estados: hierarquia.estados.length,
          municipios: hierarquia.municipios.length,
          estabelecimentos: hierarquia.estabelecimentos.length
        });
        
        // Converter estabelecimentos para o formato correto
        const estabelecimentosFormatados: EstabelecimentoOption[] = hierarquia.estabelecimentos.map(est => ({
          id: est.id,
          nome: est.nome,
          cnes: est.cnes
        }));
        
        // Converter municípios para incluir estadoId
        const municipiosFormatados = hierarquia.municipios.map(mun => ({
          id: mun.id,
          descricao: mun.descricao,
          estadoId: mun.estadoId
        }));
        
        setEstabelecimentos(estabelecimentosFormatados);
        setEstados(hierarquia.estados);
        setMunicipios(municipiosFormatados);

        // Base inicial = tudo
        setEstabelecimentosFiltrados(estabelecimentosFormatados);
        setEstadosFiltrados(hierarquia.estados);
        setMunicipiosDisponiveis(municipiosFormatados);
        setMunicipiosFiltrados(municipiosFormatados);
        
        console.log('✅ Dados carregados com relacionamentos mapeados!');
        return;
        
      } catch (hierarquiaError) {
        console.warn('⚠️ Método otimizado não disponível, usando método tradicional...');
        
        // Fallback para o método tradicional
        const [estabelecimentosData, estadosData, municipiosDataRaw] = await Promise.all([
          usuarioGestaoService.getEstabelecimentos(),
          usuarioGestaoService.getEstados(),
          usuarioGestaoService.getMunicipios(),
        ]);

        // Converter para o formato esperado (sem relacionamentos)
        const municipiosData = municipiosDataRaw.map((m) => ({ ...m }));

        setEstabelecimentos(estabelecimentosData);
        setEstados(estadosData);
        setMunicipios(municipiosData);

        // Base inicial = tudo
        setEstabelecimentosFiltrados(estabelecimentosData);
        setEstadosFiltrados(estadosData);
        setMunicipiosDisponiveis(municipiosData);
        setMunicipiosFiltrados(municipiosData);
        
        console.log('✅ Dados carregados via método tradicional');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar opções:', error);
    }
  };

  // Função para buscar município e estado baseado no estabelecimento
  const handleEstabelecimentoChange = async (estabelecimentoId: number) => {
    try {
      const response = await fetch(`/api/estabelecimentos/${estabelecimentoId}`, { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const estabelecimento = await response.json();

        const municipioId = estabelecimento.tipo_municipio?.idtipo_municipio || undefined;
        const estadoId = estabelecimento.tipo_municipio?.tipo_estado?.idtipo_estado || undefined;

        setFormData(prev => ({ ...prev, estabelecimentoId, municipioId, estadoId }));

        // Atualiza as listas derivadas (se já temos municípios carregados)
        if (estadoId) {
          const mDisp = municipios.filter(m => (m as any).estadoId === estadoId);
          setMunicipiosDisponiveis(mDisp);
          setMunicipiosFiltrados(mDisp);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do estabelecimento:', error);
    }
  };

  // Função para buscar estabelecimentos baseado no município
  const handleMunicipioChange = async (municipioId: number) => {
    try {
      // 1) Tenta resolver o estado em memória
      const munLocal = municipios.find(m => m.id === municipioId);
      if (munLocal && (munLocal as any).estadoId) {
        setFormData(prev => ({ ...prev, municipioId, estadoId: (munLocal as any).estadoId }));
      } else {
        // 2) Fallback: buscar no backend
        const municipioResponse = await fetch(`/api/municipios/${municipioId}`, { 
          credentials: 'include' 
        });
        if (municipioResponse.ok) {
          const municipio = await municipioResponse.json();
          setFormData(prev => ({
            ...prev,
            municipioId,
            estadoId: municipio.tipo_estado?.idtipo_estado || undefined,
          }));
        }
      }

      // 3) Unidades do município — mantém sua lógica de backend (caso não tenhamos mapeamento local)
      try {
        const response = await fetch(`/api/estabelecimentos/municipio/${municipioId}`, { 
          credentials: 'include' 
        });
        if (response.ok) {
          const estabelecimentosDoMunicipio = await response.json();
          const estabelecimentosFormatados: EstabelecimentoOption[] = estabelecimentosDoMunicipio.map((est: any) => ({
            id: est.idestabelecimento,
            nome: est.nome,
            cnes: est.cnes || undefined
          }));
          setEstabelecimentosFiltrados(estabelecimentosFormatados);
        } else {
          setEstabelecimentosFiltrados([]);
        }
      } catch {
        setEstabelecimentosFiltrados([]);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do município:', error);
    }
  };

  // Função para buscar municípios e estabelecimentos baseado no estado
  const handleEstadoChange = async (estadoId: number) => {
    try {
      setFormData(prev => ({ ...prev, estadoId }));

      // 1) Municípios: tenta filtrar em memória (se tivermos estadoId mapeado)
      const temEstadoMapeado = municipios.some(m => (m as any).estadoId != null);
      if (temEstadoMapeado) {
        const mDoEstado = municipios.filter(m => (m as any).estadoId === estadoId);
        setMunicipiosDisponiveis(mDoEstado);
        setMunicipiosFiltrados(mDoEstado);
      } else {
        // 2) Fallback para seu endpoint
        try {
          const municipiosResponse = await fetch(`/api/municipios/estado/${estadoId}`, { 
            credentials: 'include' 
          });
          if (municipiosResponse.ok) {
            const municipiosDoEstado = await municipiosResponse.json();
            const municipiosFormatados = municipiosDoEstado.map((mun: any) => ({
              id: mun.id || mun.idtipo_municipio,
              descricao: mun.descricao
            }));
            setMunicipiosDisponiveis(municipiosFormatados);
            setMunicipiosFiltrados(municipiosFormatados);
          } else {
            setMunicipiosDisponiveis([]);
            setMunicipiosFiltrados([]);
          }
        } catch {
          setMunicipiosDisponiveis([]);
          setMunicipiosFiltrados([]);
        }
      }

      // 3) Estabelecimentos do estado (mantém seu backend)
      try {
        const estabelecimentosResponse = await fetch(`/api/estabelecimentos/estado/${estadoId}`, { 
          credentials: 'include' 
        });
        if (estabelecimentosResponse.ok) {
          const estabelecimentosDoEstado = await estabelecimentosResponse.json();
          const estabelecimentosFormatados: EstabelecimentoOption[] = estabelecimentosDoEstado.map((est: any) => ({
            id: est.idestabelecimento,
            nome: est.nome,
            cnes: est.cnes || undefined
          }));
          setEstabelecimentosFiltrados(estabelecimentosFormatados);
        } else {
          setEstabelecimentosFiltrados([]);
        }
      } catch {
        setEstabelecimentosFiltrados([]);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do estado:', error);
    }
  };

  const loadRoles = async () => {
    try {
      console.log('🔑 Carregando roles do Keycloak...');
      const response = await fetch('/api-auth/admin/roles', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔑 Resposta do carregamento de roles:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Roles carregadas:', data);
        setRoles(data);
      } else {
        console.error('❌ Erro ao carregar roles:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Detalhes do erro:', errorText);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar roles:', error);
    }
  };

  const loadUser = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      console.log('📥 Carregando dados do usuário:', id);
      
      // Carregar dados básicos do Keycloak
      const response = await fetch(`/api-auth/admin/users/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Usuário não encontrado');
      }

      const user = await response.json();
      console.log('👤 Dados básicos do usuário carregados:', user);
      
      // Carregar dados de acesso do backend
      let acessosData = null;
      try {
        console.log('🔍 Buscando acessos do usuário...');
        const acessos = await usuarioGestaoService.getUsuarioAcessos(id);
        console.log('🎯 Acessos encontrados:', acessos);
        
        if (acessos && acessos.length > 0) {
          // Pegar o primeiro acesso (assumindo que usuário tem apenas um tipo de acesso)
          acessosData = acessos[0];
          console.log('📊 Dados de acesso processados:', acessosData);
        }
      } catch (acessoError) {
        console.warn('⚠️ Erro ao carregar acessos do usuário:', acessoError);
        // Não interrompe o carregamento se não conseguir carregar acessos
      }

      // Montar dados do formulário combinando Keycloak + Backend
      const formDataUpdate: any = {
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        enabled: user.enabled ?? true,
        emailVerified: user.emailVerified ?? false,
        temporaryPassword: false,
        // Valores padrão
        nivelAcesso: 'unidade',
        permissoes: PERMISSOES.READ_WRITE,
        estabelecimentoId: null,
        municipioId: null,
        estadoId: null,
      };

      // Preencher dados de acesso se encontrados
      if (acessosData) {
        if (acessosData.estabelecimento_id) {
          formDataUpdate.nivelAcesso = 'unidade';
          formDataUpdate.estabelecimentoId = acessosData.estabelecimento_id;
          console.log('🏥 Definido acesso de unidade:', acessosData.estabelecimento_id);
          
          // Auto-preencher município e estado baseado no estabelecimento
          if (acessosData.estabelecimento) {
            console.log('🔍 Buscando município e estado para o estabelecimento...');
            try {
              // Buscar detalhes completos do estabelecimento para obter município e estado
              const estabelecimentoCompleto = await usuarioGestaoService.getEstabelecimentoComHierarquia(acessosData.estabelecimento_id);
              
              // Usar as relações do Prisma ou os campos formatados do controller
              if (estabelecimentoCompleto?.tipo_municipio_idtipo_municipio) {
                console.log('📍 Município encontrado (Prisma):', estabelecimentoCompleto.tipo_municipio_idtipo_municipio);
                formDataUpdate.municipioId = estabelecimentoCompleto.tipo_municipio_idtipo_municipio;
              } else if (estabelecimentoCompleto?.municipio?.id) {
                console.log('📍 Município encontrado (formatado):', estabelecimentoCompleto.municipio.id);
                formDataUpdate.municipioId = estabelecimentoCompleto.municipio.id;
              }
              
              if (estabelecimentoCompleto?.tipo_municipio?.tipo_estado?.idtipo_estado) {
                console.log('🗺️ Estado encontrado (Prisma):', estabelecimentoCompleto.tipo_municipio.tipo_estado.idtipo_estado);
                formDataUpdate.estadoId = estabelecimentoCompleto.tipo_municipio.tipo_estado.idtipo_estado;
              } else if (estabelecimentoCompleto?.municipio?.estado?.id) {
                console.log('🗺️ Estado encontrado (formatado):', estabelecimentoCompleto.municipio.estado.id);
                formDataUpdate.estadoId = estabelecimentoCompleto.municipio.estado.id;
              }
            } catch (estabError) {
              console.warn('⚠️ Erro ao buscar dados geográficos do estabelecimento:', estabError);
            }
          }
          
        } else if (acessosData.tipo_municipio_id) {
          formDataUpdate.nivelAcesso = 'municipio';
          formDataUpdate.municipioId = acessosData.tipo_municipio_id;
          console.log('🏛️ Definido acesso de município:', acessosData.tipo_municipio_id);
        } else if (acessosData.tipo_estado_id) {
          formDataUpdate.nivelAcesso = 'estado';
          formDataUpdate.estadoId = acessosData.tipo_estado_id;
          console.log('🗺️ Definido acesso de estado:', acessosData.tipo_estado_id);
        }
        
        if (acessosData.permissoes !== undefined) {
          formDataUpdate.permissoes = acessosData.permissoes;
          console.log('🔑 Definidas permissões:', acessosData.permissoes);
        }
      }

      setFormData(formDataUpdate);
      console.log('✅ Dados do formulário atualizados:', formDataUpdate);
      
      // Se o usuário tem estado definido (seja por acesso de estado ou por estabelecimento), carregar municípios
      if (formDataUpdate.estadoId) {
        console.log('🗺️ Carregando municípios do estado para edição:', formDataUpdate.estadoId);
        try {
          const municipiosDoEstado = await usuarioGestaoService.getMunicipiosPorEstado(formDataUpdate.estadoId);
          setMunicipiosDisponiveis(municipiosDoEstado);
          console.log('✅ Municípios carregados para edição:', municipiosDoEstado.length);
        } catch (municipioError) {
          console.warn('⚠️ Erro ao carregar municípios para edição:', municipioError);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar usuário:', error);
      showNotification(t('admin.userForm.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUserRoles = async () => {
    if (!id) return;

    try {
      const response = await fetch(`/api-auth/admin/users/${id}/roles`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUserRoles(data);
      }
    } catch (error) {
      console.error('Erro ao carregar roles do usuário:', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = t('admin.userForm.validation.usernameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('admin.userForm.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('admin.userForm.validation.emailInvalid');
    }

    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = t('admin.userForm.validation.passwordRequired');
      } else if (formData.password.length < 6) {
        newErrors.password = t('admin.userForm.validation.passwordMinLength');
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('admin.userForm.validation.passwordMismatch');
      }
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('admin.userForm.validation.passwordMismatch');
    }

    // Validações para controle de acesso
    if (!formData.nivelAcesso) {
      newErrors.nivelAcesso = 'Nível de acesso é obrigatório';
    }

    if (!formData.permissoes) {
      newErrors.permissoes = 'Permissões são obrigatórias';
    }

    // Validações específicas por nível de acesso
    if (formData.nivelAcesso === 'unidade' && !formData.estabelecimentoId) {
      newErrors.estabelecimentoId = 'Estabelecimento é obrigatório para acesso de unidade';
    }

    if (formData.nivelAcesso === 'municipio' && !formData.municipioId) {
      newErrors.municipioId = 'Município é obrigatório para acesso municipal';
    }

    if (formData.nivelAcesso === 'estado' && !formData.estadoId) {
      newErrors.estadoId = 'Estado é obrigatório para acesso estadual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para atualizar acessos do usuário (modo edição)
  const updateUserAccess = async (userId: string) => {
    try {
      console.log('🔄 Atualizando acessos do usuário:', userId);
      console.log('📋 Dados do formulário:', {
        nivelAcesso: formData.nivelAcesso,
        estabelecimentoId: formData.estabelecimentoId,
        municipioId: formData.municipioId,
        estadoId: formData.estadoId,
        permissoes: formData.permissoes
      });

      // Primeiro, fazer limpeza completa de todos os acessos (hard delete)
      console.log('🗑️ Fazendo limpeza completa de TODOS os acessos (hard delete)...');
      try {
        await usuarioGestaoService.hardDeleteTodosAcessosUsuario(userId);
        console.log('✅ Limpeza completa realizada com sucesso');
      } catch (deleteError: any) {
        console.error('❌ Erro na limpeza completa dos acessos:', deleteError);
        throw new Error(`Erro na limpeza dos acessos: ${deleteError.message || deleteError}`);
      }
      
      // Aguardar um momento para garantir que as remoções foram processadas
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Depois, criar novo acesso baseado no formulário
      if (formData.nivelAcesso === 'unidade' && formData.estabelecimentoId) {
        console.log('🏥 Criando novo acesso de unidade...');
        await usuarioGestaoService.createAcessoUnidade(
          userId,
          formData.estabelecimentoId,
          formData.permissoes,
          formData.municipioId || undefined,
          formData.estadoId || undefined
        );
      } else if (formData.nivelAcesso === 'municipio' && formData.municipioId) {
        console.log('🏛️ Criando novo acesso de município...');
        await usuarioGestaoService.createAcessoMunicipio(
          userId,
          formData.municipioId,
          formData.permissoes
        );
      } else if (formData.nivelAcesso === 'estado' && formData.estadoId) {
        console.log('🗺️ Criando novo acesso de estado...');
        await usuarioGestaoService.createAcessoEstado(
          userId,
          formData.estadoId,
          formData.permissoes
        );
      }

      console.log('✅ Acessos atualizados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar acessos:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const userData = {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        enabled: formData.enabled,
        emailVerified: formData.emailVerified,
      };

      let response;
      if (isEditMode) {
        // Atualizar usuário
        response = await fetch(`/api-auth/admin/users/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        // Se há nova senha, resetar senha
        if (formData.password) {
          await fetch(`/api-auth/admin/users/${id}/reset-password`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'password',
              value: formData.password,
              temporary: formData.temporaryPassword,
            }),
          });
        }

        // Atualizar acessos no modo de edição
        console.log('✏️ Atualizando acessos do usuário em edição...');
        await updateUserAccess(id);
        
      } else {
        // Criar usuário
        console.log('🚀 Iniciando criação de usuário...');
        response = await fetch('/api-auth/admin/users', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...userData,
            ...(formData.password && {
              credentials: [{
                type: 'password',
                value: formData.password,
                temporary: formData.temporaryPassword,
              }]
            })
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar usuário');
        }

        // Se usuário foi criado com sucesso, buscar o ID real do usuário
        let userId;
        try {
          // Tentar obter o ID da resposta primeiro
          const responseData = await response.json();
          userId = responseData.id;
          
          // Se não tiver ID na resposta, buscar o usuário pelo username
          if (!userId) {
            console.log('🔍 Buscando ID do usuário criado pelo username:', formData.username);
            const searchResponse = await fetch(`/api-auth/admin/users?username=${encodeURIComponent(formData.username)}`, {
              credentials: 'include',
            });
            
            if (searchResponse.ok) {
              const users = await searchResponse.json();
              if (users && users.length > 0) {
                userId = users[0].id;
                console.log('✅ ID do usuário encontrado:', userId);
              }
            }
          }
          
          if (!userId) {
            throw new Error('Não foi possível obter o ID do usuário criado');
          }
        } catch (parseError) {
          console.error('❌ Erro ao processar resposta de criação:', parseError);
          // Como último recurso, tentar buscar por username
          console.log('🔍 Tentativa final: buscando usuário pelo username');
          const searchResponse = await fetch(`/api-auth/admin/users?username=${encodeURIComponent(formData.username)}`, {
            credentials: 'include',
          });
          
          if (searchResponse.ok) {
            const users = await searchResponse.json();
            if (users && users.length > 0) {
              userId = users[0].id;
              console.log('✅ ID do usuário encontrado na busca:', userId);
            }
          }
          
          if (!userId) {
            throw new Error('Falha crítica: não foi possível obter ID do usuário para configurar acessos');
          }
        }

        console.log('🆔 ID do usuário para configurar acessos:', userId);

        console.log('🎯 Pronto para configurar acessos - verificando se estamos no modo criação...');

        // Atribuir roles selecionadas ao usuário recém-criado
        if (userRoles.length > 0) {
          console.log('🔑 Atribuindo roles ao usuário criado:', userRoles.map(r => r.name));
          try {
            await fetch(`/api-auth/admin/users/${userId}/roles`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(userRoles),
            });
            console.log('✅ Roles atribuídas com sucesso');
          } catch (roleError) {
            console.error('❌ Erro ao atribuir roles:', roleError);
            // Não interromper o fluxo se houver erro nas roles
          }
        }

        // Criar registro de acesso baseado no nível selecionado
        console.log('📊 Configurando acessos do usuário...');
        console.log('  - Nível de acesso:', formData.nivelAcesso);
        console.log('  - Estabelecimento ID:', formData.estabelecimentoId);
        console.log('  - Município ID:', formData.municipioId);
        console.log('  - Estado ID:', formData.estadoId);
        console.log('  - Permissões:', formData.permissoes);
        
        if (formData.nivelAcesso === 'unidade' && formData.estabelecimentoId) {
          console.log('🏥 Criando acesso de unidade...');
          await usuarioGestaoService.createAcessoUnidade(
            userId,
            formData.estabelecimentoId,
            formData.permissoes,
            formData.municipioId || undefined,
            formData.estadoId || undefined
          );
          console.log('✅ Acesso de unidade criado');
        } else if (formData.nivelAcesso === 'municipio' && formData.municipioId) {
          console.log('🏛️ Criando acesso de município...');
          await usuarioGestaoService.createAcessoMunicipio(
            userId,
            formData.municipioId,
            formData.permissoes
          );
          console.log('✅ Acesso de município criado');
        } else if (formData.nivelAcesso === 'estado' && formData.estadoId) {
          console.log('🗺️ Criando acesso de estado...');
          await usuarioGestaoService.createAcessoEstado(
            userId,
            formData.estadoId,
            formData.permissoes
          );
          console.log('✅ Acesso de estado criado');
        } else {
          console.warn('⚠️ Nenhum acesso criado - verifique os dados do formulário');
        }
      }

      console.log('🔄 Verificando resposta da API:', response.status, response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Erro na resposta da API:', error);
        throw new Error(error.error || 'Erro ao salvar usuário');
      }

      showNotification(
        isEditMode 
          ? t('admin.userForm.updateSuccess')
          : t('admin.userForm.createSuccess'),
        'success'
      );

      setTimeout(() => {
        navigate('/admin/users');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      showNotification(error.message || t('admin.userForm.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = async (role: Role) => {
    // No modo de criação, apenas atualizar o estado local
    if (!id) {
      const hasRole = userRoles.some(ur => ur.id === role.id);
      
      if (hasRole) {
        // Remover role do estado local
        setUserRoles(prev => prev.filter(ur => ur.id !== role.id));
        console.log('🔑 Role removida (modo criação):', role.name);
      } else {
        // Adicionar role ao estado local
        setUserRoles(prev => [...prev, role]);
        console.log('🔑 Role adicionada (modo criação):', role.name);
      }
      return;
    }

    // No modo de edição, atualizar via API
    try {
      const hasRole = userRoles.some(ur => ur.id === role.id);
      
      if (hasRole) {
        // Remover role via API
        await fetch(`/api-auth/admin/users/${id}/roles`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([role]),
        });
        setUserRoles(prev => prev.filter(ur => ur.id !== role.id));
        console.log('🔑 Role removida (modo edição):', role.name);
      } else {
        // Adicionar role via API
        await fetch(`/api-auth/admin/users/${id}/roles`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([role]),
        });
        setUserRoles(prev => [...prev, role]);
        console.log('🔑 Role adicionada (modo edição):', role.name);
      }

      showNotification(
        hasRole 
          ? t('admin.userForm.roleRemoved', { role: role.name })
          : t('admin.userForm.roleAdded', { role: role.name }),
        'success'
      );
    } catch (error) {
      console.error('Erro ao alterar role:', error);
      showNotification(t('admin.userForm.roleError'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <AdminHeader 
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
          selectedLanguage={selectedLanguage}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('admin.userForm.loading')}</p>
          </div>
        </main>
        <Footer selectedLanguage={selectedLanguage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho */}
      <AdminHeader 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        selectedLanguage={selectedLanguage}
      />

      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
          notification.type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'
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
        <div className="max-w-4xl mx-auto">
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
                {isEditMode 
                  ? t('admin.userForm.editTitle')
                  : t('admin.userForm.createTitle')
                }
              </h1>
              <p className="text-gray-600">
                {isEditMode 
                  ? t('admin.userForm.editSubtitle')
                  : t('admin.userForm.createSubtitle')
                }
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações básicas */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t('admin.userForm.basicInfo')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.userForm.username')} *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('admin.userForm.usernamePlaceholder')}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.userForm.email')} *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('admin.userForm.emailPlaceholder')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.userForm.firstName')}
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('admin.userForm.firstNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.userForm.lastName')}
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('admin.userForm.lastNamePlaceholder')}
                  />
                </div>
              </div>

              {/* Configurações */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
                    {t('admin.userForm.userEnabled')}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailVerified"
                    checked={formData.emailVerified}
                    onChange={(e) => setFormData(prev => ({ ...prev, emailVerified: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="emailVerified" className="ml-2 text-sm text-gray-700">
                    {t('admin.userForm.emailVerified')}
                  </label>
                </div>
              </div>
            </div>

            {/* Senha */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Key className="h-5 w-5 mr-2" />
                {isEditMode ? t('admin.userForm.changePassword') : t('admin.userForm.password')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.userForm.password')} {!isEditMode && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={isEditMode ? t('admin.userForm.newPasswordPlaceholder') : t('admin.userForm.passwordPlaceholder')}
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
                    {t('admin.userForm.confirmPassword')} {!isEditMode && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('admin.userForm.confirmPasswordPlaceholder')}
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

              {formData.password && (
                <div className="mt-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="temporaryPassword"
                      checked={formData.temporaryPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, temporaryPassword: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="temporaryPassword" className="ml-2 text-sm text-gray-700">
                      {t('admin.userForm.temporaryPassword')}
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('admin.userForm.temporaryPasswordHelp')}
                  </p>
                </div>
              )}
            </div>

            {/* Controle de Acesso */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Controle de Acesso
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      setFormData(prev => ({ 
                        ...prev, 
                        nivelAcesso: novoNivel,
                        // Limpar campos relacionados ao mudar nível
                        estabelecimentoId: undefined,
                        municipioId: undefined,
                        estadoId: undefined
                      }));
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nivelAcesso ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Selecione o nível de acesso</option>
                    <option value="unidade">Unidade</option>
                    <option value="municipio">Município</option>
                    <option value="estado">Estado</option>
                  </select>
                  {errors.nivelAcesso && (
                    <p className="mt-1 text-sm text-red-600">{errors.nivelAcesso}</p>
                  )}
                </div>

                {/* Permissões */}
                <div>
                  <label htmlFor="permissoes" className="block text-sm font-medium text-gray-700 mb-2">
                    Permissões *
                  </label>
                  <select
                    id="permissoes"
                    value={formData.permissoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, permissoes: parseInt(e.target.value) }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.permissoes ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Selecione as permissões</option>
                    <option value={PERMISSOES.READ}>Leitura (4)</option>
                    <option value={PERMISSOES.READ_WRITE}>Leitura + Escrita (6)</option>
                    <option value={PERMISSOES.ALL}>Todas as Permissões (7)</option>
                  </select>
                  {errors.permissoes && (
                    <p className="mt-1 text-sm text-red-600">{errors.permissoes}</p>
                  )}
                </div>

                {/* Estabelecimento - Mostrar apenas se nível for 'unidade' */}
                {formData.nivelAcesso === 'unidade' && (
                  <div>
                    <label htmlFor="estabelecimentoId" className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="h-4 w-4 inline mr-1" />
                      Estabelecimento *
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Pesquisar estabelecimento..."
                        value={searchEstabelecimento}
                        onChange={(e) => setSearchEstabelecimento(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        id="estabelecimentoId"
                        value={formData.estabelecimentoId || ''}
                        onChange={(e) => {
                          console.log('🔧 Estabelecimento selecionado - valor do select:', e.target.value);
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          console.log('🔧 Valor convertido para int:', value);
                          if (value) {
                            console.log('🔧 Chamando handleEstabelecimentoChange com:', value);
                            handleEstabelecimentoChange(value);
                          } else {
                            console.log('🔧 Resetando estabelecimento para undefined');
                            setFormData(prev => ({ ...prev, estabelecimentoId: undefined }));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.estabelecimentoId ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required={formData.nivelAcesso === 'unidade'}
                        size={Math.min(estabelecimentosFiltrados.length + 1, 8)}
                      >
                        <option value="">Selecionar Estabelecimento</option>
                        {estabelecimentosFiltrados.map(est => (
                          <option key={est.id} value={est.id}>{est.nome}</option>
                        ))}
                      </select>
                      {errors.estabelecimentoId && (
                        <p className="mt-1 text-sm text-red-600">{errors.estabelecimentoId}</p>
                      )}
                      {estabelecimentosFiltrados.length === 0 && searchEstabelecimento && (
                        <p className="text-sm text-gray-500">Nenhum estabelecimento encontrado</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Município - Mostrar se nível for 'municipio' ou 'unidade' */}
                {(formData.nivelAcesso === 'municipio' || formData.nivelAcesso === 'unidade') && (
                  <div>
                    <label htmlFor="municipioId" className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Município {formData.nivelAcesso === 'municipio' && '*'}
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Pesquisar município..."
                        value={searchMunicipio}
                        onChange={(e) => setSearchMunicipio(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        id="municipioId"
                        value={formData.municipioId || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          setFormData(prev => ({ ...prev, municipioId: value }));
                          if (value) {
                            handleMunicipioChange(value);
                          } else {
                            // Se desmarcou o município, apenas limpar estabelecimentos
                            setEstabelecimentosFiltrados(estabelecimentos);
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.municipioId ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required={formData.nivelAcesso === 'municipio'}
                        size={Math.min(municipiosFiltrados.length + 1, 8)}
                      >
                        <option value="">Selecionar Município</option>
                        {municipiosFiltrados.map(mun => (
                          <option key={mun.id} value={mun.id}>{mun.descricao}</option>
                        ))}
                      </select>
                      {errors.municipioId && (
                        <p className="mt-1 text-sm text-red-600">{errors.municipioId}</p>
                      )}
                      {municipiosFiltrados.length === 0 && searchMunicipio && (
                        <p className="text-sm text-gray-500">Nenhum município encontrado</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Estado - Sempre mostrar */}
                <div>
                  <label htmlFor="estadoId" className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="h-4 w-4 inline mr-1" />
                    Estado {formData.nivelAcesso === 'estado' && '*'}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Pesquisar estado..."
                      value={searchEstado}
                      onChange={(e) => setSearchEstado(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      id="estadoId"
                      value={formData.estadoId || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                        setFormData(prev => ({ ...prev, estadoId: value }));
                        if (value) {
                          handleEstadoChange(value);
                        } else {
                          // Se desmarcou o estado, não fazer nada especial
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.estadoId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required={formData.nivelAcesso === 'estado'}
                      size={Math.min(estadosFiltrados.length + 1, 8)}
                    >
                      <option value="">Selecionar Estado</option>
                      {estadosFiltrados.map(est => (
                        <option key={est.id} value={est.id}>{est.descricao}</option>
                      ))}
                    </select>
                    {errors.estadoId && (
                      <p className="mt-1 text-sm text-red-600">{errors.estadoId}</p>
                    )}
                    {estadosFiltrados.length === 0 && searchEstado && (
                      <p className="text-sm text-gray-500">Nenhum estado encontrado</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Roles (disponível tanto na criação quanto na edição) */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                {t('admin.userForm.roles')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {roles.map((role) => {
                  const hasRole = userRoles.some(ur => ur.id === role.id);
                  return (
                    <div
                      key={role.id}
                      onClick={() => handleRoleToggle(role)}
                      className={`cursor-pointer p-3 border rounded-lg transition ${
                        hasRole 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{role.name}</span>
                          {hasRole && <Check className="h-4 w-4" />}
                        </div>
                        {role.description && (
                          <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            {/* Botões de ação */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                {t('admin.userForm.cancel')}
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
                  ? t('admin.userForm.saving')
                  : isEditMode 
                    ? t('admin.userForm.update')
                    : t('admin.userForm.create')
                }
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Rodapé */}
      <Footer selectedLanguage={selectedLanguage} />
      
      {/* Menu lateral */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
};

export default UserForm;
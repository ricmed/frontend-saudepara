import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  X, 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  ArrowLeft, 
  Menu, 
  FileCheck, 
  AlertCircle,
  Loader,
  ChevronDown,
  Wifi,
  WifiOff
} from 'lucide-react';
import axios from 'axios';
import ComunicacaoDaeService, { CreateComunicacaoDaeData, OrigemTipo, TipoAnexo, ComunicacaoDae, ComunicacaoDaeAnexo } from '@/services/ComunicacaoDaeService';
import DaeService, { Dae } from '@/services/DaeService';
import NheService, { Nhe } from '@/services/NheService';
import CievsService, { Cievs } from '@/services/CievsService';
import CrsService, { Crs } from '@/services/CrsService';
import { SideMenu } from '@/features/home/components/SideMenu';
import LocationInput from '@/features/notificationForms/components/LocationInput';
import { SearchableSelect } from '@/components/SearchableSelect';
import FileUploadWithCompression from '@/components/FileUploadWithCompression';
import DaeCheckboxList from './components/DaeCheckboxList';
import { useOfflineSystem } from '@/hooks/useOfflineSystem';
import { OfflineComunicacaoDaeServiceProxy } from '@/services/OfflineComunicacaoDaeServiceProxy';
import ConnectionStatus from '@/components/ConnectionStatus';
import indexedDBService from '@/services/indexedDB';

// Funções auxiliares para timezone
const getLocalDateTime = (date: Date = new Date()): string => {
  // Converte para timezone America/Belem (UTC-3)
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Belem' }));
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const convertUTCToLocal = (utcDateString: string): string => {
  const date = new Date(utcDateString);
  return getLocalDateTime(date);
};

// Função para normalizar texto (remover acentos e converter para maiúsculas)
const normalizeText = (text: string): string => {
  if (!text) return "";
  // Remove acentos e converte para caixa alta
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toUpperCase();
};

const ComunicacaoDaeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // ✅ Hook do sistema offline
  const {
    isOnline,
    pendingData,
    getOfflineStatusMessage
  } = useOfflineSystem();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Controle de seções expansíveis
  const [expandedSections, setExpandedSections] = useState({
    origem: true,
    paciente: true,
    documentacao: true
  });

  const toggleSection = (section: 'origem' | 'paciente' | 'documentacao') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Dados do formulário
  const [formData, setFormData] = useState<CreateComunicacaoDaeData>({
    data_comunicacao: getLocalDateTime(),
    nome_paciente: '',
    observacao_descricao: '',
    id_municipio_ocorrencia: 0,
    origem_tipo: 'CRS' as OrigemTipo,
    origem_id: 0,
    id_dae: 0,
  });

  // Dados adicionais para exibição
  const [comunicacaoCompleta, setComunicacaoCompleta] = useState<ComunicacaoDae | null>(null);

  // Listas para selects
  const [daes, setDaes] = useState<Dae[]>([]);
  const [nhes, setNhes] = useState<Nhe[]>([]);
  const [cievsList, setCievsList] = useState<Cievs[]>([]);
  const [crsList, setCrsList] = useState<Crs[]>([]);

  // Estados para UF e município
  const [ufOcorrencia, setUfOcorrencia] = useState<string>('15'); // Pará por padrão
  const [municipioOcorrencia, setMunicipioOcorrencia] = useState<string>('');
  const [isLoadingMunicipios] = useState(false);

  // Anexos
  const [anexos, setAnexos] = useState<ComunicacaoDaeAnexo[]>([]);
  const [fichaFiles, setFichaFiles] = useState<File[]>([]);
  const [relatorioFiles, setRelatorioFiles] = useState<File[]>([]);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);

  // Função para limpar o formulário
  const handleClearForm = () => {
    if (window.confirm('Deseja realmente limpar todos os campos do formulário?')) {
      setFormData({
        data_comunicacao: getLocalDateTime(),
        nome_paciente: '',
        observacao_descricao: '',
        id_municipio_ocorrencia: 0,
        origem_tipo: 'CRS' as OrigemTipo,
        origem_id: 0,
        id_dae: 0,
      });
      setUfOcorrencia('15'); // Resetar para Pará
      setMunicipioOcorrencia('');
      if (!isEditMode) {
        setFichaFile(null);
        setRelatorioFile(null);
      }
    }
  };

  // Atualizar formData quando municipioOcorrencia mudar
  useEffect(() => {
    if (municipioOcorrencia) {
      setFormData(prev => ({
        ...prev,
        id_municipio_ocorrencia: Number(municipioOcorrencia)
      }));
    }
  }, [municipioOcorrencia]);

  useEffect(() => {
    loadSelectOptions();
    if (isEditMode && id) {
      loadComunicacao(Number(id));
    }
  }, [id]);

  const loadSelectOptions = async () => {
    try {
      // ✅ Usar proxy offline para cache automático
      const [daesData, nhesData, cievsData, crsData] = await Promise.all([
        OfflineComunicacaoDaeServiceProxy.getDaeOptions(),
        OfflineComunicacaoDaeServiceProxy.getNheOptions(),
        OfflineComunicacaoDaeServiceProxy.getCievsOptions(),
        OfflineComunicacaoDaeServiceProxy.getCrsOptions(),
      ]);

      setDaes(daesData);
      setNhes(nhesData);
      setCievsList(cievsData);
      setCrsList(crsData);
      
      console.log(`✅ Opções carregadas: ${daesData.length} DAEs, ${nhesData.length} NHEs, ${cievsData.length} CIEVS, ${crsData.length} CRS`);
    } catch (err) {
      console.error('Erro ao carregar opções:', err);
      setError('Erro ao carregar dados do formulário. Alguns dados podem estar indisponíveis offline.');
    }
  };

  // Atualizar formData quando municipioOcorrencia mudar
  useEffect(() => {
    if (municipioOcorrencia) {
      setFormData(prev => ({
        ...prev,
        id_municipio_ocorrencia: Number(municipioOcorrencia)
      }));
    }
  }, [municipioOcorrencia]);

  const loadComunicacao = async (comunicacaoId: number) => {
    try {
      setLoadingData(true);
      
      // ✅ ONLINE: API primeiro, cache como fallback
      let data: ComunicacaoDae;
      try {
        console.log(`🔍 Buscando comunicação ${comunicacaoId} da API...`);
        data = await ComunicacaoDaeService.getById(comunicacaoId);
        console.log('✅ Comunicação carregada da API');
      } catch (err) {
        console.warn('⚠️ API falhou, tentando buscar do cache offline...', err);
        
        // ✅ FALLBACK: Tentar buscar do cache offline
        const cachedData = await indexedDBService.getOpcoes('comunicacoes_dae');
        const comunicacaoOffline = cachedData?.find((c: any) => c.id_comunicacao === comunicacaoId);
        
        if (comunicacaoOffline) {
          console.log('✅ Comunicação encontrada no cache offline');
          data = comunicacaoOffline;
        } else {
          throw new Error('Comunicação não encontrada na API nem no cache offline');
        }
      }
      
      setComunicacaoCompleta(data);
      
      setFormData({
        data_comunicacao: convertUTCToLocal(data.data_comunicacao),
        nome_paciente: normalizeText(data.nome_paciente),
        observacao_descricao: normalizeText(data.observacao_descricao || ''),
        id_municipio_ocorrencia: data.id_municipio_ocorrencia,
        origem_tipo: data.origem_tipo,
        origem_id: data.origem_id,
        id_dae: data.id_dae,
      });

      // ✅ CORRIGIDO: Buscar a UF do município primeiro
      if (data.id_municipio_ocorrencia) {
        try {
          // Buscar informações do município para obter a UF
          const municipios = await indexedDBService.getOpcoes('municipios');
          const municipioData = municipios?.find((m: any) => 
            Number(m.idtipo_municipio) === Number(data.id_municipio_ocorrencia)
          );
          
          if (municipioData && municipioData.tipo_estado_idtipo_estado) {
            // Setar UF primeiro
            setUfOcorrencia(String(municipioData.tipo_estado_idtipo_estado));
            console.log(`✅ UF carregada: ${municipioData.tipo_estado_idtipo_estado}`);
            
            // Pequeno delay para garantir que a UF foi setada antes do município
            setTimeout(() => {
              setMunicipioOcorrencia(String(data.id_municipio_ocorrencia));
              console.log(`✅ Município carregado: ${data.id_municipio_ocorrencia}`);
            }, 100);
          } else {
            console.warn('⚠️ Não foi possível encontrar a UF do município no cache');
            // Tentar buscar do backend como fallback
            try {
              const server = import.meta.env.VITE_API_SERVER || "";
              const port = import.meta.env.VITE_API_PORT || "";
              const baseUrl = server && port ? `${server}:${port}/` : "/";
              const response = await axios.get(`${baseUrl}api/tipo-municipio/${data.id_municipio_ocorrencia}`);
              
              if (response.data && response.data.tipo_estado_idtipo_estado) {
                setUfOcorrencia(String(response.data.tipo_estado_idtipo_estado));
                setTimeout(() => {
                  setMunicipioOcorrencia(String(data.id_municipio_ocorrencia));
                }, 100);
              }
            } catch (apiErr) {
              console.error('❌ Erro ao buscar município da API:', apiErr);
              setError('Não foi possível carregar o município de ocorrência. Verifique sua conexão.');
            }
          }
        } catch (err) {
          console.error('❌ Erro ao buscar UF do município:', err);
        }
      }

      if (data.comunicacao_dae_anexo) {
        setAnexos(data.comunicacao_dae_anexo);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao carregar comunicação');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ PROTEÇÃO: Prevenir múltiplas submissões
    if (loading || uploadingAnexo) {
      console.warn('⚠️ Submissão bloqueada: operação em andamento');
      return;
    }
    
    // Validações
    if (!formData.nome_paciente.trim()) {
      setError('Nome do paciente é obrigatório');
      return;
    }
    if (!formData.id_municipio_ocorrencia) {
      setError('Município de ocorrência é obrigatório');
      return;
    }
    if (!formData.origem_id) {
      setError('Origem da comunicação é obrigatória');
      return;
    }
    if (!formData.id_dae) {
      setError('DAE é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('📝 Iniciando salvamento da comunicação DAE...');

      // ✅ USAR SISTEMA OFFLINE
      const syncService = (await import('@/services/syncService')).default;
      
      if (isEditMode && id) {
        // Atualizar comunicação existente
        console.log('🔄 Atualizando comunicação existente...');
        const formDataWithId = { ...formData, id: Number(id), id_comunicacao: Number(id) };
        const result = await syncService.saveComunicacaoDae(formDataWithId, true);
        console.log('✅ Comunicação atualizada!');
        
        // Salvar anexos se houver
        if (fichaFiles.length > 0 || relatorioFiles.length > 0) {
          if (isOnline && result.comunicacaoId) {
            // Upload direto se online
            await uploadAnexos(result.comunicacaoId);
            alert('✅ Comunicação e anexos atualizados!');
          } else if (result.offlineId) {
            // Salvar anexos offline
            await saveAnexosOffline(result.offlineId, result.comunicacaoId);
            alert('📱 Comunicação e anexos salvos offline! Serão sincronizados quando voltar online.');
          }
        } else {
          alert(isOnline ? '✅ Comunicação atualizada com sucesso!' : '📱 Comunicação atualizada offline!');
        }
      } else {
        // Criar nova comunicação
        console.log('➕ Criando nova comunicação...');
        const result = await syncService.saveComunicacaoDae(formData, false);
        console.log('✅ Comunicação criada!');
        
        // Salvar anexos se houver
        if (fichaFiles.length > 0 || relatorioFiles.length > 0) {
          if (isOnline && result.comunicacaoId) {
            // Upload direto se online
            await uploadAnexos(result.comunicacaoId);
            alert('✅ Comunicação criada e anexos enviados!');
          } else if (result.offlineId) {
            // Salvar anexos offline
            await saveAnexosOffline(result.offlineId, result.comunicacaoId);
            alert('📱 Comunicação e anexos salvos offline! Serão sincronizados quando voltar online.');
          }
        } else {
          alert(isOnline ? '✅ Comunicação criada com sucesso!' : '📱 Comunicação salva offline!');
        }
      }

      console.log('🔄 Redirecionando para lista de comunicações...');
      
      // Pequeno delay para o usuário ver a mensagem
      setTimeout(() => {
        navigate('/private/comunicacao-dae');
      }, 1500);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Erro ao salvar comunicação';
      setError(errorMessage);
      console.error('❌ Erro ao salvar comunicação DAE:', err);
      alert(`Erro ao salvar: ${errorMessage}`);
    } finally {
      setLoading(false);
      console.log('🏁 Processo de salvamento finalizado');
    }
  };

  // ✅ Salvar anexos offline
  const saveAnexosOffline = async (comunicacaoOfflineId: string, comunicacaoId?: number) => {
    try {
      const anexosSalvos: string[] = [];

      // Salvar fichas
      for (const file of fichaFiles) {
        const anexoId = await indexedDBService.saveAnexoPendente(
          file,
          'FICHA_NOTIFICACAO',
          comunicacaoOfflineId,
          comunicacaoId
        );
        anexosSalvos.push(anexoId);
        console.log(`📎 Ficha salva para sincronização: ${file.name}`);
      }

      // Salvar relatórios
      for (const file of relatorioFiles) {
        const anexoId = await indexedDBService.saveAnexoPendente(
          file,
          'RELATORIO_INVESTIGACAO',
          comunicacaoOfflineId,
          comunicacaoId
        );
        anexosSalvos.push(anexoId);
        console.log(`📎 Relatório salvo para sincronização: ${file.name}`);
      }

      return anexosSalvos;
    } catch (err: any) {
      console.error('❌ Erro ao salvar anexos offline:', err);
      throw err;
    }
  };

  // Upload de anexos online
  const uploadAnexos = async (comunicacaoId: number) => {
    setUploadingAnexo(true);
    try {
      const uploads: Promise<any>[] = [];

      // Upload de fichas
      for (const file of fichaFiles) {
        uploads.push(
          ComunicacaoDaeService.addAnexo(comunicacaoId, file, 'FICHA_NOTIFICACAO')
        );
      }

      // Upload de relatórios
      for (const file of relatorioFiles) {
        uploads.push(
          ComunicacaoDaeService.addAnexo(comunicacaoId, file, 'RELATORIO_INVESTIGACAO')
        );
      }

      await Promise.all(uploads);
    } catch (err: any) {
      console.error('Erro ao fazer upload dos anexos:', err);
      throw err;
    } finally {
      setUploadingAnexo(false);
    }
  };

  const handleAddAnexo = async (tipo: TipoAnexo, file: File) => {
    // Calcular total de arquivos já adicionados
    const totalArquivos = isEditMode 
      ? anexos.length 
      : fichaFiles.length + relatorioFiles.length;
    
    // Validar limite de 10 arquivos
    if (totalArquivos >= 10) {
      alert('Limite máximo de 10 arquivos atingido!');
      return;
    }

    // Calcular tamanho total
    let tamanhoTotal = 0;
    
    if (isEditMode) {
      // Modo edição: somar anexos do banco
      tamanhoTotal = anexos.reduce((total, anexo) => {
        const bytes = typeof anexo.tamanho_bytes === 'string' 
          ? parseInt(anexo.tamanho_bytes, 10) 
          : Number(anexo.tamanho_bytes);
        return total + (isNaN(bytes) ? 0 : bytes);
      }, 0);
    } else {
      // Modo criação: somar arquivos locais
      tamanhoTotal = [...fichaFiles, ...relatorioFiles].reduce(
        (total, f) => total + f.size, 
        0
      );
    }
    
    const novoTamanhoTotal = tamanhoTotal + file.size;
    const LIMITE_10MB = 10 * 1024 * 1024;
    
    if (novoTamanhoTotal > LIMITE_10MB) {
      const tamanhoAtualMB = (tamanhoTotal / 1024 / 1024).toFixed(2);
      const tamanhoArquivoMB = (file.size / 1024 / 1024).toFixed(2);
      const totalMB = (novoTamanhoTotal / 1024 / 1024).toFixed(2);
      alert(`Tamanho total dos anexos excederia 10MB!\n\nAtual: ${tamanhoAtualMB}MB\nNovo arquivo: ${tamanhoArquivoMB}MB\nTotal: ${totalMB}MB`);
      return;
    }

    if (!isEditMode || !id) {
      // Modo de criação: apenas armazena o arquivo
      if (tipo === 'FICHA_NOTIFICACAO') {
        setFichaFiles(prev => [...prev, file]);
      } else {
        setRelatorioFiles(prev => [...prev, file]);
      }
      return;
    }

    // Modo de edição: faz upload imediatamente
    try {
      setUploadingAnexo(true);
      const anexo = await ComunicacaoDaeService.addAnexo(Number(id), file, tipo);
      setAnexos(prev => [...prev, anexo]);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao adicionar anexo');
    } finally {
      setUploadingAnexo(false);
    }
  };

  const handleRemoveAnexo = async (anexoId: number) => {
    if (!confirm('Tem certeza que deseja remover este anexo?')) return;

    try {
      await ComunicacaoDaeService.removeAnexo(anexoId);
      setAnexos(prev => prev.filter(a => a.id_anexo !== anexoId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao remover anexo');
    }
  };

  const handleDownloadAnexo = async (anexo: ComunicacaoDaeAnexo) => {
    try {
      await ComunicacaoDaeService.downloadAnexoWithName(anexo);
    } catch (err: any) {
      alert('Erro ao fazer download do anexo');
    }
  };

  const getOrigemOptions = () => {
    let options: any[] = [];
    switch (formData.origem_tipo) {
      case 'CRS': 
        options = [...crsList];
        break;
      case 'NHE': 
        options = [...nhes];
        break;
      case 'CIEVS': 
        options = [...cievsList];
        break;
      default: 
        return [];
    }
    
    // Ordenar numericamente extraindo números do nome
    return options.sort((a, b) => {
      // Extrai o primeiro número do nome (ex: "1º CRS" -> 1, "10º CRS" -> 10)
      const numA = parseInt(a.nome.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.nome.match(/\d+/)?.[0] || '0');
      
      // Se ambos têm números, ordenar por número
      if (numA && numB) {
        return numA - numB;
      }
      
      // Se não têm números, ordenar alfabeticamente
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader className="h-10 w-10 text-blue-500 animate-spin mb-4" />
        <p className="text-lg text-gray-600">Carregando dados...</p>
      </div>
    );
  }

  // Estilos padronizados seguindo NotificationForm
  const sectionTitleClass = "text-lg font-semibold text-gray-900 flex items-center gap-2 mb-5 pb-3 border-b-2 border-blue-100";
  const cardClass = "bg-white shadow-sm rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow";
  const labelClass = "block mb-2 font-medium text-gray-700 text-sm";
  const inputClass = "w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none";
  const selectClass = "w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none cursor-pointer";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Gradiente - Tamanho restaurado para igualar ao NotificationForm (p-4 sm:p-6) */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 sm:p-6 shadow-lg sticky top-0 z-20">
        <div className="max-w-5xl mx-auto">
          {/* Linha 1: Navegação e Título */}
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              title="Menu"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </button>
            
            <button
              onClick={() => navigate('/private/comunicacao-dae')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </button>
            
            <div className="flex flex-col flex-1 truncate">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white truncate flex-1">
                  {isEditMode ? 'Editar Comunicação DAE' : 'Nova Comunicação DAE'}
                </h1>
                {/* Indicador Online/Offline */}
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-300" title="Online" />
                ) : (
                  <WifiOff className="h-5 w-5 text-orange-300" title="Offline" />
                )}
              </div>
              {isEditMode && comunicacaoCompleta && (
                <p className="text-xs text-blue-200 font-medium">ID: #{comunicacaoCompleta.id_comunicacao}</p>
              )}
              {/* Status de dados pendentes */}
              {pendingData.comunicacoes_dae && pendingData.comunicacoes_dae > 0 && (
                <p className="text-xs text-yellow-200 font-medium">
                  📱 {pendingData.comunicacoes_dae} comunicação(ões) aguardando sincronização
                </p>
              )}
            </div>
          </div>

          {/* Linha 2: Botões de Ação */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              form="comunicacao-form"
              disabled={loading || uploadingAnexo}
              className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:gap-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm border border-transparent"
              title="Salvar"
            >
              {loading || uploadingAnexo ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{isEditMode ? 'Atualizar' : 'Salvar'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearForm}
              className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:gap-2 sm:px-4 sm:py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              title="Limpar Formulário"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/private/comunicacao-dae')}
              className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:gap-2 sm:px-4 sm:py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
              title="Cancelar"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Cancelar</span>
            </button>
          </div>
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Conteúdo Principal */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        
        {/* Status de Conexão */}
        <ConnectionStatus 
          showForceSync={true}
          className="mb-4"
        />
        
        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 shadow-sm animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Erro no formulário</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                 <button
                    onClick={() => setError(null)}
                    type="button"
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
              </div>
            </div>
          </div>
        )}

        <form id="comunicacao-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Seção: Origem e Localização */}
          <div className={cardClass}>
            <button
              type="button"
              onClick={() => toggleSection('origem')}
              className="w-full flex items-center justify-between cursor-pointer group"
            >
              <div className={sectionTitleClass}>
                <FileCheck className="w-6 h-6 text-blue-600" />
                <span>1. Origem e Localização</span>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 group-hover:text-blue-600 ${
                  expandedSections.origem ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {expandedSections.origem && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 mt-4 animate-fade-in">
              {/* Origem Da Comunicação */}
              <div>
                <label htmlFor="origem_tipo" className={labelClass}>
                  Tipo de Origem <span className="text-red-500">*</span>
                </label>
                <select
                  id="origem_tipo"
                  value={formData.origem_tipo}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      origem_tipo: e.target.value as OrigemTipo,
                      origem_id: 0
                    });
                  }}
                  className={selectClass}
                  required
                >
                  <option value="CRS">CRS - Centro Regional de Saúde</option>
                  <option value="NHE">NHE - Núcleo Hospitalar de Epidemiologia</option>
                  <option value="CIEVS">CIEVS - Centro de Informações Estratégicas em Vigilância</option>
                </select>
                <p className="mt-1.5 text-xs text-gray-500">Selecione o tipo de unidade que originou a comunicação</p>
              </div>

              {/* Unidade Específica */}
              <div>
                <SearchableSelect
                  label="Unidade Notificadora"
                  options={getOrigemOptions().map((option: any) => ({
                    id: option.id_crs || option.id_nhe || option.id_cievs,
                    label: option.nome,
                    codigo: option.codigo
                  }))}
                  value={formData.origem_id}
                  onChange={(value) => setFormData({ ...formData, origem_id: Number(value) })}
                  placeholder="Selecione a unidade..."
                  required
                  searchPlaceholder="Digite o nome ou código da unidade..."
                  emptyMessage="Nenhuma unidade encontrada"
                />
                <p className="mt-1.5 text-xs text-gray-500">Escolha a unidade específica {formData.origem_tipo}</p>
              </div>

              {/* Data da comunicação */}
              <div>
                <label htmlFor="data_comunicacao" className={labelClass}>
                  Data e Hora da Comunicação <span className="text-red-500">*</span>
                </label>
                <input
                  id="data_comunicacao"
                  type="datetime-local"
                  value={formData.data_comunicacao}
                  onChange={(e) => setFormData({ ...formData, data_comunicacao: e.target.value })}
                  className={inputClass}
                  required
                />
                <p className="mt-1.5 text-xs text-gray-500">Informe quando a comunicação foi realizada</p>
              </div>

              {/* UF de Ocorrência */}
              <div>
                <LocationInput
                  name="uf"
                  label="UF de Ocorrência"
                  value={ufOcorrencia}
                  onChange={(value) => {
                    setUfOcorrencia(value);
                    setMunicipioOcorrencia(''); // Limpar município ao trocar UF
                  }}
                  placeholder="Selecione a UF"
                  disabled={false}
                  apiEndpoint="api/tipo-estado"
                  idField="idtipo_estado"
                  required
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-500">Estado onde ocorreu o evento</p>
              </div>

              {/* Município de Ocorrência */}
              <div>
                <LocationInput
                  name="municipio"
                  label="Município de Ocorrência"
                  value={municipioOcorrencia}
                  onChange={(value) => {
                    setMunicipioOcorrencia(value);
                  }}
                  placeholder={
                    isLoadingMunicipios
                      ? "Carregando municípios..."
                      : ufOcorrencia
                        ? "Selecione o município"
                        : "Primeiro selecione a UF"
                  }
                  disabled={!ufOcorrencia || isLoadingMunicipios}
                  apiEndpoint="api/tipo-municipio"
                  idField="idtipo_municipio"
                  parentValue={ufOcorrencia}
                  required
                  className={inputClass}
                  debug={true}
                />
                <p className="mt-1.5 text-xs text-gray-500">Município onde ocorreu o evento que está sendo comunicado</p>
              </div>
            </div>
            )}
          </div>

          {/* Seção: Dados do Paciente */}
          <div className={cardClass}>
            <button
              type="button"
              onClick={() => toggleSection('paciente')}
              className="w-full flex items-center justify-between cursor-pointer group"
            >
              <div className={sectionTitleClass}>
                <AlertCircle className="w-6 h-6 text-blue-600" />
                <span>2. Dados do Paciente e Agravo</span>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 group-hover:text-blue-600 ${
                  expandedSections.paciente ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {expandedSections.paciente && (
              <div className="space-y-6 pt-4 border-t border-gray-100 mt-4 animate-fade-in">
              {/* Nome Do Paciente */}
              <div>
                <label htmlFor="nome_paciente" className={labelClass}>
                  Nome do Paciente <span className="text-red-500">*</span>
                </label>
                <input
                  id="nome_paciente"
                  type="text"
                  value={formData.nome_paciente}
                  onChange={(e) => setFormData({ ...formData, nome_paciente: normalizeText(e.target.value) })}
                  className={inputClass}
                  placeholder="Ex: JOAO DA SILVA SANTOS"
                  maxLength={150}
                  required
                />
                <p className="mt-1.5 text-xs text-gray-500 flex items-center justify-between">
                  <span>Nome completo do paciente (será convertido para MAIÚSCULAS sem acentos)</span>
                  <span className="font-medium">{formData.nome_paciente.length}/150</span>
                </p>
              </div>

              {/* DAE - Seleção com Checkboxes */}
              <div className="md:col-span-2">
                <DaeCheckboxList
                  daes={daes}
                  selectedDaeId={formData.id_dae}
                  onChange={(daeId) => {
                    setFormData({ ...formData, id_dae: daeId });
                    setError(null); // Limpar erro ao selecionar
                  }}
                  error={error && !formData.id_dae ? 'Selecione um DAE' : undefined}
                />
              </div>

              {/* Observação */}
              <div>
                <label htmlFor="observacao_descricao" className={labelClass}>
                  Observações e Descrição do Caso
                  <span className="text-gray-400 text-sm ml-2">(opcional)</span>
                </label>
                <textarea
                  id="observacao_descricao"
                  value={formData.observacao_descricao}
                  onChange={(e) => setFormData({ ...formData, observacao_descricao: normalizeText(e.target.value) })}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                  rows={5}
                  placeholder="DESCREVA DETALHADAMENTE: SINTOMAS, EVOLUCAO DO CASO, MEDIDAS TOMADAS, CONTEXTO EPIDEMIOLOGICO, ETC."
                  maxLength={1500}
                />
                <div className="mt-1.5 flex justify-between items-center">
                  <p className="text-xs text-gray-500">Informações complementares (será convertido para MAIÚSCULAS sem acentos)</p>
                  <p className={`text-xs font-medium ${(formData.observacao_descricao?.length || 0) > 1200 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {formData.observacao_descricao?.length || 0}/1500
                  </p>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Seção: Anexos */}
          <div className={cardClass}>
            <button
              type="button"
              onClick={() => toggleSection('documentacao')}
              className="w-full flex items-center justify-between cursor-pointer group"
            >
              <div className="flex flex-col items-start">
                <div className={sectionTitleClass}>
                  <FileText className="w-6 h-6 text-blue-600" />
                  <span>3. Documentação Anexa</span>
                </div>
                <p className="text-sm text-gray-600 -mt-3">Anexe os documentos relacionados à comunicação (Ficha de notificação, relatórios, etc.)</p>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 group-hover:text-blue-600 flex-shrink-0 ml-4 ${
                  expandedSections.documentacao ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {expandedSections.documentacao && (
              <div className="pt-4 border-t border-gray-100 mt-4 animate-fade-in">
                {/* Informação sobre limites com barra de progresso */}
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-blue-900 font-medium">
                      📎 Anexos: {isEditMode 
                        ? anexos.length 
                        : fichaFiles.length + relatorioFiles.length}/10
                    </p>
                    <p className="text-sm text-blue-900 font-medium">
                      {(() => {
                        const totalBytes = isEditMode 
                          ? anexos.reduce((total, anexo) => {
                              const bytes = typeof anexo.tamanho_bytes === 'string' 
                                ? parseInt(anexo.tamanho_bytes, 10) 
                                : Number(anexo.tamanho_bytes);
                              return total + (isNaN(bytes) ? 0 : bytes);
                            }, 0)
                          : [...fichaFiles, ...relatorioFiles].reduce(
                              (total, file) => total + file.size, 
                              0
                            );
                        return `${(totalBytes / 1024 / 1024).toFixed(2)}MB / 10MB`;
                      })()}
                    </p>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        (() => {
                          const totalBytes = isEditMode 
                            ? anexos.reduce((total, anexo) => {
                                const bytes = typeof anexo.tamanho_bytes === 'string' 
                                  ? parseInt(anexo.tamanho_bytes, 10) 
                                  : Number(anexo.tamanho_bytes);
                                return total + (isNaN(bytes) ? 0 : bytes);
                              }, 0)
                            : [...fichaFiles, ...relatorioFiles].reduce(
                                (total, file) => total + file.size, 
                                0
                              );
                          const percentage = (totalBytes / (10 * 1024 * 1024)) * 100;
                          if (percentage < 50) return 'bg-green-500';
                          if (percentage < 80) return 'bg-yellow-500';
                          return 'bg-red-500';
                        })()
                      }`}
                      style={{
                        width: `${(() => {
                          const totalBytes = isEditMode 
                            ? anexos.reduce((total, anexo) => {
                                const bytes = typeof anexo.tamanho_bytes === 'string' 
                                  ? parseInt(anexo.tamanho_bytes, 10) 
                                  : Number(anexo.tamanho_bytes);
                                return total + (isNaN(bytes) ? 0 : bytes);
                              }, 0)
                            : [...fichaFiles, ...relatorioFiles].reduce(
                                (total, file) => total + file.size, 
                                0
                              );
                          return Math.min((totalBytes / (10 * 1024 * 1024)) * 100, 100);
                        })()}%`
                      }}
                    />
                  </div>
                  
                  <p className="text-xs text-blue-700 mt-2">
                    💡 Máximo de 10 arquivos, tamanho total até 10MB
                  </p>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Anexo 1: Ficha */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-900 mb-3 flex items-center justify-between">
                  <span>Ficha de Notificação</span>
                  <span className="text-xs font-normal text-white bg-blue-600 px-2 py-0.5 rounded">Recomendado</span>
                </label>
                
                {/* Lista de arquivos da ficha */}
                <div className="space-y-2 mb-3">
                  {/* Arquivos já salvos no banco */}
                  {isEditMode && anexos.filter(a => a.tipo_anexo === 'FICHA_NOTIFICACAO').map((anexo) => (
                    <div key={anexo.id_anexo} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 truncate">
                        <div className="bg-blue-100 p-2 rounded text-blue-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {anexo.nome_arquivo_original}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadAnexo(anexo)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Baixar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAnexo(anexo.id_anexo)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Arquivos pendentes (modo criação) */}
                  {!isEditMode && fichaFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 truncate">
                        <div className="bg-blue-100 p-2 rounded text-blue-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFichaFiles(prev => prev.filter((_, i) => i !== index))}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Botão + para adicionar mais arquivos */}
                <FileUploadWithCompression
                  label="+ Adicionar arquivo"
                  file={null}
                  onFileSelect={(file) => {
                    if (file) {
                      handleAddAnexo('FICHA_NOTIFICACAO', file);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.heic"
                  maxSizeMB={2}
                  disabled={uploadingAnexo}
                />
              </div>

              {/* Anexo 2: Relatório */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-900 mb-3 flex items-center justify-between">
                  <span>Relatório de Investigação</span>
                  <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded">Opcional</span>
                </label>
                
                {/* Lista de arquivos do relatório */}
                <div className="space-y-2 mb-3">
                  {/* Arquivos já salvos no banco */}
                  {isEditMode && anexos.filter(a => a.tipo_anexo === 'RELATORIO_INVESTIGACAO').map((anexo) => (
                    <div key={anexo.id_anexo} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 truncate">
                        <div className="bg-purple-100 p-2 rounded text-purple-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {anexo.nome_arquivo_original}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadAnexo(anexo)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Baixar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAnexo(anexo.id_anexo)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Arquivos pendentes (modo criação) */}
                  {!isEditMode && relatorioFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 truncate">
                        <div className="bg-purple-100 p-2 rounded text-purple-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRelatorioFiles(prev => prev.filter((_, i) => i !== index))}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Botão + para adicionar mais arquivos */}
                <FileUploadWithCompression
                  label="+ Adicionar arquivo"
                  file={null}
                  onFileSelect={(file) => {
                    if (file) {
                      handleAddAnexo('RELATORIO_INVESTIGACAO', file);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.heic"
                  maxSizeMB={2}
                  disabled={uploadingAnexo}
                />
              </div>
            </div>

            {/* Status de Upload */}
            {uploadingAnexo && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center gap-3">
                <Loader className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium">Enviando arquivos para o servidor...</span>
              </div>
            )}
            </div>
            )}
          </div>

          {/* Rodapé com botões de ação CENTRALIZADOS */}
          <div className="flex items-center justify-center space-x-4 pt-6 border-t border-gray-200 mt-8 mb-8">
            <button
              type="submit"
              disabled={loading || uploadingAnexo}
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
            >
              {loading || uploadingAnexo ? (
                 <>
                   <Loader className="w-5 h-5 mr-2 animate-spin" />
                   Processando...
                 </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {isEditMode ? 'Salvar Alterações' : 'Salvar'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClearForm}
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 shadow-sm min-w-[120px] justify-center"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Limpar
            </button>

            <button
              type="button"
              onClick={() => navigate('/private/comunicacao-dae')}
              className="inline-flex items-center px-6 py-2.5 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 min-w-[120px] justify-center"
            >
              <X className="w-5 h-5 mr-2" />
              Cancelar
            </button>
          </div>

          <div className="h-4"></div>
        </form>
      </main>
    </div>
  );
};

export default ComunicacaoDaeFormPage;

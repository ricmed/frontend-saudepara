import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { getLocalDateTime, convertUTCToLocalDateTime } from '@/utils/timezoneUtils';
import { useAuth } from '@/keycloak/AuthProvider';
import {
  ComunicacaoDaeFormExportData,
  exportarComunicacaoDaeFormularioPDF,
  exportarComunicacaoDaeFormularioWord,
} from './components/formDocumentExporters';

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
  const { user, loading: authLoading } = useAuth();

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
    digitador: '',
    telefone_digitador: '',
    id_municipio_ocorrencia: 0,
    id_municipio_residencia: 0,
    origem_tipo: 'CRS' as OrigemTipo,
    origem_id: 0,
    id_daes: [],
  });

  // Dados adicionais para exibição
  const [comunicacaoCompleta, setComunicacaoCompleta] = useState<ComunicacaoDae | null>(null);

  // Listas para selects
  const [daes, setDaes] = useState<Dae[]>([]);
  const [nhes, setNhes] = useState<Nhe[]>([]);
  const [cievsList, setCievsList] = useState<Cievs[]>([]);
  const [crsList, setCrsList] = useState<Crs[]>([]);
  const [allowedOrigemTipos, setAllowedOrigemTipos] = useState<OrigemTipo[]>(['CRS', 'NHE', 'CIEVS']);
  const [lockOrigemSelection, setLockOrigemSelection] = useState(false);
  const [origemPreSelecionadaNome, setOrigemPreSelecionadaNome] = useState<string | null>(null);
  const [isOriginScopeInitialized, setIsOriginScopeInitialized] = useState(false);

  // Estados para UF e município
  const [ufOcorrencia, setUfOcorrencia] = useState<string>('15'); // Pará por padrão
  const [municipioOcorrencia, setMunicipioOcorrencia] = useState<string>('');
  const [ufResidencia, setUfResidencia] = useState<string>('15'); // Pará por padrão
  const [municipioResidencia, setMunicipioResidencia] = useState<string>('');
  const [isLoadingMunicipios] = useState(false);

  // Anexos
  const [anexos, setAnexos] = useState<ComunicacaoDaeAnexo[]>([]);
  const [fichaFiles, setFichaFiles] = useState<File[]>([]);
  const [relatorioFiles, setRelatorioFiles] = useState<File[]>([]);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportingDocument, setExportingDocument] = useState<'pdf' | 'word' | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  // Função para limpar o formulário
  const handleClearForm = () => {
    if (window.confirm('Deseja realmente limpar todos os campos do formulário?')) {
      const shouldPreserveLockedOrigem = !isEditMode && lockOrigemSelection && formData.origem_id > 0;
      const defaultOrigemTipo = !isEditMode && allowedOrigemTipos.length === 1
        ? allowedOrigemTipos[0]
        : ('CRS' as OrigemTipo);

      setFormData({
        data_comunicacao: getLocalDateTime(),
        nome_paciente: '',
        observacao_descricao: '',
        digitador: '',
        telefone_digitador: '',
        id_municipio_ocorrencia: 0,
        id_municipio_residencia: 0,
        origem_tipo: shouldPreserveLockedOrigem ? formData.origem_tipo : defaultOrigemTipo,
        origem_id: shouldPreserveLockedOrigem ? formData.origem_id : 0,
        id_daes: [],
      });
      setUfOcorrencia('15'); // Resetar para Pará
      setMunicipioOcorrencia('');
      setUfResidencia('15'); // Resetar para Pará
      setMunicipioResidencia('');
      if (!isEditMode) {
        setFichaFiles([]);
        setRelatorioFiles([]);
      }
    }
  };

  // Atualizar formData quando municipioOcorrencia mudar
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      id_municipio_ocorrencia: municipioOcorrencia ? Number(municipioOcorrencia) : 0
    }));
  }, [municipioOcorrencia]);

  // Atualizar formData quando municipioResidencia mudar
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      id_municipio_residencia: municipioResidencia ? Number(municipioResidencia) : 0
    }));
  }, [municipioResidencia]);

  useEffect(() => {
    loadSelectOptions();
    if (isEditMode && id) {
      const idNum = Number(id);
      if (Number.isFinite(idNum) && idNum > 0) {
        loadComunicacao(idNum);
      } else {
        setError('ID da comunicação inválido.');
      }
    }
  }, [id]);

  const isAdminUser = useMemo(() => {
    const roles: string[] = user?.roles || [];
    return roles.some((role) =>
      role === 'admin' ||
      role === 'administrator' ||
      role.startsWith('admin.')
    );
  }, [user?.roles]);

  const shouldLockOrigemFields = !isEditMode && lockOrigemSelection && formData.origem_id > 0;

  useEffect(() => {
    if (authLoading) return;
    if (isEditMode || isOriginScopeInitialized) return;
    if (crsList.length === 0 && nhes.length === 0 && cievsList.length === 0) return;

    const setupOrigemByUserScope = async () => {
      try {
        if (isAdminUser) {
          setAllowedOrigemTipos(['CRS', 'NHE', 'CIEVS']);
          return;
        }

        const userAccessFallback = Array.isArray(user?.usuario_acesso) ? user.usuario_acesso[0] : null;
        let acesso: any = userAccessFallback;

        try {
          const response = await axios.get('/api/usuario-acesso/current', {
            headers: { Accept: 'application/json' },
            withCredentials: true
          });
          const payload = response.data?.data ?? response.data;
          acesso = Array.isArray(payload) ? payload[0] : payload;
        } catch (err) {
          console.warn('Nao foi possivel buscar acesso atual da API, usando fallback local.');
        }

        if (!acesso) return;

        const nivelAcesso = acesso?.nivel_acesso ?? acesso?.nivel;
        const crsId = Number(acesso?.crs_id ?? acesso?.crsId ?? 0);

        if (nivelAcesso === 'crs' && crsId > 0) {
          const crsSelecionado = crsList.find(c => c.id_crs === crsId);
          setAllowedOrigemTipos(['CRS']);
          setLockOrigemSelection(true);
          setOrigemPreSelecionadaNome(crsSelecionado?.nome || `CRS ${crsId}`);
          setFormData(prev => ({
            ...prev,
            origem_tipo: 'CRS',
            origem_id: crsSelecionado?.id_crs || crsId
          }));
          return;
        }

        const estabelecimentoId = Number(acesso?.estabelecimento_id ?? acesso?.estabelecimentoId ?? 0);
        if (estabelecimentoId <= 0) return;

        let cnes: string | null = null;
        try {
          const estResponse = await axios.get(`/api/estabelecimentos/${estabelecimentoId}`, {
            headers: { Accept: 'application/json' },
            withCredentials: true
          });
          const estPayload = estResponse.data?.data ?? estResponse.data;
          if (estPayload?.cnes) {
            cnes = String(estPayload.cnes).trim();
          }
        } catch (err) {
          console.warn('Nao foi possivel buscar estabelecimento para pre-selecao de origem.');
        }

        if (!cnes) return;

        const matchCrs = crsList.find(item => String(item.codigo || '').trim() === cnes);
        const matchNhe = nhes.find(item => String(item.codigo || '').trim() === cnes);
        const matchCievs = cievsList.find(item => String(item.codigo || '').trim() === cnes);

        const matches: Array<{ tipo: OrigemTipo; id: number; nome: string }> = [];
        if (matchCrs) matches.push({ tipo: 'CRS', id: matchCrs.id_crs, nome: matchCrs.nome });
        if (matchNhe) matches.push({ tipo: 'NHE', id: matchNhe.id_nhe, nome: matchNhe.nome });
        if (matchCievs) matches.push({ tipo: 'CIEVS', id: matchCievs.id_cievs, nome: matchCievs.nome });

        if (matches.length === 0) return;

        const allowed = matches.map(m => m.tipo);
        const firstMatch = matches[0];
        setAllowedOrigemTipos(allowed);
        setOrigemPreSelecionadaNome(firstMatch.nome);
        setFormData(prev => ({
          ...prev,
          origem_tipo: firstMatch.tipo,
          origem_id: firstMatch.id
        }));

        if (matches.length === 1) {
          setLockOrigemSelection(true);
        }
      } finally {
        setIsOriginScopeInitialized(true);
      }
    };

    setupOrigemByUserScope();
  }, [authLoading, isEditMode, isOriginScopeInitialized, isAdminUser, user, crsList, nhes, cievsList]);

  useEffect(() => {
    if (!isExportMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isExportMenuOpen]);

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
    } catch (err) {
      console.error('Erro ao carregar opções:', err);
      setError('Erro ao carregar dados do formulário. Alguns dados podem estar indisponíveis offline.');
    }
  };

  const loadComunicacao = async (comunicacaoId: number) => {
    try {
      setLoadingData(true);
      
      // ✅ ONLINE: API primeiro, cache como fallback
      let data: ComunicacaoDae;
      try {
        data = await ComunicacaoDaeService.getById(comunicacaoId);
      } catch (err) {
        // ✅ FALLBACK: Tentar buscar do cache offline
        const cachedData = await indexedDBService.getOpcoes('comunicacoes_dae');
        const comunicacaoOffline = cachedData?.find((c: any) => c.id_comunicacao === comunicacaoId);
        
        if (comunicacaoOffline) {
          data = comunicacaoOffline;
        } else {
          throw new Error('Comunicação não encontrada na API nem no cache offline');
        }
      }
      
      setComunicacaoCompleta(data);
      
      const dataConvertida = convertUTCToLocalDateTime(data.data_comunicacao);
      
      const agravoIds =
        data.id_daes?.length ? [...new Set(data.id_daes)] : data.id_dae ? [data.id_dae] : [];

      setFormData({
        data_comunicacao: dataConvertida,
        nome_paciente: normalizeText(data.nome_paciente),
        observacao_descricao: normalizeText(data.observacao_descricao || ''),
        digitador: data.digitador ? normalizeText(data.digitador) : '',
        telefone_digitador: data.telefone_digitador || '',
        id_municipio_ocorrencia: data.id_municipio_ocorrencia,
        id_municipio_residencia: data.id_municipio_residencia || 0,
        origem_tipo: data.origem_tipo,
        origem_id: data.origem_id,
        id_daes: agravoIds,
      });

      const carregarUfEMunicipio = async (
        municipioId: number | undefined,
        setUf: (value: string) => void,
        setMunicipio: (value: string) => void,
        nomeCampo: string
      ) => {
        if (!municipioId) return;

        try {
          // Buscar informações do município para obter a UF
          const municipios = await indexedDBService.getOpcoes('municipios');
          const municipioData = municipios?.find((m: any) =>
            Number(m.idtipo_municipio) === Number(municipioId)
          );

          if (municipioData && municipioData.tipo_estado_idtipo_estado) {
            setUf(String(municipioData.tipo_estado_idtipo_estado));
            setTimeout(() => {
              setMunicipio(String(municipioId));
            }, 100);
            return;
          }

          // Tentar buscar do backend como fallback
          const server = import.meta.env.VITE_API_SERVER || "";
          const port = import.meta.env.VITE_API_PORT || "";
          const baseUrl = server && port ? `${server}:${port}/` : "/";
          const response = await axios.get(`${baseUrl}api/tipo-municipio/${municipioId}`);

          if (response.data && response.data.tipo_estado_idtipo_estado) {
            setUf(String(response.data.tipo_estado_idtipo_estado));
            setTimeout(() => {
              setMunicipio(String(municipioId));
            }, 100);
          }
        } catch (apiErr) {
          setError(`Não foi possível carregar o município de ${nomeCampo}. Verifique sua conexão.`);
        }
      };

      await carregarUfEMunicipio(
        data.id_municipio_ocorrencia,
        setUfOcorrencia,
        setMunicipioOcorrencia,
        'ocorrência'
      );

      await carregarUfEMunicipio(
        data.id_municipio_residencia,
        setUfResidencia,
        setMunicipioResidencia,
        'residência'
      );

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
    if (!formData.id_municipio_residencia) {
      setError('Município de residência é obrigatório');
      return;
    }
    if (!formData.origem_id) {
      setError('Origem da comunicação é obrigatória');
      return;
    }
    const agravoIds = [...new Set(formData.id_daes || [])].filter((x) => x > 0);
    if (agravoIds.length === 0) {
      setError('Selecione ao menos um agravo (DAE)');
      return;
    }

    const formPayload: CreateComunicacaoDaeData = {
      ...formData,
      id_daes: agravoIds,
      id_dae: agravoIds[0],
    };

    try {
      setLoading(true);
      setError(null);
      console.log('📝 Iniciando salvamento da comunicação DAE...');

      // ✅ USAR SISTEMA OFFLINE
      const syncService = (await import('@/services/syncService')).default;
      
      if (isEditMode && id) {
        // Atualizar comunicação existente
        console.log('🔄 Atualizando comunicação existente...');
        const formDataWithId = { ...formPayload, id: Number(id), id_comunicacao: Number(id) };
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
        const result = await syncService.saveComunicacaoDae(formPayload, false);
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

  const getOrigemSelecionada = (): { nome?: string; codigo?: string } | null => {
    const origemId = Number(formData.origem_id || 0);
    if (!origemId) return null;

    switch (formData.origem_tipo) {
      case 'CRS':
        return crsList.find((item) => item.id_crs === origemId) || null;
      case 'NHE':
        return nhes.find((item) => item.id_nhe === origemId) || null;
      case 'CIEVS':
        return cievsList.find((item) => item.id_cievs === origemId) || null;
      default:
        return null;
    }
  };

  const resolveMunicipioNome = async (municipioId: number, fallbackName?: string): Promise<string> => {
    if (fallbackName && fallbackName.trim()) {
      return fallbackName;
    }

    if (!municipioId) {
      return '-';
    }

    try {
      const municipios = await indexedDBService.getOpcoes('municipios');
      const municipio = municipios?.find((item: any) => Number(item.idtipo_municipio) === Number(municipioId));
      return municipio?.descricao || municipio?.nome || `ID ${municipioId}`;
    } catch {
      return `ID ${municipioId}`;
    }
  };

  const buildExportData = async (): Promise<ComunicacaoDaeFormExportData> => {
    const origemSelecionada = getOrigemSelecionada();
    const agravoIds = formData.id_daes?.length
      ? formData.id_daes
      : formData.id_dae
        ? [formData.id_dae]
        : [];
    const daeNomesList = agravoIds
      .map((i) => daes.find((item) => item.id_dae === Number(i))?.nome)
      .filter(Boolean) as string[];
    const daeNomeJoined =
      daeNomesList.join(', ') ||
      comunicacaoCompleta?.daes?.map((d) => d.nome).join(', ') ||
      comunicacaoCompleta?.dae?.nome ||
      '-';
    const primeiroDae = daes.find((item) => item.id_dae === Number(agravoIds[0]));
    const daeCodigo =
      primeiroDae?.codigo || comunicacaoCompleta?.daes?.[0]?.codigo || comunicacaoCompleta?.dae?.codigo || '-';

    const [municipioOcorrenciaNome, municipioResidenciaNome] = await Promise.all([
      resolveMunicipioNome(formData.id_municipio_ocorrencia, comunicacaoCompleta?.tipo_municipio?.descricao),
      resolveMunicipioNome(formData.id_municipio_residencia, comunicacaoCompleta?.tipo_municipio_residencia?.descricao),
    ]);

    const anexosSalvos = anexos.map((anexo) => ({
      nome_arquivo: anexo.nome_arquivo_original,
      tipo_anexo: anexo.tipo_anexo,
      tamanho_bytes:
        typeof anexo.tamanho_bytes === 'string'
          ? Number.parseInt(anexo.tamanho_bytes, 10)
          : Number(anexo.tamanho_bytes),
    }));

    const anexosPendentes = [
      ...fichaFiles.map((file) => ({
        nome_arquivo: file.name,
        tipo_anexo: 'FICHA_NOTIFICACAO',
        tamanho_bytes: file.size,
      })),
      ...relatorioFiles.map((file) => ({
        nome_arquivo: file.name,
        tipo_anexo: 'RELATORIO_INVESTIGACAO',
        tamanho_bytes: file.size,
      })),
    ];

    return {
      idComunicacao: comunicacaoCompleta?.id_comunicacao ?? (isEditMode && id ? Number(id) : undefined),
      dataComunicacao: formData.data_comunicacao || comunicacaoCompleta?.data_comunicacao,
      nomePaciente: formData.nome_paciente || comunicacaoCompleta?.nome_paciente,
      origemTipo: formData.origem_tipo || comunicacaoCompleta?.origem_tipo,
      origemNome: origemSelecionada?.nome || origemPreSelecionadaNome || '-',
      daeNome: daeNomeJoined,
      daeCodigo,
      municipioOcorrencia: municipioOcorrenciaNome,
      municipioResidencia: municipioResidenciaNome,
      digitador: formData.digitador || comunicacaoCompleta?.digitador || '-',
      telefoneDigitador: formData.telefone_digitador || comunicacaoCompleta?.telefone_digitador || '-',
      observacao: formData.observacao_descricao || comunicacaoCompleta?.observacao_descricao || '-',
      anexos: [...anexosSalvos, ...anexosPendentes],
    };
  };

  const handleExportDocumento = async (tipo: 'pdf' | 'word') => {
    try {
      setIsExportMenuOpen(false);
      setExportingDocument(tipo);
      setError(null);

      const exportData = await buildExportData();

      if (tipo === 'pdf') {
        await exportarComunicacaoDaeFormularioPDF(exportData);
      } else {
        await exportarComunicacaoDaeFormularioWord(exportData);
      }
    } catch (err) {
      console.error('Erro ao exportar documento DAE:', err);
      setError('Nao foi possivel exportar o documento. Tente novamente.');
    } finally {
      setExportingDocument(null);
    }
  };

  const getOrigemOptions = () => {
    if (!allowedOrigemTipos.includes(formData.origem_tipo)) {
      return [];
    }

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

  const origemTipoOptions: Array<{ value: OrigemTipo; label: string }> = [
    { value: 'CRS', label: 'CRS - Centro Regional de Saude' },
    { value: 'NHE', label: 'NHE - Nucleo Hospitalar de Epidemiologia' },
    { value: 'CIEVS', label: 'CIEVS - Centro de Informacoes Estrategicas em Vigilancia' }
  ];

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
  const cardClass = "bg-white shadow-sm rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow";
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
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <button
              type="submit"
              form="comunicacao-form"
              disabled={loading || uploadingAnexo || !!exportingDocument}
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

            <div ref={exportMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                disabled={loading || uploadingAnexo || !!exportingDocument}
                className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:gap-2 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm border border-transparent"
                title="Exportar documento"
              >
                {exportingDocument ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {exportingDocument === 'pdf'
                    ? 'Gerando PDF...'
                    : exportingDocument === 'word'
                      ? 'Gerando Word...'
                      : 'Exportar'}
                </span>
                {!exportingDocument && <ChevronDown className="h-4 w-4 hidden sm:inline" />}
              </button>

              {isExportMenuOpen && !exportingDocument && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-30 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleExportDocumento('pdf')}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    Exportar em PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportDocumento('word')}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                  >
                    <FileText className="h-4 w-4 text-indigo-600" />
                    Exportar em Word (.docx)
                  </button>
                </div>
              )}
            </div>

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
                  disabled={shouldLockOrigemFields}
                  required
                >
                  {origemTipoOptions
                    .filter(option => allowedOrigemTipos.includes(option.value))
                    .map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500">
                  {shouldLockOrigemFields
                    ? 'Tipo de origem definido automaticamente pelo seu perfil de acesso'
                    : 'Selecione o tipo de unidade que originou a comunicação'}
                </p>
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
                  disabled={shouldLockOrigemFields}
                  searchPlaceholder="Digite o nome ou código da unidade..."
                  emptyMessage="Nenhuma unidade encontrada"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  {shouldLockOrigemFields
                    ? `Unidade pre-selecionada automaticamente: ${origemPreSelecionadaNome || 'unidade vinculada ao seu acesso'}`
                    : `Escolha a unidade específica ${formData.origem_tipo}`}
                </p>
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

              {/* UF de Residência */}
              <div>
                <LocationInput
                  name="uf_residencia"
                  label="UF de Residência"
                  value={ufResidencia}
                  onChange={(value) => {
                    setUfResidencia(value);
                    setMunicipioResidencia(''); // Limpar município ao trocar UF
                  }}
                  placeholder="Selecione a UF"
                  disabled={false}
                  apiEndpoint="api/tipo-estado"
                  idField="idtipo_estado"
                  required
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-500">Estado de residência do paciente</p>
              </div>

              {/* Município de Residência */}
              <div>
                <LocationInput
                  name="municipio_residencia"
                  label="Município de Residência"
                  value={municipioResidencia}
                  onChange={(value) => {
                    setMunicipioResidencia(value);
                  }}
                  placeholder={
                    isLoadingMunicipios
                      ? "Carregando municípios..."
                      : ufResidencia
                        ? "Selecione o município"
                        : "Primeiro selecione a UF"
                  }
                  disabled={!ufResidencia || isLoadingMunicipios}
                  apiEndpoint="api/tipo-municipio"
                  idField="idtipo_municipio"
                  parentValue={ufResidencia}
                  required
                  className={inputClass}
                  debug={true}
                />
                <p className="mt-1.5 text-xs text-gray-500">Município de residência do paciente</p>
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
                  selectedDaeIds={formData.id_daes || []}
                  pinSelectedToTop={isEditMode}
                  onChange={(daeIds) => {
                    setFormData({ ...formData, id_daes: daeIds });
                    setError(null);
                  }}
                  error={error && !(formData.id_daes?.length ?? 0) ? 'Selecione ao menos um agravo (DAE)' : undefined}
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
                  className="w-full min-h-[120px] p-3 border border-gray-200 rounded-lg text-sm bg-white transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y"
                  rows={5}
                  placeholder="DESCREVA DETALHADAMENTE: SINTOMAS, EVOLUCAO DO CASO, MEDIDAS TOMADAS, CONTEXTO EPIDEMIOLOGICO, ETC."
                  maxLength={4000}
                />
                <div className="mt-1.5 flex justify-between items-center">
                  <p className="text-xs text-gray-500">Informações complementares (será convertido para MAIÚSCULAS sem acentos)</p>
                  <p className={`text-xs font-medium ${(formData.observacao_descricao?.length || 0) > 3400 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {formData.observacao_descricao?.length || 0}/4000
                  </p>
                </div>
              </div>

              {/* Digitador e Telefone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome do Digitador */}
                <div>
                  <label htmlFor="digitador" className={labelClass}>
                    Nome do Digitador
                    <span className="text-gray-400 text-sm ml-2">(opcional)</span>
                  </label>
                  <input
                    id="digitador"
                    type="text"
                    value={formData.digitador || ''}
                    onChange={(e) => setFormData({ ...formData, digitador: normalizeText(e.target.value) })}
                    className={inputClass}
                    placeholder="Ex: MARIA OLIVEIRA SANTOS"
                    maxLength={150}
                  />
                  <p className="mt-1.5 text-xs text-gray-500 flex items-center justify-between">
                    <span>Nome de quem está inserindo os dados (será convertido para MAIÚSCULAS sem acentos)</span>
                    <span className="font-medium">{(formData.digitador || '').length}/150</span>
                  </p>
                </div>

                {/* Telefone do Digitador */}
                <div>
                  <label htmlFor="telefone_digitador" className={labelClass}>
                    Telefone do Digitador
                    <span className="text-gray-400 text-sm ml-2">(opcional)</span>
                  </label>
                  <input
                    id="telefone_digitador"
                    type="tel"
                    value={formData.telefone_digitador || ''}
                    onChange={(e) => {
                      // Aplicar máscara de telefone brasileiro
                      let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
                      
                      // Limitar a 11 dígitos (DDD + 9 dígitos)
                      if (value.length > 11) {
                        value = value.substring(0, 11);
                      }
                      
                      // Aplicar máscara: (99) 99999-9999 ou (99) 9999-9999
                      if (value.length > 10) {
                        // Celular com 9 dígitos
                        value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
                      } else if (value.length > 6) {
                        // Fixo com 8 dígitos ou celular parcial
                        value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                      } else if (value.length > 2) {
                        value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                      } else if (value.length > 0) {
                        value = value.replace(/^(\d{0,2})/, '($1');
                      }
                      
                      setFormData({ ...formData, telefone_digitador: value });
                    }}
                    className={inputClass}
                    placeholder="(91) 98765-4321"
                    maxLength={15}
                  />
                  <p className="mt-1.5 text-xs text-gray-500">Telefone de contato do digitador (celular ou fixo com DDD)</p>
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
                    💡 É possível anexar várias fichas de notificação (ex.: 3 ou mais), além de relatórios. Máximo de 10
                    arquivos no total, somando até 10MB
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-6 border-t border-gray-200 mt-8 mb-8">
            <button
              type="submit"
              disabled={loading || uploadingAnexo}
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center w-full sm:w-auto"
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
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 shadow-sm min-w-[120px] justify-center w-full sm:w-auto"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Limpar
            </button>

            <button
              type="button"
              onClick={() => navigate('/private/comunicacao-dae')}
              className="inline-flex items-center px-6 py-2.5 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 min-w-[120px] justify-center w-full sm:w-auto"
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

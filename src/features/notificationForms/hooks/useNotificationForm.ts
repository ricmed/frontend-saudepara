// useNotificationForm.ts - Versão Completa com Sistema Offline
// ✅ IMPLEMENTAÇÃO CORRIGIDA E CENTRALIZADA PARA MANIPULAÇÃO DE ARQUIVOS
// 
// PRINCIPAIS MELHORIAS v2.1:
// 1. handleArquivosChange() - Função centralizada com sincronização aprimorada
// 2. Separação adequada entre metadados (estado React) e objetos File (storage)
// 3. Validação de arquivos antes de atualizar o storage
// 4. Limpeza automática de arquivos inválidos do storage
// 5. Debug detalhado para troubleshooting
// 6. Rollback automático em caso de falha na validação
// 7. ✅ CORREÇÃO CRÍTICA: handleSubmit isola array 'arquivos' da conversão toUpperCase

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import syncService from '@/services/syncService';
import indexedDBService from '@/services/indexedDB';
import { deviceIdService } from '@/services/deviceIdService';

import { useOfflineSystem } from '@/hooks/useOfflineSystem';

// Certificar que window.fileStorage existe
if (!(window as any).fileStorage) {
  (window as any).fileStorage = new Map<string, File>();
  console.log('📁 window.fileStorage inicializado');
}

import { 
  type FormData, 
  ArquivoFormulario,
  validateTotalFiles,
  validateFile,
  DEFAULT_UPLOAD_CONFIG,
  detectUserTimezone,
  EventoOption, 
  LocalidadeEventoDTO,
  ModoLocalidadeEvento,
  PublicoOption, 
  PaisOption, 
  EstadoOption, 
  MunicipioOption, 
  BairroOption, 
  GeneroOption, 
  RacaOption,
  EscolaridadeOption,
  AtendimentoOption,
  SintomaOption,
  HipoteseDiagOption,
  TraumaOption,
  EstabelecimentoOption,
  EncerramentoOption
} from '@/features/notificationForms/types/index2';
import { 
  normalizeText, 
  toUpperCaseAllStrings, 
  compareDates,
  isTipoAtendimento,
  isTipoEncerramento,
  validateForm,
  mapGestanteForApi,
  mapGestanteFromApi,
  changeEventoAndClearLocalidade,
  getModoLocalidadeEvento
} from '../utils/formUtils';
import {
  normalizeOptionLabels,
  orderOptionsByPriorityIncludes
} from '../utils/optionHelpers';
import {
  cpfAlreadyRegistered,
} from '../utils/patientLookupHelpers';
import { buildPatientPayloadFromForm } from '../utils/patientPayloadHelpers';
import { buildNotificationDataForBackend } from '../utils/notificationPayloadHelpers';
import {
  extractBackendMessage,
  mapBackendValidationErrors
} from '../utils/backendErrorHelpers';
import { 
  exportToExcel, 
  exportToWord, 
  exportToCSV, 
  exportToPDF 
} from '@/features/notificationForms/components/exportUtilities';
import { enrichExportOptions } from '@/features/notificationForms/utils/enrichExportOptions';
import {
  applyResidenciaAutoFill,
  findSantaremMunicipioId,
  PARA_ESTADO_ID,
  resolveResidenciaChangeFlags,
  usaLocalidadeEvento,
} from '../utils/procedenciaResidencia';
import { resolvePrefillEventoId } from '../utils/saireEventPrefill';
import { useSectionExpansion } from './useSectionExpansion';
import { NotificacaoService } from '@/services/NotificacaoService';
import { LocalidadeEventoService } from '@/services/LocalidadeEventoService';
import { Paciente, PacienteService } from '@/services/PacienteService';
import { ListaSindromicaService } from '@/services/ListaSindromicaService';

// 🔧 REMOVIDA A CLASSE FILEMANAGER - AGORA USANDO window.fileStorage

// Definir interface para hipótese filtrada com informação de relevância
interface HipoteseFiltrada extends HipoteseDiagOption {
  qtdSintomas?: number; // Quantidade de sintomas relacionados
}

// Função utilitária para calcular idade automaticamente a partir da data de nascimento
export const calcularIdadeAutomatica = (dataNascimento: string) => {
  if (!dataNascimento) {
    return { idade: "", idadeMeses: "", idadeUnidade: 'anos' as 'anos' | 'meses' };
  }

  try {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    
    // Verificar se a data é válida
    if (isNaN(nascimento.getTime()) || nascimento > hoje) {
      return { idade: "", idadeMeses: "", idadeUnidade: 'anos' as 'anos' | 'meses' };
    }

    let anos = hoje.getFullYear() - nascimento.getFullYear();
    let meses = hoje.getMonth() - nascimento.getMonth();

    // Ajustar se ainda não completou o aniversário no mês atual
    if (meses < 0 || (meses === 0 && hoje.getDate() < nascimento.getDate())) {
      anos--;
      meses += 12;
    }

    // Ajustar se ainda não completou o dia no mês atual
    if (hoje.getDate() < nascimento.getDate()) {
      meses--;
    }

    const totalMeses = anos * 12 + meses;

    // Definir unidade automaticamente: menos de 12 meses = 'meses', 12+ = 'anos'
    const unidade = totalMeses < 12 ? 'meses' : 'anos';

    return {
      idade: anos.toString(),
      idadeMeses: totalMeses.toString(),
      idadeUnidade: unidade
    };
  } catch (error) {
    console.error('Erro ao calcular idade:', error);
    return { idade: "", idadeMeses: "", idadeUnidade: 'anos' as 'anos' | 'meses' };
  }
};

// Initial form data
const initialFormData: FormData = {
  evento: "",
  publicoAtendido: "",
  localidadeEvento: "",
  localidadeEventoOutro: "",
  localidadeEventoAtual: null,

  // Seção 2: Procedência do indivíduo
  residenteBelem: "",
  bairro: "",
  municipio: "",
  uf: "",
  paisProcedencia: "",
  localHospedagem: "",
  contatoLocal: "",
  // Seção 3: Identificação do indivíduo
  paciente: "",
  pacienteId: undefined,
  nomeMae: "",
  dataNascimento: "",
  idade: "",
  idadeMeses: "", // <-- CAMPO ADICIONADO AQUI
  idadeUnidade: 'anos' as 'anos' | 'meses', // <-- VALOR INICIAL
  cpf: "",
  identidadeGenero: "",
  gestante: "",
  raca: "",
  escolaridade: "",
  profissao: "",
  profissaoSearch: "",
  showProfissaoOptions: false,
  ddi: "55", // Valor padrão (Brasil)
  contatoTelefonico: "",

  // Seção 4: Informações do atendimento
  tipoAtendimento: "",
  sinaisESintomas: [],
  dataInicioSintomas: "",
  observacaoSintomas: "",
  hipoteseDiagnostica: [],
  observacaoHipotese: "",
  tipoTrauma: [],
  observacaoTrauma: "",
  relacionadoSurto: "",
  observacaoIncidente: "",

  // Seção 5: Informações da unidade notificadora
  dataAtendimento: "",
  unidadeNotificadora: "",
  nomeNotificador: "",
  contatoNotificador: "",

  // Seção 6: Encerramento do Caso
  dataEncerramento: "",
  tipoEncerramento: "",
  localEncaminhamento: "",

  // 🆕 SEÇÃO: Arquivos Anexos - TEMPORARIAMENTE OCULTO (mas mantido para evitar erros)
  arquivos: [],

  // 🆕 Timezone automático (detectado no carregamento)
  ...detectUserTimezone(),

  // Campos de auditoria (apenas para exibição)
  created_at: undefined,
  updated_at: undefined,
};

const PATIENT_CREATE_ERROR_FIELD_MAP: Record<string, string> = {
  nome: "paciente",
  cpf: "cpf",
  data_nascimento: "dataNascimento",
  nome_mae: "nomeMae",
  tipo_genero_idtipo_genero: "identidadeGenero",
  tipo_raca_idtipo_raca: "raca",
  escolaridade_idescolaridade: "escolaridade",
  contato: "contatoTelefonico",
};

const NOTIFICATION_SAVE_ERROR_FIELD_MAP: Record<string, string> = {
  tipo_evento_idtipo_evento: "evento",
  tipo_publico_idtipo_publico: "publicoAtendido",
  localidade_evento_id: "localidadeEvento",
  localidade_evento_outro: "localidadeEventoOutro",
  paciente_idpaciente: "paciente",
  residente_belem: "residenteBelem",
  tipo_pais_idtipo_pais: "paisProcedencia",
  tipo_estado_idtipo_estado: "uf",
  tipo_municipio_idtipo_municipio: "municipio",
  tipo_bairro_idtipo_bairro: "bairro",
  tipo_atendimento_idtipo_atendimento: "tipoAtendimento",
  tipo_encerramento_idtipo_encerramento: "tipoEncerramento",
};

export const useNotificationForm = (
  isEditMode: boolean = false,
  id?: string,
  offlineId?: string,
) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // ✅ GARANTIR QUE window.fileStorage EXISTA (já inicializado no topo do arquivo)
  useEffect(() => {
    if (!(window as any).fileStorage) {
      (window as any).fileStorage = new Map<string, File>();
      console.log('📁 window.fileStorage inicializado no hook.');
    }
  }, []);
  
  // ✅ INTEGRAR com sistema offline
  const {
    isOnline: systemIsOnline,
    searchPatientsOfflineSafe,
    savePatientOfflineSafe,
    saveNotificationOfflineSafe,
    checkCpfOfflineSafe,
    getOfflineStatusMessage,
    isReadyForOffline,
    hasDataToSync,
    pendingData: systemPendingData,
    syncPendingData
  } = useOfflineSystem();
  
  // Estado para o formulário
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // ✅ NOVO: Estado para rastrear os IDs dos arquivos a serem excluídos
  // Este estado mantém uma lista de IDs numéricos de arquivos existentes que foram removidos
  // e precisam ser excluídos no backend quando o formulário for submetido
  const [arquivosParaExcluir, setArquivosParaExcluir] = useState<number[]>([]);
  
  // ✅ CORREÇÃO DUPLICATAS: Gerar offline_id uma única vez para novas notificações
  useEffect(() => {
    const generateOfflineId = async () => {
      // Só gerar offline_id se for nova notificação (não edição) e ainda não tiver
      if (!isEditMode && !offlineId && !(formData as any).offline_id) {
        const offlineId = await deviceIdService.generateOfflineId();
        console.log(`🆔 [FORM] Gerando offline_id único para nova notificação: ${offlineId}`);
        setFormData(prev => ({
          ...prev,
          offline_id: offlineId
        } as any));
      }
    };
    
    generateOfflineId();
  }, [isEditMode, offlineId]);
  
  // Estado para controle de carregamento e erros da API
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [optionsLoaded, setOptionsLoaded] = useState<boolean>(false);
  
  // Estado para busca de pacientes
  const [pacienteSuggestions, setPacienteSuggestions] = useState<Paciente[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isCreatingNewPatient, setIsCreatingNewPatient] = useState<boolean>(false);
  const [originalCpf, setOriginalCpf] = useState<string>("");
  
  // Estado para opções de dropdown
  const [eventoOptions, setEventoOptions] = useState<EventoOption[]>([]);
  const [localidadeEventoOptions, setLocalidadeEventoOptions] = useState<
    LocalidadeEventoDTO[]
  >([]);
  const [isLoadingLocalidadesEvento, setIsLoadingLocalidadesEvento] =
    useState(false);
  const [
    localidadeEventoCatalogAvailable,
    setLocalidadeEventoCatalogAvailable,
  ] = useState(true);
  const [publicoOptions, setPublicoOptions] = useState<PublicoOption[]>([]);
  const [paisOptions, setPaisOptions] = useState<PaisOption[]>([]);
  const [estadoOptions, setEstadoOptions] = useState<EstadoOption[]>([]);
  const [municipioOptions, setMunicipioOptions] = useState<MunicipioOption[]>([]);
  const [bairroOptions, setBairroOptions] = useState<BairroOption[]>([]);
  const [generoOptions, setGeneroOptions] = useState<GeneroOption[]>([]);
  const [racaOptions, setRacaOptions] = useState<RacaOption[]>([]);
  const [escolaridadeOptions, setEscolaridadeOptions] = useState<EscolaridadeOption[]>([]);
  const [atendimentoOptions, setAtendimentoOptions] = useState<AtendimentoOption[]>([]);
  const [sintomaOptions, setSintomaOptions] = useState<SintomaOption[]>([]);
  const [hipoteseDiagOptions, setHipoteseDiagOptions] = useState<HipoteseDiagOption[]>([]);
  const [traumaOptions, setTraumaOptions] = useState<TraumaOption[]>([]);
  const [encerramentoOptions, setEncerramentoOptions] = useState<EncerramentoOption[]>([]);
  const [estabelecimentoOptions, setEstabelecimentoOptions] = useState<EstabelecimentoOption[]>([]);

  // Estado para controle da busca de municípios
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState<boolean>(false);
  const [ufError, setUfError] = useState<string | null>(null);
  const latestUfRef = useRef<string>("");
  const localidadeEventoRequestRef = useRef(0);
  const prevResidenteRef = useRef<string | null>(null);
  const santaremMunicipioIdRef = useRef<string | null>(null);

  const modoLocalidadeEvento = getModoLocalidadeEvento(
    formData.evento,
    eventoOptions,
  );
  const santaremMunicipioId = useMemo(() => {
    const found = findSantaremMunicipioId(municipioOptions);
    if (found) {
      santaremMunicipioIdRef.current = found;
    }
    // Mantém o id depois que a lista de municípios troca de UF (ex.: usuário
    // saiu do Pará), para a pré-seleção de NÃO/SIM não esperar outro fetch.
    return santaremMunicipioIdRef.current ?? found;
  }, [municipioOptions]);
  const eventoLocalidadeMetadataLoaded =
    !formData.evento ||
    eventoOptions.some(
      evento => evento.idtipo_evento.toString() === formData.evento,
    );
  const localidadeEventoSelectedRef = useRef(formData.localidadeEvento);
  const localidadeEventoAtualRef = useRef(formData.localidadeEventoAtual);
  localidadeEventoSelectedRef.current = formData.localidadeEvento;
  localidadeEventoAtualRef.current = formData.localidadeEventoAtual;

  const loadLocalidadesEvento = useCallback(
    async (
      eventoIdValue: string,
      modo: ModoLocalidadeEvento,
      selectedIdValue: string,
      currentLocalidade: LocalidadeEventoDTO | null | undefined,
    ) => {
      const requestId = ++localidadeEventoRequestRef.current;
      const eventoId = Number(eventoIdValue);

      if (
        modo === 'NAO_USA' ||
        !Number.isInteger(eventoId) ||
        eventoId <= 0
      ) {
        setLocalidadeEventoOptions([]);
        setLocalidadeEventoCatalogAvailable(true);
        setIsLoadingLocalidadesEvento(false);
        return;
      }

      setIsLoadingLocalidadesEvento(true);

      try {
        let catalog: LocalidadeEventoDTO[] | null = null;
        const canUseOnline = await syncService.canUseOnlineMode();

        if (canUseOnline) {
          try {
            catalog = await LocalidadeEventoService.getByEventoId(eventoId);
            await indexedDBService.saveLocalidadesEvento(eventoId, catalog);
          } catch (error: any) {
            console.warn('Falha ao atualizar catálogo de localidades', {
              eventoId,
              status: error?.response?.status,
            });
          }
        }

        if (catalog === null) {
          catalog = await indexedDBService.getLocalidadesEvento(eventoId);
        }

        if (requestId !== localidadeEventoRequestRef.current) {
          return;
        }

        const hasCatalog = catalog !== null;
        const options = catalog ? [...catalog] : [];
        const selectedId = Number(selectedIdValue);

        if (
          currentLocalidade &&
          currentLocalidade.id === selectedId &&
          !options.some(option => option.id === currentLocalidade.id)
        ) {
          options.push(currentLocalidade);
        }

        setLocalidadeEventoOptions(options);
        setLocalidadeEventoCatalogAvailable(hasCatalog);
      } catch (error: any) {
        if (requestId === localidadeEventoRequestRef.current) {
          setLocalidadeEventoOptions([]);
          setLocalidadeEventoCatalogAvailable(false);
        }
        console.warn('Catálogo de localidades indisponível', {
          eventoId,
          status: error?.response?.status,
        });
      } finally {
        if (requestId === localidadeEventoRequestRef.current) {
          setIsLoadingLocalidadesEvento(false);
        }
      }
    },
    [],
  );
  
  // Estados para buscas
  const [searchSintomas, setSearchSintomas] = useState("");
  const [searchTrauma, setSearchTrauma] = useState("");
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  
  // Estados para ajuda de identidade de gênero
  const [showGenderHelp, setShowGenderHelp] = useState<boolean>(false);

  // Estados para hipóteses diagnósticas filtradas
  const [hipoteseDiagFiltradas, setHipoteseDiagFiltradas] = useState<HipoteseFiltrada[]>([]);
  const [isLoadingHipoteses, setIsLoadingHipoteses] = useState<boolean>(false);
  
  // Usar o hook de expansão de seções
  const sectionExpansion = useSectionExpansion();
  const { 
    expandedSections, 
    setExpandedSections,
    toggleSection 
  } = sectionExpansion;

  // ✅ =================================================================
  // ✅ FUNÇÃO CORRIGIDA E CENTRALIZADA PARA MANIPULAR ARQUIVOS
  // ✅ =================================================================
  const handleArquivosChange = useCallback((arquivosRecebidos: ArquivoFormulario[]) => {
    console.log('[HOOK] handleArquivosChange foi chamado com', arquivosRecebidos.length, 'arquivos.');
    const storage = (window as any).fileStorage as Map<string, File>;

    // 1. Sincronizar o `window.fileStorage` primeiro.
    // Esta é a etapa mais crítica para garantir que o objeto File seja armazenado.
    arquivosRecebidos.forEach(arquivo => {
      // Adiciona ao storage apenas se for um arquivo novo (que vem com a propriedade .file)
      if (arquivo.file && arquivo.id) {
        storage.set(arquivo.id, arquivo.file);
      }
    });

    // 2. Preparar a lista de metadados para o estado do React (sem o objeto File).
    // Isso evita armazenar dados não-serializáveis no estado.
    const arquivosParaEstado = arquivosRecebidos.map(({ file, ...rest }) => rest);

    // 3. Validar o conjunto total de arquivos (usando os metadados)
    const totalValidation = validateTotalFiles(arquivosParaEstado, DEFAULT_UPLOAD_CONFIG);
    if (!totalValidation.valid) {
      toast.error(totalValidation.error);
      setErrors(prev => ({ ...prev, arquivos: totalValidation.error! }));
      // Opcional: remover do storage os arquivos que acabaram de ser adicionados se a validação falhar
      arquivosRecebidos.forEach(arquivo => {
        if (arquivo.file && arquivo.id) storage.delete(arquivo.id);
      });
      return;
    } else {
      // Limpa o erro se a validação passar
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.arquivos;
        return newErrors;
      });
    }

    // ✅ NOVO: Lógica para rastrear exclusões de arquivos existentes
    setFormData(prevFormData => {
      const idsAtuais = new Set((prevFormData.arquivos || []).map(a => a.id));
      const idsNovos = new Set(arquivosRecebidos.map(a => a.id));

      // Verificar quais arquivos existentes foram removidos
      idsAtuais.forEach(id => {
        // Se um ID existia antes e não existe mais, e é um arquivo existente (não temporário)
        if (id && !idsNovos.has(id) && !id.startsWith('TEMP_') && !id.startsWith('temp_')) {
          const idNumerico = Number(id);
          if (!isNaN(idNumerico)) {
            setArquivosParaExcluir(prevExcluir => {
              if (!prevExcluir.includes(idNumerico)) {
                console.log(`[HOOK] 🗑️ Arquivo com ID ${id} marcado para exclusão.`);
                return [...prevExcluir, idNumerico];
              }
              return prevExcluir;
            });
          }
        }
      });

      // 4. Atualizar o estado do formulário com a lista de metadados limpa
      return {
        ...prevFormData,
        arquivos: arquivosParaEstado
      };
    });

    // 5. Sincronização final: Remover do storage arquivos que não estão mais na lista
    const idsNoEstado = new Set(arquivosParaEstado.map(a => a.id));
    storage.forEach((_file, id) => {
      if (!idsNoEstado.has(id)) {
        storage.delete(id);
        console.log(`[HOOK] 🗑️ Arquivo com ID [${id}] foi REMOVIDO do window.fileStorage por não estar mais no estado.`);
      }
    });

    console.log(`[HOOK] Sincronização finalizada. Storage agora tem: ${storage.size} arquivo(s).`);

  }, [setFormData, setErrors, setArquivosParaExcluir]);

  // 🆕 FUNÇÃO PARA ADICIONAR ARQUIVOS (ATUALIZADA PARA NOVA ESTRUTURA)
  const handleFilesAdd = (novosArquivos: File[]) => {
    console.log('\n🎯 ===== ADICIONANDO ARQUIVOS =====');
    console.log('📁 Novos arquivos:', novosArquivos.length);
    console.log('💾 Storage atual:', (window as any).fileStorage.size);
    
    const arquivosValidos: ArquivoFormulario[] = [];
    
    for (const file of novosArquivos) {
      // Validar arquivo
      const validation = validateFile(file);
      if (!validation.valid) {
        console.log(`❌ Validação falhou: ${validation.error}`);
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }
      
      // Criar ID único
      const id = `TEMP_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      console.log(`🆔 ID gerado: ${id}`);
      
      // ✅ Criar objeto para o estado com referência ao file
      // A nova estrutura inclui o objeto File na propriedade .file
      const arquivoFormulario: ArquivoFormulario = {
        id,
        nome: file.name,
        tamanho: file.size,
        tipo: file.type,
        isExisting: false,
        status: 'pending',
        file: file // ✅ INCLUIR O OBJETO FILE PARA QUE handleArquivosChange POSSA USÁ-LO
      };
      
      arquivosValidos.push(arquivoFormulario);
    }
    
    if (arquivosValidos.length === 0) {
      console.log('⚠️ Nenhum arquivo válido');
      return;
    }
    
    // ✅ Usar a nova função centralizada para atualizar
    const arquivosAtualizados = [...(formData.arquivos || []), ...arquivosValidos];
    handleArquivosChange(arquivosAtualizados);
    
    console.log('✅ ===== FIM ADICIONAR ARQUIVOS =====\n');
  };

  // 2. Debug antes de salvar a notificação (versão melhorada)
  const debugAntesDoSalvamento = (data: FormData) => {
    const arquivosNovos = (data.arquivos || []).filter(a => !a.isExisting);
    const arquivosExistentes = (data.arquivos || []).filter(a => a.isExisting);

    console.log('Resumo de anexos antes do salvamento', {
      novos: arquivosNovos.length,
      existentes: arquivosExistentes.length,
      total: data.arquivos?.length || 0,
      storageDisponivel: (window as any).fileStorage?.size || 0,
    });
  };

  // 3. Handler para drop ou seleção de arquivo com debug
  const handleFilesDrop = (files: File[]) => {
    console.log('🎯 Arquivos recebidos no drop/seleção:', files.length);
    
    // Adicionar arquivos com debug
    handleFilesAdd(files);
  };

  // 4. Função para debug - debug do storage
  const debugStorage = () => {
    console.log('Resumo do armazenamento de anexos', {
      storageDisponivel: Boolean((window as any).fileStorage),
      storageCount: (window as any).fileStorage?.size || 0,
      formCount: formData.arquivos?.length || 0,
      deleteCount: arquivosParaExcluir.length,
    });
  };

  // 5. Função corrigida para remover arquivo usando a função centralizada
  const handleRemoveFile = useCallback((id: string) => {
    const arquivosAtualizados = (formData.arquivos || []).filter(arquivo => arquivo.id !== id);
    handleArquivosChange(arquivosAtualizados);
    toast.success('Arquivo removido.');
  }, [formData.arquivos, handleArquivosChange]); // Funciona: arquivos existe como []

  // 6. FUNÇÃO CORRIGIDA PARA PROCESSAR ARQUIVOS (VERSÃO WINDOW.FILESTORAGE)
  const processarArquivosNotificacao = async (
    notificacaoId: number, 
    arquivos: ArquivoFormulario[]
  ): Promise<void> => {
    console.log('\n� ===== UPLOAD ARQUIVOS (VERSÃO CORRIGIDA) =====');
    console.log('📋 Notificação ID:', notificacaoId);
    console.log('📁 Total de arquivos:', arquivos.length);
    console.log('💾 Storage disponível:', (window as any).fileStorage?.size || 0);
    
    if (!(window as any).fileStorage) {
      console.log('   ❌ Storage não existe!');
    }
    
    try {
      const arquivosNovos = arquivos.filter(arquivo => !arquivo.isExisting);
      
      console.log('\n📊 Análise:');
      console.log(`   🆕 Arquivos novos: ${arquivosNovos.length}`);
      console.log(`   ✅ Arquivos existentes: ${arquivos.length - arquivosNovos.length}`);
      
      if (arquivosNovos.length === 0) {
        console.log('📭 Nenhum arquivo novo para upload');
        return;
      }
      
      // Verificar se storage existe
      if (!(window as any).fileStorage) {
        console.error('❌ window.fileStorage não existe!');
        throw new Error('Sistema de arquivos não inicializado');
      }
      
      // Criar FormData
      const formData = new FormData();
      let arquivosAnexados = 0;
      
      for (const arquivo of arquivosNovos) {
        if (!arquivo.id) {
          console.log('   ❌ ID ausente');
          continue;
        }
        
        // ✅ BUSCAR NO STORAGE CORRETO
        const file = (window as any).fileStorage.get(arquivo.id);
        
        console.log(`   🔍 File encontrado: ${file ? 'SIM' : 'NÃO'}`);
        console.log(`   📄 É File: ${file instanceof File}`);
        
        if (file instanceof File) {
          formData.append('arquivos', file);
          arquivosAnexados++;
        } else {
          console.log(`   ❌ File inválido ou não encontrado`);
          console.log(`   📋 Tipo recebido: ${typeof file}`);
        }
      }
      
      console.log(`\n📦 FormData com ${arquivosAnexados} arquivo(s)`);
      
      if (arquivosAnexados === 0) {
        console.log('❌ ERRO: Nenhum arquivo válido no FormData');
        throw new Error('Nenhum arquivo válido para upload');
      }
      
      // Upload
      const server = import.meta.env.VITE_API_SERVER;
      const port = import.meta.env.VITE_API_PORT;
      const url = `${server}:${port}/api/notificacao/${notificacaoId}/arquivos`;
      
      console.log(`📤 Enviando para: ${url}`);
      
      await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      
      // Limpar storage
      arquivosNovos.forEach(arquivo => {
        if (arquivo.id) {
          (window as any).fileStorage.delete(arquivo.id);
          console.log(`🗑️ Removido: ${arquivo.id}`);
        }
      });
      
      console.log('✅ ===== FIM UPLOAD =====\n');
      
    } catch (error: any) {
      console.error('Falha no upload de anexos', {
        status: error?.response?.status,
      });
      throw new Error('Falha ao processar arquivos anexados.');
    }
  };

  // Função de sincronização manual
  const handleForceSync = async () => {
    if (!systemIsOnline) {
      setApiError("Você está offline. Não é possível sincronizar agora.");
      return;
    }

    try {
      setIsSaving(true);
      await syncPendingData();
      
      toast.success("Dados sincronizados com sucesso!");
    } catch (error) {
      setApiError("Erro ao sincronizar dados");
    } finally {
      setIsSaving(false);
    }
  };

  // Verificar se CPF já existe
  // const searchCpfExists = async (cpf: string): Promise<boolean> => {
  //   if (!cpf || cpf.length !== 11) return false;

  //   try {
  //     // ✅ USAR SISTEMA OFFLINE
  //     return await checkCpfOfflineSafe(cpf);
  //   } catch (error) {
  //     console.error("Erro ao verificar CPF:", error);
  //     return false;
  //   }
  // };

  // ✅ FUNÇÃO PARA CARREGAR DADOS DO CACHE OFFLINE
  const loadOptionsFromCache = async (): Promise<{ hasData: boolean }> => {
    try {
      console.log('📱 Carregando dados do cache offline...');
      
      const [
        eventos, publicos, paises, estados, municipios, bairros,
        generos, racas, escolaridades, atendimentos, sintomas,        hipoteses, traumas, encerramentos, estabelecimentos,
      ] = await Promise.all([
        indexedDBService.getOpcoes('eventos'),
        indexedDBService.getOpcoes('publicos'),
        indexedDBService.getOpcoes('paises'),
        indexedDBService.getOpcoes('estados'),
        indexedDBService.getOpcoes('municipios'),
        indexedDBService.getOpcoes('bairros'),
        indexedDBService.getOpcoes('generos'),
        indexedDBService.getOpcoes('racas'),
        indexedDBService.getOpcoes('escolaridades'),
        indexedDBService.getOpcoes('atendimentos'),
        indexedDBService.getOpcoes('sintomas'),
        indexedDBService.getOpcoes('hipoteses').then(async (hipoteses) => {
          if (hipoteses && hipoteses.length > 0) return hipoteses;
          return indexedDBService.getOpcoes('hipoteses-diagnosticas');
        }),
        indexedDBService.getOpcoes('traumas'),
        indexedDBService.getOpcoes('encerramentos'),
        // ✅ BUSCAR ESTABELECIMENTOS FILTRADOS HIERARQUICAMENTE (salvos no download)
        indexedDBService.getOpcoes('estabelecimentos-permitidos').then(permitidos => 
          permitidos && permitidos.length > 0 
            ? permitidos 
            : indexedDBService.getOpcoes('estabelecimentos') // Fallback para cache antigo
        ),
      ]);

      // Verificar se temos dados essenciais
      const essentialData = [eventos, publicos, generos, racas, escolaridades, atendimentos, encerramentos];
      const hasEssentialData = essentialData.every(data => data && data.length > 0);

      if (!hasEssentialData) {
        console.warn('⚠️ Dados essenciais não encontrados no cache');
        return { hasData: false };
      }

      // Definir todas as opções carregadas do cache
      if (eventos) {
        // 🆕 FILTRAR: Apenas eventos ativos para o formulário
        const eventosAtivos = eventos.filter((evento: any) => evento.ativo === 'S' || evento.ativo === undefined);
        setEventoOptions(normalizeOptionLabels(eventosAtivos, { includeNome: true }));
        console.log(`✅ Eventos ativos carregados do cache: ${eventosAtivos.length}/${eventos.length}`);
      }

      if (publicos) {
        // Ordenação específica para público atendido
        const ordenacaoPublico = [
          "Participante", "Trab. do Evento", "Autoridade", "Outro"
        ].map((item) => normalizeText(item));

        const publicosUpperCase = normalizeOptionLabels(publicos, { includeNome: true });
        const publicosOrdenados = orderOptionsByPriorityIncludes(publicosUpperCase, ordenacaoPublico);
        setPublicoOptions(publicosOrdenados);
        console.log(`✅ Públicos carregados do cache: ${publicos.length}`);
      }

      if (paises) {
        setPaisOptions(normalizeOptionLabels(paises, { includeNome: true }));
        console.log(`✅ Países carregados do cache: ${paises.length}`);
      }

      if (estados) {
        setEstadoOptions(normalizeOptionLabels(estados, { includeNome: true }));
        console.log(`✅ Estados carregados do cache: ${estados.length}`);
      }

      if (municipios) {
        setMunicipioOptions(normalizeOptionLabels(municipios, { includeNome: true }));
        console.log(`✅ Municípios carregados do cache: ${municipios.length}`);
      }

      if (bairros) {
        setBairroOptions(normalizeOptionLabels(bairros, { includeNome: true }));
        console.log(`✅ Bairros carregados do cache: ${bairros.length}`);
      }

      if (generos) {
        // Ordenação específica para identidade de gênero
        const ordenacaoGenero = [
          "Mulher cisgênero", "Homem cisgênero", "Mulher transgênero",
          "Homem transgênero", "Travesti", "Não binário", "Não se aplica", "Ignorado"
        ].map((item) => normalizeText(item));

        const generosUpperCase = normalizeOptionLabels(generos, { includeNome: true });
        const generosOrdenados = [...generosUpperCase].sort((a, b) => {
          const posA = ordenacaoGenero.findIndex((item) => a.descricao.includes(item));
          const posB = ordenacaoGenero.findIndex((item) => b.descricao.includes(item));
          if (posA !== -1 && posB !== -1) return posA - posB;
          if (posA !== -1) return -1;
          if (posB !== -1) return 1;
          return 0;
        });
        setGeneroOptions(generosOrdenados);
        console.log(`✅ Gêneros carregados do cache: ${generos.length}`);
      }

      if (racas) {
        setRacaOptions(normalizeOptionLabels(racas, { includeNome: true }));
        console.log(`✅ Raças carregadas do cache: ${racas.length}`);
      }

      if (escolaridades) {
        // Ordenação específica para escolaridade
        const ordenacaoEscolaridade = [
          "Analfabeto", "Ensino fundamental incompleto", "Ensino fundamental completo",
          "Ensino médio incompleto", "Ensino médio completo", "Ensino superior incompleto",
          "Ensino superior completo", "Pós-graduado", "Ignorado", "Não se aplica"
        ].map((item) => normalizeText(item));

        const escolaridadesUpperCase = normalizeOptionLabels(escolaridades, { includeNome: true });
        const escolaridadesOrdenadas = [...escolaridadesUpperCase].sort((a, b) => {
          const posA = ordenacaoEscolaridade.findIndex((item) => a.descricao.includes(item));
          const posB = ordenacaoEscolaridade.findIndex((item) => b.descricao.includes(item));
          if (posA !== -1 && posB !== -1) return posA - posB;
          if (posA !== -1) return -1;
          if (posB !== -1) return 1;
          return 0;
        });
        setEscolaridadeOptions(escolaridadesOrdenadas);
        console.log(`✅ Escolaridades carregadas do cache: ${escolaridades.length}`);
      }

      if (atendimentos) {
        // Ordenação específica para tipo de atendimento
        const ordenacaoAtendimento = [
          "Clínico", "Trauma", "Múltiplas vítimas", "Incidente QBRN"
        ].map((item) => normalizeText(item));

        const atendimentosUpperCase = normalizeOptionLabels(atendimentos, { includeNome: true });
        const atendimentosOrdenados = [...atendimentosUpperCase].sort((a, b) => {
          const posA = ordenacaoAtendimento.findIndex((item) => a.descricao.includes(item));
          const posB = ordenacaoAtendimento.findIndex((item) => b.descricao.includes(item));
          if (posA !== -1 && posB !== -1) return posA - posB;
          if (posA !== -1) return -1;
          if (posB !== -1) return 1;
          return 0;
        });
        setAtendimentoOptions(atendimentosOrdenados);
        console.log(`✅ Atendimentos carregados do cache: ${atendimentos.length}`);
      }

      if (sintomas) {
        setSintomaOptions(normalizeOptionLabels(sintomas, { includeNome: true }));
        console.log(`✅ Sintomas carregados do cache: ${sintomas.length}`);
      }      if (hipoteses) {
        setHipoteseDiagOptions(normalizeOptionLabels(hipoteses, { includeNome: true }));
        console.log(`✅ Hipóteses carregadas do cache: ${hipoteses.length}`);
      }

      if (traumas) {
        setTraumaOptions(normalizeOptionLabels(traumas, { includeNome: true }));
        console.log(`✅ Traumas carregados do cache: ${traumas.length}`);
      }

      if (encerramentos) {
        // Ordenação específica para tipo de encerramento
        const ordenacaoEncerramento = [
          "Atendido e liberado", "Internação", "Observação", "Transferido", "Óbito"
        ].map((item) => normalizeText(item));

        const encerramentosUpperCase = normalizeOptionLabels(encerramentos, { includeNome: true });
        const encerramentosOrdenados = [...encerramentosUpperCase].sort((a, b) => {
          const getPosition = (option: EncerramentoOption) => {
            const exactIndex = ordenacaoEncerramento.findIndex((item) => option.descricao === item);
            if (exactIndex !== -1) return exactIndex;
            return ordenacaoEncerramento.findIndex((item) => option.descricao.includes(item));
          };

          const posA = getPosition(a);
          const posB = getPosition(b);
          if (posA !== -1 && posB !== -1) return posA - posB;
          if (posA !== -1) return -1;
          if (posB !== -1) return 1;
          return 0;
        });
        setEncerramentoOptions(encerramentosOrdenados);
        console.log(`✅ Encerramentos carregados do cache: ${encerramentos.length}`);
      }

      if (estabelecimentos) {
        setEstabelecimentoOptions(normalizeOptionLabels(estabelecimentos, { includeNome: true }));
        console.log(`✅ Estabelecimentos carregados do cache: ${estabelecimentos.length} (chave: estabelecimentos-permitidos)`);
      } else {
        console.warn('⚠️ Nenhum estabelecimento encontrado no cache');
      }

      console.log('✅ Todos os dados foram carregados do cache offline');
      return { hasData: true };

    } catch (error) {
      console.error('❌ Erro ao carregar dados do cache:', error);
      return { hasData: false };
    }
  };

  // ✅ FUNÇÃO MODIFICADA PARA CARREGAR TODAS AS OPÇÕES (ONLINE/OFFLINE)
  // ✅ FUNÇÃO OTIMIZADA: Carregar dados essenciais primeiro, resto em background
  const loadEssentialOptions = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // ✅ PRIMEIRO: Verificar conectividade básica
      if (!syncService.hasInternetConnection()) {
        console.log('📱 Sem internet - modo offline direto, carregando dados do cache...');
        
        const cachedData = await loadOptionsFromCache();
        if (cachedData.hasData) {
          console.log('✅ Dados carregados do cache offline');
          return;
        } else {
          throw new Error('Nenhum dado encontrado offline. Conecte-se à internet e baixe os dados primeiro.');
        }
      }

      // ✅ SEGUNDO: Verificar se servidor está disponível (evita 401 desnecessários)
      const serverAvailable = await syncService.isServerAvailable();
      if (!serverAvailable) {
        console.log('🔒 Servidor indisponível - modo offline direto, carregando dados do cache...');
        
        const cachedData = await loadOptionsFromCache();
        if (cachedData.hasData) {
          console.log('✅ Dados carregados do cache offline');
          return;
        } else {
          throw new Error('Servidor indisponível e nenhum dado em cache. Verifique a conexão e tente novamente.');
        }
      }

      // ✅ TERCEIRO: Se servidor disponível, verificar autenticação (pode gerar 401 se não logado)
      const canUseOnline = await syncService.canUseOnlineMode();
      if (!canUseOnline) {
        console.log('📱 Modo offline ativo, tentando usar dados em cache...');
        
        const cachedData = await loadOptionsFromCache();
        if (cachedData.hasData) {
          console.log('✅ Dados carregados do cache offline');
          return;
        } else {
          throw new Error('Nenhum dado encontrado offline. Conecte-se à internet e baixe os dados primeiro.');
        }
      }

      // ✅ MODO ONLINE: carregar apenas dados ESSENCIAIS primeiro
      console.log('🌐 Modo online: carregando dados essenciais...');
      
      // Primeiro: carregar apenas dados essenciais para abrir o formulário
      const [
        eventos,
        publicos,
        paises,
        estados,
        generos,
        atendimentos
      ] = await Promise.all([
        NotificacaoService.getEventoOptions(),
        NotificacaoService.getPublicoOptions(),
        NotificacaoService.getPaisOptions(),
        NotificacaoService.getEstadoOptions(),
        NotificacaoService.getGeneroOptions(),
        NotificacaoService.getAtendimentoOptions()
      ]);

      // ✅ FILTRAR: Apenas eventos ativos para o formulário
      const eventosAtivos = eventos.filter((evento: any) => evento.ativo === 'S' || evento.ativo === undefined);
      
      // Definir opções essenciais imediatamente com ordenações específicas
      setEventoOptions(normalizeOptionLabels(eventosAtivos, { includeNome: true }));
      
      // Ordenação específica para público atendido
      const ordenacaoPublico = [
        "Participante",
        "Trab. do Evento",
        "Autoridade",
        "Outro",
      ].map((item) => normalizeText(item));

      const publicosUpperCase = normalizeOptionLabels(publicos, { includeNome: true });
      const publicosOrdenados = orderOptionsByPriorityIncludes(publicosUpperCase, ordenacaoPublico);
      setPublicoOptions(publicosOrdenados);
      
      setPaisOptions(normalizeOptionLabels(paises, { includeNome: true }));
      setEstadoOptions(normalizeOptionLabels(estados, { includeNome: true }));
      
      // Ordenação específica para identidade de gênero
      const ordenacaoGenero = [
        "Mulher cisgênero",
        "Homem cisgênero",
        "Mulher transgênero",
        "Homem transgênero",
        "Travesti",
        "Não binário",
        "Não se aplica",
        "Ignorado",
      ].map((item) => normalizeText(item));

      const generosUpperCase = normalizeOptionLabels(generos, { includeNome: true });
      const generosOrdenados = [...generosUpperCase].sort((a, b) => {
        const posA = ordenacaoGenero.findIndex((item) => a.descricao.includes(item));
        const posB = ordenacaoGenero.findIndex((item) => b.descricao.includes(item));
        if (posA !== -1 && posB !== -1) return posA - posB;
        if (posA !== -1) return -1;
        if (posB !== -1) return 1;
        return 0;
      });
      setGeneroOptions(generosOrdenados);
      
      // Ordenação específica para tipo de atendimento
      const ordenacaoAtendimento = [
        "Clínico",
        "Trauma",
        "Múltiplas vítimas",
        "Incidente QBRN",
      ].map((item) => normalizeText(item));

      const atendimentosUpperCase = normalizeOptionLabels(atendimentos, { includeNome: true });
      const atendimentosOrdenados = [...atendimentosUpperCase].sort((a, b) => {
        const posA = ordenacaoAtendimento.findIndex((item) => a.descricao.includes(item));
        const posB = ordenacaoAtendimento.findIndex((item) => b.descricao.includes(item));
        if (posA !== -1 && posB !== -1) return posA - posB;
        if (posA !== -1) return -1;
        if (posB !== -1) return 1;
        return 0;
      });
      setAtendimentoOptions(atendimentosOrdenados);
      
      setIsLoading(false);
      
      // ✅ BACKGROUND: Carregar resto dos dados em background
      loadRemainingOptions();

    } catch (error) {
      console.error('❌ Erro ao carregar opções essenciais:', error);
      setIsLoading(false);
      
      // Tentar usar cache como fallback
      try {
        const cachedData = await loadOptionsFromCache();
        if (cachedData.hasData) {
          console.log('✅ Fallback: usando dados do cache');
        }
      } catch (cacheError) {
        console.error('❌ Erro no fallback do cache:', cacheError);
      }
    }
  }, []);

  // ✅ FUNÇÃO: Carregar dados restantes em background
  const loadRemainingOptions = async (currentEstabelecimentoId?: number) => {
    try {
      // ✅ VERIFICAR: Só carregar dados adicionais se estiver online/autenticado
      const canUseOnline = await syncService.canUseOnlineMode();
      if (!canUseOnline) {
        console.log('⚠️ Sistema offline/não autenticado, pulando carregamento de dados restantes');
        return;
      }

      console.log('🔄 Carregando dados restantes em background...');
      
      const [
        racas,
        escolaridades,
        sintomas,
        hipoteseDiag,
        traumas,
        encerramentos,
        estabelecimentos
      ] = await Promise.all([
        NotificacaoService.getRacaOptions(),
        NotificacaoService.getEscolaridadeOptions(),
        NotificacaoService.getSintomaOptions(),
        NotificacaoService.getHipoteseDiagOptions(),
        NotificacaoService.getTraumaOptions(),
        NotificacaoService.getEncerramentoOptions(),
        // ✅ IMPORTANTE: Passar ID do estabelecimento atual para incluir mesmo se inativo
        NotificacaoService.getEstabelecimentoOptions(currentEstabelecimentoId)
      ]);

      // Definir opções restantes com ordenações específicas
      setRacaOptions(normalizeOptionLabels(racas, { includeNome: true }));
      
      // Ordenação específica para escolaridade
      const ordenacaoEscolaridade = [
        "Analfabeto",
        "Ensino fundamental incompleto",
        "Ensino fundamental completo",
        "Ensino médio incompleto",
        "Ensino médio completo",
        "Ensino superior incompleto",
        "Ensino superior completo",
        "Pós-graduado",
        "Ignorado",
        "Não se aplica",
      ].map((item) => normalizeText(item));

      const escolaridadesUpperCase = normalizeOptionLabels(escolaridades, { includeNome: true });
      const escolaridadesOrdenadas = [...escolaridadesUpperCase].sort((a, b) => {
        const posA = ordenacaoEscolaridade.findIndex((item) => a.descricao.includes(item));
        const posB = ordenacaoEscolaridade.findIndex((item) => b.descricao.includes(item));
        if (posA !== -1 && posB !== -1) return posA - posB;
        if (posA !== -1) return -1;
        if (posB !== -1) return 1;
        return 0;
      });
      setEscolaridadeOptions(escolaridadesOrdenadas);
      
      setSintomaOptions(normalizeOptionLabels(sintomas, { includeNome: true }));
      setHipoteseDiagOptions(normalizeOptionLabels(hipoteseDiag, { includeNome: true }));
      setTraumaOptions(normalizeOptionLabels(traumas, { includeNome: true }));
      
      // Ordenação específica para tipo de encerramento
      const ordenacaoEncerramento = [
        "Atendido e liberado",
        "Internação",
        "Observação",
        "Transferido",
        "Óbito",
      ].map((item) => normalizeText(item));

      const encerramentosUpperCase = normalizeOptionLabels(encerramentos, { includeNome: true });
      const encerramentosOrdenados = [...encerramentosUpperCase].sort((a, b) => {
        const getPosition = (option: any) => {
          const exactIndex = ordenacaoEncerramento.findIndex((item) => option.descricao === item);
          if (exactIndex !== -1) return exactIndex;
          return ordenacaoEncerramento.findIndex((item) => option.descricao.includes(item));
        };

        const posA = getPosition(a);
        const posB = getPosition(b);
        if (posA !== -1 && posB !== -1) return posA - posB;
        if (posA !== -1) return -1;
        if (posB !== -1) return 1;
        return 0;
      });
      setEncerramentoOptions(encerramentosOrdenados);
      
      setEstabelecimentoOptions(normalizeOptionLabels(estabelecimentos, { includeNome: true }));

      // ✅ SALVAR NO CACHE após carregar tudo
      await Promise.all([
        indexedDBService.saveOpcoes('racas', racas),
        indexedDBService.saveOpcoes('escolaridades', escolaridades),
        indexedDBService.saveOpcoes('sintomas', sintomas),
        indexedDBService.saveOpcoes('hipoteses', hipoteseDiag),
        indexedDBService.saveOpcoes('traumas', traumas),
        indexedDBService.saveOpcoes('encerramentos', encerramentos),
        indexedDBService.saveOpcoes('estabelecimentos', estabelecimentos)
      ]);
      
      console.log('✅ Dados restantes carregados e salvos no cache');

    } catch (error) {
      console.warn('⚠️ Erro ao carregar dados restantes em background:', error);
    }
  };

  // ✅ FUNÇÃO ORIGINAL (renomeada para compatibilidade) 
  const loadAllOptions = useCallback(async () => {
    return loadEssentialOptions();
  }, [loadEssentialOptions]);

  // ✅ FUNÇÃO MODIFICADA PARA CARREGAR MUNICÍPIOS (ONLINE/OFFLINE)
  const loadMunicipiosByEstado = useCallback(async (estadoId: string) => {
    if (!estadoId) {
      setMunicipioOptions([]);
      return;
    }

    // Atualizar a referência do último estado selecionado
    latestUfRef.current = estadoId;

    try {
      setIsLoadingMunicipios(true);
      setUfError(null);

      // Converter explicitamente para número
      const estadoIdNumber = Number(estadoId);

      if (isNaN(estadoIdNumber)) {
        throw new Error(`ID de estado inválido: ${estadoId}`);
      }

      let municipios = [];

      // ✅ TENTAR CACHE OFFLINE PRIMEIRO  
      const canUseOnline = await syncService.canUseOnlineMode();
      if (!canUseOnline) {
        console.log('📱 Modo offline: buscando municípios em cache...');
        
        try {
          const allMunicipios = await indexedDBService.getOpcoes('municipios');
          if (allMunicipios && allMunicipios.length > 0) {
            // Filtrar municípios do estado selecionado
            municipios = allMunicipios.filter((municipio: any) => 
              Number(municipio.tipo_estado_idtipo_estado) === estadoIdNumber ||
              Number(municipio.idtipo_estado) === estadoIdNumber
            );
            
            console.log(`✅ Encontrados ${municipios.length} municípios offline para estado ${estadoIdNumber}`);
          } else {
            console.warn('⚠️ Nenhum município em cache. Baixe os dados offline primeiro.');
            setUfError('Nenhum município encontrado offline. Baixe os dados primeiro.');
            return;
          }
        } catch (cacheError) {
          console.error('❌ Erro ao buscar municípios em cache:', cacheError);
          setUfError('Erro ao buscar municípios offline.');
          return;
        }
      } else {
        // ✅ MODO ONLINE: usar API normal
        console.log('🌐 Modo online: buscando municípios na API...');
        municipios = await NotificacaoService.getMunicipioOptions(estadoIdNumber);
      }

      // Verificar se o estado ainda é o mesmo após a conclusão da requisição
      if (latestUfRef.current === estadoId) {
        if (municipios.length === 0) {
          console.warn(`Nenhum município encontrado para a UF ${estadoId}`);
        }

        setMunicipioOptions(municipios);

        // Se tiver um município selecionado que não pertence a esse estado, limpe a seleção
        setFormData((prev) => {
          if (prev.municipio) {
            const municipioExiste = municipios.some(
              (m) => m.idtipo_municipio.toString() === prev.municipio
            );
            if (!municipioExiste) {
              return { ...prev, municipio: "" };
            }
          }
          return prev;
        });
      }
    } catch (error) {
      console.error(`Erro ao carregar municípios para UF ${estadoId}:`, error);
      setUfError(`Falha ao carregar municípios: ${error instanceof Error ? error.message : String(error)}`);
      toast.error("Erro ao carregar lista de municípios");
    } finally {
      // Só atualize o estado de carregamento se esta for a última requisição
      if (latestUfRef.current === estadoId) {
        setIsLoadingMunicipios(false);
      }
    }
  }, []);

  // ✅ =================================================================
  // ✅ FUNÇÃO DE CARREGAMENTO DA NOTIFICAÇÃO (CORRIGIDA)
  // ✅ =================================================================
  const applyLoadedFormData = useCallback(async (dadosFormatados: any) => {
    setOriginalCpf(dadosFormatados?.cpf || "");

    const estabelecimentoId = dadosFormatados?.estabelecimentoNotificadora;
    if (estabelecimentoId) {
      await loadRemainingOptions(estabelecimentoId);
    }

    if (dadosFormatados?.uf) {
      await loadMunicipiosByEstado(dadosFormatados.uf);
    }

    setFormData(dadosFormatados);
  }, [loadMunicipiosByEstado, loadRemainingOptions]);

  const loadNotificacao = useCallback(async (notificacaoId?: string, localOfflineId?: string) => {
    setIsLoading(true);
    try {
      const offlineKey = localOfflineId || offlineId;
      if (offlineKey) {
        const record = await indexedDBService.getNotificacaoRecordByOfflineId(offlineKey);
        const localForm = record?.formData;
        if (!localForm) {
          throw new Error('Ficha offline não encontrada neste aparelho');
        }
        await applyLoadedFormData({
          ...localForm,
          offline_id: record.offlineId || offlineKey,
          id: record.id,
          idnotificacao: record.id,
        });
        const errorText =
          record.errorInfo?.lastError ||
          record.errorInfo?.message ||
          null;
        if (errorText) {
          setApiError(errorText);
        }
        if (record.errorInfo?.errors) {
          const mappedErrors = {
            ...mapBackendValidationErrors(
              record.errorInfo.errors,
              PATIENT_CREATE_ERROR_FIELD_MAP,
            ),
            ...mapBackendValidationErrors(
              record.errorInfo.errors,
              NOTIFICATION_SAVE_ERROR_FIELD_MAP,
            ),
          };
          if (Object.keys(mappedErrors).length > 0) {
            setErrors((prev) => ({ ...prev, ...mappedErrors }));
            sectionExpansion.expandSectionsWithErrors(mappedErrors);
          }
        } else if (errorText && /genero|gênero|tipo_genero/i.test(String(errorText))) {
          setErrors((prev) => ({
            ...prev,
            identidadeGenero: prev.identidadeGenero || 'A Identidade de Gênero é obrigatória',
          }));
          setExpandedSections((prev) => ({ ...prev, identificacao: true }));
        }
        return;
      }

      console.log("[HOOK] Carregando notificação ID:", notificacaoId);
      const numericId = notificacaoId != null ? Number(notificacaoId) : NaN;
      if (Number.isFinite(numericId) && numericId <= 0) {
        const localForm = await indexedDBService.getNotificacao(numericId);
        if (localForm) {
          await applyLoadedFormData({
            ...localForm,
            id: numericId,
            idnotificacao: numericId,
          });
          return;
        }
      }

      const dadosFormatados = await NotificacaoService.getById(notificacaoId!);
      
      if (dadosFormatados) {
        await applyLoadedFormData(dadosFormatados);
      }
    } catch (error: any) {
      console.error("Falha ao carregar notificação", {
        status: error?.response?.status,
      });
      toast.error("Erro ao carregar dados da notificação");
      navigate(offlineId ? "/private/offline-management" : "/private/comunicacao-de-caso");
    } finally {
      setIsLoading(false);
    }
  }, [applyLoadedFormData, navigate, offlineId]);

  const handlePatientAutoCreateError = useCallback(async (error: any): Promise<boolean> => {
    console.error("Falha ao criar paciente automaticamente", {
      status: error?.response?.status,
      code: error?.code,
    });

    const isNetworkError = (
      error?.code === 'ERR_NETWORK' ||
      error?.code === 'ERR_INTERNET_DISCONNECTED' ||
      error?.message?.includes('Network Error') ||
      error?.message?.includes('Failed to fetch') ||
      !(await syncService.canUseOnlineMode())
    );

    if (isNetworkError) {
      console.log('🔄 Erro de rede na criação de paciente, já está usando sistema offline');
      setApiError(`Erro ao salvar paciente: ${error.message}`);
      return false;
    }

    const errorMessage = extractBackendMessage(
      error,
      "Erro ao criar o paciente. Verifique os dados e tente novamente."
    );
    toast.error(errorMessage);
    setApiError(errorMessage);

    if (error.response && error.response.data && error.response.data.errors) {
      const mappedErrors = mapBackendValidationErrors(
        error.response.data.errors,
        PATIENT_CREATE_ERROR_FIELD_MAP
      );
      setErrors((prev) => ({ ...prev, ...mappedErrors }));
      setExpandedSections((prev) => ({ ...prev, identificacao: true }));
    }

    return false;
  }, []);

  const ensurePatientReadyForSubmit = useCallback(async (): Promise<boolean> => {
    // Verifica se tem paciente
    if (!formData.paciente.trim()) {
      console.log("Nome do paciente ausente");
      toast.error("O nome do paciente é obrigatório");
      setErrors((prev) => ({
        ...prev,
        paciente: "O nome do paciente é obrigatório",
      }));
      setExpandedSections((prev) => ({
        ...prev,
        identificacao: true,
      }));
      return false;
    }

    // Sem pacienteId: cria cadastro novo. CPF já no banco → descarta só o CPF e sobe.
    if (formData.paciente.trim() && !formData.pacienteId) {
      try {
        if (await cpfAlreadyRegistered(formData.cpf, searchPatientsOfflineSafe)) {
          formData.cpf = '';
        }

        const novoPaciente: any = buildPatientPayloadFromForm(
          formData,
          { mapGestanteForApi },
          {
            uppercaseNome: true,
            uppercaseNomeMae: true,
            includeNullableClassificationIds: true
          }
        );

        const pacienteCriado = await savePatientOfflineSafe(novoPaciente, { silent: true });
        formData.pacienteId = pacienteCriado.idpaciente;
      } catch (error: any) {
        return handlePatientAutoCreateError(error);
      }
    }
    // Se já tem ID de paciente, atualizar dados do paciente
    else if (formData.pacienteId) {
      try {
        console.log("Atualizando dados do paciente ID:", formData.pacienteId);

        const pacienteData: any = buildPatientPayloadFromForm(
          formData,
          { mapGestanteForApi },
          {
            uppercaseNome: false,
            uppercaseNomeMae: false,
            includeNullableClassificationIds: false
          }
        );

        const canUseOnline = await syncService.canUseOnlineMode();
        if (canUseOnline && isEditMode) {
          await PacienteService.update(formData.pacienteId, pacienteData);
        } else {
          await syncService.savePaciente(
            { ...pacienteData, idpaciente: formData.pacienteId },
            { silent: true },
          );
        }

        console.log("Dados do paciente atualizados com sucesso!");
      } catch (error: any) {
        console.error("Falha ao atualizar dados do paciente", {
          status: error?.response?.status,
        });
        toast.warning("Aviso: Os dados do paciente não puderam ser atualizados, mas tentaremos salvar a notificação.");
      }
    }

    return true;
  }, [
    formData,
    isEditMode,
    mapGestanteForApi,
    searchPatientsOfflineSafe,
    savePatientOfflineSafe,
    handlePatientAutoCreateError
  ]);

  const emitNotificationSavedEvent = useCallback((detail: Record<string, any>) => {
    const notificationSavedEvent = new CustomEvent('notification-saved', {
      detail: {
        ...detail,
        timestamp: Date.now(),
      },
    });
    window.dispatchEvent(notificationSavedEvent);
  }, []);

  const persistNotificationAndHandleSuccess = useCallback(
    async (dataForBackend: Record<string, any>) => {
      const numericId = id != null ? Number(id) : NaN;
      // Ficha ainda só local (ID temp ≤ 0 ou correção por offlineId): atualiza IndexedDB, sem PUT.
      const isLocalPendingOnly =
        isEditMode &&
        (Boolean(offlineId) || !Number.isFinite(numericId) || numericId <= 0);

      if (isEditMode && id && !isLocalPendingOnly) {
        console.log("Editando notificação ID:", id, "via sistema offline");
        await saveNotificationOfflineSafe(dataForBackend, true, id, { silent: true });
        console.log("Notificação editada com sucesso");
        setIsSuccess(true);
        toast.success("Notificação atualizada com sucesso");
        setArquivosParaExcluir([]);
        emitNotificationSavedEvent({
          action: 'edit',
          id,
        });
        console.log('📤 Evento de notificação editada disparado');
      } else if (isLocalPendingOnly) {
        console.log("Atualizando ficha offline pendente (mesmo offline_id)");
        if (dataForBackend.offline_id) {
          await indexedDBService.retryNotificacao(dataForBackend.offline_id);
        }
        await saveNotificationOfflineSafe(dataForBackend, false, undefined, {
          silent: true,
          localPendingOnly: true,
        });
        setIsSuccess(true);
        toast.success("Ficha corrigida. Vai sincronizar de novo.");
        setArquivosParaExcluir([]);
        emitNotificationSavedEvent({
          action: 'edit-offline-pending',
          offlineId: dataForBackend.offline_id,
          isOffline: !systemIsOnline,
        });
        if (systemIsOnline) {
          void syncPendingData();
        }
      } else {
        console.log("Criando nova notificação via sistema offline");
        await saveNotificationOfflineSafe(dataForBackend, false, undefined, { silent: true });
        console.log("Notificação salva (online ou offline conforme disponibilidade)");
        setIsSuccess(true);
        toast.success(systemIsOnline ? "Notificação criada com sucesso" : "Notificação salva offline");
        setArquivosParaExcluir([]);
        emitNotificationSavedEvent({
          action: 'create',
          offlineId: dataForBackend.offline_id,
          isOffline: !systemIsOnline,
        });
        console.log('📤 Evento de nova notificação disparado');
      }

      setTimeout(() => {
        navigate(offlineId ? "/private/offline-management" : "/private/comunicacao-de-caso");
      }, 1500);
    },
    [
      emitNotificationSavedEvent,
      id,
      isEditMode,
      navigate,
      offlineId,
      saveNotificationOfflineSafe,
      syncPendingData,
      systemIsOnline,
    ]
  );

  const handleNotificationSaveError = useCallback(
    (error: any) => {
      console.error("Falha ao salvar notificação", {
        status: error?.response?.status,
        code: error?.code,
      });

      let errorMessage = "Erro ao salvar notificação";
      let validationErrors: Record<string, string> = {};

      if (error.response && error.response.data) {
        errorMessage = extractBackendMessage(error, "Erro ao salvar notificação");

        if (error.response.data.errors) {
          validationErrors = mapBackendValidationErrors(
            error.response.data.errors,
            NOTIFICATION_SAVE_ERROR_FIELD_MAP
          );
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setApiError(errorMessage);
      toast.error(errorMessage);

      if (Object.keys(validationErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...validationErrors }));
        sectionExpansion.expandSectionsWithErrors(validationErrors);
      }
    },
    [sectionExpansion]
  );

  const runPreSubmitChecks = useCallback(async (): Promise<boolean> => {
    console.log("=== INICIANDO VALIDAÇÃO DO FORMULÁRIO ===");

    if (
      generoOptions.length === 0 ||
      racaOptions.length === 0 ||
      eventoOptions.length === 0
    ) {
      toast.error(
        'Faltam listas do formulário neste aparelho (gênero e outras). Em Gestão offline, baixe os dados e depois corrija a ficha.',
      );
      return false;
    }

    const { isValid, errorCount } = validateForm(
      formData,
      errors,
      setErrors,
      setExpandedSections,
      expandedSections,
      atendimentoOptions,
      encerramentoOptions,
      {
        modo: modoLocalidadeEvento,
        options: localidadeEventoOptions,
        catalogAvailable: localidadeEventoCatalogAvailable,
      },
    );

    if (!isValid) {
      console.log(`Validação falhou. Total de erros: ${errorCount}`);
      toast.error(
        errorCount === 1
          ? '1 erro encontrado. Verifique o resumo acima.'
          : `${errorCount} erros encontrados. Verifique o resumo acima.`,
      );
      return false;
    }

    console.log("Validação passou. Procedendo com criação/atualização do paciente...");

    const arquivosError = validateArquivos(formData.arquivos || []);
    if (arquivosError) {
      setErrors((prev) => ({ ...prev, arquivos: arquivosError }));
      toast.error("Erro nos arquivos anexados. Verifique e tente novamente.");
      return false;
    }

    const patientReady = await ensurePatientReadyForSubmit();
    if (!patientReady) {
      return false;
    }

    return true;
  }, [
    atendimentoOptions,
    encerramentoOptions,
    ensurePatientReadyForSubmit,
    errors,
    eventoOptions,
    expandedSections,
    formData,
    generoOptions,
    localidadeEventoCatalogAvailable,
    localidadeEventoOptions,
    modoLocalidadeEvento,
    racaOptions,
  ]);

  const prepareNotificationPayloadForSubmit = useCallback((): Record<string, any> => {
    debugAntesDoSalvamento(formData);

    const dataForBackend = buildNotificationDataForBackend(formData, arquivosParaExcluir);
    const arquivos = dataForBackend.arquivos || [];

    console.log("✅ Dados preparados para backend (arquivos preservados):", {
      totalCampos: Object.keys(dataForBackend).length,
      arquivosCount: arquivos?.length || 0,
      arquivosIDs: (arquivos as Array<{ id?: string | number }>).map((arquivo) => arquivo.id),
      arquivosParaExcluir: arquivosParaExcluir
    });

    return dataForBackend;
  }, [arquivosParaExcluir, formData]);

  const submitNotification = useCallback(async () => {
    setIsSaving(true);
    try {
      console.log("Iniciando salvamento da notificação...");
      const dataForBackend = prepareNotificationPayloadForSubmit();
      await persistNotificationAndHandleSuccess(dataForBackend);
    } catch (error: any) {
      handleNotificationSaveError(error);
    } finally {
      setIsSaving(false);
    }
  }, [
    handleNotificationSaveError,
    persistNotificationAndHandleSuccess,
    prepareNotificationPayloadForSubmit,
  ]);

  // ✅ FUNÇÃO MODIFICADA PARA SUBMETER O FORMULÁRIO (COM SISTEMA OFFLINE)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpar estados de feedback
    setApiError(null);
    setIsSuccess(false);

    const canSubmit = await runPreSubmitChecks();
    if (!canSubmit) {
      return;
    }

    await submitNotification();
  };

  // Efeitos

  // Efeito para carregar dados iniciais 
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      if (!optionsLoaded && isMounted) {
        setIsLoading(true);
        try {
          await loadAllOptions();
          if (isMounted) {
            setOptionsLoaded(true);
          }
        } catch (error) {
          console.error('Erro ao carregar dados iniciais:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      // Carregar dados da notificação se estiver em modo de edição
      if (isEditMode && isMounted && (offlineId || id)) {
        loadNotificacao(id, offlineId);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, id, offlineId]);

  // Pré-seleciona evento da query (?eventoId=) ao abrir ficha nova (CTA Sairé na home).
  useEffect(() => {
    if (isEditMode || !optionsLoaded || eventoOptions.length === 0) {
      return;
    }

    const prefillId = resolvePrefillEventoId(
      searchParams.get('eventoId'),
      eventoOptions,
      formData.evento,
    );
    if (!prefillId) {
      return;
    }

    const nextModo = getModoLocalidadeEvento(prefillId, eventoOptions);
    localidadeEventoRequestRef.current += 1;
    setLocalidadeEventoOptions([]);
    setLocalidadeEventoCatalogAvailable(nextModo === 'NAO_USA');
    setIsLoadingLocalidadesEvento(nextModo !== 'NAO_USA');
    setFormData((prev) => changeEventoAndClearLocalidade(prev, prefillId));
  }, [
    isEditMode,
    optionsLoaded,
    eventoOptions,
    formData.evento,
    searchParams,
  ]);
  
  // 🆕 Hook para limpar window.fileStorage quando componente desmonta
  useEffect(() => {
    return () => {
      if ((window as any).fileStorage) {
        (window as any).fileStorage.clear();
        console.log('🧹 window.fileStorage limpo ao desmontar componente');
      }
    };
  }, []);

  useEffect(() => {
    if (!eventoLocalidadeMetadataLoaded) {
      return;
    }

    if (modoLocalidadeEvento === 'NAO_USA') {
      setFormData(prev => {
        if (
          !prev.localidadeEvento &&
          !prev.localidadeEventoOutro &&
          !prev.localidadeEventoAtual
        ) {
          return prev;
        }

        return {
          ...prev,
          localidadeEvento: '',
          localidadeEventoOutro: '',
          localidadeEventoAtual: null,
        };
      });
    }

    void loadLocalidadesEvento(
      formData.evento,
      modoLocalidadeEvento,
      localidadeEventoSelectedRef.current,
      localidadeEventoAtualRef.current,
    );
  }, [
    formData.evento,
    eventoLocalidadeMetadataLoaded,
    loadLocalidadesEvento,
    modoLocalidadeEvento,
  ]);

  // Efeito para processar idade quando dados vêm do backend
  useEffect(() => {
    // Esta lógica será executada quando o formulário for carregado com dados do backend
    // A nova lógica de idade está no notificacaoAdapter.ts
    console.log("useEffect idade - dados carregados do backend");
  }, [formData.dataNascimento]);

  // Efeito para atualizar municípios quando o estado muda
  useEffect(() => {
    console.log(`🔍 DEBUG useEffect UF changed: formData.uf = "${formData.uf}"`);
    if (formData.uf) {
      // ✅ VERIFICAR: Se o último estado carregado é o mesmo, não recarregar
      if (latestUfRef.current === formData.uf && municipioOptions.length > 0) {
        console.log(`🔍 Municípios já carregados para UF ${formData.uf}: ${municipioOptions.length} itens (mesmo estado)`);
        return;
      }
      
      console.log(`🔍 Chamando loadMunicipiosByEstado com UF: "${formData.uf}"`);
      loadMunicipiosByEstado(formData.uf);
    } else if (!usaLocalidadeEvento(modoLocalidadeEvento)) {
      // Em evento Sairé, não limpar a lista pré-aquecida do Pará (lookup Santarém).
      console.log('🔍 UF vazia, limpando municípios');
      setMunicipioOptions([]);
    }
  }, [formData.uf, loadMunicipiosByEstado, modoLocalidadeEvento]);

  // Pré-aquece municípios do Pará quando o evento usa localidade (SIM/NÃO
  // precisam de Santarém sem esperar o primeiro clique em residente).
  useEffect(() => {
    if (!usaLocalidadeEvento(modoLocalidadeEvento)) {
      return;
    }
    if (formData.uf && formData.uf !== PARA_ESTADO_ID) {
      return;
    }
    if (
      latestUfRef.current === PARA_ESTADO_ID &&
      municipioOptions.length > 0 &&
      santaremMunicipioIdRef.current
    ) {
      return;
    }
    void loadMunicipiosByEstado(PARA_ESTADO_ID);
  }, [
    modoLocalidadeEvento,
    formData.uf,
    loadMunicipiosByEstado,
    municipioOptions.length,
  ]);

  // Efeito para limpar campos de acordo com o tipo de atendimento
  useEffect(() => {
    if (formData.tipoAtendimento) {
      // Cria uma cópia dos dados atuais do formulário
      const updatedData = { ...formData };

      // Caso clínico ou incidente QBRN - limpa campos de trauma
      if (
        isTipoAtendimento("CLINICO", formData.tipoAtendimento, atendimentoOptions) ||
        isTipoAtendimento("INCIDENTE QBRN", formData.tipoAtendimento, atendimentoOptions)
      ) {
        updatedData.tipoTrauma = [];
        updatedData.observacaoTrauma = "";
      }
      // Trauma ou múltiplas vítimas - limpa campos clínicos
      else if (
        isTipoAtendimento("TRAUMA", formData.tipoAtendimento, atendimentoOptions) ||
        isTipoAtendimento("MULTIPLAS VITIMAS", formData.tipoAtendimento, atendimentoOptions)
      ) {
        updatedData.sinaisESintomas = [];
        updatedData.dataInicioSintomas = "";
        updatedData.observacaoSintomas = "";
        updatedData.hipoteseDiagnostica = [];
      }

      setFormData(updatedData);
    }
  }, [formData.tipoAtendimento]);

  useEffect(() => {
    if (!formData.residenteBelem) {
      return;
    }

    const { hydrate: isHydrate, residenteJustChanged } =
      resolveResidenciaChangeFlags(
        prevResidenteRef.current,
        formData.residenteBelem,
        Boolean(
          formData.uf ||
            formData.municipio ||
            formData.paisProcedencia ||
            formData.bairro,
        ),
      );
    prevResidenteRef.current = formData.residenteBelem;

    setFormData((prev) => {
      const next = applyResidenciaAutoFill({
        residenteBelem: prev.residenteBelem,
        modo: modoLocalidadeEvento,
        current: prev,
        santaremMunicipioId,
        residenteJustChanged,
        hydrate: isHydrate,
      });

      const clearLocalidade =
        usaLocalidadeEvento(modoLocalidadeEvento) &&
        (prev.residenteBelem === '2' || prev.residenteBelem === '3') &&
        Boolean(
          prev.localidadeEvento ||
            prev.localidadeEventoOutro ||
            prev.localidadeEventoAtual,
        );

      if (!next && !clearLocalidade) {
        return prev;
      }

      const merged = {
        ...prev,
        ...(next ?? {}),
        ...(clearLocalidade
          ? {
              localidadeEvento: '',
              localidadeEventoOutro: '',
              localidadeEventoAtual: null,
            }
          : {}),
      };

      if (
        !clearLocalidade &&
        next &&
        next.paisProcedencia === prev.paisProcedencia &&
        next.uf === prev.uf &&
        next.municipio === prev.municipio &&
        next.bairro === prev.bairro &&
        next.localHospedagem === prev.localHospedagem &&
        next.contatoLocal === prev.contatoLocal
      ) {
        return prev;
      }

      return merged;
    });
  }, [formData.residenteBelem, modoLocalidadeEvento, santaremMunicipioId]);

  // Efeito para fechar sugestões quando clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSuggestions) {
        const target = e.target as HTMLElement;
        // Verificar se o clique foi fora da área de sugestões
        if (!target.closest(".paciente-suggestions-area")) {
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  // Efeito para desativar a tradução automática para todo o formulário
  useEffect(() => {
    // Desativar tradução automática para todo o formulário
    const formElement = document.getElementById("notification-form");
    if (formElement) {
      formElement.setAttribute("translate", "no");
      formElement.classList.add("notranslate");
    }

    // Adicionar meta tag dinamicamente se não existir
    if (!document.querySelector('meta[name="google"][content="notranslate"]')) {
      const meta = document.createElement("meta");
      meta.name = "google";
      meta.content = "notranslate";
      document.head.appendChild(meta);
    }

    // Impedir a tradução automática especificamente para o Chrome
    document.documentElement.setAttribute("translate", "no");

    // Adicionar estilo que a Google usa para detectar conteúdo que não deve ser traduzido
    if (!document.getElementById("notranslate-style")) {
      const style = document.createElement("style");
      style.id = "notranslate-style";
      style.textContent =
        ".notranslate { font-family: _notranslate, Arial, sans-serif !important; }";
      document.head.appendChild(style);
    }

    // Adicionar classe notranslate a todos os elementos select e label
    const elements = document.querySelectorAll("select, label, option");
    elements.forEach((element) => {
      element.classList.add("notranslate");
    });

    return () => {
      // Limpar quando o componente for desmontado (opcional)
      document.documentElement.removeAttribute("translate");

      if (document.getElementById("notranslate-style")) {
        document.getElementById("notranslate-style")?.remove();
      }
    };
  }, []);

  // Atualizar hipóteses diagnósticas quando sintomas mudam
  useEffect(() => {
    const fetchHipoteses = async () => {
      // Se não temos sintomas selecionados ou não é um tipo de atendimento que usa sintomas, 
      // mostrar todas as hipóteses
      if (
        formData.sinaisESintomas.length === 0 || 
        !(isTipoAtendimento("CLINICO", formData.tipoAtendimento, atendimentoOptions) ||
          isTipoAtendimento("INCIDENTE QBRN", formData.tipoAtendimento, atendimentoOptions))
      ) {
        setHipoteseDiagFiltradas(hipoteseDiagOptions);
        return;
      }
  
      try {
        setIsLoadingHipoteses(true);
        
        // Buscar hipóteses relacionadas aos sintomas selecionados
        const hipotesesDaApi = await ListaSindromicaService.getHipotesesPorSintomas(formData.sinaisESintomas);
        
        if (hipotesesDaApi.length === 0) {
          // Se não encontrou nenhuma hipótese relacionada, mostrar todas as opções
          setHipoteseDiagFiltradas(hipoteseDiagOptions);
        } else {
          // Mapear as hipóteses da API para o formato esperado pelo componente,
          // mantendo a ordenação da API (que já está por relevância)
          const hipotesesFiltradas = hipotesesDaApi.map(hipoteseApi => {
            // Encontrar a hipótese correspondente nas opções originais para ter a descrição completa
            const hipoteseOriginal = hipoteseDiagOptions.find(
              h => h.idtipo_hipotese_diag === hipoteseApi.id
            );
            
            // Se encontrou, retornar com informações adicionais
            if (hipoteseOriginal) {
              return {
                ...hipoteseOriginal,
                qtdSintomas: hipoteseApi.qtd // Adicionar a quantidade de sintomas relacionados
              };
            }
            
            // Se não encontrou, criar um objeto com as informações da API
            return {
              idtipo_hipotese_diag: hipoteseApi.id,
              descricao: hipoteseApi.hipotese,
              qtdSintomas: hipoteseApi.qtd
            };
          });
          
          // Criar conjunto com os IDs das hipóteses que já estão filtradas
          const hipotesesFiltradasIds = new Set(hipotesesFiltradas.map(h => h.idtipo_hipotese_diag.toString()));
          
          // Para cada hipótese selecionada que não está na lista filtrada, adicionar à lista
          const hipotesesAdicionaisSelecionadas = formData.hipoteseDiagnostica
            .filter(id => !hipotesesFiltradasIds.has(id)) // Pegar apenas as que não estão já na lista filtrada
            .map(id => {
              // Encontrar a hipótese nas opções originais
              const hipoteseOriginal = hipoteseDiagOptions.find(
                h => h.idtipo_hipotese_diag.toString() === id
              );
              
              // Se encontrou, adicionar com qtdSintomas = 0 (sem relação com sintomas)
              if (hipoteseOriginal) {
                return {
                  ...hipoteseOriginal,
                  qtdSintomas: 0 // Indicar que não tem sintomas relacionados
                };
              }
              
              // Se não encontrou nas opções (improvável), criar um objeto básico
              return {
                idtipo_hipotese_diag: parseInt(id),
                descricao: `Hipótese ${id}`, // Descrição genérica
                qtdSintomas: 0
              };
            });
          
          // Combinar as hipóteses relacionadas com as selecionadas adicionais
          const todasHipotesesAMostrar = [
            ...hipotesesFiltradas,          // Primeiro as relacionadas por sintomas (ordenadas por relevância)
            ...hipotesesAdicionaisSelecionadas // Depois as selecionadas sem relação
          ];
          
          setHipoteseDiagFiltradas(todasHipotesesAMostrar);
        }
      } catch (error) {
        console.error('Erro ao buscar hipóteses diagnósticas:', error);
        // Em caso de erro, mostrar todas as hipóteses
        setHipoteseDiagFiltradas(hipoteseDiagOptions);
      } finally {
        setIsLoadingHipoteses(false);
      }
    };
  
    fetchHipoteses();
  }, [formData.sinaisESintomas, formData.tipoAtendimento, hipoteseDiagOptions]);

  // Retornar todos os estados e funções necessários

  // Lidar com mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Limpar erro quando o campo for alterado
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === 'evento') {
      localidadeEventoRequestRef.current += 1;
      const nextModo = getModoLocalidadeEvento(value, eventoOptions);

      setLocalidadeEventoOptions([]);
      setLocalidadeEventoCatalogAvailable(nextModo === 'NAO_USA');
      setIsLoadingLocalidadesEvento(nextModo !== 'NAO_USA' && value !== '');
      setErrors(prev => {
        const nextErrors = { ...prev };
        delete nextErrors.evento;
        delete nextErrors.localidadeEvento;
        delete nextErrors.localidadeEventoOutro;
        return nextErrors;
      });
      setFormData(prev => changeEventoAndClearLocalidade(prev, value));
      return;
    }

    if (name === 'localidadeEvento') {
      const selectedLocalidade = localidadeEventoOptions.find(
        option => option.id.toString() === value,
      );

      setErrors(prev => {
        const nextErrors = { ...prev };
        delete nextErrors.localidadeEvento;
        delete nextErrors.localidadeEventoOutro;
        return nextErrors;
      });
      setFormData(prev => ({
        ...prev,
        localidadeEvento: value,
        localidadeEventoOutro:
          selectedLocalidade?.especial === 'OUTRO'
            ? prev.localidadeEventoOutro
            : '',
        localidadeEventoAtual: selectedLocalidade ?? null,
      }));
      return;
    }

    if (name === 'localidadeEventoOutro') {
      setFormData(prev => ({
        ...prev,
        localidadeEventoOutro: value.slice(0, 150),
      }));
      return;
    }

    if (name === 'residenteBelem') {
      const { hydrate, residenteJustChanged } = resolveResidenciaChangeFlags(
        prevResidenteRef.current,
        value,
        Boolean(
          formData.uf ||
            formData.municipio ||
            formData.paisProcedencia ||
            formData.bairro,
        ),
      );
      prevResidenteRef.current = value;

      setFormData((prev) => {
        const filled = applyResidenciaAutoFill({
          residenteBelem: value,
          modo: modoLocalidadeEvento,
          current: prev,
          santaremMunicipioId,
          residenteJustChanged,
          hydrate,
        });

        const clearLocalidade =
          usaLocalidadeEvento(modoLocalidadeEvento) &&
          (value === '2' || value === '3') &&
          Boolean(
            prev.localidadeEvento ||
              prev.localidadeEventoOutro ||
              prev.localidadeEventoAtual,
          );

        return {
          ...prev,
          residenteBelem: value,
          ...(filled ?? {}),
          ...(clearLocalidade
            ? {
                localidadeEvento: '',
                localidadeEventoOutro: '',
                localidadeEventoAtual: null,
              }
            : {}),
        };
      });
      return;
    }

    // Gestante: Mulher cis (1), Mulher trans (3) ou Não binário (6)
    if (name === "identidadeGenero") {
      setFormData((prev) => {
        const next = { ...prev, identidadeGenero: value };
        if (value !== "1" && value !== "3" && value !== "6") {
          next.gestante = "";
        }
        return next;
      });
      return;
    }

    // ✅ CORREÇÃO: Tratar idadeUnidade ANTES da normalização
    if (name === 'idadeUnidade') {
      // Limpar erros quando mudar a unidade
      if (errors.idade) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.idade;
          return newErrors;
        });
      }
      if (errors.idadeMeses) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.idadeMeses;
          return newErrors;
        });
      }
      
      setFormData((prev) => ({ 
        ...prev, 
        idadeUnidade: value as 'anos' | 'meses'  // ✅ Usa o value original
      }));
      return;
    }

    // Normalizar texto para outros campos
    let newValue = normalizeText(value);

    if (name === "paciente" && newValue.length > 100) {
      newValue = newValue.slice(0, 100);
    } else if (name === "nomeMae" && newValue.length > 100) {
      newValue = newValue.slice(0, 100);
    }
    // Limitar contato telefônico a 15 caracteres numéricos
    else if (name === "contatoTelefonico") {
      newValue = value.slice(0, 15);
    }

    // *** LÓGICA MELHORADA PARA DATA DE NASCIMENTO ***
    if (name === "dataNascimento") {
      // Calcular idade automaticamente quando a data de nascimento for alterada
      const idadeCalculada = calcularIdadeAutomatica(newValue);
      
      // Validar se a idade calculada não ultrapassa 120 anos
      const anosCalculados = parseInt(idadeCalculada.idade, 10);
      if (!isNaN(anosCalculados) && anosCalculados > 120) {
        setErrors((prev) => ({
          ...prev,
          dataNascimento: "A idade calculada não pode ser superior a 120 anos"
        }));
        return;
      }
      
      setFormData((prev) => ({
        ...prev,
        dataNascimento: newValue,
        idade: idadeCalculada.idade,
        idadeMeses: idadeCalculada.idadeMeses,
        idadeUnidade: idadeCalculada.idadeUnidade as 'anos' | 'meses'
      }));
      return;
    }

    // Validar relações entre datas
    if (name === "dataAtendimento" && formData.dataNascimento && newValue) {
      if (!compareDates(newValue, formData.dataNascimento)) {

        setErrors((prev) => ({
          ...prev,
          dataAtendimento: "A data de atendimento não pode ser anterior à data de início dos sintomas",
        }));
      }
    }
    
    // Validar dataInicioSintomas em relação a dataAtendimento
    if (name === "dataInicioSintomas" && formData.dataAtendimento && newValue) {
      if (!compareDates(formData.dataAtendimento, newValue)) {
        setErrors((prev) => ({
          ...prev,
          dataInicioSintomas: "A data de início dos sintomas não pode ser posterior à data de atendimento",
        }));
      }
    }
    
    // Lógica para os campos de idade em anos ou meses (apenas se não houver data de nascimento)
    if ((name === 'idade' || name === 'idadeMeses') && !formData.dataNascimento) {
        const numValue = parseInt(newValue, 10);
        
        // Validações de limite
        if (!isNaN(numValue) && newValue !== "") {
          if (name === 'idade' && numValue > 120) {
            setErrors((prev) => ({
              ...prev,
              idade: "A idade não pode ser superior a 120 anos"
            }));
            return;
          }
          
          if (name === 'idadeMeses' && numValue > 11 && formData.idadeUnidade === 'meses') {
            setErrors((prev) => ({
              ...prev,
              idadeMeses: "Quando a unidade é 'meses', o valor não pode ser superior a 11"
            }));
            return;
          }
        }
        
        setFormData(prev => {
            const newFormData = {...prev, [name]: newValue};
            
            if (isNaN(numValue) || newValue === "") {
                newFormData.idade = "";
                newFormData.idadeMeses = "";
            } else if (name === 'idade') {
                newFormData.idadeMeses = (numValue * 12).toString();
            } else { // name === 'idadeMeses'
                newFormData.idade = Math.floor(numValue / 12).toString();
            }
            return newFormData;
        });
        return;
    }
    
    // Lógica para outros campos
    console.log(`🔧 handleChange: alterando ${name} = "${newValue}"`);
    if (name === 'uf') {
      console.log(`🚨 UF SENDO ALTERADA POR handleChange: valor atual: "${formData.uf}" → novo: "${newValue}"`);
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  // Handler para checkboxes (múltipla seleção)
  const handleCheckboxChange = (field: keyof FormData, value: string) => {
    if (!value) return;

    setFormData((prev) => {
      const currentValues = prev[field] as string[];
      return {
        ...prev,
        [field]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });
  };

  // Handler para CPF
  const handleCPFChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Remove formatação para armazenar apenas os dígitos no estado
    const formattedCPF = rawValue.replace(/\D/g, "").slice(0, 11);

    setFormData((prev) => ({
      ...prev,
      cpf: formattedCPF,
    }));
  };

  // Handler para contato local
  const handleContatoLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      contatoLocal: value,
    }));
  };

  // Handler para mudanças no campo de paciente
  const handlePacienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      paciente: value,
    }));

    // ✅ REMOVIDO: Busca automática de pacientes (conforme solicitação)
    // searchPacientes(value);
  };

  // Handler para seleção de paciente das sugestões
  const handleSelectPaciente = (paciente: Paciente) => {
    const idadeCalculada = paciente.data_nascimento 
      ? calcularIdadeAutomatica(paciente.data_nascimento)
      : { idade: "", idadeMeses: "", idadeUnidade: 'anos' as 'anos' | 'meses' };

    setFormData((prev) => ({
      ...prev,
      paciente: paciente.nome || "",
      pacienteId: paciente.idpaciente,
      cpf: paciente.cpf || "",
      dataNascimento: paciente.data_nascimento || "",
      nomeMae: paciente.nome_mae || "",
      identidadeGenero: paciente.tipo_genero?.idtipo_genero?.toString() || "",
      gestante: mapGestanteFromApi(paciente.gestante),
      raca: paciente.tipo_raca?.idtipo_raca?.toString() || "",
      escolaridade: paciente.escolaridade_idescolaridade?.toString() || "",
      contatoTelefonico: paciente.contato || "",
      idade: idadeCalculada.idade,
      idadeMeses: idadeCalculada.idadeMeses,
      idadeUnidade: idadeCalculada.idadeUnidade as 'anos' | 'meses'
    }));

    setShowSuggestions(false);
    setPacienteSuggestions([]);
  };



  // ✅ FUNÇÃO PARA VALIDAR ARQUIVOS
  const validateArquivos = useCallback((arquivos: ArquivoFormulario[]): string | null => {
    if (arquivos.length === 0) {
      return null; // Arquivos são opcionais
    }
    
    const validation = validateTotalFiles(arquivos, DEFAULT_UPLOAD_CONFIG);
    if (!validation.valid) {
      return validation.error!;
    }
    
    // Verificar se há arquivos com erro
    const arquivosComErro = arquivos.filter(arquivo => arquivo.status === 'error');
    if (arquivosComErro.length > 0) {
      return `${arquivosComErro.length} arquivo(s) com erro. Remova ou substitua-os.`;
    }
    
    return null;
  }, []);

  // ✅ FUNÇÃO PARA LIMPAR FORMULÁRIO INCLUINDO ARQUIVOS
  const handleClearForm = () => {
    if (window.confirm("Tem certeza que deseja limpar todos os campos do formulário?")) {
      prevResidenteRef.current = null;
      setFormData(initialFormData);
      setErrors({});
      toast.info("Formulário limpo com sucesso");
    }
  };

  const getExportOptions = useCallback(
    () => ({
      eventoOptions,
      publicoOptions,
      paisOptions,
      estadoOptions,
      municipioOptions,
      bairroOptions,
      generoOptions,
      racaOptions,
      escolaridadeOptions,
      atendimentoOptions,
      sintomaOptions,
      hipoteseDiagOptions,
      traumaOptions,
      estabelecimentoOptions,
      encerramentoOptions,
      localidadeEventoOptions,
      modoLocalidadeEvento,
    }),
    [
      eventoOptions,
      publicoOptions,
      paisOptions,
      estadoOptions,
      municipioOptions,
      bairroOptions,
      generoOptions,
      racaOptions,
      escolaridadeOptions,
      atendimentoOptions,
      sintomaOptions,
      hipoteseDiagOptions,
      traumaOptions,
      estabelecimentoOptions,
      encerramentoOptions,
      localidadeEventoOptions,
      modoLocalidadeEvento,
    ],
  );

  const handleExport = async (format: string) => {
    try {
      const exportOptions = await enrichExportOptions(getExportOptions(), formData);

      switch (format) {
        case "Excel":
          exportToExcel(formData, exportOptions);
          break;
        case "Word":
          exportToWord(formData, exportOptions);
          break;
        case "CSV":
          exportToCSV(formData, exportOptions);
          break;
        case "PDF":
        case "PDF_DOCUMENTO": {
          const ok = await exportToPDF(formData, exportOptions);
          if (ok) {
            toast.success("PDF documento gerado.");
          } else {
            toast.error("Falha ao gerar o PDF documento. Tente novamente.");
          }
          break;
        }
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      toast.error(`Falha ao exportar para ${format}. Por favor, tente novamente.`);
    }

    setIsExportDropdownOpen(false);
  };

  // Alternar dropdown de exportação
  const toggleExportDropdown = () => {
    setIsExportDropdownOpen(!isExportDropdownOpen);
  };

  // Criar novo paciente com base nos dados do formulário
  const criarNovoPaciente = async () => {
    setIsCreatingNewPatient(true);

    try {
      const payloadSource = { ...formData };
      if (await cpfAlreadyRegistered(payloadSource.cpf, searchPatientsOfflineSafe)) {
        payloadSource.cpf = '';
        setFormData((prev) => ({ ...prev, cpf: '' }));
      }

      const novoPaciente: any = buildPatientPayloadFromForm(
        payloadSource,
        { mapGestanteForApi },
        {
          uppercaseNome: false,
          uppercaseNomeMae: false,
          includeNullableClassificationIds: true
        }
      );
      
      const pacienteCriado = await savePatientOfflineSafe(novoPaciente);

      // Atualizar o formData com o novo paciente e seu ID
      const pacienteUpperCase = toUpperCaseAllStrings(pacienteCriado);
      setFormData((prev) => ({
        ...prev,
        pacienteId: pacienteUpperCase.idpaciente,
      }));

      const message = systemIsOnline 
        ? "Novo paciente criado com sucesso!" 
        : "Paciente salvo offline. Será sincronizado quando conectar.";
      
      toast.success(message);
    } catch (error: any) {
      console.error("Falha ao criar novo paciente", {
        status: error?.response?.status,
      });
      toast.error("Erro ao criar novo paciente. Por favor, tente novamente.");
    } finally {
      setIsCreatingNewPatient(false);
      setShowSuggestions(false);
    }
  };

  // Função para receber erros de validação de componentes
  const handleValidationError = (name: string, error: string | null) => {
    if ( error) {
      // Adicionar erro ao estado de erros
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    } else if (errors[name]) {
      // Remover o erro se foi resolvido
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  // 🆕 NOVA FUNÇÃO: Obter informações do timezone
  const getTimezoneInfo = useCallback(() => {
    return {
      timezone_name: formData.timezone_name || detectUserTimezone().timezone_name,
      timezone_offset_minutos: formData.timezone_offset_minutos ?? detectUserTimezone().timezone_offset_minutos,
      timezone_display: formData.timezone_name ? 
        `${formData.timezone_name} (UTC${formData.timezone_offset_minutos! >= 0 ? '+' : ''}${Math.floor(formData.timezone_offset_minutos! / 60)}:${Math.abs(formData.timezone_offset_minutos! % 60).toString().padStart(2, '0')})` :
        'Detectando...'
    };
  }, [formData.timezone_name, formData.timezone_offset_minutos]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isLoading,
    isSaving,
    isSuccess,
    apiError,
    expandedSections,
   
    toggleSection,
    handleChange,
    handleCheckboxChange,
    handleCPFChange,
    handleContatoLocalChange,
    handlePacienteChange,
    handleSelectPaciente,
    handleSubmit,
    handleClearForm,
    handleExport,
    getExportOptions,
    toggleExportDropdown,
    criarNovoPaciente,
    handleValidationError,
    
    // 🆕 NOVOS RETORNOS PARA ARQUIVOS
    handleArquivosChange, // Função unificada para gerenciar arquivos
    validateArquivos,
    arquivosParaExcluir, // ✅ NOVO: Lista de IDs de arquivos para exclusão
    
    // 🆕 FUNÇÕES CORRIGIDAS PARA ARQUIVOS
    handleFilesDrop,
    handleRemoveFile, // Função corrigida para remoção com limpeza do storage
    debugAntesDoSalvamento,
    debugStorage,
    processarArquivosNotificacao,
    
    // Dados de pacientes
    pacienteSuggestions,
    showSuggestions,
    isCreatingNewPatient,
    isPatientModalOpen,
    setIsPatientModalOpen,
    
    // Dados de exportação
    isExportDropdownOpen,
    
    // Campo de ajuda de gênero
    showGenderHelp,
    setShowGenderHelp,
    
    // Opções de dropdown
    eventoOptions,
    localidadeEventoOptions,
    modoLocalidadeEvento,
    isLoadingLocalidadesEvento,
    localidadeEventoCatalogAvailable,
    publicoOptions,
    paisOptions,
    estadoOptions,
    municipioOptions,
    bairroOptions,
    generoOptions,
    racaOptions,
    escolaridadeOptions,
    atendimentoOptions,
    sintomaOptions,
    hipoteseDiagOptions,
    traumaOptions,
    encerramentoOptions,
    estabelecimentoOptions,
    
    // Estado dos municípios
    isLoadingMunicipios,
    ufError,
    
    // Filtros de busca
    searchSintomas,
    setSearchSintomas,
    searchTrauma,
    setSearchTrauma,
    
    // Hipóteses diagnósticas filtradas
    hipoteseDiagFiltradas,
    isLoadingHipoteses,
    
    // Helpers para condicionais
    isTipoAtendimentoFunc: (tipo: string) => isTipoAtendimento(tipo, formData.tipoAtendimento, atendimentoOptions),
    isTipoEncerramentoFunc: (tipo: string) => isTipoEncerramento(tipo, formData.tipoEncerramento, encerramentoOptions),
    
    // ✅ Retornos do sistema offline
    isOnline: systemIsOnline,
    pendingCount: systemPendingData,
    offlineStatusMessage: getOfflineStatusMessage(),
    isReadyForOffline: isReadyForOffline(),
    hasDataToSync: hasDataToSync(),
    handleForceSync,
    checkCpfOfflineSafe,

    // CPF original para validação de duplicatas
    originalCpf,

    // 🆕 NOVOS RETORNOS para timezone:
    getTimezoneInfo,
    detectUserTimezone,
  };
};
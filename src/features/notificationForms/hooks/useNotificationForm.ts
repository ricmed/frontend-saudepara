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

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import axios from 'axios';
import syncService from '@/services/syncService';
import indexedDBService from '@/services/indexedDB';
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
  formatDateWithTimezone,
  EventoOption, 
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
  validateForm
} from '../utils/formUtils';
import { 
  exportToExcel, 
  exportToWord, 
  exportToCSV, 
  exportToPDF 
} from '@/features/notificationForms/components/exportUtilities';
import { useSectionExpansion } from './useSectionExpansion';
import { NotificacaoService } from '@/services/NotificacaoService';
import { Paciente, PacienteService } from '@/services/PacienteService';
import { salvarNotificacaoCompleta } from '@/utils/notificacaoAdapter';
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

  // 🆕 NOVA SEÇÃO: Arquivos Anexos
  arquivos: [],

  // 🆕 Timezone automático (detectado no carregamento)
  ...detectUserTimezone(),

  // Campos de auditoria (apenas para exibição)
  created_at: undefined,
  updated_at: undefined,
};

export const useNotificationForm = (isEditMode: boolean = false, id?: string) => {
  const navigate = useNavigate();
  
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
  
  // Estado para controle de carregamento e erros da API
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Estado para busca de pacientes
  const [pacienteSuggestions, setPacienteSuggestions] = useState<Paciente[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isCreatingNewPatient, setIsCreatingNewPatient] = useState<boolean>(false);
  const [originalCpf, setOriginalCpf] = useState<string>("");
  
  // Estado para opções de dropdown
  const [eventoOptions, setEventoOptions] = useState<EventoOption[]>([]);
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
        console.log(`[HOOK] 💾 Arquivo [${arquivo.nome}] com ID [${arquivo.id}] foi ADICIONADO/ATUALIZADO no window.fileStorage.`);
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
      const idsAtuais = new Set(prevFormData.arquivos.map(a => a.id));
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
      console.log(`\n📄 Processando: ${file.name}`);
      console.log(`   • Tamanho: ${file.size} bytes`);
      console.log(`   • Tipo: ${file.type}`);
      console.log(`   • É File: ${file instanceof File}`);
      
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
      console.log(`✅ ArquivoFormulario criado para: ${file.name}`);
    }
    
    if (arquivosValidos.length === 0) {
      console.log('⚠️ Nenhum arquivo válido');
      return;
    }
    
    // ✅ Usar a nova função centralizada para atualizar
    const arquivosAtualizados = [...formData.arquivos, ...arquivosValidos];
    handleArquivosChange(arquivosAtualizados);
    
    console.log('✅ ===== FIM ADICIONAR ARQUIVOS =====\n');
  };

  // 2. Debug antes de salvar a notificação (versão melhorada)
  const debugAntesDoSalvamento = (data: FormData) => {
    console.log('\n🔍 ===== DEBUG ANTES DO SALVAMENTO =====');
    console.log('📁 Total de arquivos no formulário:', data.arquivos.length);
    console.log('💾 Storage disponível:', (window as any).fileStorage?.size || 0);
    
    // Listar tudo que está no storage
    console.log('\n📋 Conteúdo do storage:');
    if ((window as any).fileStorage) {
      (window as any).fileStorage.forEach((file: File, id: string) => {
        console.log(`   • ${id}: ${file.name} (${file.size} bytes)`);
      });
    } else {
      console.log('   ❌ Storage não existe!');
    }
    
    data.arquivos.forEach((arquivo, index) => {
      console.log(`\n📄 Arquivo ${index + 1} no FormData (Estado):`);
      console.log('   • ID:', arquivo.id);
      console.log('   • Nome:', arquivo.nome);
      console.log('   • Tamanho:', arquivo.tamanho);
      console.log('   • Tipo:', arquivo.tipo);
      console.log('   • isExisting:', arquivo.isExisting);
      console.log('   • status:', arquivo.status);
      
      // Verificar no storage
      if (!arquivo.isExisting && arquivo.id) {
        const fileNoStorage = (window as any).fileStorage?.get(arquivo.id);
        console.log('   • Verificando no Storage... Encontrado?', fileNoStorage instanceof File ? '✅ SIM' : '❌ NÃO');
        if (fileNoStorage instanceof File) {
          console.log(`   • File no storage: ${fileNoStorage.name} (${fileNoStorage.size} bytes)`);
        }
      }
    });
    
    const arquivosNovos = data.arquivos.filter(a => !a.isExisting);
    const arquivosExistentes = data.arquivos.filter(a => a.isExisting);
    
    console.log('\n📊 RESUMO:');
    console.log('   🆕 Arquivos novos para upload:', arquivosNovos.length);
    console.log('   ✅ Arquivos existentes:', arquivosExistentes.length);
    console.log('   📄 Total:', data.arquivos.length);
    
    if (arquivosNovos.length === 0) {
      console.log('\n⚠️ ATENÇÃO: Nenhum arquivo novo será enviado!');
    }
    
    console.log('✅ ===== FIM DEBUG SALVAMENTO =====\n');
  };

  // 3. Handler para drop ou seleção de arquivo com debug
  const handleFilesDrop = (files: File[]) => {
    console.log('🎯 Arquivos recebidos no drop/seleção:', files.length);
    
    // Verificar se são Files válidos
    files.forEach((file, index) => {
      console.log(`File ${index + 1}:`, file instanceof File, file.name);
    });
    
    // Adicionar arquivos com debug
    handleFilesAdd(files);
  };

  // 4. Função para debug - debug do storage
  const debugStorage = () => {
    console.log('\n🔍 ===== DEBUG STORAGE =====');
    console.log('Storage existe:', !!(window as any).fileStorage);
    console.log('Storage tamanho:', (window as any).fileStorage?.size || 0);
    console.log('Arquivos no formData:', formData.arquivos.length);
    console.log('Arquivos para excluir:', arquivosParaExcluir);
    
    if ((window as any).fileStorage) {
      console.log('Conteúdo do storage:');
      (window as any).fileStorage.forEach((file: File, id: string) => {
        console.log(`  ${id}: ${file.name}`);
      });
    }
    
    console.log('Arquivos no estado:');
    formData.arquivos.forEach((arquivo, index) => {
      console.log(`  ${index + 1}. ${arquivo.id}: ${arquivo.nome} (existente: ${arquivo.isExisting})`);
    });
    console.log('✅ ===== FIM DEBUG =====\n');
  };

  // 5. Função corrigida para remover arquivo usando a função centralizada
  const handleRemoveFile = useCallback((id: string) => {
    const arquivosAtualizados = formData.arquivos.filter(arquivo => arquivo.id !== id);
    handleArquivosChange(arquivosAtualizados);
    toast.success('Arquivo removido.');
  }, [formData.arquivos, handleArquivosChange]);

  // 6. FUNÇÃO CORRIGIDA PARA PROCESSAR ARQUIVOS (VERSÃO WINDOW.FILESTORAGE)
  const processarArquivosNotificacao = async (
    notificacaoId: number, 
    arquivos: ArquivoFormulario[]
  ): Promise<void> => {
    console.log('\n� ===== UPLOAD ARQUIVOS (VERSÃO CORRIGIDA) =====');
    console.log('📋 Notificação ID:', notificacaoId);
    console.log('📁 Total de arquivos:', arquivos.length);
    console.log('💾 Storage disponível:', (window as any).fileStorage?.size || 0);
    
    // Listar tudo que está no storage
    console.log('\n📋 Conteúdo do storage:');
    if ((window as any).fileStorage) {
      (window as any).fileStorage.forEach((file: File, id: string) => {
        console.log(`   • ${id}: ${file.name} (${file.size} bytes)`);
      });
    } else {
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
        console.log(`\n🔍 Processando: ${arquivo.nome}`);
        console.log(`   • ID: ${arquivo.id}`);
        
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
          console.log(`   ✅ Anexado: ${file.name} (${arquivosAnexados}/${arquivosNovos.length})`);
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
      
      const response = await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      
      console.log('✅ Upload sucesso!', response.data);
      
      // Limpar storage
      arquivosNovos.forEach(arquivo => {
        if (arquivo.id) {
          (window as any).fileStorage.delete(arquivo.id);
          console.log(`🗑️ Removido: ${arquivo.id}`);
        }
      });
      
      console.log('✅ ===== FIM UPLOAD =====\n');
      
    } catch (error) {
      console.log('\n❌ ===== ERRO =====');
      console.error('Erro:', error);
      console.log('❌ ===== FIM ERRO =====\n');
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
        indexedDBService.getOpcoes('hipoteses'),
        indexedDBService.getOpcoes('traumas'),
        indexedDBService.getOpcoes('encerramentos'),
        indexedDBService.getOpcoes('estabelecimentos'),
      ]);

      // Verificar se temos dados essenciais
      const essentialData = [eventos, publicos, generos, racas, escolaridades, atendimentos, encerramentos];
      const hasEssentialData = essentialData.every(data => data && data.length > 0);

      if (!hasEssentialData) {
        console.warn('⚠️ Dados essenciais não encontrados no cache');
        return { hasData: false };
      }

      // Função para converter opções para caixa alta
      const convertOptionsToUpperCase = (options: any[]) => {
        if (!options) return [];
        return options.map((option) => {
          const newOption = { ...option };
          if (newOption.descricao) {
            newOption.descricao = normalizeText(newOption.descricao);
          }
          return newOption;
        });
      };

      // Definir todas as opções carregadas do cache
      if (eventos) {
        // 🆕 FILTRAR: Apenas eventos ativos para o formulário
        const eventosAtivos = eventos.filter((evento: any) => evento.ativo === 'S' || evento.ativo === undefined);
        setEventoOptions(convertOptionsToUpperCase(eventosAtivos));
        console.log(`✅ Eventos ativos carregados do cache: ${eventosAtivos.length}/${eventos.length}`);
      }

      if (publicos) {
        // Ordenação específica para público atendido
        const ordenacaoPublico = [
          "Participante", "Trab. do Evento", "Autoridade", "Outro"
        ].map((item) => normalizeText(item));

        const publicosUpperCase = convertOptionsToUpperCase(publicos);
        const publicosOrdenados = [...publicosUpperCase].sort((a, b) => {
          const posA = ordenacaoPublico.findIndex((item) => a.descricao.includes(item));
          const posB = ordenacaoPublico.findIndex((item) => b.descricao.includes(item));
          if (posA !== -1 && posB !== -1) return posA - posB;
          if (posA !== -1) return -1;
          if (posB !== -1) return 1;
          return 0;
        });
        setPublicoOptions(publicosOrdenados);
        console.log(`✅ Públicos carregados do cache: ${publicos.length}`);
      }

      if (paises) {
        setPaisOptions(convertOptionsToUpperCase(paises));
        console.log(`✅ Países carregados do cache: ${paises.length}`);
      }

      if (estados) {
        setEstadoOptions(convertOptionsToUpperCase(estados));
        console.log(`✅ Estados carregados do cache: ${estados.length}`);
      }

      if (municipios) {
        setMunicipioOptions(convertOptionsToUpperCase(municipios));
        console.log(`✅ Municípios carregados do cache: ${municipios.length}`);
      }

      if (bairros) {
        setBairroOptions(convertOptionsToUpperCase(bairros));
        console.log(`✅ Bairros carregados do cache: ${bairros.length}`);
      }

      if (generos) {
        // Ordenação específica para identidade de gênero
        const ordenacaoGenero = [
          "Mulher cisgênero", "Homem cisgênero", "Mulher transgênero",
          "Homem transgênero", "Travesti", "Não binário", "Não se aplica", "Ignorado"
        ].map((item) => normalizeText(item));

        const generosUpperCase = convertOptionsToUpperCase(generos);
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
        setRacaOptions(convertOptionsToUpperCase(racas));
        console.log(`✅ Raças carregadas do cache: ${racas.length}`);
      }

      if (escolaridades) {
        // Ordenação específica para escolaridade
        const ordenacaoEscolaridade = [
          "Analfabeto", "Ensino fundamental incompleto", "Ensino fundamental completo",
          "Ensino médio incompleto", "Ensino médio completo", "Ensino superior incompleto",
          "Ensino superior completo", "Pós-graduado", "Ignorado", "Não se aplica"
        ].map((item) => normalizeText(item));

        const escolaridadesUpperCase = convertOptionsToUpperCase(escolaridades);
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

        const atendimentosUpperCase = convertOptionsToUpperCase(atendimentos);
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
        setSintomaOptions(convertOptionsToUpperCase(sintomas));
        console.log(`✅ Sintomas carregados do cache: ${sintomas.length}`);
      }      if (hipoteses) {
        setHipoteseDiagOptions(convertOptionsToUpperCase(hipoteses));
        console.log(`✅ Hipóteses carregadas do cache: ${hipoteses.length}`);
      }

      if (traumas) {
        setTraumaOptions(convertOptionsToUpperCase(traumas));
        console.log(`✅ Traumas carregados do cache: ${traumas.length}`);
      }

      if (encerramentos) {
        // Ordenação específica para tipo de encerramento
        const ordenacaoEncerramento = [
          "Atendido e liberado", "Internação", "Observação", "Transferido", "Óbito"
        ].map((item) => normalizeText(item));

        const encerramentosUpperCase = convertOptionsToUpperCase(encerramentos);
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
        setEstabelecimentoOptions(convertOptionsToUpperCase(estabelecimentos));
        console.log(`✅ Estabelecimentos carregados do cache: ${estabelecimentos.length}`);
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
  const loadEssentialOptions = async () => {
    setIsLoading(true);
    
    try {
      // ✅ VERIFICAR SE ESTÁ OFFLINE E HAS CACHE
      if (!navigator.onLine) {
        console.log('📱 Modo offline detectado, tentando usar dados em cache...');
        
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
      
      // Converter todas as descrições para caixa alta
      const convertOptionsToUpperCase = (options: any[]) => {
        return options.map((option) => {
          const newOption = { ...option };
          if (newOption.descricao) {
            newOption.descricao = normalizeText(newOption.descricao);
          }
          return newOption;
        });
      };

      // Definir opções essenciais imediatamente com ordenações específicas
      setEventoOptions(convertOptionsToUpperCase(eventosAtivos));
      
      // Ordenação específica para público atendido
      const ordenacaoPublico = [
        "Participante",
        "Trab. do Evento",
        "Autoridade",
        "Outro",
      ].map((item) => normalizeText(item));

      const publicosUpperCase = convertOptionsToUpperCase(publicos);
      const publicosOrdenados = [...publicosUpperCase].sort((a, b) => {
        const posA = ordenacaoPublico.findIndex((item) => a.descricao.includes(item));
        const posB = ordenacaoPublico.findIndex((item) => b.descricao.includes(item));
        if (posA !== -1 && posB !== -1) return posA - posB;
        if (posA !== -1) return -1;
        if (posB !== -1) return 1;
        return 0;
      });
      setPublicoOptions(publicosOrdenados);
      
      setPaisOptions(convertOptionsToUpperCase(paises));
      setEstadoOptions(convertOptionsToUpperCase(estados));
      
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

      const generosUpperCase = convertOptionsToUpperCase(generos);
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

      const atendimentosUpperCase = convertOptionsToUpperCase(atendimentos);
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
  };

  // ✅ FUNÇÃO: Carregar dados restantes em background
  const loadRemainingOptions = async () => {
    try {
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
        NotificacaoService.getEstabelecimentoOptions()
      ]);

      // Converter descrições para caixa alta
      const convertOptionsToUpperCase = (options: any[]) => {
        return options.map((option) => {
          const newOption = { ...option };
          if (newOption.descricao) {
            newOption.descricao = normalizeText(newOption.descricao);
          }
          return newOption;
        });
      };

      // Definir opções restantes com ordenações específicas
      setRacaOptions(convertOptionsToUpperCase(racas));
      
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

      const escolaridadesUpperCase = convertOptionsToUpperCase(escolaridades);
      const escolaridadesOrdenadas = [...escolaridadesUpperCase].sort((a, b) => {
        const posA = ordenacaoEscolaridade.findIndex((item) => a.descricao.includes(item));
        const posB = ordenacaoEscolaridade.findIndex((item) => b.descricao.includes(item));
        if (posA !== -1 && posB !== -1) return posA - posB;
        if (posA !== -1) return -1;
        if (posB !== -1) return 1;
        return 0;
      });
      setEscolaridadeOptions(escolaridadesOrdenadas);
      
      setSintomaOptions(convertOptionsToUpperCase(sintomas));
      setHipoteseDiagOptions(convertOptionsToUpperCase(hipoteseDiag));
      setTraumaOptions(convertOptionsToUpperCase(traumas));
      
      // Ordenação específica para tipo de encerramento
      const ordenacaoEncerramento = [
        "Atendido e liberado",
        "Internação",
        "Observação",
        "Transferido",
        "Óbito",
      ].map((item) => normalizeText(item));

      const encerramentosUpperCase = convertOptionsToUpperCase(encerramentos);
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
      
      setEstabelecimentoOptions(convertOptionsToUpperCase(estabelecimentos));

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
  const loadAllOptions = async () => {
    return loadEssentialOptions();
  };

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
      if (!navigator.onLine) {
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
  const loadNotificacao = useCallback(async (notificacaoId: string) => {
    setIsLoading(true);
    try {
      console.log("[HOOK] Carregando notificação ID:", notificacaoId);
      
      // 1. O NotificacaoService.getById já usa o adapter e retorna os dados formatados.
      const dadosFormatados = await NotificacaoService.getById(Number(notificacaoId));
      
      if (dadosFormatados) {
        console.log("[HOOK] Dados formatados recebidos do serviço:", dadosFormatados);
        console.log("[HOOK] Arquivos carregados:", dadosFormatados.arquivos?.length || 0);
        
        // 2. Armazena o CPF original para validações futuras.
        setOriginalCpf(dadosFormatados.cpf || "");

        // 3. Define diretamente os dados no formulário.
        // A lógica de arquivos já foi tratada no adapter.
        setFormData(dadosFormatados);
        
        // 4. Carrega municípios se um estado estiver definido.
        if (dadosFormatados.uf) {
          loadMunicipiosByEstado(dadosFormatados.uf);
        }
        
        console.log("[HOOK] FormData atualizado com dados da notificação");
      }
    } catch (error) {
      console.error("Erro ao carregar notificação:", error);
      toast.error("Erro ao carregar dados da notificação");
      navigate("/private/comunicacao-de-caso");
    } finally {
      setIsLoading(false);
    }
  }, [navigate, loadMunicipiosByEstado]);

  // 🆕 NOVA FUNÇÃO: Adicionar timezone ao FormData
  const addTimezoneToFormData = useCallback((data: FormData): FormData => {
    // Se não tiver timezone definido, detectar automaticamente
    if (!data.timezone_name || !data.timezone_offset_minutos) {
      const timezone = detectUserTimezone();
      return {
        ...data,
        timezone_name: timezone.timezone_name,
        timezone_offset_minutos: timezone.timezone_offset_minutos
      };
    }
    
    return data;
  }, []);

  // ✅ FUNÇÃO MODIFICADA PARA SUBMETER O FORMULÁRIO (COM SISTEMA OFFLINE)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpar estados de feedback
    setApiError(null);
    setIsSuccess(false);

    console.log("=== INICIANDO VALIDAÇÃO DO FORMULÁRIO ===");

    // ========================================
    // VALIDAÇÃO PRINCIPAL - COLETAR TODOS OS ERROS
    // ========================================
    
    // IMPORTANTE: Chamar validateForm PRIMEIRO para coletar todos os erros
    const isValid = validateForm(
      formData, 
      errors, 
      setErrors, 
      setExpandedSections, 
      expandedSections,
      atendimentoOptions,
      encerramentoOptions
    );

    // Se a validação falhou, mostrar toast e impedir submissão
    if (!isValid) {
      // Aguardar um frame para que o estado seja atualizado
      setTimeout(() => {
        const currentErrors = Object.keys(errors).length;
        console.log(`Validação falhou. Total de erros: ${currentErrors}`);
        toast.error(`${currentErrors} erro(s) encontrado(s). Verifique o resumo acima.`);
      }, 100);
      return;
    }

    console.log("Validação passou. Procedendo com criação/atualização do paciente...");

    // ✅ VALIDAR ARQUIVOS
    const arquivosError = validateArquivos(formData.arquivos);
    if (arquivosError) {
      setErrors(prev => ({ ...prev, arquivos: arquivosError }));
      toast.error("Erro nos arquivos anexados. Verifique e tente novamente.");
      // Expandir seção de anexos se houver erro
      setExpandedSections(prev => ({ ...prev, anexos: true }));
      return;
    }

    // ========================================
    // VERIFICAÇÕES DE PACIENTE (APÓS VALIDAÇÃO)
    // ========================================

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
      return;
    }

    // Create patient automatically if name exists without ID
    if (formData.paciente.trim() && !formData.pacienteId) {
      try {
        toast.info("Criando novo paciente automaticamente...");
        console.log("Criando novo paciente com dados:", {
          nome: formData.paciente,
          nomeMae: formData.nomeMae,
          dataNascimento: formData.dataNascimento,
          cpf: formData.cpf
        });        // ✅ USAR SISTEMA OFFLINE
        const novoPaciente: any = {
          nome: formData.paciente.toUpperCase(),
          nome_mae: formData.nomeMae?.toUpperCase() || "",
          data_nascimento: formData.dataNascimento || null,
          cpf: formData.cpf || "",
          contato: formData.contatoTelefonico || "",
          ddi: formData.ddi || "55",
          gestante: formData.gestante || null, // ✅ ADICIONADO: Incluir campo gestante
          tipo_genero_idtipo_genero: formData.identidadeGenero ? parseInt(formData.identidadeGenero) : 2,
          tipo_raca_idtipo_raca: formData.raca ? parseInt(formData.raca) : 1,
          escolaridade_idescolaridade: formData.escolaridade ? parseInt(formData.escolaridade) : 11,
          cbo_idcbo: formData.profissao ? parseInt(formData.profissao) : null
        };
        
        // ✅ CORREÇÃO: SEMPRE enviar idade em meses quando não há data de nascimento
        if ((!formData.dataNascimento || formData.dataNascimento.trim() === '') && formData.idadeMeses) {
          novoPaciente.idade = parseInt(formData.idadeMeses); // Envia o total de meses
        } else {
          novoPaciente.idade = null;
        }
        
        // ✅ DEBUG: Log para verificar se gestante e idade estão incluídos
        console.log('🔍 DEBUG - Criando paciente com gestante e idade:', {
          gestante: formData.gestante,
          gestante_novoPaciente: novoPaciente.gestante,
          idade_formData: formData.idadeMeses,
          idade_novoPaciente: novoPaciente.idade,
          dataNascimento: formData.dataNascimento
        });

        const pacienteCriado = await savePatientOfflineSafe(novoPaciente);
        formData.pacienteId = pacienteCriado.idpaciente;

        console.log("Paciente criado automaticamente com ID:", pacienteCriado.idpaciente);
      } catch (error: any) {
        console.error("Erro ao criar paciente automaticamente:", error);

        // ✅ VERIFICAR SE É ERRO DE REDE PARA USAR SISTEMA OFFLINE
        const isNetworkError = (
          error?.code === 'ERR_NETWORK' ||
          error?.code === 'ERR_INTERNET_DISCONNECTED' ||
          error?.message?.includes('Network Error') ||
          error?.message?.includes('Failed to fetch') ||
          !navigator.onLine
        );

        if (isNetworkError) {
          console.log('🔄 Erro de rede na criação de paciente, já está usando sistema offline');
          // O syncService.savePaciente já deveria ter funcionado offline
          setApiError(`Erro ao salvar paciente: ${error.message}`);
        } else {
          // Erros não de rede (validação, etc) - tratamento original
          let errorMessage = "Erro ao criar o paciente. Verifique os dados e tente novamente.";
          if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          toast.error(errorMessage);
          setApiError(errorMessage);

          // Destacar campos específicos com erro
          if (error.response && error.response.data && error.response.data.errors) {
            const backendErrors = error.response.data.errors;
            const mappedErrors: Record<string, string> = {};

            Object.entries(backendErrors).forEach(([key, value]) => {
              const fieldMapping: Record<string, string> = {
                nome: "paciente",
                cpf: "cpf",
                data_nascimento: "dataNascimento",
              };

              const fieldName = fieldMapping[key] || key;
              mappedErrors[fieldName] = Array.isArray(value) ? value[0] : String(value);
            });

            setErrors((prev) => ({ ...prev, ...mappedErrors }));
            setExpandedSections((prev) => ({ ...prev, identificacao: true }));
          }
        }

        setIsSaving(false);
        return; // Impedir envio do formulário
      }
    }
    // Se já tem ID de paciente, atualizar dados do paciente
    else if (formData.pacienteId) {
      try {
        console.log("Atualizando dados do paciente ID:", formData.pacienteId);
        
        // ✅ USAR SISTEMA OFFLINE
        const pacienteData: any = {
          nome: formData.paciente,
          nome_mae: formData.nomeMae || "",
          cpf: formData.cpf || "",
          contato: formData.contatoTelefonico || "",
          ddi: formData.ddi || "55",
          gestante: formData.gestante || null, // ✅ Preservar valores "S" ou "N", converter "" para null
        };
        
        // ✅ DEBUG: Log para verificar valor de gestante
        console.log('🔍 DEBUG useNotificationForm - Valor de gestante:', {
          original: formData.gestante,
          final: pacienteData.gestante,
          tipo: typeof formData.gestante
        });

        // CORREÇÃO: SEMPRE enviar data_nascimento (null se vazio)
        if (formData.dataNascimento && formData.dataNascimento.trim() !== '') {
          pacienteData.data_nascimento = formData.dataNascimento;
        } else {
          pacienteData.data_nascimento = null;
        }

        // CORREÇÃO: SEMPRE enviar idade em meses quando não há data de nascimento
        if ((!formData.dataNascimento || formData.dataNascimento.trim() === '') && formData.idadeMeses) {
          pacienteData.idade = parseInt(formData.idadeMeses); // Envia o total de meses
        } else {
          pacienteData.idade = null;
        }

        if (formData.identidadeGenero) {
          pacienteData.tipo_genero_idtipo_genero = parseInt(formData.identidadeGenero);
        }
        if (formData.raca) {
          pacienteData.tipo_raca_idtipo_raca = parseInt(formData.raca);
        }
        if (formData.escolaridade) {
          pacienteData.escolaridade_idescolaridade = parseInt(formData.escolaridade);
        }
        if (formData.profissao) {
          pacienteData.cbo_idcbo = parseInt(formData.profissao);
        }

        console.log("Dados do paciente para atualização:", pacienteData);

        // Para edição, usar PacienteService diretamente se online
        if (navigator.onLine && isEditMode) {
          await PacienteService.update(formData.pacienteId, pacienteData);
        } else {
          // Offline ou criação, usar sistema offline
          await syncService.savePaciente({ ...pacienteData, idpaciente: formData.pacienteId });
        }
        
        console.log("Dados do paciente atualizados com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar dados do paciente:", error);
        toast.warning("Aviso: Os dados do paciente não puderam ser atualizados, mas tentaremos salvar a notificação.");
      }
    }

    // ========================================
    // SALVAMENTO DA NOTIFICAÇÃO
    // ========================================

    setIsSaving(true);
    try {
      console.log("Iniciando salvamento da notificação...");
      
      // 🆕 DEBUG ANTES DO SALVAMENTO
      debugAntesDoSalvamento(formData);
      
      // ✅ CORREÇÃO CRÍTICA: Isolar o array 'arquivos' da conversão para maiúsculas
      const { arquivos, ...restOfData } = formData;
      const dataForBackend = {
        ...toUpperCaseAllStrings(restOfData), // Converte apenas os outros dados
        arquivos: arquivos, // Mantém o array de arquivos original, com IDs em minúsculas
        // ✅ NOVO: Envia a lista de IDs para exclusão
        arquivos_para_excluir: arquivosParaExcluir,
        // 🆕 GARANTIR que timezone seja sempre enviado
        timezone_name: formData.timezone_name || detectUserTimezone().timezone_name,
        timezone_offset_minutos: formData.timezone_offset_minutos ?? detectUserTimezone().timezone_offset_minutos,
      };

      console.log("✅ Dados preparados para backend (arquivos preservados):", {
        totalCampos: Object.keys(dataForBackend).length,
        arquivosCount: arquivos.length,
        arquivosIDs: arquivos.map(a => a.id),
        arquivosParaExcluir: arquivosParaExcluir
      });

      // Agora, `salvarNotificacaoCompleta` recebe os dados com os IDs corretos
      if (isEditMode && id) {
        // Para edição, verificar se está online
        if (!systemIsOnline) {
          setApiError("Não é possível editar notificações offline. Conecte-se à internet.");
          setIsSaving(false);
          return;
        }

        // Para atualização, usar método original
        console.log("Atualizando notificação ID:", id);
        await salvarNotificacaoCompleta(dataForBackend, true, Number(id));
        console.log("Notificação atualizada com sucesso");
        setIsSuccess(true);
        toast.success("Notificação atualizada com sucesso");
        
        // ✅ NOVO: Limpa a lista de exclusão após salvamento bem-sucedido
        setArquivosParaExcluir([]);
      } else {
        // Para criação, usar sistema offline
        console.log("Criando nova notificação via sistema offline");
        await saveNotificationOfflineSafe(dataForBackend);
        console.log("Notificação salva (online ou offline conforme disponibilidade)");
        setIsSuccess(true);
        
        toast.success(systemIsOnline ? "Notificação criada com sucesso" : "Notificação salva offline");
        
        // ✅ NOVO: Limpa a lista de exclusão após salvamento bem-sucedido
        setArquivosParaExcluir([]);
      }

      // Redirecionar para página de listagem ou detalhes após um breve delay
      setTimeout(() => {
        navigate("/private/comunicacao-de-caso");
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao salvar notificação:", error);

      // Tratamento de erros melhorado
      let errorMessage = "Erro ao salvar notificação";
      let validationErrors: Record<string, string> = {};

      // Extrair mensagem de erro e possíveis erros de validação do backend
      if (error.response && error.response.data) {
        // Mensagem geral de erro
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }

        // Erros específicos por campo
        if (error.response.data.errors) {
          const backendErrors = error.response.data.errors;

          // Mapear os erros do backend para nossos campos do formulário
          Object.entries(backendErrors).forEach(([key, value]) => {
            // Mapeamento dos nomes de campo do backend para o frontend
            const fieldMapping: Record<string, string> = {
              tipo_evento_idtipo_evento: "evento",
              tipo_publico_idtipo_publico: "publicoAtendido",
              paciente_idpaciente: "paciente",
              residente_belem: "residenteBelem",
              tipo_pais_idtipo_pais: "paisProcedencia",
              tipo_estado_idtipo_estado: "uf",
              tipo_municipio_idtipo_municipio: "municipio",
              tipo_bairro_idtipo_bairro: "bairro",
              tipo_atendimento_idtipo_atendimento: "tipoAtendimento",
              tipo_encerramento_idtipo_encerramento: "tipoEncerramento",
              // Adicionar mais mapeamentos conforme necessário
            };

            const fieldName = fieldMapping[key] || key;
            validationErrors[fieldName] = Array.isArray(value) ? value[0] : String(value);
          });
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Atualizar estado de erro e exibir toast
      setApiError(errorMessage);
      toast.error(errorMessage);

      // Atualizar erros específicos por campo
      if (Object.keys(validationErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...validationErrors }));
        sectionExpansion.expandSectionsWithErrors(validationErrors);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Efeitos

  // Efeito para carregar dados iniciais
  useEffect(() => {
    loadAllOptions();

    // Carregar dados da notificação se estiver em modo de edição
    if (isEditMode && id) {
      loadNotificacao(id);
    }
  }, [isEditMode, id, loadNotificacao]);  

  // 🆕 Hook para limpar window.fileStorage quando componente desmonta
  useEffect(() => {
    return () => {
      if ((window as any).fileStorage) {
        (window as any).fileStorage.clear();
        console.log('🧹 window.fileStorage limpo ao desmontar componente');
      }
    };
  }, []);

  // Efeito para processar idade quando dados vêm do backend
  useEffect(() => {
    // Esta lógica será executada quando o formulário for carregado com dados do backend
    // A nova lógica de idade está no notificacaoAdapter.ts
    console.log("useEffect idade - dados carregados do backend");
  }, [formData.dataNascimento]);

  // Efeito para atualizar municípios quando o estado muda
  useEffect(() => {
    if (formData.uf) {
      loadMunicipiosByEstado(formData.uf);
    } else {
      // Limpar municípios quando nenhum estado estiver selecionado
      setMunicipioOptions([]);
    }
  }, [formData.uf, loadMunicipiosByEstado]);

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

  // Efeito para limpar campos quando muda opção de residente
  useEffect(() => {
    // Somente executar se já tiver um valor selecionado (evita limpar na inicialização)
    if (formData.residenteBelem && Object.keys(formData).length > 1) {
      // Criar uma cópia do formData para fazer as alterações
      const updatedData = { ...formData };

      // Se selecionar "SIM" (residente em Belém), limpar campos de não-residentes
      if (formData.residenteBelem === "1") {
        updatedData.uf = "";
        updatedData.municipio = "";
        updatedData.paisProcedencia = "105"; // Brasil
        updatedData.localHospedagem = "";
        updatedData.contatoLocal = "";
      }
      // Se selecionar "NÃO" (outro município/estado), limpar bairro e dados estrangeiros
      else if (formData.residenteBelem === "2") {
        updatedData.bairro = "";
        updatedData.paisProcedencia = "105"; // Brasil
        updatedData.localHospedagem = "";
        updatedData.contatoLocal = "";
      }
      // Se selecionar "ESTRANGEIRO", limpar dados de localização nacional
      else if (formData.residenteBelem === "3") {
        updatedData.bairro = "";
        updatedData.uf = "";
        updatedData.municipio = "";
      }

      // Atualizar o estado
      setFormData(updatedData);
    }
  }, [formData.residenteBelem]);

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

  // ✅ NOVA FUNÇÃO: Buscar pacientes com sistema offline
  const searchPacientes = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 3) {
        setPacienteSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        console.log('🔍 Buscando pacientes:', query);
        const results = await searchPatientsOfflineSafe(query);
        
        if (results && results.length > 0) {
          setPacienteSuggestions(results);
          setShowSuggestions(true);
          console.log(`✅ Encontrados ${results.length} pacientes`);
        } else {
          setPacienteSuggestions([]);
          setShowSuggestions(false);
          console.log('ℹ️ Nenhum paciente encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
        setPacienteSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500),
    [searchPatientsOfflineSafe]
  );

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

    // Buscar pacientes usando debounce
    searchPacientes(value);
  };

  // Handler para seleção de paciente das sugestões
  const handleSelectPaciente = (paciente: Paciente) => {
    const idadeCalculada = paciente.data_nascimento 
      ? calcularIdadeAutomatica(paciente.data_nascimento)
      : { idade: "", idadeMeses: "", idadeUnidade: 'anos' as 'anos' | 'meses' };

    setFormData((prev) => ({
      ...prev,
      paciente: paciente.nome || "",
      cpf: paciente.cpf || "",
      dataNascimento: paciente.data_nascimento || "",
      nomeMae: paciente.nome_mae || "",
      // Usar os IDs dos tipos em vez dos nomes diretos
      genero: paciente.tipo_genero?.idtipo_genero?.toString() || "",
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
      setFormData(initialFormData);
      setErrors({});
      toast.info("Formulário limpo com sucesso");
    }
  };

  // Funções de exportação
  const handleExport = async (format: string) => {
    try {
      const exportOptions = {
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
      };

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
          exportToPDF(formData, exportOptions);
          break;
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
      // ✅ USAR SISTEMA OFFLINE
      const novoPaciente: any = {
        nome: formData.paciente,
        nome_mae: formData.nomeMae || "",
        data_nascimento: formData.dataNascimento || null,
        cpf: formData.cpf || "",
        contato: formData.contatoTelefonico || "",
        gestante: formData.gestante || null, // ✅ ADICIONADO: Incluir campo gestante
        tipo_genero_idtipo_genero: formData.identidadeGenero || null,
        tipo_raca_idtipo_raca: formData.raca || null,
        escolaridade_idescolaridade: formData.escolaridade || null,
        cbo_idcbo: formData.profissao || null,
      };
      
      // ✅ CORREÇÃO: SEMPRE enviar idade em meses quando não há data de nascimento
      if ((!formData.dataNascimento || formData.dataNascimento.trim() === '') && formData.idadeMeses) {
        novoPaciente.idade = parseInt(formData.idadeMeses); // Envia o total de meses
      } else {
        novoPaciente.idade = null;
      }
      
      // ✅ DEBUG: Log para verificar se gestante e idade estão incluídos
      console.log('🔍 DEBUG - Criando novo paciente com gestante e idade:', {
        gestante: formData.gestante,
        gestante_novoPaciente: novoPaciente.gestante,
        idade_formData: formData.idadeMeses,
        idade_novoPaciente: novoPaciente.idade,
        dataNascimento: formData.dataNascimento,
        tipo: typeof formData.gestante
      });

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
    } catch (error) {
      console.error("Erro ao criar novo paciente:", error);
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
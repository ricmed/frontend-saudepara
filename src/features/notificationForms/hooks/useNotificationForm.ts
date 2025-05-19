// src/features/notificationForms/hooks/useNotificationForm.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { debounce } from 'lodash';
import { 
  FormData, 
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
  calculateAge, 
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

// Definir interface para hipótese filtrada com informação de relevância
interface HipoteseFiltrada extends HipoteseDiagOption {
  qtdSintomas?: number; // Quantidade de sintomas relacionados
}

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
  dataOcorrencia: "",
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
};

export const useNotificationForm = (isEditMode: boolean = false, id?: string) => {
  const navigate = useNavigate();
  
  // Estado para o formulário
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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

  // Funções para busca de pacientes
  const searchPacienteByName = useCallback(
    debounce(async (name: string) => {
      if (name.length < 3) {
        setPacienteSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const server = import.meta.env.VITE_API_SERVER;
        const port = import.meta.env.VITE_API_PORT;
        const response = await axios.get(
          `${server}:${port}/api/paciente/search?nome=${encodeURIComponent(name)}`
        );

        // Converter todos os pacientes para caixa alta
        const pacientes = response.data.map((p: Paciente) =>
          toUpperCaseAllStrings(p)
        );
        setPacienteSuggestions(pacientes);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
        setPacienteSuggestions([]);
      }
    }, 500),
    []
  );

  // Verificar se CPF já existe
  const searchCpfExists = async (cpf: string): Promise<boolean> => {
    // Não verificar CPFs vazios ou incompletos
    if (!cpf || cpf.length !== 11) return false;

    try {
      const server = import.meta.env.VITE_API_SERVER;
      const port = import.meta.env.VITE_API_PORT;
      const response = await axios.get(
        `${server}:${port}/api/paciente/check-cpf/${cpf}`
      );

      return response.data.exists;
    } catch (error) {
      console.error("Erro ao verificar CPF:", error);
      return false;
    }
  };

  // Função para carregar todas as opções
  const loadAllOptions = async () => {
    setIsLoading(true);
    try {
      const [
        eventos,
        publicos,
        paises,
        estados,
        municipios,
        bairros,
        generos,
        racas,
        escolaridades,
        atendimentos,
        sintomas,
        hipoteseDiag,
        traumas,
        encerramentos,
        estabelecimentos,
      ] = await Promise.all([
        NotificacaoService.getEventoOptions(),
        NotificacaoService.getPublicoOptions(),
        NotificacaoService.getPaisOptions(),
        NotificacaoService.getEstadoOptions(),
        NotificacaoService.getMunicipioOptions(),
        NotificacaoService.getBairroOptions(),
        NotificacaoService.getGeneroOptions(),
        NotificacaoService.getRacaOptions(),
        NotificacaoService.getEscolaridadeOptions(),
        NotificacaoService.getAtendimentoOptions(),
        NotificacaoService.getSintomaOptions(),
        NotificacaoService.getHipoteseDiagOptions(),
        NotificacaoService.getTraumaOptions(),
        NotificacaoService.getEncerramentoOptions(),
        NotificacaoService.getEstabelecimentoOptions(),
      ]);

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

      // Ordenar e atribuir as opções
      setPaisOptions(convertOptionsToUpperCase(paises));
      setEventoOptions(convertOptionsToUpperCase(eventos));

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
        "Surto",
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

      // Outras opções
      setEstadoOptions(convertOptionsToUpperCase(estados));
      setMunicipioOptions(convertOptionsToUpperCase(municipios));
      setBairroOptions(convertOptionsToUpperCase(bairros));
      setRacaOptions(convertOptionsToUpperCase(racas));
      setSintomaOptions(convertOptionsToUpperCase(sintomas));
      setHipoteseDiagOptions(convertOptionsToUpperCase(hipoteseDiag));
      setTraumaOptions(convertOptionsToUpperCase(traumas));
      setEstabelecimentoOptions(convertOptionsToUpperCase(estabelecimentos));
    } catch (error) {
      console.error("Erro ao carregar opções:", error);
      toast.error("Erro ao carregar opções para o formulário");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para carregar municípios com base no estado selecionado
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

      const municipios = await NotificacaoService.getMunicipioOptions(estadoIdNumber);

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

  // Carregar notificação se estiver em modo de edição
  const loadNotificacao = async (notificacaoId: string) => {
    setIsLoading(true);
    try {
      const response = await NotificacaoService.getById(Number(notificacaoId));
      const responseUpperCase = toUpperCaseAllStrings(response);
      const formattedData = responseUpperCase;

      if (formattedData) {
        // Normalizar dados para garantir consistência
        const normalizarDadosResidencia = (dados: any) => {
            // Criar uma cópia dos dados para não modificar o original
            const normalizado = { ...dados };
            
            // Normalizar IDs para strings nos campos de localização primeiro
            if (normalizado.tipo_pais_idtipo_pais !== undefined) {
              normalizado.paisProcedencia = normalizado.tipo_pais_idtipo_pais.toString();
            }
            
            // Se é estrangeiro (país não é Brasil - ID 105)
            if (normalizado.paisProcedencia && normalizado.paisProcedencia !== "105") {
              // Forçar opção "Estrangeiro" independentemente do que estiver no banco
              normalizado.residenteBelem = "3";
              console.log("Detectado país estrangeiro, corrigindo para ESTRANGEIRO");
              
              // Limpar campos brasileiros
              normalizado.bairro = "";
              normalizado.uf = "";
              normalizado.municipio = "";
            } 
            // Se não é estrangeiro, manter o valor original
            else if (normalizado.residente_belem !== undefined) {
              normalizado.residenteBelem = normalizado.residente_belem.toString();
            }
            
            return normalizado;
          };
        
        const dadosNormalizados = normalizarDadosResidencia(formattedData);
        console.log("Dados normalizados:", dadosNormalizados);

        // Combinar DDI e número de telefone no formato correto
        if (dadosNormalizados.paciente?.ddi && dadosNormalizados.paciente?.contato) {
          console.log("[PHONE DEBUG] Combinando DDI e telefone:", {
            ddi: dadosNormalizados.paciente.ddi,
            contato: dadosNormalizados.paciente.contato
          });
          
          // Remover caracteres não numéricos do DDI (garantir que não tem +)
          const cleanDDI = dadosNormalizados.paciente.ddi.replace(/\D/g, '');
          
          // Criar o número completo no formato +XX YYYYY
          dadosNormalizados.contatoTelefonico = `+${cleanDDI} ${dadosNormalizados.paciente.contato}`;
          
          console.log("[PHONE DEBUG] Número completo gerado:", dadosNormalizados.contatoTelefonico);
        }

        // Armazenar o CPF original para comparações
        setOriginalCpf(dadosNormalizados.cpf || "");

        // Atualizar o formulário com os dados normalizados
        setFormData(dadosNormalizados);

        // Carregar municípios se tivermos um estado selecionado
        if (dadosNormalizados.uf) {
          loadMunicipiosByEstado(dadosNormalizados.uf);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar notificação:", error);
      toast.error("Erro ao carregar dados da notificação");
      navigate("/private/comunicacao-de-caso"); // Voltar se ocorrer erro
    } finally {
      setIsLoading(false);
    }
  };

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

    // Processamento específico para certos campos
    let newValue = value;

    // Converter campos de texto para caixa alta
    if (typeof newValue === "string") {
      newValue = normalizeText(newValue);
    }

    // Aplicar normalização apenas para campos de texto - não em datas, números, IDs, etc.
    const textFields = [
      "paciente",
      "nomeMae",
      "bairro",
      "localHospedagem",
      "nomeNotificador",
      "observacaoSintomas",
      "observacaoHipotese",
      "observacaoTrauma",
      "observacaoIncidente",
    ];

    if (textFields.includes(name)) {
      // Para esses campos, além de converter para caixa alta, remover acentos
      newValue = normalizeText(value);

      if (name === "paciente" && newValue.length > 100) {
        newValue = newValue.slice(0, 100);
      } else if (name === "nomeMae" && newValue.length > 100) {
        newValue = newValue.slice(0, 100);
      }
    }
    // Limitar contato telefônico a 15 caracteres numéricos
    else if (name === "contatoTelefonico") {
      newValue = value.slice(0, 15);
    }

    // Validar relações entre datas
    if (name === "dataAtendimento" && formData.dataInicioSintomas && newValue) {
      if (!compareDates(newValue, formData.dataInicioSintomas)) {
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

    // Limpar erro existente
    if (errors.cpf) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.cpf;
        return newErrors;
      });
    }

    // Verificar CPF existente apenas se for um CPF completo
    if (formattedCPF.length === 11 && formattedCPF !== originalCpf) {
      const exists = await searchCpfExists(formattedCPF);

      if (exists) {
        setErrors((prev) => ({
          ...prev,
          cpf: "O CPF digitado já existe",
        }));
      }
    }
  };

  // Handler para contato local
  const handleContatoLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = rawValue.replace(/\D/g, "").slice(0, 11);

    setFormData((prev) => ({
      ...prev,
      contatoLocal: formattedValue,
    }));

    // Clear error if exists
    if (errors.contatoLocal) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.contatoLocal;
        return newErrors;
      });
    }
  };

  // Função para receber erros de validação de componentes
  const handleValidationError = (name: string, error: string | null) => {
    if (error) {
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

  // Handler para mudança no campo paciente
  const handlePacienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const normalizedValue = normalizeText(value);

    // Atualizar o formData sem o ID se estiver digitando manualmente
    setFormData((prev) => ({
      ...prev,
      paciente: normalizedValue,
      pacienteId: undefined, // Limpar o ID porque estamos digitando um novo nome
    }));

    // Buscar pacientes com nome similar
    searchPacienteByName(normalizedValue);

    // Limpar erro se existir
    if (errors.paciente) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.paciente;
        return newErrors;
      });
    }
  };

  // Selecionar paciente da lista de sugestões
  const handleSelectPaciente = (paciente: Paciente) => {
    // Converter todos os campos de texto para caixa alta
    const pacienteUpperCase = toUpperCaseAllStrings(paciente);

    // Armazenar o CPF original para comparações
    setOriginalCpf(pacienteUpperCase.cpf || "");

    // Formatar a data corretamente
    let formattedDate = "";
    if (pacienteUpperCase.data_nascimento) {
      const date = new Date(pacienteUpperCase.data_nascimento);
      formattedDate = date.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    }

    // Verificar explicitamente se o nome_mae não é um CPF
    let nomeDaMae = pacienteUpperCase.nome_mae || "";
    // Se o nome_mae parece ser um CPF (apenas dígitos e tem entre 11 a 14 caracteres)
    if (/^\d{11,14}$/.test(nomeDaMae)) {
      nomeDaMae = ""; // Limpar se parecer um CPF
      console.warn("Nome da mãe parece ser um CPF, limpando o campo");
    }

    // Mapeamento de escolaridade com correção específica
    let escolaridadeValue = "";
    if (
      pacienteUpperCase.escolaridade_idescolaridade !== null &&
      pacienteUpperCase.escolaridade_idescolaridade !== undefined
    ) {
      // Mapear especificamente o valor 7 para 8
      if (pacienteUpperCase.escolaridade_idescolaridade === 7) {
        escolaridadeValue = "8"; // Corrigindo o mapeamento específico
      } else {
        escolaridadeValue = String(
          pacienteUpperCase.escolaridade_idescolaridade
        );
      }
    } else if (
      pacienteUpperCase.tipo_escolaridade &&
      pacienteUpperCase.tipo_escolaridade.idescolaridade
    ) {
      // Aplicar o mesmo mapeamento para a estrutura alternativa
      if (pacienteUpperCase.tipo_escolaridade.idescolaridade === 7) {
        escolaridadeValue = "8";
      } else {
        escolaridadeValue = String(
          pacienteUpperCase.tipo_escolaridade.idescolaridade
        );
      }
    }

    setFormData((prev) => ({
      ...prev,
      paciente: pacienteUpperCase.nome || "",
      pacienteId: pacienteUpperCase.idpaciente,
      nomeMae: nomeDaMae,
      dataNascimento: formattedDate,
      idade: calculateAge(pacienteUpperCase.data_nascimento).toString(),
      cpf: pacienteUpperCase.cpf || "",
      identidadeGenero:
        pacienteUpperCase.tipo_genero_idtipo_genero?.toString() || "",
      raca: pacienteUpperCase.tipo_raca_idtipo_raca?.toString() || "",
      escolaridade: escolaridadeValue,
      profissao: pacienteUpperCase.cbo_idcbo
        ? pacienteUpperCase.cbo_idcbo.toString()
        : "",
      contatoTelefonico: (pacienteUpperCase.ddi && pacienteUpperCase.contato) 
        ? `+${pacienteUpperCase.ddi.replace(/\D/g, '')} ${pacienteUpperCase.contato}` 
        : pacienteUpperCase.contato || "",
    }));

    // Limpar erros ao selecionar um paciente
    setErrors({});
    setShowSuggestions(false);
  };

  // Criar novo paciente com base nos dados do formulário
  const criarNovoPaciente = async () => {
    setIsCreatingNewPatient(true);

    try {
      const server = import.meta.env.VITE_API_SERVER;
      const port = import.meta.env.VITE_API_PORT;

      // Dados básicos do novo paciente
      const novoPaciente = {
        nome: formData.paciente,
        nome_mae: formData.nomeMae || "",
        data_nascimento: formData.dataNascimento || null,
        cpf: formData.cpf || "",
        contato: formData.contatoTelefonico || "",
        tipo_genero_idtipo_genero: formData.identidadeGenero || null,
        tipo_raca_idtipo_raca: formData.raca || null,
        escolaridade_idescolaridade: formData.escolaridade || null,
        cbo_idcbo: formData.profissao || null,
      };

      // Enviar para a API
      const response = await axios.post(
        `${server}:${port}/api/paciente`,
        novoPaciente
      );

      // Atualizar o formData com o novo paciente e seu ID
      const pacienteCriado = response.data;

      // Converter para caixa alta e atualizar formData
      const pacienteUpperCase = toUpperCaseAllStrings(pacienteCriado);
      setFormData((prev) => ({
        ...prev,
        pacienteId: pacienteUpperCase.idpaciente,
      }));

      toast.success("Novo paciente criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar novo paciente:", error);
      toast.error("Erro ao criar novo paciente. Por favor, tente novamente.");
    } finally {
      setIsCreatingNewPatient(false);
      setShowSuggestions(false);
    }
  };

  // Função para limpar o formulário
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

  // Função para submeter o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpar estados de feedback
    setApiError(null);
    setIsSuccess(false);

    // Verificar explicitamente se há erros de data
    if (errors.dataOcorrencia || errors.dataInicioSintomas || errors.dataAtendimento || errors.dataEncerramento) {
      // Destacar a seção com erro
      const secaoComErro = errors.dataOcorrencia || errors.dataInicioSintomas 
        ? 'atendimento' 
        : errors.dataAtendimento 
          ? 'unidadeNotificadora' 
          : 'encerramento';
      
      setExpandedSections(prev => ({
        ...prev,
        [secaoComErro]: true
      }));
      
      // Exibir mensagem de erro
      toast.error("Há problemas com as datas informadas. Por favor, corrija os erros destacados.");
      return; // Impedir submissão
    }

    // Verifica se tem paciente
    if (!formData.paciente.trim()) {
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

    // Se tem nome de paciente, mas não tem ID, criar paciente automaticamente
    if (formData.paciente.trim() && !formData.pacienteId) {
      try {
        const server = import.meta.env.VITE_API_SERVER;
        const port = import.meta.env.VITE_API_PORT;

        toast.info("Criando novo paciente automaticamente...");

        // Criar payload de novo paciente com os dados disponíveis
        const novoPaciente = {
          nome: formData.paciente,
          nome_mae: formData.nomeMae || "",
          data_nascimento: formData.dataNascimento || null,
          cpf: formData.cpf || "",
          contato: formData.contatoTelefonico || "",
          tipo_genero_idtipo_genero: formData.identidadeGenero
            ? parseInt(formData.identidadeGenero)
            : null,
          tipo_raca_idtipo_raca: formData.raca ? parseInt(formData.raca) : null,
          escolaridade_idescolaridade: formData.escolaridade
            ? parseInt(formData.escolaridade)
            : null,
          cbo_idcbo: formData.profissao ? parseInt(formData.profissao) : null,
        };

        // Criar o paciente no backend
        const response = await axios.post(
          `${server}:${port}/api/paciente`,
          novoPaciente
        );

        // Atualizar o formData com o ID do paciente criado
        formData.pacienteId = response.data.idpaciente;

        console.log("Paciente criado automaticamente com ID:", response.data.idpaciente);
      } catch (error: any) {
        console.error("Erro ao criar paciente automaticamente:", error);

        // Mostrar mensagem de erro mais específica
        let errorMessage = "Erro ao criar o paciente. Verifique os dados e tente novamente.";

        // Se o erro contém informações da API, mostrar essas informações
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        setApiError(errorMessage);

        // Destacar campos específicos com erro, se a API retornar essa informação
        if (error.response && error.response.data && error.response.data.errors) {
          const backendErrors = error.response.data.errors;

          // Mapear erros do backend para os campos do formulário
          const mappedErrors: Record<string, string> = {};

          Object.entries(backendErrors).forEach(([key, value]) => {
            // Mapear nome dos campos do backend para nomes no nosso formData
            const fieldMapping: Record<string, string> = {
              nome: "paciente",
              cpf: "cpf",
              data_nascimento: "dataNascimento",
              // adicionar outros mapeamentos conforme necessário
            };

            const fieldName = fieldMapping[key] || key;
            mappedErrors[fieldName] = Array.isArray(value) ? value[0] : String(value);
          });

          setErrors((prev) => ({ ...prev, ...mappedErrors }));

          // Expandir a seção de identificação do paciente
          setExpandedSections((prev) => ({ ...prev, identificacao: true }));
        }

        setIsSaving(false);
        return; // Impedir envio do formulário
      }
    }
    // Se já tem ID de paciente, atualizar dados do paciente
    else if (formData.pacienteId) {
      try {
        // Atualizar os dados do paciente antes de salvar a notificação
        const pacienteData = {
          nome: formData.paciente,
          nome_mae: formData.nomeMae || "",
          // Incluir data_nascimento apenas se existir
          ...(formData.dataNascimento ? { data_nascimento: formData.dataNascimento } : {}),
          cpf: formData.cpf || "",
          contato: formData.contatoTelefonico || "",
          tipo_genero_idtipo_genero: formData.identidadeGenero
            ? parseInt(formData.identidadeGenero)
            : undefined,
          tipo_raca_idtipo_raca: formData.raca
            ? parseInt(formData.raca)
            : undefined,
          escolaridade_idescolaridade: formData.escolaridade
            ? parseInt(formData.escolaridade)
            : undefined,
          cbo_idcbo: formData.profissao
            ? parseInt(formData.profissao)
            : undefined,
          ddi: formData.ddi || "55",
          // Adicionar idade somente se não houver data de nascimento
          ...((!formData.dataNascimento || formData.dataNascimento.trim() === '') && formData.idade
              ? { idade: parseInt(formData.idade) }
              : {}),
        };

        // Usar o serviço para atualizar o paciente
        await PacienteService.update(formData.pacienteId, pacienteData);
        console.log("Dados do paciente atualizados com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar dados do paciente:", error);
        toast.warning("Aviso: Os dados do paciente não puderam ser atualizados, mas tentaremos salvar a notificação.");
      }
    }

    // Validar o formulário
    const isValid = validateForm(
      formData, 
      errors, 
      setErrors, 
      setExpandedSections, 
      expandedSections,
      atendimentoOptions,
      encerramentoOptions
    );
    
    if (!isValid) return;

    setIsSaving(true);
    try {
      // Converter todos os dados para caixa alta antes de enviar
      const formDataUpperCase = toUpperCaseAllStrings(formData);

      // Usar a função importada salvarNotificacaoCompleta
      if (isEditMode && id) {
        // Para atualização
        await salvarNotificacaoCompleta(formDataUpperCase, true, Number(id));
        console.log("Notificação atualizada com sucesso");
        setIsSuccess(true);
        toast.success("Notificação atualizada com sucesso");
      } else {
        // Para criação
        await salvarNotificacaoCompleta(formDataUpperCase, false);
        console.log("Notificação criada com sucesso");
        setIsSuccess(true);
        toast.success("Notificação criada com sucesso");
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
              data_ocorrencia: "dataOcorrencia",
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
  }, [isEditMode, id]);

  // Efeito para calcular idade automaticamente quando a data de nascimento mudar
  useEffect(() => {
    if (formData.dataNascimento) {
      const calculatedAge = calculateAge(formData.dataNascimento);

      // Verificar se a idade calculada é válida (não maior que 120)
      if (calculatedAge > 120) {
        // Limpar a data de nascimento se for inválida
        setFormData((prev) => ({
          ...prev,
          dataNascimento: "", // Limpar data inválida
          idade: "", // Limpar idade também
        }));

        // Mostrar mensagem de erro
        setErrors((prev) => ({
          ...prev,
          dataNascimento: "A idade não pode ser maior que 120 anos",
        }));
      } else {
        // Se a idade for válida, atualizar normalmente
        setFormData((prev) => ({
          ...prev,
          idade: calculatedAge.toString(),
        }));

        // Limpar erro se existir
        if (errors.dataNascimento) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.dataNascimento;
            return newErrors;
          });
        }
      }
    } else {
      // Quando data de nascimento for limpa, limpar idade também
      setFormData((prev) => ({
        ...prev,
        idade: "",
      }));
    }
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

      // Caso clínico, surto ou incidente QBRN - limpa campos de trauma
      if (
        isTipoAtendimento("CLINICO", formData.tipoAtendimento, atendimentoOptions) ||
        isTipoAtendimento("SURTO", formData.tipoAtendimento, atendimentoOptions) ||
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
          isTipoAtendimento("SURTO", formData.tipoAtendimento, atendimentoOptions) ||
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
          
          // INÍCIO DA MODIFICAÇÃO: Adicionar hipóteses já selecionadas à lista, mesmo que não tenham relação com sintomas
          
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
          
          // FIM DA MODIFICAÇÃO
          
          // Remover o código que removia automaticamente as hipóteses selecionadas
          /*
          // Remover hipóteses diagnósticas que não estão mais disponíveis
          const hipotesesValidas = new Set(hipotesesFiltradas.map(
            h => h.idtipo_hipotese_diag.toString()
          ));
          
          // Filtrar as hipóteses selecionadas para manter apenas as válidas
          const hipotesesSelecionadasValidas = formData.hipoteseDiagnostica.filter(
            id => hipotesesValidas.has(id)
          );
          
          // Se a seleção mudou, atualizar o formData
          if (hipotesesSelecionadasValidas.length !== formData.hipoteseDiagnostica.length) {
            setFormData(prev => ({
              ...prev,
              hipoteseDiagnostica: hipotesesSelecionadasValidas
            }));
          }
          */
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
    isTipoEncerramentoFunc: (tipo: string) => isTipoEncerramento(tipo, formData.tipoEncerramento, encerramentoOptions)
  };
};
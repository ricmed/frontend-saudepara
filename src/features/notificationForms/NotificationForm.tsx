import React, { useState, useEffect, useCallback, useRef } from "react";
import PhoneInput from "@/features/notificationForms/components/PhoneInput";
import CboInput from "@/features/notificationForms/components/CboInput";
import UnidadeNotificadoraField from "@/features/notificationForms/components/UnidadeNotificadoraField";
import BrazilianPhoneInput from "@/features/notificationForms/components/BrazilianPhoneInput";
import ModalBuscaPaciente from "@/features/paginaPacientesComu/components/ModalBuscaPaciente";
import { Paciente } from "@/services/PacienteService";
import LocationInput from "@/features/notificationForms/components/LocationInput";
import BairroInput from "./components/BairroInput";
import { debounce } from "lodash";
import CustomDateInput from "./components/CustomDateInput";
import { PacienteService } from "@/services/PacienteService";
import axios from "axios";
import {
  Search,
  Save,
  X,
  User,
  ClipboardList,
  Bell,
  ArrowLeft,
  FileChartColumnIncreasing,
  FileSpreadsheet,
  FileText,
  Files,
  Download,
  ArchiveX,
  ChevronDown,
  ChevronUp,
  FileOutput,
  Globe,
  ListChecks,
  Loader,
  HelpCircle,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
// Import the export utilities
import {
  exportToExcel,
  exportToCSV,
  exportToWord,
  exportToPDF,
} from "@/features/notificationForms/components/exportUtilities";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Import do serviço e interfaces
import {
  NotificacaoService,
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
  EncerramentoOption,
} from "@/services/NotificacaoService";
import { salvarNotificacaoCompleta } from "@/utils/notificacaoAdapter";

// Interface FormData atualizada
export interface FormData {
  // Seção 1: Dados Gerais
  evento: string;
  publicoAtendido: string;

  // Seção 2: Procedência do indivíduo
  residenteBelem: string;
  bairro: string;
  municipio: string;
  uf: string;
  paisProcedencia: string;
  localHospedagem: string;
  contatoLocal: string;

  // Seção 3: Identificação do indivíduo
  paciente: string;
  pacienteId?: number; // Adicione esta linha para armazenar o ID do paciente
  nomeMae: string;
  dataNascimento: string;
  idade: string;
  cpf: string;
  identidadeGenero: string;
  gestante: string;
  raca: string;
  escolaridade: string;
  profissao: string;
  profissaoSearch?: string;
  showProfissaoOptions?: boolean;
  ddi: string;
  contatoTelefonico: string;

  // Seção 4: Informações do atendimento
  tipoAtendimento: string;
  sinaisESintomas: string[];
  dataInicioSintomas: string;
  observacaoSintomas: string;
  hipoteseDiagnostica: string[];
  observacaoHipotese: string;
  tipoTrauma: string[];
  dataOcorrencia: string;
  observacaoTrauma: string;
  relacionadoSurto: string;
  observacaoIncidente: string;

  // Seção 5: Informações da unidade notificadora
  dataAtendimento: string;
  unidadeNotificadora: string;
  nomeNotificador: string;
  contatoNotificador: string;

  // Seção 6: Encerramento do Caso
  dataEncerramento: string;
  tipoEncerramento: string;
  localEncaminhamento: string;
}

// Modifique a função normalizeText para garantir que apenas converta para caixa alta sem remover acentos, se necessário
function normalizeText(text: string): string {
  if (!text) return "";
  // Remove acentos e converte para caixa alta
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toUpperCase();
}

// Adicione uma função para converter todos os textos de um objeto para caixa alta
const toUpperCaseAllStrings = (obj: any): any => {
  if (!obj) return obj;

  if (typeof obj === "string") {
    return normalizeText(obj); // remove acentos e cedilhas e converte para caixa alta
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => toUpperCaseAllStrings(item));
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = toUpperCaseAllStrings(obj[key]);
      }
    }
    return result;
  }

  return obj;
};

const NotificationForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Estado para controle de erros
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Estados para as opções de dropdown vindas da API
  const [eventoOptions, setEventoOptions] = useState<EventoOption[]>([]);
  const [publicoOptions, setPublicoOptions] = useState<PublicoOption[]>([]);
  const [paisOptions, setPaisOptions] = useState<PaisOption[]>([]);
  const [estadoOptions, setEstadoOptions] = useState<EstadoOption[]>([]);
  const [municipioOptions, setMunicipioOptions] = useState<MunicipioOption[]>(
    []
  );
  const [isLoadingMunicipios, setIsLoadingMunicipios] =
    useState<boolean>(false);
  const [ufError, setUfError] = useState<string | null>(null);
  const latestUfRef = useRef<string>("");
  const [bairroOptions] = useState<BairroOption[]>([]);
  const [pacienteSuggestions, setPacienteSuggestions] = useState<Paciente[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreatingNewPatient, setIsCreatingNewPatient] = useState(false);
  const [originalCpf, setOriginalCpf] = useState<string>("");
  const [generoOptions, setGeneroOptions] = useState<GeneroOption[]>([]);
  const [racaOptions, setRacaOptions] = useState<RacaOption[]>([]);
  const [escolaridadeOptions, setEscolaridadeOptions] = useState<
    EscolaridadeOption[]
  >([]);
  const [atendimentoOptions, setAtendimentoOptions] = useState<
    AtendimentoOption[]
  >([]);
  const [sintomaOptions, setSintomaOptions] = useState<SintomaOption[]>([]);
  const [hipoteseDiagOptions, setHipoteseDiagOptions] = useState<
    HipoteseDiagOption[]
  >([]);
  const [traumaOptions, setTraumaOptions] = useState<TraumaOption[]>([]);
  const [encerramentoOptions, setEncerramentoOptions] = useState<
    EncerramentoOption[]
  >([]);
  const [estabelecimentoOptions, setEstabelecimentoOptions] = useState<
    EstabelecimentoOption[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [] = useState<boolean>(false);

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
    pacienteId: undefined, // ou null, dependendo de como prefere inicializar
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

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const normalizarDadosResidencia = (data: FormData): FormData => {
    // Clone os dados para não modificar o original diretamente
    const normalizados = { ...data };

    // Se é brasileiro
    if (parseInt(normalizados.paisProcedencia) === 105) {
      // Residente em Belém
      if (normalizados.residenteBelem === "1") {
        // Já está correto, apenas limpar outros campos
        normalizados.uf = "";
        normalizados.municipio = "";
        normalizados.localHospedagem = "";
        normalizados.contatoLocal = "";
      }
      // Não residente em Belém (outro município brasileiro)
      else if (normalizados.residenteBelem === "2") {
        // Limpar campos não aplicáveis
        normalizados.bairro = "";
        normalizados.localHospedagem = "";
        normalizados.contatoLocal = "";
      }
    }
    // Se estrangeiro (país não é Brasil)
    else if (parseInt(normalizados.paisProcedencia) !== 105) {
      // Forçar opção "Estrangeiro"
      normalizados.residenteBelem = "3";
      // Limpar campos brasileiros
      normalizados.bairro = "";
      normalizados.uf = "";
      normalizados.municipio = "";
    }

    return normalizados;
  };

  const [searchSintomas, setSearchSintomas] = useState("");
  const [searchTrauma, setSearchTrauma] = useState("");
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Estado para armazenar o objeto paciente completo selecionado
  const [, setSelectedPaciente] = useState<Paciente | null>(null);

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

  // Estado para controlar seções expandidas
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    dadosGerais: true,
    procedencia: true,
    identificacao: true,
    atendimento: true,
    unidadeNotificadora: true,
    encerramento: true,
  });

  // Efeito para calcular idade automaticamente quando a data de nascimento mudar
  useEffect(() => {
    if (formData.dataNascimento) {
      const calculatedAge = calculateAge(formData.dataNascimento);

      // Verificar se a idade calculada é válida (não maior que 120)
      if (calculatedAge > 120) {
        // Opção 1: Limpar a data de nascimento se for inválida
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

  // Adicione esta função para converter todas as opções para caixa alta
  const convertOptionsToUpperCase = useCallback((options: any[]) => {
    return options.map((option) => {
      const newOption = { ...option };

      // Procura pela propriedade de descrição e converte para caixa alta E remove acentos
      if (newOption.descricao) {
        newOption.descricao = normalizeText(newOption.descricao);
      }

      return newOption;
    });
  }, []);

  const loadAllOptions = async () => {
    setIsLoading(true);
    try {
      const [
        eventos,
        publicos,
        paises,
        estados,
        municipios,
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
      console.log("Lista de países:", convertOptionsToUpperCase(paises));
      setPaisOptions(convertOptionsToUpperCase(paises));
      setEventoOptions(convertOptionsToUpperCase(eventos));

      // Ordenar as opções de público atendido na ordem específica
      const ordenacaoPublico = [
        "Participante",
        "Trab. do Evento",
        "Autoridade",
        "Outro",
      ].map((item) => normalizeText(item));

      const publicosUpperCase = convertOptionsToUpperCase(publicos);
      const publicosOrdenados = [...publicosUpperCase].sort((a, b) => {
        // Encontrar a posição de cada item no array de ordenação
        const posA = ordenacaoPublico.findIndex((item) =>
          a.descricao.includes(item)
        );
        const posB = ordenacaoPublico.findIndex((item) =>
          b.descricao.includes(item)
        );

        // Se ambos forem encontrados, ordenar pela posição
        if (posA !== -1 && posB !== -1) {
          return posA - posB;
        }

        // Se apenas um for encontrado, colocá-lo primeiro
        if (posA !== -1) return -1;
        if (posB !== -1) return 1;

        // Se nenhum for encontrado, manter a ordem original
        return 0;
      });

      setPublicoOptions(publicosOrdenados);

      // Ordenar as opções de identidade de gênero na ordem específica
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
        // Encontrar a posição de cada item no array de ordenação
        const posA = ordenacaoGenero.findIndex((item) =>
          a.descricao.includes(item)
        );
        const posB = ordenacaoGenero.findIndex((item) =>
          b.descricao.includes(item)
        );

        // Se ambos forem encontrados, ordenar pela posição
        if (posA !== -1 && posB !== -1) {
          return posA - posB;
        }

        // Se apenas um for encontrado, colocá-lo primeiro
        if (posA !== -1) return -1;
        if (posB !== -1) return 1;

        // Se nenhum for encontrado, manter a ordem original
        return 0;
      });

      setGeneroOptions(generosOrdenados);

      // Ordenar as opções de tipo de atendimento na ordem específica
      const ordenacaoAtendimento = [
        "Clínico",
        "Trauma",
        "Surto",
        "Múltiplas vítimas",
        "Incidente QBRN",
      ].map((item) => normalizeText(item));

      const atendimentosUpperCase = convertOptionsToUpperCase(atendimentos);
      const atendimentosOrdenados = [...atendimentosUpperCase].sort((a, b) => {
        // Encontrar a posição de cada item no array de ordenação
        const posA = ordenacaoAtendimento.findIndex((item) =>
          a.descricao.includes(item)
        );
        const posB = ordenacaoAtendimento.findIndex((item) =>
          b.descricao.includes(item)
        );

        // Se ambos forem encontrados, ordenar pela posição
        if (posA !== -1 && posB !== -1) {
          return posA - posB;
        }

        // Se apenas um for encontrado, colocá-lo primeiro
        if (posA !== -1) return -1;
        if (posB !== -1) return 1;

        // Se nenhum for encontrado, manter a ordem original
        return 0;
      });

      setAtendimentoOptions(atendimentosOrdenados);

      // Ordenar as opções de escolaridade na ordem específica
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
      const escolaridadesOrdenadas = [...escolaridadesUpperCase].sort(
        (a, b) => {
          // Encontrar a posição de cada item no array de ordenação
          const posA = ordenacaoEscolaridade.findIndex((item) =>
            a.descricao.includes(item)
          );
          const posB = ordenacaoEscolaridade.findIndex((item) =>
            b.descricao.includes(item)
          );

          // Se ambos forem encontrados, ordenar pela posição
          if (posA !== -1 && posB !== -1) {
            return posA - posB;
          }

          // Se apenas um for encontrado, colocá-lo primeiro
          if (posA !== -1) return -1;
          if (posB !== -1) return 1;

          // Se nenhum for encontrado, manter a ordem original
          return 0;
        }
      );

      setEscolaridadeOptions(escolaridadesOrdenadas);

      // Ordenar as opções de tipo de encerramento na ordem específica
      const ordenacaoEncerramento = [
        "Atendido e liberado",
        "Internação",
        "Observação",
        "Transferido",
        "Óbito",
      ].map((item) => normalizeText(item));

      const encerramentosUpperCase = convertOptionsToUpperCase(encerramentos);
      const encerramentosOrdenados = [...encerramentosUpperCase].sort(
        (a, b) => {
          // Função para encontrar a posição no array de ordenação
          const getPosition = (option: EncerramentoOption) => {
            // Verificar correspondência exata primeiro
            const exactIndex = ordenacaoEncerramento.findIndex(
              (item) => option.descricao === item
            );
            if (exactIndex !== -1) return exactIndex;

            // Se não houver correspondência exata, procurar por correspondência parcial
            return ordenacaoEncerramento.findIndex((item) =>
              option.descricao.includes(item)
            );
          };

          const posA = getPosition(a);
          const posB = getPosition(b);

          // Se ambos forem encontrados, ordenar pela posição
          if (posA !== -1 && posB !== -1) {
            return posA - posB;
          }

          // Se apenas um for encontrado, colocá-lo primeiro
          if (posA !== -1) return -1;
          if (posB !== -1) return 1;

          // Se nenhum for encontrado, manter a ordem original
          return 0;
        }
      );

      setEncerramentoOptions(encerramentosOrdenados);

      setPaisOptions(convertOptionsToUpperCase(paises));
      setEstadoOptions(convertOptionsToUpperCase(estados));
      setMunicipioOptions(convertOptionsToUpperCase(municipios));
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

        // Converter todos os pacientes para caixa alta conforme padrão do app
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

  // Função para carregar municipios com base no estado selecionado
  const loadMunicipiosByEstado = useCallback(
    async (estadoId: string) => {
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

        const municipios =
          await NotificacaoService.getMunicipioOptions(estadoIdNumber);

        // Verificar se o estado ainda é o mesmo após a conclusão da requisição
        // Isso evita que requisições concluídas fora de ordem atualizem o estado incorretamente
        if (latestUfRef.current === estadoId) {
          if (municipios.length === 0) {
            console.warn(`Nenhum município encontrado para a UF ${estadoId}`);
          }

          setMunicipioOptions(municipios);

          // Se tiver um município selecionado que não pertence a esse estado, limpe a seleção
          if (formData.municipio) {
            const municipioExiste = municipios.some(
              (m) => m.idtipo_municipio.toString() === formData.municipio
            );

            if (!municipioExiste) {
              setFormData((prev) => ({ ...prev, municipio: "" }));
            }
          }
        }
      } catch (error) {
        console.error(
          `Erro ao carregar municípios para UF ${estadoId}:`,
          error
        );
        setUfError(
          `Falha ao carregar municípios: ${error instanceof Error ? error.message : String(error)}`
        );
        toast.error("Erro ao carregar lista de municípios");
      } finally {
        // Só atualize o estado de carregamento se esta for a última requisição
        if (latestUfRef.current === estadoId) {
          setIsLoadingMunicipios(false);
        }
      }
    },
    [setFormData]
  );

  const loadNotificacao = async (notificacaoId: string) => {
    setIsLoading(true);
    try {
      // Buscar dados da notificação
      const response = await NotificacaoService.getById(Number(notificacaoId));

      // Converter todos os textos para caixa alta
      const responseUpperCase = toUpperCaseAllStrings(response);

      // Usar o adapter para formatar os dados
      const formattedData = responseUpperCase;

      console.log("Dados da notificação carregados:", formattedData);

      if (formattedData) {
        // Normalizar dados para garantir consistência
        const dadosNormalizados = normalizarDadosResidencia(formattedData);
        console.log("Dados normalizados:", dadosNormalizados);

        // Verificar especificamente os sintomas
        console.log("Sintomas carregados:", dadosNormalizados.sinaisESintomas);

        // Armazenar o CPF original para comparações
        setOriginalCpf(dadosNormalizados.cpf || "");

        // Atualizar o formulário com os dados normalizados
        setFormData(dadosNormalizados);
        setFormData(dadosNormalizados);

        // Carregar municípios se tivermos um estado selecionado
        if (dadosNormalizados.uf) {
          loadMunicipiosByEstado(dadosNormalizados.uf);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar notificação:", error);
      toast.error("Erro ao carregar dados da notificação");
      return () => {
        navigate("/lista-comunicacao");
      }; // Voltar se ocorrer erro
    } finally {
      setIsLoading(false);
    }
  };

  // Hook para carregar dados iniciais
  useEffect(() => {
    loadAllOptions();

    // Carregar dados da notificação se estiver em modo de edição
    if (isEditMode && id) {
      loadNotificacao(id);
    }
  }, [isEditMode, id]);

  // Desativar a tradução automática para todo o formulário
  useEffect(() => {
    // Desativar tradução automática para todo o formulário
    const formElement = document.getElementById("notification-form");
    if (formElement) {
      formElement.setAttribute("translate", "no");

      // Adicionalmente, adicionar classes específicas para navegadores
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

  // Hook para atualizar municípios quando o estado muda
  useEffect(() => {
    if (formData.uf) {
      loadMunicipiosByEstado(formData.uf);
    } else {
      // Limpar municípios quando nenhum estado estiver selecionado
      setMunicipioOptions([]);
    }
  }, [formData.uf, loadMunicipiosByEstado]);

  // Funções de formatação para inputs
  const formatCPF = (cpf: string) => {
    // Remove caracteres não numéricos e limita a 11 dígitos
    return cpf.replace(/\D/g, "").slice(0, 11);
  };

  // Nova função para exibir CPF formatado
  const displayFormattedCPF = (cpf: string) => {
    // Remove caracteres não numéricos e limita a 11 dígitos
    const cleanCPF = cpf.replace(/\D/g, "").slice(0, 11);

    // Se o CPF não tiver 11 dígitos, retorna ele apenas limpo
    if (cleanCPF.length !== 11) return cleanCPF;

    // Formata como XXX.XXX.XXX-XX
    return `${cleanCPF.substring(0, 3)}.${cleanCPF.substring(3, 6)}.${cleanCPF.substring(6, 9)}-${cleanCPF.substring(9)}`;
  };

  // Modificar ou remover a função de formatação para manter o formato original
  const formatContato = (contato: string) => {
    // Removendo apenas a limitação de caracteres, mantendo a formatação original
    // E apenas limitando o tamanho máximo para 15 caracteres
    return contato.slice(0, 15);
  };

  // ADICIONE AQUI: Função específica para contatoLocal
  const formatContatoLocal = (contato: string) => {
    // Remove caracteres não numéricos e limita a 11 dígitos
    return contato.replace(/\D/g, "").slice(0, 11);
  };

  // Handler específico para CPF
  const handleCPFChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Remove formatação para armazenar apenas os dígitos no estado
    const formattedCPF = formatCPF(rawValue);

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

  // ADICIONE AQUI: Handler específico para contatoLocal
  const handleContatoLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatContatoLocal(rawValue);

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

  const handleSelectPaciente = (paciente: Paciente) => {
    // Converter todos os campos de texto para caixa alta
    const pacienteUpperCase = toUpperCaseAllStrings(paciente);

    // Armazenar o paciente completo para uso posterior
    setSelectedPaciente(pacienteUpperCase);

    // Armazenar o CPF original para comparações
    setOriginalCpf(pacienteUpperCase.cpf || "");

    // Formatar a data corretamente
    let formattedDate = "";
    if (pacienteUpperCase.data_nascimento) {
      const date = new Date(pacienteUpperCase.data_nascimento);
      formattedDate = date.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    }
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
      // AQUI ESTÁ A MUDANÇA: Mapear especificamente o valor 7 para 8
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
      contatoTelefonico: pacienteUpperCase.contato || "",
    }));

    // Limpar erros ao selecionar um paciente
    setErrors({});
  };

  // Função auxiliar para calcular idade
  const calculateAge = (birthdate: string): number => {
    if (!birthdate) return 0;

    const birthDate = new Date(birthdate);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Adiciona função para comparar datas
  const compareDates = (date1: string, date2: string): boolean => {
    if (!date1 || !date2) return true; // Se alguma data estiver faltando, a validação passa

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Verificar se ambas as datas são válidas
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return true;

    // Retorna true se date1 for igual ou depois de date2 (caso válido)
    return d1 >= d2;
  };

  // Função para alternar a expansão de uma seção
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Componente para o cabeçalho da seção
  const SectionHeader = ({
    icon,
    title,
    isExpanded,
    onToggle,
  }: {
    icon: React.ReactNode;
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {isExpanded ? (
        <ChevronUp className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-500" />
      )}
    </button>
  );

  // Modificar o handleChange para garantir que todos os textos estão em caixa alta e validar datas
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
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

    // Converter todos os campos de texto para caixa alta
    if (typeof newValue === "string") {
      newValue = normalizeText(newValue); // remove acentos, cedilhas e converte para caixa alta
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
      newValue = formatContato(value);
    }

    // Criar formulário temporário atualizado para verificar validação de datas
    const updatedFormData = { ...formData, [name]: newValue };

    // Validar relações entre datas se estivermos alterando a data de atendimento
    if (name === "dataAtendimento" && formData.dataInicioSintomas && newValue) {
      if (!compareDates(newValue, formData.dataInicioSintomas)) {
        setErrors((prev) => ({
          ...prev,
          dataAtendimento:
            "A data de atendimento não pode ser anterior à data de início dos sintomas",
        }));
      }
    }

    // Validar dataInicioSintomas em relação a dataAtendimento
    if (name === "dataInicioSintomas" && formData.dataAtendimento && newValue) {
      if (!compareDates(formData.dataAtendimento, newValue)) {
        setErrors((prev) => ({
          ...prev,
          dataInicioSintomas:
            "A data de início dos sintomas não pode ser posterior à data de atendimento",
        }));
      }
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  // Handler para clicar fora do dropdown de profissão
  useEffect(() => {
    const handleClickOutside = () => {
      if (formData.showProfissaoOptions) {
        setFormData((prev) => ({ ...prev, showProfissaoOptions: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [formData.showProfissaoOptions]);

  useEffect(() => {
    if (formData.tipoAtendimento) {
      // Cria uma cópia dos dados atuais do formulário
      const updatedData = { ...formData };

      // Caso clínico, surto ou incidente QBRN - limpa campos de trauma
      if (
        isTipoAtendimento("CLINICO") ||
        isTipoAtendimento("SURTO") ||
        isTipoAtendimento("INCIDENTE QBRN")
      ) {
        updatedData.tipoTrauma = [];
        updatedData.observacaoTrauma = "";
      }
      // Trauma ou múltiplas vítimas - limpa campos clínicos
      else if (
        isTipoAtendimento("TRAUMA") ||
        isTipoAtendimento("MULTIPLAS VITIMAS")
      ) {
        updatedData.sinaisESintomas = [];
        updatedData.dataInicioSintomas = "";
        updatedData.observacaoSintomas = "";
      }

      setFormData(updatedData);
    }
  }, [formData.tipoAtendimento]);

  // Adicionar este useEffect para limpar campos quando muda opção de residente
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

  // Validar campos da seção de identificação do indivíduo
  const validateIdentificacao = () => {
    const newErrors: Record<string, string> = {};

    // Validar nome do paciente
    if (!formData.paciente.trim()) {
      newErrors.paciente = "O campo nome é obrigatório";
    } else if (formData.paciente.length > 100) {
      newErrors.paciente = "O campo nome deve ter no máximo 100 caracteres";
    }

    // Validar nome da mãe (opcional)
    if (formData.nomeMae && formData.nomeMae.length > 100) {
      newErrors.nomeMae =
        "O campo nome da mãe deve ter no máximo 100 caracteres";
    }

    // Validar data de nascimento
    if (!formData.dataNascimento) {
      newErrors.dataNascimento = "O campo data de nascimento é obrigatório";
    } else {
      const date = new Date(formData.dataNascimento);
      if (isNaN(date.getTime())) {
        newErrors.dataNascimento = "Data de nascimento inválida";
      }
    }

    // Validar CPF (opcional)
    if (formData.cpf && formData.cpf.length > 0 && formData.cpf.length !== 11) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }

    // Validar identidade de gênero
    if (!formData.identidadeGenero) {
      newErrors.identidadeGenero = "O campo identidade de gênero é obrigatório";
    }

    // Validar gestante para gênero feminino
    if (formData.identidadeGenero === "1") {
      // Supondo que "1" é o código para feminino
      const idade = calculateAge(formData.dataNascimento);
      if (idade >= 10 && !formData.gestante) {
        newErrors.gestante = "Informe se a paciente está gestante";
      }
    }

    // Validar raça
    if (!formData.raca) {
      newErrors.raca = "O campo raça é obrigatório";
    }

    // Validar contato telefônico (opcional)
    if (formData.contatoTelefonico && formData.contatoTelefonico.length > 15) {
      newErrors.contatoTelefonico =
        "O contato deve ter no máximo 15 caracteres";
    }

    // Atualizar o estado com os erros encontrados
    setErrors((prev) => ({ ...prev, ...newErrors }));

    // Verificar se há algum erro
    return Object.keys(newErrors).length === 0;
  };

  const handlePacienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    // Normalizar para caixa alta como o restante da aplicação
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

  // Validar formulário antes de enviar
  const validateForm = (): boolean => {
    // Verificar se tem ID do paciente
    if (!formData.pacienteId) {
      const newErrors: Record<string, string> = {
        paciente: "É necessário selecionar ou criar um paciente válido com ID",
      };
      setErrors((prev) => ({ ...prev, ...newErrors }));
      setExpandedSections((prev) => ({ ...prev, identificacao: true }));
      return false;
    }

    // Verificar relações entre datas se ambas estiverem presentes
    if (formData.dataAtendimento && formData.dataInicioSintomas) {
      if (
        !compareDates(formData.dataAtendimento, formData.dataInicioSintomas)
      ) {
        const newErrors: Record<string, string> = {
          dataAtendimento:
            "A data de atendimento não pode ser anterior à data de início dos sintomas",
        };
        setErrors((prev) => ({ ...prev, ...newErrors }));
        setExpandedSections((prev) => ({ ...prev, unidadeNotificadora: true }));
        return false;
      }
    }

    // Verificar campos obrigatórios
    const requiredFields: Array<{
      field: keyof FormData;
      label: string;
      message?: string;
    }> = [
      { field: "evento", label: "Evento" },
      { field: "publicoAtendido", label: "Público Atendido" },
      { field: "residenteBelem", label: "Residente em Belém" },
      { field: "paciente", label: "Paciente" },
      { field: "paisProcedencia", label: "País de procedência" },
      { field: "tipoAtendimento", label: "Tipo de Atendimento" },
      { field: "dataOcorrencia", label: "Data da Ocorrência" },
      { field: "tipoEncerramento", label: "Tipo de Encerramento" },
      { field: "unidadeNotificadora", label: "Unidade Notificadora" },
    ];

    const newErrors: Record<string, string> = {};
    const missingFields = requiredFields.filter(
      (item) => !formData[item.field]
    );

    // Adicionar mensagens de erro para cada campo faltante
    missingFields.forEach((item) => {
      newErrors[item.field] =
        item.message || `O campo ${item.label} é obrigatório`;
    });

    // Adicionar validações específicas para outros campos
    if (isTipoAtendimento("clínico") && formData.sinaisESintomas.length === 0) {
      newErrors.sinaisESintomas = "Selecione pelo menos um sinal ou sintoma";
    }

    if (isTipoAtendimento("trauma") && formData.tipoTrauma.length === 0) {
      newErrors.tipoTrauma = "Selecione pelo menos um tipo de trauma";
    }

    // Validar se unidadeNotificadora é um número válido
    if (
      formData.unidadeNotificadora &&
      !/^\d+$/.test(formData.unidadeNotificadora)
    ) {
      newErrors.unidadeNotificadora =
        "Selecione uma unidade notificadora válida";
    }

    // Atualizar o estado com os erros encontrados
    setErrors(newErrors);

    // Se houver erros, expandir as seções relevantes e fazer scroll
    if (Object.keys(newErrors).length > 0) {
      // Expandir seções com erros
      const newExpandedSections = { ...expandedSections };

      if (newErrors.evento || newErrors.publicoAtendido) {
        newExpandedSections.dadosGerais = true;
      }

      if (
        newErrors.residenteBelem ||
        newErrors.bairro ||
        newErrors.municipio ||
        newErrors.uf ||
        newErrors.paisProcedencia
      ) {
        newExpandedSections.procedencia = true;
      }

      if (
        newErrors.paciente ||
        newErrors.dataNascimento ||
        newErrors.identidadeGenero ||
        newErrors.raca
      ) {
        newExpandedSections.identificacao = true;
      }

      if (
        newErrors.tipoAtendimento ||
        newErrors.sinaisESintomas ||
        newErrors.tipoTrauma ||
        newErrors.dataOcorrencia ||
        newErrors.dataInicioSintomas
      ) {
        newExpandedSections.atendimento = true;
      }

      if (
        newErrors.tipoEncerramento ||
        newErrors.unidadeNotificadora ||
        newErrors.dataAtendimento
      ) {
        newExpandedSections.encerramento = true;
        newExpandedSections.unidadeNotificadora = true;
      }

      setExpandedSections(newExpandedSections);

      // Depois de expandir as seções, scroll para o primeiro erro
      setTimeout(() => {
        const firstErrorField = document.querySelector('[data-error="true"]');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Adicionalmente, podemos focar no campo com erro
          if (
            firstErrorField instanceof HTMLInputElement ||
            firstErrorField instanceof HTMLSelectElement ||
            firstErrorField instanceof HTMLTextAreaElement
          ) {
            firstErrorField.focus();
          }
        }
      }, 100);

      // Exibir toast com resumo
      if (missingFields.length > 0) {
        const missingLabels = missingFields
          .map((item) => item.label)
          .join(", ");
        toast.error(`Preencha os campos obrigatórios: ${missingLabels}`);
      } else {
        toast.error("Corrija os erros no formulário para continuar");
      }

      return false;
    }

    return true;
  };

  // Handlers para ações do formulário
  // Modificar a função handleSubmit para garantir que todos os dados enviados estejam em caixa alta
  // No arquivo NotificationForm.tsx, procure o método handleSubmit e substitua por este:

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("BOTÃO SALVAR CLICADO");
    e.preventDefault();
    console.log("Form prevent default executado");

    // Limpar estados de feedback
    setApiError(null);
    setIsSuccess(false);

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

        console.log(
          "Paciente criado automaticamente com ID:",
          response.data.idpaciente
        );
      } catch (error: any) {
        console.error("Erro ao criar paciente automaticamente:", error);

        // Mostrar mensagem de erro mais específica
        let errorMessage =
          "Erro ao criar o paciente. Verifique os dados e tente novamente.";

        // Se o erro contém informações da API, mostrar essas informações
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        setApiError(errorMessage);

        // Destacar campos específicos com erro, se a API retornar essa informação
        if (
          error.response &&
          error.response.data &&
          error.response.data.errors
        ) {
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
            mappedErrors[fieldName] = Array.isArray(value)
              ? value[0]
              : String(value);
          });

          setErrors((prev) => ({ ...prev, ...mappedErrors }));

          // Expandir a seção de identificação do paciente
          setExpandedSections((prev) => ({ ...prev, identificacao: true }));

          // Rolar até o primeiro erro
          setTimeout(() => {
            const firstErrorField = document.querySelector(
              '[data-error="true"]'
            );
            if (firstErrorField) {
              firstErrorField.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 100);
        }

        setIsSaving(false);
        return; // Impedir envio do formulário
      }
    }
    // ADICIONAR AQUI: Se já tem ID de paciente, atualizar dados do paciente
    else if (formData.pacienteId) {
      try {
        // Atualizar os dados do paciente antes de salvar a notificação
        const pacienteData = {
          nome: formData.paciente,
          nome_mae: formData.nomeMae || "",
          data_nascimento: formData.dataNascimento || undefined,
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
        };

        // Usar o serviço para atualizar o paciente
        await PacienteService.update(formData.pacienteId, pacienteData);
        console.log("Dados do paciente atualizados com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar dados do paciente:", error);
        toast.warning(
          "Aviso: Os dados do paciente não puderam ser atualizados, mas tentaremos salvar a notificação."
        );
        // Não impedir o envio da notificação se a atualização do paciente falhar
      }
    }

    const isValid = validateForm();
    console.log("Form validation result:", isValid);
    if (!isValid) return;

    setIsSaving(true);
    try {
      // Converter todos os dados para caixa alta antes de enviar
      const formDataUpperCase = toUpperCaseAllStrings(formData);

      console.log(
        "Dados do formulário:",
        JSON.stringify(formDataUpperCase, null, 2)
      );
      console.log("Sintomas selecionados:", formDataUpperCase.sinaisESintomas);

      // Usar a função importada salvarNotificacaoCompleta
      if (isEditMode && id) {
        // Para atualização
        await salvarNotificacaoCompleta(formDataUpperCase, true, Number(id));
        console.log("Notificação atualizada com sucesso");
        setIsSuccess(true); // Definir estado de sucesso
        toast.success("Notificação atualizada com sucesso");
      } else {
        // Para criação
        await salvarNotificacaoCompleta(formDataUpperCase, false);
        console.log("Notificação criada com sucesso");
        setIsSuccess(true); // Definir estado de sucesso
        toast.success("Notificação criada com sucesso");
      }

      // Redirecionar para página de listagem ou detalhes após um breve delay para mostrar a mensagem de sucesso
      setTimeout(() => {
        navigate("/lista-comunicacao");
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
            validationErrors[fieldName] = Array.isArray(value)
              ? value[0]
              : String(value);
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

        // Expandir seções relevantes com base nos erros
        const sectionsToExpand: Record<string, boolean> = {};

        // Lógica para determinar quais seções expandir
        Object.keys(validationErrors).forEach((field) => {
          if (["evento", "publicoAtendido"].includes(field)) {
            sectionsToExpand.dadosGerais = true;
          } else if (
            [
              "residenteBelem",
              "paisProcedencia",
              "uf",
              "municipio",
              "bairro",
            ].includes(field)
          ) {
            sectionsToExpand.procedencia = true;
          } else if (
            [
              "paciente",
              "nomeMae",
              "dataNascimento",
              "cpf",
              "identidadeGenero",
              "raca",
            ].includes(field)
          ) {
            sectionsToExpand.identificacao = true;
          } else if (
            [
              "tipoAtendimento",
              "sinaisESintomas",
              "tipoTrauma",
              "dataOcorrencia",
            ].includes(field)
          ) {
            sectionsToExpand.atendimento = true;
          } else if (["tipoEncerramento", "dataEncerramento"].includes(field)) {
            sectionsToExpand.encerramento = true;
          }
        });

        // Expandir as seções determinadas
        setExpandedSections((prev) => ({ ...prev, ...sectionsToExpand }));

        // Rolar até o primeiro campo com erro
        setTimeout(() => {
          const firstErrorField = document.querySelector('[data-error="true"]');
          if (firstErrorField) {
            firstErrorField.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Função para limpar o formulário
  const handleClearForm = () => {
    if (
      window.confirm(
        "Tem certeza que deseja limpar todos os campos do formulário?"
      )
    ) {
      setFormData(initialFormData);
      setErrors({});
      toast.info("Formulário limpo com sucesso");
    }
  };

  // Prepare export options object with all loaded dropdown options
  const getExportOptions = () => {
    return {
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
  };

  // Update the handleExport function to use the export utilities with options
  const handleExport = async (format: string) => {
    try {
      // Get all the dynamic options
      const exportOptions = getExportOptions();

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
      toast.error(
        `Falha ao exportar para ${format}. Por favor, tente novamente.`
      );
    }

    setIsExportDropdownOpen(false);
  };

  const toggleExportDropdown = () => {
    setIsExportDropdownOpen(!isExportDropdownOpen);
  };

  // Função auxiliar para verificar o tipo de atendimento pelo texto
  const isTipoAtendimento = (tipo: string) => {
    // Se não há tipo selecionado, retorna falso
    if (!formData.tipoAtendimento) return false;

    // Encontra a opção selecionada
    const selectedOption = atendimentoOptions.find(
      (option) =>
        option.idtipo_atendimento.toString() ===
        formData.tipoAtendimento.toString()
    );

    if (!selectedOption) return false;

    // Normalizar ambos os textos antes de comparar
    const normalizedDescription = selectedOption.descricao;
    const normalizedTipo = normalizeText(tipo);

    // Verificar se a descrição contém o texto procurado
    return normalizedDescription.includes(normalizedTipo);
  };

  // Função auxiliar para verificar o tipo de encerramento pelo texto
  const isTipoEncerramento = (tipo: string) => {
    // Se não há tipo selecionado, retorna falso
    if (!formData.tipoEncerramento) return false;

    // Encontra a opção selecionada
    const selectedOption = encerramentoOptions.find(
      (option) =>
        option.idtipo_encerramento.toString() ===
        formData.tipoEncerramento.toString()
    );

    if (!selectedOption) return false;

    // Normalizar ambos os textos antes de comparar
    const normalizedDescription = selectedOption.descricao;
    const normalizedTipo = normalizeText(tipo);

    // Verificar se a descrição contém o texto procurado
    return normalizedDescription.includes(normalizedTipo);
  };

  // Estado para controlar a visibilidade do popover de ajuda de identidade de gênero
  const [showGenderHelp, setShowGenderHelp] = useState<boolean>(false);

  // Tela de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-white">
            <button
              onClick={() => navigate("/lista-comunicacao")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <ClipboardList className="h-8 w-8" />
            <h1 className="text-2xl font-semibold">
              {isEditMode
                ? "Editar Dados da Ficha de Comunicação"
                : "Nova Comunicação"}
            </h1>
          </div>

          <div className="relative flex items-center gap-3">
            {/* Botão Exportar com Dropdown */}
            <div className="relative">
              <button
                onClick={toggleExportDropdown}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>

              {/* Dropdown de Exportação - Apenas PDF e PNG */}
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => handleExport("PDF")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <Files className="h-4 w-4" /> PDF
                    </button>
                    <button
                      onClick={() => handleExport("PNG")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <FileChartColumnIncreasing className="h-4 w-4" /> PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-white/20 mx-2" /> {/* Separador */}
            {/* Botões de Ação (CABEÇALHO) */}
            <button
              type="submit"
              form="notification-form"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <ArchiveX className="h-4 w-4" />
              Limpar
            </button>
            <button
              type="button"
              onClick={() => navigate("/lista-comunicacao")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        {isLoading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-700">
                Carregando dados da notificação...
              </p>
            </div>
          </div>
        )}
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2 text-red-600">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Erro</p>
                <p className="text-sm">{apiError}</p>
              </div>
            </div>
          </div>
        )}
        {isSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <p>
                {isEditMode
                  ? "Notificação atualizada com sucesso!"
                  : "Notificação cadastrada com sucesso!"}
              </p>
            </div>
          </div>
        )}
        <form
          id="notification-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-700 font-medium mb-2">
                Corrija os seguintes erros para continuar:
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field} className="text-red-600 text-sm">
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Seção 1: Dados Gerais */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<FileOutput className="h-5 w-5 text-blue-500" />}
              title="1. Dados Gerais"
              isExpanded={expandedSections.dadosGerais}
              onToggle={() => toggleSection("dadosGerais")}
            />
            {expandedSections.dadosGerais && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Evento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Evento <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="evento"
                      className={`w-full p-3 border ${
                        errors.evento
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.evento}
                      onChange={handleChange}
                      data-error={errors.evento ? "true" : "false"}
                    >
                      <option value="">Selecione</option>
                      {eventoOptions.map((option) => (
                        <option
                          key={option.idtipo_evento}
                          value={option.idtipo_evento}
                        >
                          {option.descricao}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Público Atendido */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Público Atendido <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="publicoAtendido"
                      className={`w-full p-3 border ${
                        errors.publicoAtendido
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.publicoAtendido}
                      onChange={handleChange}
                      data-error={errors.publicoAtendido ? "true" : "false"}
                    >
                      <option value="">Selecione</option>
                      {publicoOptions.map((option) => (
                        <option
                          key={option.idtipo_publico}
                          value={option.idtipo_publico}
                        >
                          {option.descricao}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 2: Procedência do indivíduo */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<Globe className="h-5 w-5 text-green-500" />}
              title="2. Procedência do indivíduo"
              isExpanded={expandedSections.procedencia}
              onToggle={() => toggleSection("procedencia")}
            />
            {expandedSections.procedencia && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Residente em Belém? */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Residente em Belém?{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="residenteBelem"
                      className={`w-full p-3 border ${
                        errors.residenteBelem
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.residenteBelem}
                      onChange={handleChange}
                      data-error={errors.residenteBelem ? "true" : "false"}
                      translate="no"
                    >
                      <option value="" translate="no">
                        Selecione
                      </option>
                      <option value="1" translate="no">
                        SIM
                      </option>
                      <option value="2" translate="no">
                        NÃO
                      </option>
                      <option value="3" translate="no">
                        ESTRANGEIRO
                      </option>
                    </select>
                  </div>

                  {/* Campos condicionais baseados na residência */}
                  {formData.residenteBelem === "1" && (
                    <div>
                      <BairroInput
                        label="Bairro"
                        value={formData.bairro}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            bairro: value,
                            tipo_bairro_idtipo_bairro: value, // Adicionar esta linha
                          }));
                        }}
                        placeholder="Selecione o bairro"
                        disabled={false}
                      />
                      {errors.bairro && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.bairro}
                        </p>
                      )}
                    </div>
                  )}

                  {formData.residenteBelem === "2" && (
                    <>
                      <div>
                        {/* UF - use os nomes de campos que correspondem à sua estrutura de banco de dados */}
                        <LocationInput
                          name="uf"
                          label="UF"
                          value={formData.uf}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              uf: value,
                              municipio: "",
                            }));
                          }}
                          placeholder="Selecione a UF"
                          disabled={false}
                          apiEndpoint="api/tipo-estado"
                          idField="idtipo_estado"
                          debug={true} // Habilitar logs para depuração
                        />
                      </div>
                      <div>
                        <LocationInput
                          name="municipio"
                          label="Município"
                          value={formData.municipio}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              municipio: value,
                            }));
                          }}
                          placeholder={
                            isLoadingMunicipios
                              ? "Carregando municípios..."
                              : "Selecione o município"
                          }
                          disabled={!formData.uf || isLoadingMunicipios}
                          apiEndpoint="api/tipo-municipio"
                          idField="idtipo_municipio"
                          parentValue={formData.uf}
                          debug={true}
                        />
                        {ufError && (
                          <p className="mt-1 text-sm text-red-500">{ufError}</p>
                        )}
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Local de Hospedagem
                        </label>
                        <input
                          type="text"
                          name="localHospedagem"
                          placeholder="Informe o nome do local de hospedagem"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.localHospedagem}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Contato do Local da Hospedagem
                        </label>
                        <input
                          type="text"
                          name="contatoLocal"
                          placeholder="Apenas números (máx 11 dígitos)"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.contatoLocal}
                          onChange={handleContatoLocalChange}
                          inputMode="numeric" // Shows numeric keyboard on mobile devices
                        />
                        {errors.contatoLocal && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.contatoLocal}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {formData.residenteBelem === "3" && (
                    <>
                      <div>
                        <LocationInput
                          name="paisProcedencia"
                          label="País de Procedência"
                          value={formData.paisProcedencia}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              paisProcedencia: value,
                            }));
                          }}
                          placeholder="Selecione o país"
                          disabled={false}
                          apiEndpoint="api/tipo-pais"
                          idField="idtipo_pais"
                          debug={true}
                          required={true} // Marcado como obrigatório
                          error={errors.paisProcedencia} // Passar erro específico
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Local de Hospedagem
                        </label>
                        <input
                          type="text"
                          name="localHospedagem"
                          placeholder="Informe o nome do local de hospedagem"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.localHospedagem}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Contato do Local da Hospedagem
                        </label>
                        <input
                          type="text"
                          name="contatoLocal"
                          placeholder="DDD XXXXX-XXXX"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.contatoLocal}
                          onChange={handleContatoLocalChange}
                          inputMode="numeric" // Shows numeric keyboard on mobile devices
                        />
                        {errors.contatoLocal && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.contatoLocal}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Seção 3: Identificação do indivíduo */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<User className="h-5 w-5 text-purple-500" />}
              title="3. Identificação do indivíduo"
              isExpanded={expandedSections.identificacao}
              onToggle={() => toggleSection("identificacao")}
            />
            {expandedSections.identificacao && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome do Paciente */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <div className="relative paciente-suggestions-area">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="paciente"
                          placeholder="Nome do paciente"
                          className={`flex-1 p-3 border ${
                            errors.paciente
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200"
                          } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                          value={formData.paciente}
                          onChange={handlePacienteChange}
                          maxLength={100}
                          data-error={errors.paciente ? "true" : "false"}
                        />
                        <button
                          type="button"
                          onClick={() => setIsPatientModalOpen(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Search className="h-4 w-4" />
                          <span>Pesquisar</span>
                        </button>
                      </div>

                      {/* Mostrar sugestões */}
                      {showSuggestions && pacienteSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {pacienteSuggestions.map((paciente) => (
                            <button
                              key={paciente.idpaciente}
                              type="button"
                              className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm text-gray-700 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                handleSelectPaciente(paciente);
                                setShowSuggestions(false);
                              }}
                            >
                              <div className="font-medium">{paciente.nome}</div>
                              <div className="text-xs text-gray-500">
                                {paciente.data_nascimento
                                  ? `Nascimento: ${new Date(paciente.data_nascimento).toLocaleDateString()}`
                                  : ""}
                                {paciente.cpf ? ` | CPF: ${paciente.cpf}` : ""}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Mensagem quando não há resultados */}
                      {showSuggestions &&
                        formData.paciente.length >= 3 &&
                        pacienteSuggestions.length === 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
                            <p className="text-sm text-gray-600">
                              Nenhum paciente encontrado.
                            </p>
                            <button
                              type="button"
                              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                              onClick={criarNovoPaciente}
                              disabled={isCreatingNewPatient}
                            >
                              {isCreatingNewPatient
                                ? "Criando..."
                                : "Criar novo paciente"}
                            </button>
                          </div>
                        )}
                    </div>
                    {errors.paciente && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.paciente}
                      </p>
                    )}

                    {/* Mostra o ID do paciente quando for selecionado */}
                    {formData.pacienteId && (
                      <p className="mt-1 text-xs text-blue-500">
                        ID do paciente: {formData.pacienteId}
                      </p>
                    )}
                  </div>

                  {/* Nome da Mãe */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Nome da Mãe
                    </label>
                    <input
                      type="text"
                      name="nomeMae"
                      placeholder="Nome da mãe do paciente"
                      className={`w-full p-3 border ${
                        errors.nomeMae
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.nomeMae}
                      onChange={handleChange}
                      maxLength={100}
                      data-error={errors.nomeMae ? "true" : "false"}
                    />
                    {errors.nomeMae && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.nomeMae}
                      </p>
                    )}
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Data de Nascimento <span className="text-red-500">*</span>
                    </label>
                    <CustomDateInput
                      name="dataNascimento"
                      className={`w-full p-3 border ${
                        errors.dataNascimento
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.dataNascimento}
                      onChange={handleChange}
                      data-error={errors.dataNascimento ? "true" : "false"}
                    />
                    {errors.dataNascimento && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.dataNascimento}
                      </p>
                    )}
                  </div>

                  {/* Idade */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Idade
                    </label>
                    <input
                      type="number"
                      name="idade"
                      placeholder={
                        formData.dataNascimento
                          ? "Calculada automaticamente"
                          : "Digite a idade"
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                      value={formData.idade}
                      onChange={(e) => {
                        // Obter o valor digitado
                        const value = e.target.value;

                        // Verificar se é um número válido e não maior que 120
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue > 120) {
                          // Se for maior que 120, mostrar erro
                          setErrors((prev) => ({
                            ...prev,
                            idade: "A idade não pode ser maior que 120 anos",
                          }));
                          return;
                        }

                        // Limitar a 3 caracteres e processar normalmente
                        if (value.length <= 3) {
                          handleChange({
                            target: {
                              name: "idade",
                              value: value,
                            },
                          } as React.ChangeEvent<HTMLInputElement>);

                          // Limpar erro se existir
                          if (errors.idade) {
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.idade;
                              return newErrors;
                            });
                          }
                        }
                      }}
                      disabled={!!formData.dataNascimento}
                      maxLength={3}
                      min="0"
                      max="120"
                    />
                    {formData.dataNascimento && (
                      <p className="mt-1 text-xs text-gray-500">
                        Idade calculada a partir da data de nascimento
                      </p>
                    )}
                    {errors.idade && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.idade}
                      </p>
                    )}
                  </div>

                  {/* CPF */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      CPF
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      placeholder="000.000.000-00"
                      className={`w-full p-3 border ${
                        errors.cpf
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={
                        formData.cpf ? displayFormattedCPF(formData.cpf) : ""
                      }
                      onChange={handleCPFChange}
                      maxLength={14} // Aumentar para comportar os caracteres de formatação
                      data-error={errors.cpf ? "true" : "false"}
                    />
                    {errors.cpf && (
                      <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>
                    )}
                  </div>

                  {/* Identidade de Gênero */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="font-medium text-gray-700">
                        Identidade de Gênero{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowGenderHelp(!showGenderHelp)}
                        className="text-gray-500 hover:text-blue-600 transition-colors focus:outline-none"
                        aria-label="Ajuda sobre identidade de gênero"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>

                    {showGenderHelp && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-gray-700 relative">
                        <button
                          type="button"
                          onClick={() => setShowGenderHelp(false)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                          aria-label="Fechar ajuda"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <h4 className="font-medium text-blue-700 mb-2">
                          Entendendo Identidade de Gênero:
                        </h4>
                        <ul className="space-y-1.5">
                          <li>
                            <strong>Mulher cisgênero:</strong> Pessoa nascida
                            com sexo feminino que se identifica como mulher.
                          </li>
                          <li>
                            <strong>Homem cisgênero:</strong> Pessoa nascida com
                            sexo masculino que se identifica como homem.
                          </li>
                          <li>
                            <strong>Mulher transgênero:</strong> Pessoa nascida
                            com sexo masculino que se identifica como mulher.
                          </li>
                          <li>
                            <strong>Homem transgênero:</strong> Pessoa nascida
                            com sexo feminino que se identifica como homem.
                          </li>
                          <li>
                            <strong>Travesti:</strong> Pessoa designada como
                            homem ao nascer que se expressa no gênero feminino.
                          </li>
                          <li>
                            <strong>Não binário:</strong> Pessoa cuja identidade
                            não se limita ao binário masculino/feminino.
                          </li>
                          <li>
                            <strong>Não se aplica:</strong> Quando a identidade
                            de gênero não é relevante para o atendimento.
                          </li>
                          <li>
                            <strong>Ignorado:</strong> Quando a informação não
                            está disponível.
                          </li>
                        </ul>
                      </div>
                    )}

                    <select
                      name="identidadeGenero"
                      className={`w-full p-3 border ${
                        errors.identidadeGenero
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.identidadeGenero}
                      onChange={handleChange}
                      data-error={errors.identidadeGenero ? "true" : "false"}
                    >
                      <option value="">Selecione</option>
                      {generoOptions.map((option) => (
                        <option
                          key={option.idtipo_genero}
                          value={option.idtipo_genero}
                        >
                          {option.descricao}
                        </option>
                      ))}
                    </select>
                    {errors.identidadeGenero && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.identidadeGenero}
                      </p>
                    )}
                  </div>

                  {/* Gestante (condicional) */}
                  {formData.identidadeGenero === "1" && (
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        Gestante
                      </label>
                      <select
                        name="gestante"
                        className={`w-full p-3 border ${
                          errors.gestante
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200"
                        } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                        value={formData.gestante}
                        onChange={handleChange}
                        data-error={errors.gestante ? "true" : "false"}
                      >
                        <option value="">Selecione</option>
                        <option value="1">Sim</option>
                        <option value="2">Não</option>
                      </select>
                      {errors.gestante && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.gestante}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Raça */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Raça <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="raca"
                      className={`w-full p-3 border ${
                        errors.raca
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.raca}
                      onChange={handleChange}
                      data-error={errors.raca ? "true" : "false"}
                    >
                      <option value="">Selecione</option>
                      {racaOptions.map((option) => (
                        <option
                          key={option.idtipo_raca}
                          value={option.idtipo_raca}
                        >
                          {option.descricao}
                        </option>
                      ))}
                    </select>
                    {errors.raca && (
                      <p className="mt-1 text-sm text-red-500">{errors.raca}</p>
                    )}
                  </div>

                  {/* Escolaridade */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Escolaridade
                    </label>
                    <select
                      name="escolaridade"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.escolaridade}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {escolaridadeOptions.map((option) => (
                        <option
                          key={option.idtipo_escolaridade}
                          value={option.idtipo_escolaridade}
                        >
                          {option.descricao}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Profissão/Ocupação com pesquisa */}
                  <div>
                    <CboInput
                      name="profissao"
                      value={formData.profissao}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          profissao: value,
                        }))
                      }
                      placeholder="Pesquisar profissão"
                      label="Profissão/Ocupação (CBO)"
                    />
                  </div>

                  {/* Contato Telefônico */}
                  <div>
                    <PhoneInput
                      name="contatoTelefonico"
                      value={formData.contatoTelefonico}
                      ddi={formData.ddi} // Passar o DDI separadamente
                      onChange={(value) => {
                        // Preserve the full phone number including country code
                        const formattedValue = value.slice(0, 20);

                        // Extrair o código do país e o número de telefone
                        let ddi = "55"; // Valor padrão (Brasil)
                        let phoneNumber = formattedValue;

                        // Se o valor tem formato +XX YYYYY, separar o DDI e o número
                        if (
                          formattedValue.startsWith("+") &&
                          formattedValue.includes(" ")
                        ) {
                          const parts = formattedValue.split(" ");
                          ddi = parts[0].replace("+", ""); // Remove o "+" do DDI
                          phoneNumber = parts.slice(1).join(" "); // O resto é o número
                        }

                        setFormData((prev) => ({
                          ...prev,
                          contatoTelefonico: phoneNumber, // Armazena apenas o número, sem o código do país
                          ddi: ddi, // Adicione este campo no seu formData para armazenar o DDI separadamente
                        }));

                        console.log(`DDI: ${ddi}, Número: ${phoneNumber}`); // Debug

                        // Limpar erro se existir
                        if (errors.contatoTelefonico) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.contatoTelefonico;
                            return newErrors;
                          });
                        }
                      }}
                      label="Contato Telefônico"
                      placeholder="Digite o número de telefone"
                    />
                    {errors.contatoTelefonico && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.contatoTelefonico}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 4: Informações do atendimento */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<ListChecks className="h-5 w-5 text-yellow-500" />}
              title="4. Informações do atendimento"
              isExpanded={expandedSections.atendimento}
              onToggle={() => toggleSection("atendimento")}
            />
            {expandedSections.atendimento && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tipo de Atendimento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Tipo de Atendimento{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tipoAtendimento"
                      className={`w-full p-3 border ${
                        errors.tipoAtendimento
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.tipoAtendimento}
                      onChange={handleChange}
                      data-error={errors.tipoAtendimento ? "true" : "false"}
                      translate="no"
                    >
                      <option value="" translate="no">
                        Selecione
                      </option>
                      {atendimentoOptions.map((option) => (
                        <option
                          key={option.idtipo_atendimento}
                          value={option.idtipo_atendimento}
                          translate="no"
                        >
                          {option.descricao}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Renderização condicional dos campos de acordo com o tipo de atendimento */}
                  {(isTipoAtendimento("CLINICO") ||
                    isTipoAtendimento("SURTO") ||
                    isTipoAtendimento("INCIDENTE QBRN")) && (
                    <>
                      {/* Sinais e Sintomas com campo de pesquisa */}
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-medium text-gray-700">
                            Sinais e Sintomas
                          </label>
                          <div className="relative w-64">
                            <input
                              type="text"
                              placeholder="Pesquisar sintomas..."
                              value={searchSintomas}
                              onChange={(e) =>
                                setSearchSintomas(e.target.value)
                              }
                              className="w-full p-2 pl-8 text-sm border border-gray-200 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            {searchSintomas && (
                              <button
                                type="button"
                                onClick={() => setSearchSintomas("")}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              >
                                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                          {sintomaOptions
                            .filter(
                              (option) =>
                                searchSintomas === "" ||
                                option.descricao
                                  .toLowerCase()
                                  .includes(searchSintomas.toLowerCase())
                            )
                            .map((option) => (
                              <label
                                key={option.idtipo_sintoma}
                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 group"
                                translate="no"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.sinaisESintomas.includes(
                                    option.idtipo_sintoma.toString()
                                  )}
                                  onChange={() =>
                                    handleCheckboxChange(
                                      "sinaisESintomas",
                                      option.idtipo_sintoma.toString()
                                    )
                                  }
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200 group-hover:border-blue-400"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                                  {option.descricao}
                                </span>
                              </label>
                            ))}
                        </div>
                        {searchSintomas &&
                          sintomaOptions.filter((option) =>
                            option.descricao
                              .toLowerCase()
                              .includes(searchSintomas.toLowerCase())
                          ).length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                              Nenhum sintoma encontrado para "{searchSintomas}"
                            </div>
                          )}
                      </div>

                      {/* Data de Início dos Sintomas */}
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Data de Início dos Sintomas
                        </label>
                        <CustomDateInput
                          name="dataInicioSintomas"
                          className={`w-full p-3 border ${
                            errors.dataInicioSintomas
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200"
                          } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                          value={formData.dataInicioSintomas}
                          onChange={handleChange}
                          data-error={
                            errors.dataInicioSintomas ? "true" : "false"
                          }
                        />
                        {errors.dataInicioSintomas && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.dataInicioSintomas}
                          </p>
                        )}
                      </div>

                      {/* Observação dos Sintomas */}
                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-gray-700">
                          Observação
                        </label>
                        <textarea
                          name="observacaoSintomas"
                          rows={3}
                          placeholder="Informações adicionais sobre os sintomas..."
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.observacaoSintomas}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  {(isTipoAtendimento("TRAUMA") ||
                    isTipoAtendimento("MULTIPLAS VITIMAS")) && (
                    <>
                      {/* Tipo de Trauma com campo de pesquisa */}
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-medium text-gray-700">
                            Tipo de Trauma
                          </label>
                          <div className="relative w-64">
                            <input
                              type="text"
                              placeholder="Pesquisar traumas..."
                              value={searchTrauma}
                              onChange={(e) => setSearchTrauma(e.target.value)}
                              className="w-full p-2 pl-8 text-sm border border-gray-200 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            {searchTrauma && (
                              <button
                                type="button"
                                onClick={() => setSearchTrauma("")}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              >
                                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                          {traumaOptions
                            .filter(
                              (option) =>
                                searchTrauma === "" ||
                                option.descricao
                                  .toLowerCase()
                                  .includes(searchTrauma.toLowerCase())
                            )
                            .map((option) => (
                              <label
                                key={option.idtipo_trauma}
                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 group"
                                translate="no"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.tipoTrauma.includes(
                                    option.idtipo_trauma.toString()
                                  )}
                                  onChange={() =>
                                    handleCheckboxChange(
                                      "tipoTrauma",
                                      option.idtipo_trauma.toString()
                                    )
                                  }
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200 group-hover:border-blue-400"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                                  {option.descricao}
                                </span>
                              </label>
                            ))}
                        </div>
                        {searchTrauma &&
                          traumaOptions.filter((option) =>
                            option.descricao
                              .toLowerCase()
                              .includes(searchTrauma.toLowerCase())
                          ).length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                              Nenhum trauma encontrado para "{searchTrauma}"
                            </div>
                          )}
                      </div>

                      {/* Data da Ocorrência */}
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Data da Ocorrência{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <CustomDateInput
                          name="dataOcorrencia"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.dataOcorrencia}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Observação do Trauma */}
                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-gray-700">
                          Observação
                        </label>
                        <textarea
                          name="observacaoTrauma"
                          rows={3}
                          placeholder="Informações adicionais sobre o trauma..."
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.observacaoTrauma}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  {/* Observação do Incidente para SURTO ou INCIDENTE QBRN */}
                  {(isTipoAtendimento("SURTO") ||
                    isTipoAtendimento("INCIDENTE QBRN")) && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-gray-700">
                          Observação do Incidente
                        </label>
                        <textarea
                          name="observacaoIncidente"
                          rows={3}
                          placeholder="Informações adicionais sobre o incidente..."
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.observacaoIncidente}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  {/* Data da Ocorrência para outros tipos */}
                  {!isTipoAtendimento("TRAUMA") &&
                    !isTipoAtendimento("MULTIPLAS VITIMAS") && (
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Data da Ocorrência{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <CustomDateInput
                          name="dataOcorrencia"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.dataOcorrencia}
                          onChange={handleChange}
                        />
                      </div>
                    )}

                  {/* Hipótese Diagnóstica para TODOS os tipos */}
                  <div className="md:col-span-2">
                    <label className="block mb-2 font-medium text-gray-700">
                      Hipótese Diagnóstica
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {hipoteseDiagOptions.map((option) => (
                        <label
                          key={option.idtipo_hipotese_diag}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 group"
                        >
                          <input
                            type="checkbox"
                            checked={formData.hipoteseDiagnostica.includes(
                              option.idtipo_hipotese_diag.toString()
                            )}
                            onChange={() =>
                              handleCheckboxChange(
                                "hipoteseDiagnostica",
                                option.idtipo_hipotese_diag.toString()
                              )
                            }
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200 group-hover:border-blue-400"
                          />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                            {option.descricao}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Observação da Hipótese para TODOS os tipos */}
                  <div className="md:col-span-2">
                    <label className="block mb-2 font-medium text-gray-700">
                      Observação da Hipótese
                    </label>
                    <textarea
                      name="observacaoHipotese"
                      rows={3}
                      placeholder="Informações adicionais sobre a hipótese diagnóstica..."
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.observacaoHipotese}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 5: Informações da unidade notificadora */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<Bell className="h-5 w-5 text-orange-500" />}
              title="5. Informações da unidade notificadora"
              isExpanded={expandedSections.unidadeNotificadora}
              onToggle={() => toggleSection("unidadeNotificadora")}
            />
            {expandedSections.unidadeNotificadora && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data do Atendimento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Data do Atendimento
                    </label>
                    <CustomDateInput
                      name="dataAtendimento"
                      className={`w-full p-3 border ${
                        errors.dataAtendimento
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.dataAtendimento}
                      onChange={handleChange}
                      data-error={errors.dataAtendimento ? "true" : "false"}
                    />
                    {errors.dataAtendimento && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.dataAtendimento}
                      </p>
                    )}
                  </div>

                  {/* Unidade Notificadora - Modificado para mostrar erro */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Unidade Notificadora{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <UnidadeNotificadoraField
                      value={formData.unidadeNotificadora}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          unidadeNotificadora: value,
                        }))
                      }
                      label=""
                      placeholder="Buscar unidade notificadora..."
                      hasError={!!errors.unidadeNotificadora} // Passar estado de erro
                      // Aplicar classe de erro
                      className={`${errors.unidadeNotificadora ? "border-red-500 bg-red-50" : ""}`}
                    />
                    {/* Mostrar mensagem de erro */}
                    {errors.unidadeNotificadora && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.unidadeNotificadora}
                      </p>
                    )}
                  </div>

                  {/* Nome do Notificador */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Nome do Notificador
                    </label>
                    <input
                      type="text"
                      name="nomeNotificador"
                      placeholder="Nome do notificador"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.nomeNotificador}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Contato do Notificador */}
                  <div>
                    <BrazilianPhoneInput
                      name="contatoNotificador"
                      value={formData.contatoNotificador}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          contatoNotificador: value,
                        }))
                      }
                      label="Contato do Notificador"
                      placeholder="Digite o número de telefone"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 6: Encerramento do Caso */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<ArchiveX className="h-5 w-5 text-gray-700" />}
              title="6. Encerramento do Caso"
              isExpanded={expandedSections.encerramento}
              onToggle={() => toggleSection("encerramento")}
            />
            {expandedSections.encerramento && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data de Encerramento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Data de Encerramento
                    </label>
                    <CustomDateInput
                      name="dataEncerramento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.dataEncerramento}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Tipo de Encerramento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Tipo de Encerramento{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tipoEncerramento"
                      className={`w-full p-3 border ${
                        errors.tipoEncerramento
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.tipoEncerramento}
                      onChange={handleChange}
                      data-error={errors.tipoEncerramento ? "true" : "false"}
                    >
                      <option value="">Selecione</option>
                      {encerramentoOptions.map((option) => (
                        <option
                          key={option.idtipo_encerramento}
                          value={option.idtipo_encerramento}
                        >
                          {option.descricao}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Local de Encaminhamento (condicional) */}
                  {isTipoEncerramento("transferido") && (
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        Local de Encaminhamento{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <UnidadeNotificadoraField
                        value={formData.localEncaminhamento}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            localEncaminhamento: value,
                          }))
                        }
                        label=""
                        placeholder="Buscar estabelecimento para encaminhamento..."
                        isForEncaminhamento={true}
                        hasError={!!errors.localEncaminhamento} // Passar estado de erro
                        // Aplicar classe de erro
                        className={`${errors.localEncaminhamento ? "border-red-500 bg-red-50" : ""}`}
                      />
                      {/* Mostrar mensagem de erro */}
                      {errors.localEncaminhamento && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.localEncaminhamento}
                        </p>
                      )}
                      {/* ID selecionado */}
                      <p className="mt-1 text-xs text-blue-400">
                        ID selecionado:{" "}
                        {formData.localEncaminhamento || "Nenhum"}
                      </p>
                    </div>
                  )}

                  {/* Local de Encaminhamento para Óbito */}
                  {isTipoEncerramento("óbito") && (
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        Local de Encaminhamento
                      </label>
                      <select
                        name="localEncaminhamento"
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        value={formData.localEncaminhamento}
                        onChange={handleChange}
                      >
                        <option value="">-- Selecione (Opcional) --</option>
                        <option value="12205">SVO DVS SESPA</option>
                        <option value="23116">
                          Centro de Perícias Científicas Renato Chaves (IML)
                        </option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Campo opcional. Selecione um dos campos acima, se for
                        necessário encaminhamento para estes locais.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botões de ação na parte inferior do formulário (centralizados) */}
          <div className="mt-8 flex justify-center space-x-4">
            <button
              type="submit"
              form="notification-form"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              className="inline-flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ArchiveX className="h-4 w-4" />
              Limpar
            </button>
            <button
              type="button"
              onClick={() => navigate("/lista-comunicacao")}
              className="inline-flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>
        </form>
      </main>
      {/* Modal de busca de pacientes */}
      <ModalBuscaPaciente
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSelectPaciente={handleSelectPaciente}
      />
    </div>
  );
};

export default NotificationForm;

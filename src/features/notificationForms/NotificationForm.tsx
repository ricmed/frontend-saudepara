import React, { useState, useEffect, useCallback } from "react";
import PhoneInput from "@/features/notificationForms/components/PhoneInput";
import CboInput from "@/features/notificationForms/components/CboInput";
import UnidadeNotificadoraField from "@/features/notificationForms/components/UnidadeNotificadoraField";
import BrazilianPhoneInput from "@/features/notificationForms/components/BrazilianPhoneInput";
import ModalBuscaPaciente from "@/features/paginaPacientesComu/components/ModalBuscaPaciente";
import { Paciente } from "@/services/PacienteService";
import LocationInput from "@/features/notificationForms/components/LocationInput";
import {
  Search,
  Save,
  Plus,
  X,
  User,
  ClipboardList,
  Bell,
  PackageCheck,
  ArrowLeft,
  FileChartColumnIncreasing,
  FileSpreadsheet,
  FileText,
  Files,
  Download,
  MapPin,
  ArchiveX,
  ChevronDown,
  ChevronUp,
  FileOutput,
  Globe,
  ListChecks,
  AlertCircle,
  Loader,
} from "lucide-react";
// Import the export utilities
import {
  exportToExcel,
  exportToCSV,
  exportToWord,
  exportToPDF,
} from "./exportUtilities";
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

const NotificationForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Estado para controle de erros
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados para as opções de dropdown vindas da API
  const [eventoOptions, setEventoOptions] = useState<EventoOption[]>([]);
  const [publicoOptions, setPublicoOptions] = useState<PublicoOption[]>([]);
  const [paisOptions, setPaisOptions] = useState<PaisOption[]>([]);
  const [estadoOptions, setEstadoOptions] = useState<EstadoOption[]>([]);
  const [municipioOptions, setMunicipioOptions] = useState<MunicipioOption[]>(
    []
  );
  const [bairroOptions, setBairroOptions] = useState<BairroOption[]>([]);
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
  const [loadingEstabelecimentos, setLoadingEstabelecimentos] =
    useState<boolean>(false);

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
  const [searchSintomas, setSearchSintomas] = useState("");
  const [searchTrauma, setSearchTrauma] = useState("");
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Estado para armazenar o objeto paciente completo selecionado
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(
    null
  );

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
  const loadEstabelecimentos = useCallback(async () => {
    try {
      setLoadingEstabelecimentos(true);
      const estabelecimentos =
        await NotificacaoService.getEstabelecimentoOptions();
      setEstabelecimentoOptions(estabelecimentos);
    } catch (error) {
      console.error("Erro ao carregar estabelecimentos:", error);
      toast.error("Erro ao carregar lista de estabelecimentos");
    } finally {
      setLoadingEstabelecimentos(false);
    }
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

      setEventoOptions(eventos);
      
      // Ordenar as opções de público atendido na ordem específica
      const ordenacaoPublico = ["Participante", "Trabalhador", "Autoridade", "Outro"];
      const publicosOrdenados = [...publicos].sort((a, b) => {
        // Encontrar a posição de cada item no array de ordenação
        const posA = ordenacaoPublico.findIndex(item => 
          a.descricao.toLowerCase().includes(item.toLowerCase()));
        const posB = ordenacaoPublico.findIndex(item => 
          b.descricao.toLowerCase().includes(item.toLowerCase()));
        
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
        "Ignorado"
      ];
      
      const generosOrdenados = [...generos].sort((a, b) => {
        // Encontrar a posição de cada item no array de ordenação
        const posA = ordenacaoGenero.findIndex(item => 
          a.descricao.toLowerCase().includes(item.toLowerCase()));
        const posB = ordenacaoGenero.findIndex(item => 
          b.descricao.toLowerCase().includes(item.toLowerCase()));
        
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
        "Incidente QBRN"
      ];
      
      const atendimentosOrdenados = [...atendimentos].sort((a, b) => {
        // Encontrar a posição de cada item no array de ordenação
        const posA = ordenacaoAtendimento.findIndex(item => 
          a.descricao.toLowerCase().includes(item.toLowerCase()));
        const posB = ordenacaoAtendimento.findIndex(item => 
          b.descricao.toLowerCase().includes(item.toLowerCase()));
        
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
        "Não se aplica"
      ];
      
      const escolaridadesOrdenadas = [...escolaridades].sort((a, b) => {
        // Encontrar a posição de cada item no array de ordenação
        const posA = ordenacaoEscolaridade.findIndex(item => 
          a.descricao.toLowerCase().includes(item.toLowerCase()));
        const posB = ordenacaoEscolaridade.findIndex(item => 
          b.descricao.toLowerCase().includes(item.toLowerCase()));
        
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
      
      setEscolaridadeOptions(escolaridadesOrdenadas);
      
      setPaisOptions(paises);
      setEstadoOptions(estados);
      setMunicipioOptions(municipios);
      // Não precisamos mais carregar opções de bairro já que é texto livre
      // setBairroOptions(bairros);
      setRacaOptions(racas);
      setSintomaOptions(sintomas);
      setHipoteseDiagOptions(hipoteseDiag);
      setTraumaOptions(traumas);
      setEstabelecimentoOptions(estabelecimentos);
      setEncerramentoOptions(encerramentos);
    } catch (error) {
      console.error("Erro ao carregar opções:", error);
      toast.error("Erro ao carregar opções para o formulário");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para carregar municipios com base no estado selecionado
  const loadMunicipiosByEstado = async (estadoId: string) => {
    if (!estadoId) return;

    try {
      const municipios = await NotificacaoService.getMunicipioOptions(
        Number(estadoId)
      );
      setMunicipioOptions(municipios);
    } catch (error) {
      console.error("Erro ao carregar municípios:", error);
      toast.error("Erro ao carregar lista de municípios");
    }
  };

  // Função para carregar dados de uma notificação existente
  const loadNotificacao = async (notificacaoId: string) => {
    setIsLoading(true);
    try {
      const response = await NotificacaoService.getById(Number(notificacaoId));

      // Usar o adapter para formatar os dados
      const formattedData = response;
      if (formattedData) {
        setFormData(formattedData);

        // Carregar municipios se tivermos um estado selecionado
        if (formattedData.uf) {
          loadMunicipiosByEstado(formattedData.uf);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar notificação:", error);
      toast.error("Erro ao carregar dados da notificação");
      navigate(-1); // Voltar se ocorrer erro
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

  // Hook para atualizar municípios quando o estado muda
  useEffect(() => {
    if (formData.uf) {
      loadMunicipiosByEstado(formData.uf);
    }
  }, [formData.uf]);

  // Funções de formatação para inputs
  const formatCPF = (cpf: string) => {
    // Remove caracteres não numéricos e limita a 11 dígitos
    return cpf.replace(/\D/g, "").slice(0, 11);
  };

  const formatContato = (contato: string) => {
    // Remove caracteres não numéricos e limita a 15 dígitos
    return contato.replace(/\D/g, "").slice(0, 15);
  };

  // Handler específico para CPF
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);

    setFormData((prev) => ({
      ...prev,
      cpf: formattedCPF,
    }));

    if (errors.cpf) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.cpf;
        return newErrors;
      });
    }
  };

  // Interface para o paciente esperado por ModalBuscaPaciente
  const handleSelectPaciente = (paciente: Paciente) => {
    // Log detalhado para debug
    console.log("Paciente recebido:", JSON.stringify(paciente, null, 2));

    // Armazenar o paciente completo para uso posterior
    setSelectedPaciente(paciente);

    // Formatar a data corretamente
    let formattedDate = "";
    if (paciente.data_nascimento) {
      const date = new Date(paciente.data_nascimento);
      formattedDate = date.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    }

    // Verificar explicitamente se o nome_mae não é um CPF
    let nomeDaMae = paciente.nome_mae || "";
    // Se o nome_mae parece ser um CPF (apenas dígitos e tem entre 11 a 14 caracteres)
    if (/^\d{11,14}$/.test(nomeDaMae)) {
      nomeDaMae = ""; // Limpar se parecer um CPF
      console.warn("Nome da mãe parece ser um CPF, limpando o campo");
    }

    // Mapeamento de escolaridade com correção específica
    let escolaridadeValue = "";
    if (
      paciente.escolaridade_idescolaridade !== null &&
      paciente.escolaridade_idescolaridade !== undefined
    ) {
      // AQUI ESTÁ A MUDANÇA: Mapear especificamente o valor 7 para 8
      if (paciente.escolaridade_idescolaridade === 7) {
        escolaridadeValue = "8"; // Corrigindo o mapeamento específico
        console.log("Escolaridade mapeada: 7 -> 8 (Ensino superior completo)");
      } else {
        escolaridadeValue = String(paciente.escolaridade_idescolaridade);
        console.log("Escolaridade mantida:", escolaridadeValue);
      }
    } else if (
      paciente.tipo_escolaridade &&
      paciente.tipo_escolaridade.idescolaridade
    ) {
      // Aplicar o mesmo mapeamento para a estrutura alternativa
      if (paciente.tipo_escolaridade.idescolaridade === 7) {
        escolaridadeValue = "8";
        console.log("Escolaridade alternativa mapeada: 7 -> 8");
      } else {
        escolaridadeValue = String(paciente.tipo_escolaridade.idescolaridade);
        console.log("Escolaridade alternativa mantida:", escolaridadeValue);
      }
    }

    setFormData((prev) => ({
      ...prev,
      paciente: paciente.nome || "",
      nomeMae: nomeDaMae,
      dataNascimento: formattedDate,
      idade: calculateAge(paciente.data_nascimento).toString(),
      cpf: paciente.cpf || "",
      identidadeGenero: paciente.tipo_genero_idtipo_genero?.toString() || "",
      raca: paciente.tipo_raca_idtipo_raca?.toString() || "",
      escolaridade: escolaridadeValue,
      profissao: paciente.cbo_idcbo ? paciente.cbo_idcbo.toString() : "",
      contatoTelefonico: paciente.contato || "",
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

  // Handler genérico para mudanças nos campos
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Adicionar console.log para depuração do tipoAtendimento
    if (name === "tipoAtendimento") {
      console.log("No handleChange - tipoAtendimento:", value, typeof value);
    }

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

    // Limitar nome do paciente e nome da mãe a 100 caracteres
    if (name === "paciente" && value.length > 100) {
      newValue = value.slice(0, 100);
    } else if (name === "nomeMae" && value.length > 100) {
      newValue = value.slice(0, 100);
    }
    // Limitar contato telefônico a 15 caracteres numéricos
    else if (name === "contatoTelefonico") {
      newValue = formatContato(value);
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  // Handler para clicar fora do dropdown de profissão
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formData.showProfissaoOptions) {
        setFormData((prev) => ({ ...prev, showProfissaoOptions: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [formData.showProfissaoOptions]);

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

  // Validar formulário antes de enviar
  const validateForm = (): boolean => {
    // Verificar campos obrigatórios
    const requiredFields: Array<{ field: keyof FormData; label: string }> = [
      { field: "evento", label: "Evento" },
      { field: "publicoAtendido", label: "Público Atendido" },
      { field: "residenteBelem", label: "Residente em Belém" },
      { field: "paciente", label: "Paciente" },
      { field: "tipoAtendimento", label: "Tipo de Atendimento" },
      { field: "dataOcorrencia", label: "Data da Ocorrência" },
      { field: "tipoEncerramento", label: "Tipo de Encerramento" },
    ];

    const missingFields = requiredFields.filter(
      (item) => !formData[item.field]
    );

    if (missingFields.length > 0) {
      const missingLabels = missingFields.map((item) => item.label).join(", ");
      toast.error(`Preencha os campos obrigatórios: ${missingLabels}`);
      return false;
    }

    // Validar campos de identificação do indivíduo
    const identificacaoValida = validateIdentificacao();
    if (!identificacaoValida) {
      // Expandir a seção de identificação para mostrar os erros
      setExpandedSections((prev) => ({
        ...prev,
        identificacao: true,
      }));
      toast.error("Existem erros nos campos de identificação do indivíduo");
      return false;
    }

    // Validações específicas por tipo de atendimento
    if (
      formData.tipoAtendimento === "1" &&
      formData.sinaisESintomas.length === 0
    ) {
      toast.error("Selecione pelo menos um sinal ou sintoma");
      return false;
    }

    if (formData.tipoAtendimento === "2" && formData.tipoTrauma.length === 0) {
      toast.error("Selecione pelo menos um tipo de trauma");
      return false;
    }

    return true;
  };

  // Handlers para ações do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      let result;

      if (isEditMode && id) {
        // Atualizar notificação existente
        result = await NotificacaoService.update(Number(id), formData);
        toast.success("Notificação atualizada com sucesso");
      } else {
        // Criar nova notificação
        result = await NotificacaoService.create(formData);
        toast.success("Notificação criada com sucesso");
      }

      // Redirecionar para página de listagem ou detalhes
      navigate("/notificacoes");
    } catch (error: any) {
      console.error("Erro ao salvar notificação:", error);
      toast.error(error.message || "Erro ao salvar notificação");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setSelectedPaciente(null);
    setErrors({});
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
  const handleExport = (format: string) => {
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
        default:
          alert(`Export to ${format} is not supported`);
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
      option => option.idtipo_atendimento.toString() === formData.tipoAtendimento.toString()
    );
    
    // Verifica se a descrição contém o texto procurado
    return selectedOption?.descricao.toLowerCase().includes(tipo.toLowerCase()) || false;
  };

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

  console.log("Estado atual - tipoAtendimento:", formData.tipoAtendimento, typeof formData.tipoAtendimento);
  console.log("Condição Clínico seria:", formData.tipoAtendimento === "1");
  console.log("Condição Trauma seria:", formData.tipoAtendimento === "2");
  console.log("Condição Outros seria:", ["3", "4", "5"].includes(formData.tipoAtendimento));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-white">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <ClipboardList className="h-8 w-8" />
            <h1 className="text-2xl font-semibold">
              {isEditMode ? "Editar Notificação" : "Nova Notificação"}
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

              {/* Dropdown de Exportação */}
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => handleExport("Word")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <FileChartColumnIncreasing className="h-4 w-4" /> Word
                    </button>
                    <button
                      onClick={() => handleExport("Excel")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <FileSpreadsheet className="h-4 w-4" /> Excel
                    </button>
                    <button
                      onClick={() => handleExport("CSV")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <FileText className="h-4 w-4" /> CSV
                    </button>
                    <button
                      onClick={() => handleExport("PDF")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <Files className="h-4 w-4" /> PDF
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo Registro
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <form
          id="notification-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
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
                      Evento
                    </label>
                    <select
                      name="evento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.evento}
                      onChange={handleChange}
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
                      Público Atendido
                    </label>
                    <select
                      name="publicoAtendido"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.publicoAtendido}
                      onChange={handleChange}
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
                      Residente em Belém?
                    </label>
                    <select
                      name="residenteBelem"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.residenteBelem}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      <option value="1">SIM</option>
                      <option value="2">NÃO</option>
                      <option value="3">ESTRANGEIRO</option>
                    </select>
                  </div>

                  {/* Campos condicionais baseados na residência */}
                  {formData.residenteBelem === "1" && (
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        Bairro
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="bairro"
                          placeholder="Digite o nome do bairro"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.bairro}
                          onChange={handleChange}
                        />
                      </div>
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
                          placeholder="Selecione o município"
                          disabled={!formData.uf}
                          apiEndpoint="api/tipo-municipio"
                          idField="idtipo_municipio"
                          parentValue={formData.uf}
                          debug={true} // Habilitar logs para depuração
                        />
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
                          onChange={handleChange}
                        />
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
                      Nome
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="paciente"
                        placeholder="Nome do paciente"
                        className={`flex-1 p-3 border ${
                          errors.paciente ? "border-red-500" : "border-gray-200"
                        } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                        value={formData.paciente}
                        onChange={handleChange}
                        maxLength={100}
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
                    {errors.paciente && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.paciente}
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
                        errors.nomeMae ? "border-red-500" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.nomeMae}
                      onChange={handleChange}
                      maxLength={100}
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
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      name="dataNascimento"
                      className={`w-full p-3 border ${
                        errors.dataNascimento
                          ? "border-red-500"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.dataNascimento}
                      onChange={handleChange}
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
                      placeholder="Digite a idade"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.idade}
                      onChange={(e) => {
                        // Limitar a 3 caracteres
                        const value = e.target.value;
                        if (value.length <= 3) {
                          handleChange({
                            target: {
                              name: "idade",
                              value: value,
                            },
                          } as React.ChangeEvent<HTMLInputElement>);
                        }
                      }}
                      maxLength={3}
                    />
                  </div>

                  {/* CPF */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      CPF
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      placeholder="Apenas números"
                      className={`w-full p-3 border ${
                        errors.cpf ? "border-red-500" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.cpf}
                      onChange={handleCPFChange}
                      maxLength={11}
                    />
                    {errors.cpf && (
                      <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>
                    )}
                  </div>

                  {/* Identidade de Gênero */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Identidade de Gênero
                    </label>
                    <select
                      name="identidadeGenero"
                      className={`w-full p-3 border ${
                        errors.identidadeGenero
                          ? "border-red-500"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.identidadeGenero}
                      onChange={handleChange}
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
                          errors.gestante ? "border-red-500" : "border-gray-200"
                        } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                        value={formData.gestante}
                        onChange={handleChange}
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
                      Raça
                    </label>
                    <select
                      name="raca"
                      className={`w-full p-3 border ${
                        errors.raca ? "border-red-500" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.raca}
                      onChange={handleChange}
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
                      onChange={(value) => {
                        // Extrair apenas o número de telefone (sem o código do país)
                        const phoneNumberOnly = value.replace(/^\+\d+\s/, "");

                        // Aplicar formatação para limitar a 15 dígitos numéricos
                        const formattedValue = formatContato(phoneNumberOnly);

                        setFormData((prev) => ({
                          ...prev,
                          contatoTelefonico: formattedValue,
                        }));

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
                      Tipo de Atendimento
                    </label>
                    <select
                      name="tipoAtendimento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.tipoAtendimento}
                      onChange={(e) => {
                        console.log(
                          "Tipo de atendimento selecionado:",
                          e.target.value,
                          typeof e.target.value
                        );
                        handleChange(e);
                      }}
                    >
                      <option value="">Selecione</option>
                      {atendimentoOptions.map((option) => (
                        <option
                          key={option.idtipo_atendimento}
                          value={option.idtipo_atendimento}
                        >
                          {option.descricao}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Campos condicionais baseados no tipo de atendimento */}
                  {isTipoAtendimento('clínico') && (
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
                        <input
                          type="date"
                          name="dataInicioSintomas"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.dataInicioSintomas}
                          onChange={handleChange}
                        />
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

                      {/* Hipótese Diagnóstica */}
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

                      {/* Observação da Hipótese */}
                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-gray-700">
                          Observação
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
                    </>
                  )}

                  {isTipoAtendimento('trauma') && (
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
                          Data da Ocorrência
                        </label>
                        <input
                          type="date"
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

                  {(isTipoAtendimento('surto') || isTipoAtendimento('múltiplas') || 
                    isTipoAtendimento('qbrn') || isTipoAtendimento('incidente')) && (
                    <>
                      {/* Relacionado a Surto ou Agregado de Indivíduos */}
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Relacionado a Surto ou Agregado de Indivíduos
                        </label>
                        <select
                          name="relacionadoSurto"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.relacionadoSurto}
                          onChange={handleChange}
                        >
                          <option value="">Selecione</option>
                          <option value="1">Sim</option>
                          <option value="2">Não</option>
                        </select>
                      </div>

                      {/* Observação do Incidente */}
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

                  {/* Data da Ocorrência (obrigatória para todos os tipos exceto Trauma) */}
                  {!isTipoAtendimento('trauma') && (
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        Data da Ocorrência
                      </label>
                      <input
                        type="date"
                        name="dataOcorrencia"
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        value={formData.dataOcorrencia}
                        onChange={handleChange}
                      />
                    </div>
                  )}
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
                    <input
                      type="date"
                      name="dataAtendimento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.dataAtendimento}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Unidade Notificadora - Componente separado */}
                  <div>
                    <UnidadeNotificadoraField
                      value={formData.unidadeNotificadora}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          unidadeNotificadora: value,
                        }))
                      }
                      label="Unidade Notificadora"
                      placeholder="Buscar unidade notificadora..."
                    />
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
                    <input
                      type="date"
                      name="dataEncerramento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.dataEncerramento}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Tipo de Encerramento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Tipo de Encerramento
                    </label>
                    <select
                      name="tipoEncerramento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.tipoEncerramento}
                      onChange={handleChange}
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
                  {formData.tipoEncerramento === "4" && (
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
                        <option value="">Selecione</option>
                        {estabelecimentoOptions.map((option) => (
                          <option
                            key={option.idestabelecimento}
                            value={option.idestabelecimento}
                          >
                            {option.descricao}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Local de Encaminhamento para Óbito */}
                  {formData.tipoEncerramento === "5" && (
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
                        <option value="">Selecione</option>
                        <option value="1">SVO</option>
                        <option value="2">IML</option>
                        <option value="3">Ignorado</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo Registro
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Save,
  X,
  ArrowLeft,
  UserCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Loader,
  Menu,
  Trash2,
  WifiOff, // ✅ NOVO: Ícone offline
  Database // ✅ NOVO: Ícone cache
} from "lucide-react";
import CboInput from "@/features/notificationForms/components/CboInput";
import PhoneInput from "@/features/notificationForms/components/PhoneInput";
import CustomDateInput from "@/features/notificationForms/components/CustomDateInput";
import {
  PacienteService,
  Paciente,
  OptionItem,
} from "@/services/PacienteService";
import { toast } from "react-toastify";
import SideMenu from "@/features/home/components/SideMenu";
import { useOfflineSystem } from '@/hooks/useOfflineSystem';
import ConnectionStatus from '@/components/ConnectionStatus';
import indexedDBService from '@/services/indexedDB';
import { calcularIdadeAutomatica } from '@/features/notificationForms/hooks/useNotificationForm';

// Interface para as props do componente
interface FormularioPacienteProps {
  isModal?: boolean;
  isNewPatient?: boolean;
  onPacienteSalvo?: (paciente: Omit<Paciente, "idpaciente">) => void;
  onClose?: () => void;
  pacienteId?: number;
}

// Interface para os dados do formulário
export interface PacienteFormData {
  nome: string;
  nome_mae: string;
  data_nascimento: string;
  cpf: string;
  tipo_genero_idtipo_genero: number | "";
  gestante: string;
  tipo_raca_idtipo_raca: number | "";
  escolaridade_idescolaridade: number | "";
  cbo_idcbo: number | null;
  ddi: string;
  contato: string;
  idade?: string;
  idadeMeses?: string;
  idadeUnidade?: 'anos' | 'meses'; // <-- CAMPO ADICIONADO
}

// Opções default para os dropdowns
const gestanteOptions = [
  { value: "S", label: "Sim" },
  { value: "N", label: "Não" },
];

// Função de normalização para garantir a remoção de acentos e cedilhas
function normalizeText(text: string): string {
  if (!text) return "";

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

// Função toUpperCaseAllStrings
const toUpperCaseAllStrings = (obj: any): any => {
  if (!obj) return obj;

  if (typeof obj === "string") {
    return normalizeText(obj);
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

const FormularioPaciente = ({
  isModal = false,
  isNewPatient = false,
  onPacienteSalvo,
  onClose,
  pacienteId: propPacienteId,
}: FormularioPacienteProps) => {
  const { id } = useParams();
  const pacienteId = isNewPatient ? undefined : (propPacienteId || (id ? parseInt(id) : undefined));
    // ✅ INTEGRAR SISTEMA OFFLINE
  const {
    isOnline,
    getOfflineStatusMessage,
    hasDataToSync,
    pendingData,
    savePatientOfflineSafe,
    checkCpfOfflineSafe
  } = useOfflineSystem();  const initialFormData: PacienteFormData = {
    nome: "",
    nome_mae: "",
    data_nascimento: "",
    cpf: "",
    tipo_genero_idtipo_genero: "",
    gestante: "",
    tipo_raca_idtipo_raca: "",
    escolaridade_idescolaridade: "",
    cbo_idcbo: null,
    ddi: "55",
    contato: "",
    idadeMeses: "", // <-- CAMPO ADICIONADO
    idadeUnidade: 'anos', // <-- CAMPO ADICIONADO
  };

  // Estados para dados do formulário e comportamento
  const [formData, setFormData] = useState<PacienteFormData>(initialFormData);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Estados para os dados dos dropdowns carregados do banco
  const [generoOptions, setGeneroOptions] = useState<OptionItem[]>([]);
  const [racaOptions, setRacaOptions] = useState<OptionItem[]>([]);
  const [escolaridadeOptions, setEscolaridadeOptions] = useState<OptionItem[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalCpf, setOriginalCpf] = useState<string>("");

  // Estado para controlar seções expandidas
  const [expandedSections, setExpandedSections] = useState({
    identificacao_individuo: true,
  });
  // Estado para mostrar/esconder o popover de ajuda de identidade de gênero
  const [showGenderHelp, setShowGenderHelp] = useState<boolean>(false);

  // Estado para mostrar mensagem de CPF disponível
  const [cpfAvailableMessage, setCpfAvailableMessage] = useState<string | null>(null);

  // Adicionando estado para o SideMenu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ✅ FUNÇÃO: Carregar opções do cache offline
  const loadOptionsFromCache = async (): Promise<{ hasData: boolean }> => {
    try {
      console.log('📱 Carregando opções de paciente do cache offline...');
      
      const [generos, racas, escolaridades] = await Promise.all([
        indexedDBService.getOpcoes('generos'),
        indexedDBService.getOpcoes('racas'),
        indexedDBService.getOpcoes('escolaridades')
      ]);

      // Verificar se temos dados essenciais
      const hasEssentialData = generos && generos.length > 0 && 
                               racas && racas.length > 0 && 
                               escolaridades && escolaridades.length > 0;

      if (!hasEssentialData) {
        console.warn('⚠️ Dados essenciais de paciente não encontrados no cache');
        return { hasData: false };
      }

      // Converter opções para caixa alta
      const convertOptionsToUpperCase = (options: any[]) => {
        if (!options) return [];
        return options.map((option) => ({
          ...option,
          descricao: normalizeText(option.descricao)
        }));
      };

      // Definir opções do cache
      setGeneroOptions(convertOptionsToUpperCase(generos));
      setRacaOptions(convertOptionsToUpperCase(racas));
      setEscolaridadeOptions(convertOptionsToUpperCase(escolaridades));

      console.log(`✅ Opções de paciente carregadas do cache: ${generos.length} gêneros, ${racas.length} raças, ${escolaridades.length} escolaridades`);
      return { hasData: true };

    } catch (error) {
      console.error('❌ Erro ao carregar opções do cache:', error);
      return { hasData: false };
    }
  };

  // ✅ FUNÇÃO MODIFICADA: Carregar opções (online/offline)
  useEffect(() => {
    const loadDropdownOptions = async () => {
      setIsLoadingOptions(true);
      setLoadingError(null);

      try {
        // ✅ VERIFICAR SE ESTÁ OFFLINE
        if (!isOnline) {
          console.log('📱 Modo offline detectado para opções de paciente');
          
          const cachedData = await loadOptionsFromCache();
          if (cachedData.hasData) {
            console.log('✅ Opções de paciente carregadas do cache offline');
            setLoadingError(null);
          } else {
            setLoadingError('Dados não disponíveis offline. Conecte-se à internet e baixe os dados primeiro.');
          }
          return;
        }

        // ✅ MODO ONLINE: carregar normalmente + salvar cache
        console.log('🌐 Modo online: carregando opções de paciente da API...');
        
        const [generos, racas, escolaridades] = await Promise.all([
          PacienteService.getTiposGenero(),
          PacienteService.getTiposRaca(),
          PacienteService.getTiposEscolaridade()
        ]);

        // ✅ SALVAR NO CACHE PARA USO OFFLINE FUTURO
        try {
          await Promise.all([
            indexedDBService.saveOpcoes('generos', generos),
            indexedDBService.saveOpcoes('racas', racas),
            indexedDBService.saveOpcoes('escolaridades', escolaridades)
          ]);
          console.log('✅ Opções de paciente salvas no cache offline');
        } catch (cacheError) {
          console.warn('⚠️ Erro ao salvar opções no cache:', cacheError);
        }

        // Converter opções para caixa alta
        const convertOptionsToUpperCase = (options: any[]) => {
          return options.map((option) => ({
            ...option,
            descricao: normalizeText(option.descricao),
          }));
        };

        setGeneroOptions(convertOptionsToUpperCase(generos));
        setRacaOptions(convertOptionsToUpperCase(racas));
        setEscolaridadeOptions(convertOptionsToUpperCase(escolaridades));

      } catch (error) {
        console.error("Erro ao carregar opções de dropdown:", error);
        
        // ✅ FALLBACK: tentar usar cache em caso de erro online
        try {
          console.log('⚠️ Erro online, tentando usar cache como fallback...');
          const cachedData = await loadOptionsFromCache();
          
          if (cachedData.hasData) {
            toast.warning('Usando dados offline devido a erro de conexão');
            setLoadingError(null);
          } else {
            throw new Error('Nenhum dado encontrado offline');
          }
        } catch (cacheError) {
          console.error('Erro ao usar cache como fallback:', cacheError);
          setLoadingError(
            "Não foi possível carregar as opções. " + 
            (isOnline ? "Tente recarregar a página." : "Conecte-se à internet e baixe os dados offline primeiro.")
          );
        }
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadDropdownOptions();
  }, [isOnline]);

  // ✅ FUNÇÃO MODIFICADA: Carregar dados do paciente (apenas online para edição)
  useEffect(() => {
    if (pacienteId) {
      // ✅ VERIFICAR SE ESTÁ ONLINE PARA EDIÇÃO
      if (!isOnline) {
        setApiError('Não é possível editar pacientes offline. Conecte-se à internet.');
        setIsLoading(false);
        return;
      }

      console.log("Tentando carregar paciente com ID:", pacienteId);
      setIsLoading(true);
      setApiError(null);

      PacienteService.getById(pacienteId)
        .then((paciente) => {
          console.log("Dados recebidos da API:", paciente);

          if (!paciente) {
            throw new Error("Paciente não encontrado");
          }

          // Converter todos os campos de texto para caixa alta
          const pacienteUpperCase = toUpperCaseAllStrings(paciente);
          console.log("Dados convertidos para caixa alta:", pacienteUpperCase);

          // Salvar o CPF original para verificação de duplicidade
          setOriginalCpf(pacienteUpperCase.cpf || "");

          // Verificação adicional para escolaridade
          let escolaridadeId = null;
          if (
            pacienteUpperCase.escolaridade_idescolaridade !== null &&
            pacienteUpperCase.escolaridade_idescolaridade !== undefined
          ) {
            escolaridadeId = Number(
              pacienteUpperCase.escolaridade_idescolaridade
            );
          }          // Formatar a data de nascimento e processar idade
          const formattedDate = pacienteUpperCase.data_nascimento
            ? new Date(pacienteUpperCase.data_nascimento)
                .toISOString()
                .split("T")[0]
            : "";
            
          // Processar idade conforme nova lógica: backend envia idade total em meses
          let finalAge = "";
          let finalAgeMonths = "";
          let ageUnit: 'anos' | 'meses' = 'anos';
          
          if (formattedDate) {
            // Se há data de nascimento, a idade já foi processada pelo backend
            console.log("Paciente com data de nascimento - dados já processados pelo backend");
          }
          
          // O backend agora envia a IDADE TOTAL EM MESES no campo 'idade'
          if (pacienteUpperCase.idade !== null && pacienteUpperCase.idade !== undefined) {
            const totalMonths = Number(pacienteUpperCase.idade);
            
            // Calcula anos e meses a partir do total de meses
            finalAge = Math.floor(totalMonths / 12).toString();
            finalAgeMonths = totalMonths.toString();
            
            // Define a unidade padrão para a UI
            ageUnit = totalMonths >= 12 ? 'anos' : 'meses';
            
            console.log(`Paciente carregado - Idade do backend (meses): ${totalMonths}. Convertido para: ${finalAge} anos e ${finalAgeMonths} meses. Unidade: ${ageUnit}`);
          }

          setFormData({
            nome: pacienteUpperCase.nome || "",
            nome_mae: pacienteUpperCase.nome_mae || "",
            data_nascimento: formattedDate,
            cpf: pacienteUpperCase.cpf || "",
            tipo_genero_idtipo_genero:
              pacienteUpperCase.tipo_genero_idtipo_genero || "",
            gestante: pacienteUpperCase.gestante || "",
            tipo_raca_idtipo_raca:
              pacienteUpperCase.tipo_raca_idtipo_raca || "",
            escolaridade_idescolaridade:
              escolaridadeId === null ? "" : escolaridadeId,
            cbo_idcbo: pacienteUpperCase.cbo_idcbo || null,            ddi: pacienteUpperCase.ddi || "55",
            contato: pacienteUpperCase.contato || "",
            idade: finalAge,
            idadeMeses: finalAgeMonths, // <-- ADICIONA MESES
            idadeUnidade: ageUnit, // <-- ADICIONA UNIDADE
          });
        })
        .catch((error) => {
          console.error("Erro ao carregar paciente:", error);
          setApiError(
            error instanceof Error ? error.message : "Erro ao carregar paciente"
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [pacienteId, isOnline]);  // useEffect para processar idade quando dados vêm do backend
  useEffect(() => {
    console.log("useEffect idade - data_nascimento mudou:", formData.data_nascimento);
    
    if (!formData.data_nascimento || formData.data_nascimento.trim() === '') {
      console.log("Data de nascimento vazia, limpando idade");
      setFormData((prev) => ({
        ...prev,
        idade: "",
        idadeMeses: "", // <-- LIMPA MESES TAMBÉM
      }));
    } else {
      // A nova lógica de idade está no backend - dados já vêm processados
      console.log("Data de nascimento presente - idade será processada pelo backend");
    }
  }, [formData.data_nascimento]);

  // Efeito para resetar o formulário quando isNewPatient for true
  useEffect(() => {
    if (isNewPatient) {
      setFormData(initialFormData);
      setErrors({});
      setApiError(null);
      setIsSuccess(false);
      setOriginalCpf("");
      console.log("Formulário resetado para novo paciente");
    }
  }, [isNewPatient]);

  // Função para alternar a expansão de uma seção
  const toggleSection = (section: keyof typeof expandedSections) => {
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

  // Função para calcular idade a partir da data de nascimento
  const calculateAge = (birthdate: string) => {
    if (!birthdate) return "";

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

    return age.toString();
  };

  // Handler genérico para mudanças nos campos
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Limpar erro quando o campo for preenchido
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Tratamento específico para cada campo
    if (name === "escolaridade_idescolaridade") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else if (
      name === "tipo_genero_idtipo_genero" ||
      name === "tipo_raca_idtipo_raca"
    ) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else if (name === "nome" || name === "nome_mae") {
      const normalizedValue = normalizeText(value);
      const limitedValue = normalizedValue.slice(0, 100);

      setFormData((prev) => ({
        ...prev,
        [name]: limitedValue,
      }));    } else if (name === "data_nascimento") {
      if (!value || value === "" || value.trim() === "") {
        console.log("Campo de data limpo:", value);
        setFormData((prev) => ({
          ...prev,
          [name]: "",
          idade: "",
          idadeMeses: "",
          idadeUnidade: 'anos'
        }));

        if (errors.data_nascimento) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.data_nascimento;
            return newErrors;
          });
        }
      } else {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate > today) {
          setErrors(prev => ({
            ...prev,
            data_nascimento: "A data de nascimento não pode ser futura"
          }));
          return;
        }
        
        // Calcular idade automaticamente usando a função importada
        const idadeCalculada = calcularIdadeAutomatica(value);
        console.log("Nova data selecionada:", value, "Idade calculada:", idadeCalculada);

        // Validar se a idade calculada não ultrapassa 120 anos
        const anosCalculados = parseInt(idadeCalculada.idade, 10);
        if (!isNaN(anosCalculados) && anosCalculados > 120) {
          setErrors(prev => ({
            ...prev,
            data_nascimento: "A idade calculada não pode ser superior a 120 anos"
          }));
          return;
        }

        setFormData((prev) => ({
          ...prev,
          [name]: value,
          idade: idadeCalculada.idade,
          idadeMeses: idadeCalculada.idadeMeses,
          idadeUnidade: idadeCalculada.idadeUnidade as 'anos' | 'meses'
        }));
        
        console.log("Data de nascimento atualizada para:", value);
      }    } else if (name === "idade") {
      if (!formData.data_nascimento || formData.data_nascimento.trim() === '') {
        const ageValue = value === "" ? "" : value;
        const ageNum = parseInt(ageValue);

        if (!isNaN(ageNum) && ageNum > 120) {
          setErrors((prev) => ({
            ...prev,
            idade: "A idade não pode ser maior que 120 anos",
          }));
          return;
        }

        setFormData((prev) => {
          const newFormData = { ...prev, idade: ageValue };
          
          // Se estamos editando idade em anos, calcular meses
          if (formData.idadeUnidade === 'anos' && ageValue) {
            newFormData.idadeMeses = (ageNum * 12).toString();
          } else if (formData.idadeUnidade === 'anos') {
            newFormData.idadeMeses = "";
          }
          
          return newFormData;
        });
        console.log("Idade manual alterada para:", ageValue);
      } else {
        console.log("Tentativa de alterar idade manualmente ignorada - data de nascimento presente");
      }
    } else if (name === "idadeMeses") {
      if (!formData.data_nascimento || formData.data_nascimento.trim() === '') {
        const monthsValue = value === "" ? "" : value;
        const monthsNum = parseInt(monthsValue);

        // Validação específica baseada na unidade selecionada
        if (formData.idadeUnidade === 'meses') {
          // Quando a unidade é "meses", permitir apenas 0-11 meses
          if (!isNaN(monthsNum) && monthsNum > 11) {
            setErrors((prev) => ({
              ...prev,
              idadeMeses: "Quando a unidade é 'meses', o valor máximo é 11 meses",
            }));
            return;
          }
        } else {
          // Quando a unidade é "anos", permitir até 1440 meses (120 anos)
          if (!isNaN(monthsNum) && monthsNum > 1440) {
            setErrors((prev) => ({
              ...prev,
              idadeMeses: "A idade não pode ser maior que 120 anos (1440 meses)",
            }));
            return;
          }
        }

        setFormData((prev) => {
          const newFormData = { ...prev, idadeMeses: monthsValue };
          
          // Se estamos editando idade em meses, calcular anos
          if (formData.idadeUnidade === 'meses' && monthsValue) {
            newFormData.idade = Math.floor(monthsNum / 12).toString();
          } else if (formData.idadeUnidade === 'meses') {
            newFormData.idade = "";
          }
          
          return newFormData;
        });
        console.log("Idade em meses alterada para:", monthsValue);
      } else {
        console.log("Tentativa de alterar idade em meses manualmente ignorada - data de nascimento presente");
      }
    } else if (name === "idadeUnidade") {
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
        idadeUnidade: value as 'anos' | 'meses'
      }));
      console.log("Unidade de idade alterada para:", value);
    } else {
      let newValue = value;
      if (typeof newValue === "string") {
        newValue = newValue.toUpperCase();
      }
      setFormData((prev) => ({ ...prev, [name]: newValue }));
    }
  };

  // Handler para validação do CPF
  const formatCPF = (cpf: string) => {
    return cpf.replace(/\D/g, "").slice(0, 11);
  };

  // Função para exibir CPF formatado
  const displayFormattedCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, "").slice(0, 11);

    if (cleanCPF.length !== 11) return cleanCPF;

    return `${cleanCPF.substring(0, 3)}.${cleanCPF.substring(3, 6)}.${cleanCPF.substring(6, 9)}-${cleanCPF.substring(9)}`;
  };
  // ✅ FUNÇÃO MODIFICADA: Handler para CPF com sistema offline
  const handleCPFChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedCPF = formatCPF(rawValue);

    setFormData((prev) => ({
      ...prev,
      cpf: formattedCPF,
    }));

    // Limpar mensagem de CPF disponível sempre que o usuário digitar
    setCpfAvailableMessage(null);

    if (errors.cpf) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.cpf;
        return newErrors;
      });
    }
    
    // ✅ IMPORTANTE: Só verificar CPF se for diferente do original (para edição)
    // ou se for criação nova (sem pacienteId)
    const shouldCheckCPF = formattedCPF.length === 11 && (
      !pacienteId || // Criação nova
      formattedCPF !== originalCpf // Edição com CPF diferente
    );
    
    if (shouldCheckCPF) {
      setErrors(prev => ({
        ...prev,
        cpf: isOnline ? "Verificando CPF..." : "Verificando CPF offline..."
      }));
      
      try {
        const timeoutPromise = new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na verificação')), 8000)
        );
        
        const exists = await Promise.race([
          checkCpfOfflineSafe(formattedCPF),
          timeoutPromise
        ]);
        
        if (exists) {
          setErrors((prev) => ({
            ...prev,
            cpf: "O CPF digitado já existe",
          }));
          setCpfAvailableMessage(null);
          console.log("CPF existente detectado:", formattedCPF);
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.cpf;
            return newErrors;
          });
          setCpfAvailableMessage("CPF disponível para cadastro");
          toast.success("CPF disponível para cadastro!");
          console.log("CPF verificado com sucesso:", formattedCPF);
        }
        
      } catch (error: any) {
        console.error("Erro ao verificar CPF:", error);
        
        if (error.message === 'Timeout na verificação') {
          setErrors(prev => ({
            ...prev,
            cpf: "Timeout na verificação - tente novamente"
          }));
        } else if (!isOnline) {
          // Modo offline: ser tolerante com erros
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.cpf;
            return newErrors;
          });
          console.log("⚠️ Erro offline tolerado:", error.message);
        } else {
          setErrors(prev => ({
            ...prev,
            cpf: "Erro ao verificar CPF"
          }));
        }
      }
    } else if (formattedCPF === originalCpf && pacienteId) {
      // ✅ CPF não mudou durante edição - sem erro
      console.log("CPF não alterado durante edição, não verificando");
    }
  };

  // Validar o formulário antes de enviar
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "O campo nome é obrigatório";
    } else if (formData.nome.length > 100) {
      newErrors.nome = "O campo nome deve ter no máximo 100 caracteres";
    }

    if (formData.nome_mae && formData.nome_mae.length > 100) {
      newErrors.nome_mae = "O campo nome da mãe deve ter no máximo 100 caracteres";
    }

    if (formData.data_nascimento && formData.data_nascimento.trim() !== '') {
      const date = new Date(formData.data_nascimento);
      if (isNaN(date.getTime())) {
        newErrors.data_nascimento = "Data de nascimento inválida";
      } else {
        const age = parseInt(calculateAge(formData.data_nascimento));
        if (age > 120) {
          newErrors.data_nascimento = "A idade não pode ser maior que 120 anos";
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date > today) {
          newErrors.data_nascimento = "A data de nascimento não pode ser futura";
        }
      }
    }    if (!formData.data_nascimento && (formData.idade || formData.idadeMeses)) {
      if (formData.idadeUnidade === 'anos' && formData.idade) {
        const age = parseInt(formData.idade);
        if (isNaN(age)) {
          newErrors.idade = "Idade inválida";
        } else if (age > 120) {
          newErrors.idade = "A idade não pode ser maior que 120 anos";
        } else if (age < 0) {
          newErrors.idade = "A idade não pode ser negativa";
        }
      } else if (formData.idadeUnidade === 'meses' && formData.idadeMeses) {
        const ageInMonths = parseInt(formData.idadeMeses);
        if (isNaN(ageInMonths)) {
          newErrors.idadeMeses = "Idade em meses inválida";
        } else if (ageInMonths > 1440) { // 120 anos * 12 meses
          newErrors.idadeMeses = "A idade não pode ser maior que 120 anos";
        } else if (ageInMonths < 0) {
          newErrors.idadeMeses = "A idade não pode ser negativa";
        }
      }
    }

    if (formData.cpf && formData.cpf.length > 0 && formData.cpf.length !== 11) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }

    if (!formData.tipo_genero_idtipo_genero) {
      newErrors.tipo_genero_idtipo_genero = "O campo identidade de gênero é obrigatório";
    }

    if (!formData.tipo_raca_idtipo_raca) {
      newErrors.tipo_raca_idtipo_raca = "O campo raça é obrigatório";
    }

    if (formData.contato && formData.contato.length > 15) {
      newErrors.contato = "O contato deve ter no máximo 15 caracteres";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setExpandedSections({
        identificacao_individuo: true
      });
      
      setTimeout(() => {
        const errorSummary = document.getElementById('error-summary');
        if (errorSummary) {
          errorSummary.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 150);
      
      toast.error(`${Object.keys(newErrors).length} erro(s) encontrado(s). Verifique o resumo acima.`);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Converter o formData para o formato necessário para API
  const convertFormDataToApiFormat = (): Omit<Paciente, "idpaciente"> => {
    console.log(
      "FormData antes da conversão:",
      JSON.stringify(formData, null, 2)
    );

    const nome = normalizeText(formData.nome);
    const nome_mae = formData.nome_mae
      ? normalizeText(formData.nome_mae)
      : null;

    // Determinar se há data de nascimento
    const hasDateOfBirth = formData.data_nascimento && formData.data_nascimento.trim() !== '';
    
    const result: any = {
      nome: nome,
      nome_mae: nome_mae,
      data_nascimento: hasDateOfBirth ? formData.data_nascimento : null,
      cpf: formData.cpf || null,
      tipo_genero_idtipo_genero: formData.tipo_genero_idtipo_genero as number,
      gestante: formData.gestante || null,
      tipo_raca_idtipo_raca: formData.tipo_raca_idtipo_raca as number,
      ddi: formData.ddi,
      contato: formData.contato || null,
    };

    // ✅ CORREÇÃO: Lógica de idade adequada
    console.log("🔍 DEBUG - hasDateOfBirth:", hasDateOfBirth);
    console.log("🔍 DEBUG - formData.data_nascimento:", formData.data_nascimento);
    console.log("🔍 DEBUG - formData.idadeUnidade:", formData.idadeUnidade);
    console.log("🔍 DEBUG - formData.idade:", formData.idade);
    console.log("🔍 DEBUG - formData.idadeMeses:", formData.idadeMeses);
    
    if (!hasDateOfBirth) {
      // Se não há data de nascimento, precisamos enviar a idade
      if (formData.idadeUnidade === 'anos' && formData.idade) {
        // Se idade foi digitada em anos, converter para meses para o backend
        const ageInYears = parseInt(formData.idade);
        result.idade = ageInYears * 12; // Backend espera idade total em meses
        console.log(`🔢 Idade convertida: ${ageInYears} anos = ${result.idade} meses para o backend`);
      } else if (formData.idadeUnidade === 'meses' && formData.idadeMeses) {
        // Se idade foi digitada em meses, usar diretamente
        result.idade = parseInt(formData.idadeMeses);
        console.log(`🔢 Idade em meses: ${result.idade} meses para o backend`);
      }
    } else {
      console.log("🔍 DEBUG - Pulando idade pois há data de nascimento");
    }
    // Se há data de nascimento, não enviamos idade - backend calculará

    // Adicionar outros campos
    result.escolaridade_idescolaridade = formData.escolaridade_idescolaridade === ""
      ? null
      : formData.escolaridade_idescolaridade
        ? Number(formData.escolaridade_idescolaridade)
        : null;

    result.cbo_idcbo = !formData.cbo_idcbo ? null : Number(formData.cbo_idcbo);

    console.log("Payload final:", JSON.stringify(result, null, 2));
    return result;
  };

  // ✅ FUNÇÃO CORRIGIDA: Salvar paciente diferenciando criação de edição
  const handleCrearPacienteComDadosLimpos = async () => {
    setApiError(null);
    setIsSuccess(false);

    if (validateForm()) {
      setIsSaving(true);

      try {
        const pacienteData = convertFormDataToApiFormat();
        const pacienteUpperCase = toUpperCaseAllStrings(pacienteData);
          console.log("=== DEBUG SAVE ===");
        console.log("pacienteId:", pacienteId);
        console.log("isOnline:", isOnline);
        console.log("Dados para salvar:", pacienteUpperCase);
        console.log("=================");
        
        if (pacienteId) {
          // ==========================================
          // 🔄 EDIÇÃO: Sempre requer conexão online
          // ==========================================
          console.log(`🔄 Editando paciente ID ${pacienteId}`);
          
          if (isOnline) {
            // ✅ EDIÇÃO ONLINE
            await PacienteService.update(pacienteId, pacienteUpperCase);
          } else {
            // ⚠️ EDIÇÃO OFFLINE: Informar que não é possível
            throw new Error("Não é possível editar pacientes offline. Conecte-se à internet para editar.");
          }
          
        } else {
          // ==========================================
          // ➕ CRIAÇÃO: Online direto, Offline com sistema
          // ==========================================
          console.log("➕ Criando novo paciente");
          
          if (isOnline) {
            // ✅ CRIAÇÃO ONLINE
            await PacienteService.create(pacienteUpperCase);
          } else {
            // ✅ CRIAÇÃO OFFLINE
            await savePatientOfflineSafe(pacienteUpperCase);
          }
        }

        setIsSuccess(true);
        
        // ✅ MENSAGENS ESPECÍFICAS
        let message;
        if (isOnline) {
          message = pacienteId ? "Paciente atualizado com sucesso!" : "Paciente cadastrado com sucesso!";
        } else {
          message = "Paciente salvo offline! Será sincronizado quando conectar.";
        }
        
        toast.success(message);
        console.log("✅ Operação concluída:", message);
          
        if (isModal && onPacienteSalvo) {
          onPacienteSalvo(pacienteUpperCase);
        } else if (!pacienteId) {
          // Só limpar formulário se foi criação (não edição)
          setFormData(initialFormData);
        }
        
      } catch (error: any) {
        console.error("❌ Erro ao salvar paciente:", error);
        
        let errorMessage = "Erro ao salvar paciente";
        let validationErrors: Record<string, string> = {};
        
        // Verificar se é erro de rede para mostrar mensagem offline apropriada
        const isNetworkError = (
          error?.code === 'ERR_NETWORK' ||
          error?.code === 'ERR_INTERNET_DISCONNECTED' ||
          error?.message?.includes('Network Error') ||
          error?.message?.includes('Failed to fetch') ||
          !navigator.onLine
        );

        if (isNetworkError && !isOnline && !pacienteId) {
          // Só para criação offline
          errorMessage = "Você está offline. Os dados serão salvos localmente e sincronizados quando voltar online.";
        } else if (error.response && error.response.data) {
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
          }
          
          if (error.response.data.errors) {
            const backendErrors = error.response.data.errors;
            
            Object.entries(backendErrors).forEach(([key, value]) => {
              const fieldMapping: Record<string, string> = {
                "nome": "nome",
                "nome_mae": "nome_mae",
                "data_nascimento": "data_nascimento",
                "cpf": "cpf",
                "tipo_genero_idtipo_genero": "tipo_genero_idtipo_genero",
                "tipo_raca_idtipo_raca": "tipo_raca_idtipo_raca",
                "escolaridade_idescolaridade": "escolaridade_idescolaridade",
                "contato": "contato"
              };
              
              const fieldName = fieldMapping[key] || key;
              validationErrors[fieldName] = Array.isArray(value) ? value[0] : String(value);
            });
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setApiError(errorMessage);
        toast.error(errorMessage);

        if (Object.keys(validationErrors).length > 0) {
          setErrors(prev => ({...prev, ...validationErrors}));
          
          setExpandedSections({
            identificacao_individuo: true
          });
          
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
    }
  };

  // ========================================
  // COMPONENTE DE RESUMO DE ERROS
  // ========================================
  const ErrorSummary = ({ errors, onFieldClick }: { errors: Record<string, string>, onFieldClick: (fieldName: string) => void }) => {
    const errorEntries = Object.entries(errors);
    
    if (errorEntries.length === 0) return null;    const fieldLabels: Record<string, string> = {
      "nome": "Nome",
      "nome_mae": "Nome da Mãe", 
      "data_nascimento": "Data de Nascimento",
      "idade": "Idade",
      "idadeMeses": "Idade (Meses)",
      "cpf": "CPF",
      "tipo_genero_idtipo_genero": "Identidade de Gênero",
      "gestante": "Gestante",
      "tipo_raca_idtipo_raca": "Raça",
      "escolaridade_idescolaridade": "Escolaridade",
      "cbo_idcbo": "Profissão/Ocupação",
      "contato": "Contato Telefônico",
      "ddi": "DDI"
    };

    return (
      <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg shadow-sm" id="error-summary">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 w-full">
            <h3 className="text-sm font-medium text-red-800">
              {errorEntries.length === 1 
                ? "Há 1 erro que precisa ser corrigido:"
                : `Há ${errorEntries.length} erros que precisam ser corrigidos:`
              }
            </h3>
            <div className="mt-2">
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errorEntries.map(([fieldName, errorMessage]) => (
                  <li key={fieldName} className="flex items-start">
                    <button
                      type="button"
                      onClick={() => onFieldClick(fieldName)}
                      className="text-left hover:underline focus:underline focus:outline-none"
                    >
                      <span className="font-medium">
                        {fieldLabels[fieldName] || fieldName}:
                      </span>{" "}
                      {errorMessage}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-3">
              <p className="text-xs text-red-600">
                💡 Clique em qualquer erro acima para ir diretamente ao campo
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // FUNÇÃO PARA SCROLL PARA CAMPO ESPECÍFICO
  // ========================================
  const scrollToField = (fieldName: string) => {
    if (!expandedSections.identificacao_individuo) {
      setExpandedSections(prev => ({
        ...prev,
        identificacao_individuo: true
      }));
    }
    
    setTimeout(() => {
      const element = document.querySelector(`[name="${fieldName}"]`) || 
                     document.querySelector(`[data-field="${fieldName}"]`);
      
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        
        (element as HTMLElement).style.transform = 'scale(1.02)';
        (element as HTMLElement).style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
          (element as HTMLElement).style.transform = 'scale(1)';
          if ((element as HTMLElement).focus) {
            (element as HTMLElement).focus();
          }
        }, 200);
      }
    }, 100);
  };

  // Handler para submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCrearPacienteComDadosLimpos();
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setApiError(null);
    setIsSuccess(false);
  };

  return (
    <div className={isModal ? "" : "min-h-screen bg-gray-50"}>
      {/* Cabeçalho - só exibir se não for modal */}
      {!isModal && (
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 md:p-6 shadow-lg sticky top-0 z-10">
          <div className="max-w-5xl mx-auto">
            {/* Mobile Layout: Two rows */}
            <div className="block md:hidden">
              {/* First row: Navigation buttons and title */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-white">
                  <button
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                    title="Menu"
                  >
                    <Menu className="h-6 w-6 text-white" />
                  </button>
                  
                  <button
                    onClick={() => window.history.back()}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                    title="Voltar"
                  >
                    <ArrowLeft className="h-6 w-6 text-white" />
                  </button>
                  <UserCircle className="h-6 w-6" />
                  <h1 className="text-lg font-semibold">
                    {pacienteId ? "Editar" : "Novo"}
                  </h1>
                </div>
                
                {/* Status offline indicator - mobile */}
                {!isOnline && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-yellow-900 rounded text-xs font-medium">
                    <WifiOff className="h-3 w-3" />
                    Off
                  </div>
                )}
              </div>
              
              {/* Second row: Action buttons - apenas ícones compactos */}
              <div className="flex gap-1 ml-auto">
                <button
                  type="submit"
                  form="paciente-form"
                  disabled={isSaving || isLoadingOptions}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation"
                  title="Salvar"
                >
                  {isSaving ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving || isLoadingOptions}
                  className="p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors touch-manipulation"
                  title="Limpar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  disabled={isSaving}
                  className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors touch-manipulation"
                  title="Cancelar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Desktop Layout: Single row */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-4 text-white">
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Menu"
                >
                  <Menu className="h-6 w-6 text-white" />
                </button>
                
                <button
                  onClick={() => window.history.back()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Voltar"
                >
                  <ArrowLeft className="h-6 w-6 text-white" />
                </button>
                <UserCircle className="h-8 w-8" />
                <h1 className="text-2xl font-semibold">
                  {pacienteId ? "Editar Paciente" : "Cadastro de Paciente"}
                </h1>
                
                {/* Desktop offline indicator */}
                {!isOnline && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500 text-yellow-900 rounded-full text-sm font-medium">
                    <WifiOff className="h-4 w-4" />
                    Offline
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  form="paciente-form"
                  disabled={isSaving || isLoadingOptions}
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
                  onClick={handleReset}
                  disabled={isSaving || isLoadingOptions}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* SideMenu */}
      {!isModal && (
        <SideMenu 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)}
        />
      )}

      {/* Título do modal (se for modal) */}
      {isModal && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 rounded-t-lg">
          <div className="flex items-center gap-2 text-white">
            <UserCircle className="h-6 w-6" />
            <h2 className="text-xl font-semibold">
              {pacienteId ? "Editar Paciente" : "Cadastro de Paciente"}
            </h2>
            {/* ✅ NOVO: Indicador offline no modal */}
            {!isOnline && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-yellow-900 rounded text-xs font-medium ml-auto">
                <WifiOff className="h-3 w-3" />
                Offline
              </div>
            )}
          </div>
        </div>
      )}

      <main className={isModal ? "p-4" : "max-w-5xl mx-auto p-6"}>
        {/* ✅ NOVO: Status offline detalhado */}
        {!isModal && !isOnline && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 mb-1">
                  Modo Offline Ativo
                </h3>
                <p className="text-sm text-yellow-700 mb-2">
                  {getOfflineStatusMessage()}
                </p>
                <div className="flex items-center gap-4 text-xs text-yellow-600">
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    <span>Usando dados em cache</span>
                  </div>
                  {hasDataToSync() && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{pendingData.total} dados para sincronizar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status - só exibir se não for modal */}
        {!isModal && <ConnectionStatus />}
        
        {/* Estado de carregamento das opções */}
        {isLoadingOptions && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-700">
                {isOnline ? "Carregando opções do formulário..." : "Carregando opções do cache offline..."}
              </p>
            </div>
          </div>
        )}

        {/* Erro ao carregar opções */}
        {loadingError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2 text-yellow-700">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Atenção</p>
                <p className="text-sm">{loadingError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem de erro da API */}
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

        {/* Mensagem de sucesso */}
        {isSuccess && !isModal && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <p>
                {pacienteId
                  ? "Paciente atualizado com sucesso!"
                  : "Paciente cadastrado com sucesso!"}
              </p>
            </div>
          </div>
        )}

        {/* Resumo de Erros */}
        <ErrorSummary 
          errors={errors} 
          onFieldClick={scrollToField}
        />

        <form id="paciente-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Seção Única: Identificação do Indivíduo */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<UserCircle className="h-5 w-5 text-blue-500" />}
              title="3. Identificação do Indivíduo"
              isExpanded={expandedSections.identificacao_individuo}
              onToggle={() => toggleSection("identificacao_individuo")}
            />
            {expandedSections.identificacao_individuo && (
              <div className="p-4 md:p-6 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {/* Nome */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block mb-2 font-medium text-gray-700">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nome"
                      placeholder="Nome do paciente"
                      className={`w-full p-3 border ${
                        errors.nome ? "border-red-500 bg-red-50" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none touch-manipulation`}
                      value={formData.nome}
                      onChange={handleChange}
                      maxLength={100}
                      disabled={isLoading || isLoadingOptions}
                      data-error={errors.nome ? "true" : "false"}
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-500">{errors.nome}</p>
                    )}
                  </div>

                  {/* Nome da Mãe */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block mb-2 font-medium text-gray-700">
                      Nome da Mãe
                    </label>
                    <input
                      type="text"
                      name="nome_mae"
                      placeholder="Nome da mãe do paciente"
                      className={`w-full p-3 border ${
                        errors.nome_mae ? "border-red-500 bg-red-50" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none touch-manipulation`}
                      value={formData.nome_mae}
                      onChange={handleChange}
                      maxLength={100}
                      disabled={isLoading || isLoadingOptions}
                      data-error={errors.nome_mae ? "true" : "false"}
                    />
                    {errors.nome_mae && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.nome_mae}
                      </p>
                    )}
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Data de Nascimento
                    </label>
                    <CustomDateInput
                      name="data_nascimento"
                      className={`w-full p-3 border ${
                        errors.data_nascimento
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none touch-manipulation`}
                      value={formData.data_nascimento}
                      onChange={handleChange}
                      disabled={isLoading || isLoadingOptions}
                      placeholder="DD/MM/AAAA"
                      required={false}
                      data-error={errors.data_nascimento ? "true" : "false"}
                      error={errors.data_nascimento}
                      maxDate={new Date().toISOString().split('T')[0]}
                    />
                  </div>                  {/* Idade com Seletor de Unidade */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Idade
                    </label>
                    <div className="flex items-center gap-2">
                      {/* Seletor de Unidade */}
                      <select
                        name="idadeUnidade"
                        value={formData.idadeUnidade || 'anos'}
                        onChange={handleChange}
                        disabled={!!formData.data_nascimento}
                        className="p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="anos">Anos</option>
                        <option value="meses">Meses</option>
                      </select>

                      {/* Campo de Idade (Anos ou Meses) */}
                      <input
                        type="number"
                        name={formData.idadeUnidade === 'anos' ? 'idade' : 'idadeMeses'}
                        value={formData.idadeUnidade === 'anos' ? (formData.idade || '') : (formData.idadeMeses || '')}
                        onChange={handleChange}
                        placeholder={
                          formData.data_nascimento
                            ? "Calculada"
                            : (formData.idadeUnidade === 'anos' ? 'Anos' : 'Meses')
                        }
                        disabled={!!formData.data_nascimento}
                        min="0"
                        max={formData.idadeUnidade === 'anos' ? "120" : "1440"}
                        className={`flex-1 p-3 border rounded-lg text-sm transition-colors outline-none ${
                          (errors.idade || errors.idadeMeses)
                            ? "border-red-500 bg-red-50" 
                            : formData.data_nascimento
                              ? "border-gray-300 bg-gray-200 text-gray-600 cursor-not-allowed opacity-75"
                              : "border-gray-200 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        }`}
                        data-error={(errors.idade || errors.idadeMeses) ? "true" : "false"}
                      />
                    </div>
                    {formData.data_nascimento && (
                      <p className="mt-1 text-xs text-gray-500">
                        Calculada automaticamente: {(() => {
                          const totalMeses = parseInt(formData.idadeMeses || '0');
                          const anos = parseInt(formData.idade || '0');
                          
                          // Se tem menos de 12 meses, mostrar só os meses
                          if (totalMeses < 12) {
                            return `${totalMeses} ${totalMeses === 1 ? 'mês' : 'meses'}`;
                          }
                          // Se tem 12 meses ou mais, mostrar só os anos
                          else {
                            return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
                          }
                        })()}
                      </p>
                    )}
                    {!formData.data_nascimento && (
                      <p className="mt-1 text-xs text-gray-500">
                        Preencha apenas se não souber a data de nascimento exata
                      </p>
                    )}
                    {(errors.idade || errors.idadeMeses) && (
                      <p className="mt-1 text-sm text-red-500">{errors.idade || errors.idadeMeses}</p>
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
                        errors.cpf ? "border-red-500 bg-red-50" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={
                        formData.cpf ? displayFormattedCPF(formData.cpf) : ""
                      }
                      onChange={handleCPFChange}
                      maxLength={14}
                      disabled={isLoading || isLoadingOptions}
                      data-error={errors.cpf ? "true" : "false"}                    />
                    {errors.cpf && (
                      <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>
                    )}
                    {/* Mensagem de CPF disponível */}
                    {cpfAvailableMessage && (
                      <p className="mt-1 text-sm text-green-600">{cpfAvailableMessage}</p>
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
                      name="tipo_genero_idtipo_genero"
                      className={`w-full p-3 border ${
                        errors.tipo_genero_idtipo_genero
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.tipo_genero_idtipo_genero}
                      onChange={handleChange}
                      disabled={isLoading || isLoadingOptions}
                      data-error={errors.tipo_genero_idtipo_genero ? "true" : "false"}
                    >
                      <option value="">Selecione</option>
                      {generoOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.descricao}
                        </option>
                      ))}
                    </select>
                    {errors.tipo_genero_idtipo_genero && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.tipo_genero_idtipo_genero}
                      </p>
                    )}
                  </div>

                  {/* Gestante (condicional - apenas para mulher cisgênero e homem transgênero) */}
                  {(typeof formData.tipo_genero_idtipo_genero === "number" &&
                    (formData.tipo_genero_idtipo_genero === 1 || formData.tipo_genero_idtipo_genero === 4)) && (
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Gestante
                        </label>
                        <select
                          name="gestante"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.gestante}
                          onChange={handleChange}
                          disabled={isLoading || isLoadingOptions}
                        >
                          <option value="">Selecione</option>
                          {gestanteOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                  {/* Raça */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Raça <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tipo_raca_idtipo_raca"
                      className={`w-full p-3 border ${
                        errors.tipo_raca_idtipo_raca
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.tipo_raca_idtipo_raca}
                      onChange={handleChange}
                      disabled={isLoading || isLoadingOptions}
                      data-error={errors.tipo_raca_idtipo_raca ? "true" : "false"}
                    >
                      <option value="">Selecione</option>
                      {racaOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.descricao}
                        </option>
                      ))}
                    </select>
                    {errors.tipo_raca_idtipo_raca && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.tipo_raca_idtipo_raca}
                      </p>
                    )}
                  </div>

                  {/* Escolaridade */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Escolaridade
                    </label>
                    <select
                      name="escolaridade_idescolaridade"
                      className={`w-full p-3 border ${
                        errors.escolaridade_idescolaridade 
                          ? "border-red-500 bg-red-50" 
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.escolaridade_idescolaridade}
                      onChange={handleChange}
                      disabled={isLoading || isLoadingOptions}
                      data-error={errors.escolaridade_idescolaridade ? "true" : "false"}
                    >
                      <option value="">Selecione</option>
                      {escolaridadeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.descricao}
                        </option>
                      ))}
                    </select>
                    {errors.escolaridade_idescolaridade && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.escolaridade_idescolaridade}
                      </p>
                    )}
                  </div>

                  {/* Profissão/Ocupação com pesquisa */}
                  <div>
                    <CboInput
                      name="cbo_idcbo"
                      value={formData.cbo_idcbo?.toString() || ""}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          cbo_idcbo:
                            value && value.trim() !== ""
                              ? parseInt(value)
                              : null,
                        }));
                      }}
                      placeholder="Pesquisar profissão"
                      label="Profissão/Ocupação (CBO)"
                      disabled={isLoading || isLoadingOptions}
                    />
                  </div>

                  {/* Contato Telefônico */}
                  <div>
                    <PhoneInput
                      name="contato"
                      value={formData.contato}
                      ddi={formData.ddi}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          contato: value,
                        }));
                        
                        if (errors.contato) {
                          setErrors(prev => {
                            const newErrors = {...prev};
                            delete newErrors.contato;
                            return newErrors;
                          });
                        }
                      }}
                      onChangeWithCode={(ddiValue, phoneNumber) => {
                        setFormData((prev) => ({
                          ...prev,
                          ddi: ddiValue,
                          contato: phoneNumber,
                        }));
                        
                        if (errors.contato) {
                          setErrors(prev => {
                            const newErrors = {...prev};
                            delete newErrors.contato;
                            return newErrors;
                          });
                        }
                      }}
                      label="Contato Telefônico"
                      placeholder="Digite o número de telefone"
                      data-error={errors.contato ? "true" : "false"}
                    />
                    {errors.contato && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.contato}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação (Inferiores) */}
          <div className="mt-6 md:mt-8">
            {/* Mobile Layout: Full-width stacked buttons */}
            <div className="flex flex-col gap-3 sm:hidden">
              <button
                type="submit"
                disabled={isSaving || isLoadingOptions}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation"
              >
                {isSaving ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
              {!isModal && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving || isLoadingOptions}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors touch-manipulation"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar
                </button>
              )}
              <button
                type="button"
                onClick={
                  isModal ? () => onClose?.() : () => window.history.back()
                }
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors touch-manipulation"
              >
                <X className="h-4 w-4" />
                {isModal ? "Cancelar" : "Cancelar"}
              </button>
            </div>

            {/* Desktop Layout: Centered horizontal buttons */}
            <div className="hidden sm:flex justify-center space-x-4">
              <button
                type="submit"
                disabled={isSaving || isLoadingOptions}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
              {!isModal && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving || isLoadingOptions}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar
                </button>
              )}
              <button
                type="button"
                onClick={
                  isModal ? () => onClose?.() : () => window.history.back()
                }
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
                {isModal ? "Cancelar" : "Cancelar"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default FormularioPaciente;
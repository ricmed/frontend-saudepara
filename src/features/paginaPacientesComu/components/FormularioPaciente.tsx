import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  User,
  Save,
  Plus,
  X,
  ArrowLeft,
  Calendar,
  Phone,
  UserCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Loader
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

// Interface para as props do componente
interface FormularioPacienteProps {
  isModal?: boolean;
  isNewPatient?: boolean; // Nova prop para indicar explicitamente que é um novo paciente
  onPacienteSalvo?: (paciente: Omit<Paciente, "idpaciente">) => void;
  onClose?: () => void;
  pacienteId?: number; // ID para edição, se aplicável
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
}

// Opções default para os dropdowns (serão substituídas por dados do banco)
const gestanteOptions = [
  { value: "S", label: "Sim" },
  { value: "N", label: "Não" },
];

// Modificar a função de normalização para garantir a remoção de acentos e cedilhas
function normalizeText(text: string): string {
  if (!text) return "";

  // Remove acentos e cedilhas e converte para caixa alta
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove completamente todos os acentos
    .toUpperCase();
}

// Modificar a função toUpperCaseAllStrings para também aplicar normalização de texto
const toUpperCaseAllStrings = (obj: any): any => {
  if (!obj) return obj;

  if (typeof obj === "string") {
    // Além de colocar em caixa alta, normalizar para remover acentos/cedilhas
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
  isNewPatient = false, // Definir valor padrão
  onPacienteSalvo,
  onClose,
  pacienteId: propPacienteId,
}: FormularioPacienteProps) => {
  const { id } = useParams();
  // Se isNewPatient for true, ignorar qualquer pacienteId
  const pacienteId = isNewPatient ? undefined : (propPacienteId || (id ? parseInt(id) : undefined));
  const initialFormData: PacienteFormData = {
    nome: "",
    nome_mae: "",
    data_nascimento: "",
    cpf: "",
    tipo_genero_idtipo_genero: "",
    gestante: "",
    tipo_raca_idtipo_raca: "",
    escolaridade_idescolaridade: "",
    cbo_idcbo: null,
    ddi: "55", // Padrão para Brasil
    contato: "",
  };

  // Estados para dados do formulário e comportamento
  const [formData, setFormData] = useState<PacienteFormData>(initialFormData);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false); // Novo estado para controle de salvamento

  // Estados para os dados dos dropdowns carregados do banco
  const [generoOptions, setGeneroOptions] = useState<OptionItem[]>([]);
  const [racaOptions, setRacaOptions] = useState<OptionItem[]>([]);
  const [escolaridadeOptions, setEscolaridadeOptions] = useState<OptionItem[]>(
    []
  );
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalCpf, setOriginalCpf] = useState<string>(""); // Armazenar CPF original para validação

  // Estado para controlar seções expandidas
  const [expandedSections, setExpandedSections] = useState({
    dados_pessoais: true,
    dados_complementares: true,
    contato: true,
  });

  // Estado para mostrar/esconder o popover de ajuda de identidade de gênero
  const [showGenderHelp, setShowGenderHelp] = useState<boolean>(false);

  // Carregar as opções de dropdown do banco de dados
  useEffect(() => {
    const loadDropdownOptions = async () => {
      setIsLoadingOptions(true);
      setLoadingError(null);

      try {
        // Carregar gêneros
        const generos = await PacienteService.getTiposGenero();
        setGeneroOptions(
          generos.map((option) => ({
            ...option,
            descricao: normalizeText(option.descricao),
          }))
        );

        // Carregar raças
        const racas = await PacienteService.getTiposRaca();
        setRacaOptions(
          racas.map((option) => ({
            ...option,
            descricao: normalizeText(option.descricao),
          }))
        );

        // Carregar escolaridades
        const escolaridades = await PacienteService.getTiposEscolaridade();
        setEscolaridadeOptions(
          escolaridades.map((option) => ({
            ...option,
            descricao: normalizeText(option.descricao),
          }))
        );
      } catch (error) {
        console.error("Erro ao carregar opções de dropdown:", error);
        setLoadingError(
          "Não foi possível carregar todas as opções. Tente recarregar a página."
        );
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadDropdownOptions();
  }, []);

  // Carregar dados do paciente se for edição
  useEffect(() => {
    if (pacienteId) {
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
          }

          // Formatar a data de nascimento e calcular a idade
          const formattedDate = pacienteUpperCase.data_nascimento
            ? new Date(pacienteUpperCase.data_nascimento)
                .toISOString()
                .split("T")[0]
            : "";

          // Calcular a idade se tiver data de nascimento
          const calculatedAge = formattedDate
            ? calculateAge(formattedDate)
            : "";

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
            cbo_idcbo: pacienteUpperCase.cbo_idcbo || null,
            ddi: pacienteUpperCase.ddi || "55",
            contato: pacienteUpperCase.contato || "",
            idade: calculatedAge,
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
  }, [pacienteId]);

  useEffect(() => {
    // Se a data de nascimento está vazia, limpar a idade e habilitar o campo
    if (!formData.data_nascimento) {
      setFormData((prev) => ({
        ...prev,
        idade: "",
      }));
    }
    // Se a data de nascimento existe, calcular a idade
    else {
      const calculatedAge = calculateAge(formData.data_nascimento);

      // Verificar se a idade é válida (não maior que 120)
      const age = parseInt(calculatedAge);
      if (!isNaN(age) && age > 120) {
        setErrors((prev) => ({
          ...prev,
          data_nascimento: "A idade não pode ser maior que 120 anos",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        idade: calculatedAge,
      }));

      // Limpar erro de data de nascimento se existir
      if (errors.data_nascimento) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.data_nascimento;
          return newErrors;
        });
      }
    }
  }, [formData.data_nascimento]);

  // Efeito para resetar o formulário quando isNewPatient for true
  useEffect(() => {
    if (isNewPatient) {
      // Resetar explicitamente para o estado inicial quando for um novo paciente
      setFormData(initialFormData);
      setErrors({});
      setApiError(null);
      setIsSuccess(false);
      setOriginalCpf(""); // Importante também resetar o CPF original
      console.log("Formulário resetado para novo paciente");
    }
  }, [isNewPatient]);

  // Função para verificar se o CPF já existe
  const searchCpfExists = async (cpf: string): Promise<boolean> => {
    // Não verificar CPFs vazios ou incompletos
    if (!cpf || cpf.length !== 11) return false;
    
    try {
      // Use a função do serviço, mas inverta o resultado
      // já que checkCpfAvailable retorna true se o CPF está DISPONÍVEL (não existe)
      const isAvailable = await PacienteService.checkCpfAvailable(cpf);
      return !isAvailable; // Inverte para ter true quando o CPF JÁ EXISTE
    } catch (error) {
      console.error("Erro ao verificar CPF:", error);
      return false;
    }
  };

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

  // Handler genérico para mudanças nos campos - modificado para normalizar texto
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
      // Converter para número ou vazio
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else if (
      name === "tipo_genero_idtipo_genero" ||
      name === "tipo_raca_idtipo_raca"
    ) {
      // Outros campos numéricos obrigatórios
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else if (name === "nome" || name === "nome_mae") {
      // Normalizar texto: remove acentos, cedilha e converte para maiúsculas
      const normalizedValue = normalizeText(value);
      // Limitar a 100 caracteres
      const limitedValue = normalizedValue.slice(0, 100);

      setFormData((prev) => ({
        ...prev,
        [name]: limitedValue,
      }));
    } else if (name === "data_nascimento") {
      // Usar uma verificação mais rigorosa para considerar o campo vazio
      if (!value || value === "" || value.trim() === "") {
        console.log("Campo de data limpo:", value); // Debugging temporário
        setFormData((prev) => ({
          ...prev,
          [name]: "",
          idade: "", // Limpar a idade
        }));

        // Limpar erro se existir
        if (errors.data_nascimento) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.data_nascimento;
            return newErrors;
          });
        }
      } else {
        // Verificar se a data é futura
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Remover horas para comparação justa
        
        if (selectedDate > today) {
          setErrors(prev => ({
            ...prev,
            data_nascimento: "A data de nascimento não pode ser futura"
          }));
          return;
        }
        
        // Se tem data, calcular a idade automaticamente
        const age = calculateAge(value);

        // Verificar se a idade é válida (não maior que 120)
        const ageNum = parseInt(age);
        if (!isNaN(ageNum) && ageNum > 120) {
          setErrors((prev) => ({
            ...prev,
            data_nascimento: "A idade não pode ser maior que 120 anos",
          }));
          return;
        }

        setFormData((prev) => ({
          ...prev,
          [name]: value,
          idade: age,
        }));
      }
    } else if (name === "idade") {
      // Se a idade for alterada manualmente (apenas quando data_nascimento estiver vazia)
      if (!formData.data_nascimento) {
        const ageValue = value === "" ? "" : value;
        const ageNum = parseInt(ageValue);

        // Verificar se a idade é maior que 120
        if (!isNaN(ageNum) && ageNum > 120) {
          setErrors((prev) => ({
            ...prev,
            idade: "A idade não pode ser maior que 120 anos",
          }));
          return;
        }

        setFormData((prev) => ({ ...prev, idade: ageValue }));
      }
    } else {
      // Campos de texto simples - converter para caixa alta
      let newValue = value;
      if (typeof newValue === "string") {
        newValue = newValue.toUpperCase();
      }
      setFormData((prev) => ({ ...prev, [name]: newValue }));
    }
  };

  // Handler para validação do CPF
  const formatCPF = (cpf: string) => {
    // Remove qualquer caractere que não seja número
    return cpf.replace(/\D/g, "").slice(0, 11);
  };

  // Nova função para exibir CPF formatado
  const displayFormattedCPF = (cpf: string) => {
    // Remove qualquer caractere que não seja número
    const cleanCPF = cpf.replace(/\D/g, "").slice(0, 11);

    // Se o CPF não tiver 11 dígitos, retorna ele apenas limpo
    if (cleanCPF.length !== 11) return cleanCPF;

    // Formata como XXX.XXX.XXX-XX
    return `${cleanCPF.substring(0, 3)}.${cleanCPF.substring(3, 6)}.${cleanCPF.substring(6, 9)}-${cleanCPF.substring(9)}`;
  };

  const handleCPFChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Remove formatação para armazenar apenas os dígitos no estado
    const formattedCPF = formatCPF(rawValue);
  
    setFormData((prev) => ({
      ...prev,
      cpf: formattedCPF,
    }));
  
    // Limpar erro anterior, se houver
    if (errors.cpf) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.cpf;
        return newErrors;
      });
    }
    
    // Verificar CPF existente se tiver 11 dígitos e for diferente do original
    if (formattedCPF.length === 11 && formattedCPF !== originalCpf) {
      try {
        // Adicionar indicador visual de verificação em andamento
        setErrors(prev => ({
          ...prev,
          cpf: "Verificando CPF..."
        }));
        
        const exists = await searchCpfExists(formattedCPF);
        
        if (exists) {
          setErrors((prev) => ({
            ...prev,
            cpf: "O CPF digitado já existe",
          }));
          console.log("CPF existente detectado:", formattedCPF);
        } else {
          // Limpar o erro se o CPF não existir
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.cpf;
            return newErrors;
          });
        }
      } catch (error) {
        console.error("Erro ao verificar CPF:", error);
        setErrors(prev => ({
          ...prev,
          cpf: "Erro ao verificar CPF"
        }));
      }
    }
  };

  // Validar o formulário antes de enviar
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar nome
    if (!formData.nome.trim()) {
      newErrors.nome = "O campo nome é obrigatório";
    } else if (formData.nome.length > 100) {
      newErrors.nome = "O campo nome deve ter no máximo 100 caracteres";
    }

    // Validar nome_mae (opcional)
    if (formData.nome_mae && formData.nome_mae.length > 100) {
      newErrors.nome_mae =
        "O campo nome da mãe deve ter no máximo 100 caracteres";
    }

    // Validar data_nascimento
    if (!formData.data_nascimento) {
      newErrors.data_nascimento = "O campo data de nascimento é obrigatório";
    } else {
      const date = new Date(formData.data_nascimento);
      if (isNaN(date.getTime())) {
        newErrors.data_nascimento = "Data de nascimento inválida";
      } else {
        // Verificar se a data de nascimento não resulta em idade maior que 120 anos
        const age = parseInt(calculateAge(formData.data_nascimento));
        if (age > 120) {
          newErrors.data_nascimento = "A idade não pode ser maior que 120 anos";
        }
        
        // Verificar se a data não é futura
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Zerar horas para comparação justa
        if (date > today) {
          newErrors.data_nascimento = "A data de nascimento não pode ser futura";
        }
      }
    }

    // Validar idade quando não há data de nascimento
    if (!formData.data_nascimento && formData.idade) {
      const age = parseInt(formData.idade);
      if (isNaN(age)) {
        newErrors.idade = "Idade inválida";
      } else if (age > 120) {
        newErrors.idade = "A idade não pode ser maior que 120 anos";
      } else if (age < 0) {
        newErrors.idade = "A idade não pode ser negativa";
      }
    }

    // Validar CPF (opcional)
    if (formData.cpf && formData.cpf.length > 0 && formData.cpf.length !== 11) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }

    // Validar tipo de gênero
    if (!formData.tipo_genero_idtipo_genero) {
      newErrors.tipo_genero_idtipo_genero =
        "O campo tipo de gênero é obrigatório";
    }

    // Validar tipo de raça
    if (!formData.tipo_raca_idtipo_raca) {
      newErrors.tipo_raca_idtipo_raca = "O campo tipo de raça é obrigatório";
    }

    // Validar contato (opcional)
    if (formData.contato && formData.contato.length > 15) {
      newErrors.contato = "O contato deve ter no máximo 15 caracteres";
    }

    setErrors(newErrors);
    
    // Se houver erros, expandir as seções relevantes e fazer scroll
    if (Object.keys(newErrors).length > 0) {
      // Expandir seções com erros
      const newExpandedSections = { ...expandedSections };
      
      if (newErrors.nome || newErrors.nome_mae || newErrors.data_nascimento || 
          newErrors.idade || newErrors.cpf) {
        newExpandedSections.dados_pessoais = true;
      }
      
      if (newErrors.tipo_genero_idtipo_genero || newErrors.tipo_raca_idtipo_raca || 
          newErrors.escolaridade_idescolaridade) {
        newExpandedSections.dados_complementares = true;
      }
      
      if (newErrors.contato) {
        newExpandedSections.contato = true;
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
        }
      }, 100);
      
      // Exibir toast com resumo
      toast.error("Corrija os erros no formulário para continuar");
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Converter o formData para o formato necessário para API
  const convertFormDataToApiFormat = (): Omit<Paciente, "idpaciente"> => {
    console.log(
      "FormData antes da conversão:",
      JSON.stringify(formData, null, 2)
    );

    // Garantir nomes normalizados (sem acentos e em caixa alta)
    const nome = normalizeText(formData.nome);
    const nome_mae = formData.nome_mae
      ? normalizeText(formData.nome_mae)
      : null;

    // Iniciar com os dados obrigatórios
    const result: any = {
      nome: nome,
      nome_mae: nome_mae,
      data_nascimento: formData.data_nascimento,
      cpf: formData.cpf || null,
      tipo_genero_idtipo_genero: formData.tipo_genero_idtipo_genero as number,
      gestante: formData.gestante || null,
      tipo_raca_idtipo_raca: formData.tipo_raca_idtipo_raca as number,
      ddi: formData.ddi,
      contato: formData.contato || null,

      // Definir explicitamente como null quando vazio
      escolaridade_idescolaridade:
        formData.escolaridade_idescolaridade === ""
          ? null
          : formData.escolaridade_idescolaridade
            ? Number(formData.escolaridade_idescolaridade)
            : null,

      cbo_idcbo: !formData.cbo_idcbo ? null : Number(formData.cbo_idcbo),
    };

    console.log("Payload final:", JSON.stringify(result, null, 2));
    return result;
  };

  // Melhorado: tratamento de erros do backend
  const handleCrearPacienteComDadosLimpos = async () => {
    // Limpar mensagens anteriores
    setApiError(null);
    setIsSuccess(false);

    if (validateForm()) {
      setIsSaving(true);

      try {
        // Converter dados do formulário para o formato da API
        const pacienteData = convertFormDataToApiFormat();

        // Garantir que todos os dados de texto estejam em caixa alta
        const pacienteUpperCase = toUpperCaseAllStrings(pacienteData);
        console.log("Dados para salvar em caixa alta:", pacienteUpperCase);

        // Criar ou atualizar paciente
        if (pacienteId) {
          await PacienteService.update(pacienteId, pacienteUpperCase);
        } else {
          await PacienteService.create(pacienteUpperCase);
        }

        // Sucesso!
        setIsSuccess(true);
        toast.success(pacienteId 
          ? "Paciente atualizado com sucesso!" 
          : "Paciente cadastrado com sucesso!");
          
        if (isModal && onPacienteSalvo) {
          onPacienteSalvo(pacienteUpperCase);
        } else if (!pacienteId) {
          setFormData(initialFormData); // Limpar formulário se for criação
        }
      } catch (error: any) {
        // Melhor tratamento de erros do backend
        let errorMessage = "Erro ao salvar paciente";
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
            
            // Mapear os erros do backend para campos do formulário
            Object.entries(backendErrors).forEach(([key, value]) => {
              // Mapeamento de campos conforme necessário
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
        
        // Adicionar erros de validação de campos específicos
        if (Object.keys(validationErrors).length > 0) {
          setErrors(prev => ({...prev, ...validationErrors}));
          
          // Expandir seções com erros
          const sectionsToExpand = { ...expandedSections };
          
          // Determinar quais seções expandir com base nos erros
          Object.keys(validationErrors).forEach(field => {
            if (["nome", "nome_mae", "data_nascimento", "idade", "cpf"].includes(field)) {
              sectionsToExpand.dados_pessoais = true;
            } else if (["tipo_genero_idtipo_genero", "tipo_raca_idtipo_raca", "escolaridade_idescolaridade"].includes(field)) {
              sectionsToExpand.dados_complementares = true;
            } else if (["contato", "ddi"].includes(field)) {
              sectionsToExpand.contato = true;
            }
          });
          
          setExpandedSections(sectionsToExpand);
          
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
    }
  };

  // Substitua o handleSubmit pela nova implementação
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
              <UserCircle className="h-8 w-8" />
              <h1 className="text-2xl font-semibold">
                {pacienteId ? "Editar Paciente" : "Cadastro de Paciente"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Botões de Ação (CABEÇALHO) */}
              <button
                type="submit"
                form="paciente-form"
                disabled={isSaving || isLoadingOptions}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${
                  isSaving || isLoadingOptions
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
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
                className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                  isSaving || isLoadingOptions
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
              >
                <Plus className="h-4 w-4" />
                Novo Registro
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                disabled={isSaving}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${
                  isSaving ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Título do modal (se for modal) */}
      {isModal && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 rounded-t-lg">
          <div className="flex items-center gap-2 text-white">
            <UserCircle className="h-6 w-6" />
            <h2 className="text-xl font-semibold">
              {pacienteId ? "Editar Paciente" : "Cadastro de Paciente"}
            </h2>
          </div>
        </div>
      )}

      <main className={isModal ? "p-4" : "max-w-5xl mx-auto p-6"}>
        {/* Estado de carregamento das opções */}
        {isLoadingOptions && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-700">
                Carregando opções do formulário...
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

        <form id="paciente-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Seção 1: Dados Pessoais */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<User className="h-5 w-5 text-blue-500" />}
              title="1. Dados Pessoais"
              isExpanded={expandedSections.dados_pessoais}
              onToggle={() => toggleSection("dados_pessoais")}
            />
            {expandedSections.dados_pessoais && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nome"
                      placeholder="Nome completo do paciente"
                      className={`w-full p-3 border ${
                        errors.nome ? "border-red-500 bg-red-50" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
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
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Nome da Mãe
                    </label>
                    <input
                      type="text"
                      name="nome_mae"
                      placeholder="Nome da mãe do paciente"
                      className={`w-full p-3 border ${
                        errors.nome_mae ? "border-red-500 bg-red-50" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
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
                      Data de Nascimento <span className="text-red-500">*</span>
                    </label>
                    <CustomDateInput
                      name="data_nascimento"
                      className={`w-full p-3 border ${
                        errors.data_nascimento
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.data_nascimento}
                      onChange={handleChange}
                      disabled={isLoading || isLoadingOptions}
                      placeholder="DD/MM/AAAA"
                      required={true}
                      data-error={errors.data_nascimento ? "true" : "false"}
                      error={errors.data_nascimento}
                      // Impedir datas futuras
                      maxDate={new Date().toISOString().split('T')[0]}
                    />
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
                        formData.data_nascimento
                          ? "Calculada automaticamente"
                          : "Digite a idade"
                      }
                      className={`w-full p-3 border ${errors.idade ? "border-red-500 bg-red-50" : "border-gray-200"} rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${
                        formData.data_nascimento
                          ? "bg-gray-100 text-gray-700"
                          : ""
                      }`}
                      value={formData.idade || ""}
                      onChange={handleChange}
                      disabled={Boolean(formData.data_nascimento)} // Importante: converter explicitamente para booleano
                      min="0"
                      max="120"
                      data-error={errors.idade ? "true" : "false"}
                    />
                    {formData.data_nascimento ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Idade calculada a partir da data de nascimento
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        Preencha apenas se não souber a data de nascimento exata
                      </p>
                    )}
                    {errors.idade && (
                      <p className="mt-1 text-sm text-red-500">
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
                        errors.cpf ? "border-red-500 bg-red-50" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={
                        formData.cpf ? displayFormattedCPF(formData.cpf) : ""
                      }
                      onChange={handleCPFChange}
                      maxLength={14}
                      disabled={isLoading || isLoadingOptions}
                      data-error={errors.cpf ? "true" : "false"}
                    />
                    {errors.cpf && (
                      <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 2: Dados Complementares */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<UserCircle className="h-5 w-5 text-purple-500" />}
              title="2. Dados Complementares"
              isExpanded={expandedSections.dados_complementares}
              onToggle={() => toggleSection("dados_complementares")}
            />
            {expandedSections.dados_complementares && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  {/* Gestante (condicional - apenas para mulher cisgênero) */}
                  {typeof formData.tipo_genero_idtipo_genero === "number" &&
                    formData.tipo_genero_idtipo_genero === 1 && (
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
                        console.log(
                          `Alterando cbo_idcbo para: "${value}" (${typeof value})`
                        );
                        setFormData((prev) => ({
                          ...prev,
                          // Garantir que valores vazios sejam null, não 0 ou string vazia
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
                </div>
              </div>
            )}
          </div>

          {/* Seção 3: Contato */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<Phone className="h-5 w-5 text-green-500" />}
              title="3. Contato"
              isExpanded={expandedSections.contato}
              onToggle={() => toggleSection("contato")}
            />
            {expandedSections.contato && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contato Telefônico */}
                  <div>
                    <PhoneInput
                      name="contato"
                      value={formData.contato}
                      ddi={formData.ddi} // Adicione esta linha para passar o DDI atual
                      onChange={(value) => {
                        // Este callback continuará funcionando para compatibilidade
                        setFormData((prev) => ({
                          ...prev,
                          contato: value,
                        }));
                        
                        // Limpar erro se existir
                        if (errors.contato) {
                          setErrors(prev => {
                            const newErrors = {...prev};
                            delete newErrors.contato;
                            return newErrors;
                          });
                        }
                      }}
                      onChangeWithCode={(ddiValue, phoneNumber) => {
                        // Novo callback para atualizar separadamente o DDI e o número
                        setFormData((prev) => ({
                          ...prev,
                          ddi: ddiValue, // Atualiza o DDI no estado
                          contato: phoneNumber, // Atualiza apenas o número no estado
                        }));
                        
                        // Limpar erro se existir
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
          <div className="flex justify-center gap-4 mt-8 pb-8">
            <button
              type="submit"
              disabled={isSaving || isLoadingOptions}
              className={`inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                isSaving || isLoadingOptions
                  ? "opacity-70 cursor-not-allowed"
                  : ""
              }`}
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
                className={`inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                  isSaving || isLoadingOptions
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
              >
                <Plus className="h-4 w-4" />
                Novo Registro
              </button>
            )}
            <button
              type="button"
              onClick={
                isModal ? () => onClose?.() : () => window.history.back()
              }
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
                isSaving ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <X className="h-4 w-4" />
              {isModal ? "Cancelar" : "Voltar"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default FormularioPaciente;
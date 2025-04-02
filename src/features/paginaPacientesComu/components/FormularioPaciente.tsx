import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
} from "lucide-react";
import CboInput from "@/features/notificationForms/components/CboInput";
import PhoneInput from "@/features/notificationForms/components/PhoneInput";
import {
  PacienteService,
  Paciente,
  OptionItem,
} from "@/services/PacienteService";

// Interface para as props do componente
interface FormularioPacienteProps {
  isModal?: boolean;
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
  return text.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Remove completamente todos os acentos
    .toUpperCase();
}

// Modificar a função toUpperCaseAllStrings para também aplicar normalização de texto
const toUpperCaseAllStrings = (obj: any): any => {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    // Além de colocar em caixa alta, normalizar para remover acentos/cedilhas
    return normalizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => toUpperCaseAllStrings(item));
  }
  
  if (typeof obj === 'object') {
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
  onPacienteSalvo,
  onClose,
  pacienteId: propPacienteId,
}: FormularioPacienteProps) => {
  const { id } = useParams();
  const pacienteId = propPacienteId || (id ? parseInt(id) : undefined);
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

  // Estados para os dados dos dropdowns carregados do banco
  const [generoOptions, setGeneroOptions] = useState<OptionItem[]>([]);
  const [racaOptions, setRacaOptions] = useState<OptionItem[]>([]);
  const [escolaridadeOptions, setEscolaridadeOptions] = useState<OptionItem[]>(
    []
  );
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado para controlar seções expandidas
  const [expandedSections, setExpandedSections] = useState({
    dados_pessoais: true,
    dados_complementares: true,
    contato: true,
  });

  // Carregar as opções de dropdown do banco de dados
  useEffect(() => {
    const loadDropdownOptions = async () => {
      setIsLoadingOptions(true);
      setLoadingError(null);

      try {
        // Carregar gêneros
        const generos = await PacienteService.getTiposGenero();
        setGeneroOptions(generos.map(option => ({
          ...option,
          descricao: normalizeText(option.descricao)
        })));

        // Carregar raças
        const racas = await PacienteService.getTiposRaca();
        setRacaOptions(racas.map(option => ({
          ...option,
          descricao: normalizeText(option.descricao)
        })));

        // Carregar escolaridades
        const escolaridades = await PacienteService.getTiposEscolaridade();
        setEscolaridadeOptions(escolaridades.map(option => ({
          ...option,
          descricao: normalizeText(option.descricao)
        })));
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

          // Verificação adicional para escolaridade
          let escolaridadeId = null;
          if (
            pacienteUpperCase.escolaridade_idescolaridade !== null &&
            pacienteUpperCase.escolaridade_idescolaridade !== undefined
          ) {
            escolaridadeId = Number(pacienteUpperCase.escolaridade_idescolaridade);
          }

          setFormData({
            nome: pacienteUpperCase.nome || "",
            nome_mae: pacienteUpperCase.nome_mae || "",
            data_nascimento: pacienteUpperCase.data_nascimento
              ? new Date(pacienteUpperCase.data_nascimento).toISOString().split("T")[0]
              : "",
            cpf: pacienteUpperCase.cpf || "",
            tipo_genero_idtipo_genero: pacienteUpperCase.tipo_genero_idtipo_genero || "",
            gestante: pacienteUpperCase.gestante || "",
            tipo_raca_idtipo_raca: pacienteUpperCase.tipo_raca_idtipo_raca || "",
            escolaridade_idescolaridade:
              escolaridadeId === null ? "" : escolaridadeId,
            cbo_idcbo: pacienteUpperCase.cbo_idcbo || null,
            ddi: pacienteUpperCase.ddi || "55",
            contato: pacienteUpperCase.contato || "",
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
    if (name === 'escolaridade_idescolaridade') {
      // Converter para número ou vazio
      setFormData(prev => ({
        ...prev,
        [name]: value === "" ? "" : Number(value)
      }));
    } 
    else if (name === 'tipo_genero_idtipo_genero' || name === 'tipo_raca_idtipo_raca') {
      // Outros campos numéricos obrigatórios
      setFormData(prev => ({
        ...prev,
        [name]: value === "" ? "" : Number(value)
      }));
    }
    else if (name === 'nome' || name === 'nome_mae') {
      // Normalizar texto: remove acentos, cedilha e converte para maiúsculas
      const normalizedValue = normalizeText(value);
      // Limitar a 100 caracteres
      const limitedValue = normalizedValue.slice(0, 100);
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: limitedValue 
      }));
    } 
    else {
      // Campos de texto simples - converter para caixa alta
      let newValue = value;
      if (typeof newValue === 'string') {
        newValue = newValue.toUpperCase();
      }
      setFormData(prev => ({ ...prev, [name]: newValue }));
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

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Remove formatação para armazenar apenas os dígitos no estado
    const formattedCPF = formatCPF(rawValue);

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
    const nome_mae = formData.nome_mae ? normalizeText(formData.nome_mae) : null;

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

  // Adicione uma função para criar um novo paciente com dados limpos
  const handleCrearPacienteComDadosLimpos = async () => {
    // Limpar mensagens anteriores
    setApiError(null);
    setIsSuccess(false);

    if (validateForm()) {
      setIsLoading(true);

      try {
        // Converter dados do formulário para o formato da API
        const pacienteData = convertFormDataToApiFormat();
        
        // Garantir que todos os dados de texto estejam em caixa alta
        const pacienteUpperCase = toUpperCaseAllStrings(pacienteData);
        console.log("Dados para salvar em caixa alta:", pacienteUpperCase);

        // Criar ou atualizar paciente
        let paciente;

        if (pacienteId) {
          paciente = await PacienteService.update(pacienteId, pacienteUpperCase);
        } else {
          paciente = await PacienteService.create(pacienteUpperCase);
        }

        // Sucesso!
        setIsSuccess(true);
        if (isModal && onPacienteSalvo) {
          onPacienteSalvo(pacienteUpperCase);
        } else if (!pacienteId) {
          setFormData(initialFormData); // Limpar formulário se for criação
        }
      } catch (error) {
        setApiError(
          error instanceof Error ? error.message : "Erro ao salvar paciente"
        );
      } finally {
        setIsLoading(false);
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

    return age;
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
                disabled={isLoading || isLoadingOptions}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${
                  isLoading || isLoadingOptions
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading || isLoadingOptions}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                  isLoading || isLoadingOptions
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
                disabled={isLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
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
                        errors.nome ? "border-red-500" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.nome}
                      onChange={handleChange}
                      maxLength={100}
                      disabled={isLoading || isLoadingOptions}
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
                        errors.nome_mae ? "border-red-500" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.nome_mae}
                      onChange={handleChange}
                      maxLength={100}
                      disabled={isLoading || isLoadingOptions}
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
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="data_nascimento"
                        className={`w-full p-3 pl-10 border ${
                          errors.data_nascimento
                            ? "border-red-500"
                            : "border-gray-200"
                        } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                        value={formData.data_nascimento}
                        onChange={handleChange}
                        disabled={isLoading || isLoadingOptions}
                      />
                    </div>
                    {errors.data_nascimento && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.data_nascimento}
                      </p>
                    )}
                    {formData.data_nascimento && !errors.data_nascimento && (
                      <p className="mt-1 text-sm text-gray-500">
                        Idade: {calculateAge(formData.data_nascimento)} anos
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
                        errors.cpf ? "border-red-500" : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.cpf ? displayFormattedCPF(formData.cpf) : ""}
                      onChange={handleCPFChange}
                      maxLength={14}
                      disabled={isLoading || isLoadingOptions}
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
                    <label className="block mb-2 font-medium text-gray-700">
                      Identidade de Gênero{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tipo_genero_idtipo_genero"
                      className={`w-full p-3 border ${
                        errors.tipo_genero_idtipo_genero
                          ? "border-red-500"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.tipo_genero_idtipo_genero}
                      onChange={handleChange}
                      disabled={isLoading || isLoadingOptions}
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

                  {/* Gestante (condicional - para gêneros 1 e 3 que correspondem a mulheres) */}
                  {typeof formData.tipo_genero_idtipo_genero === "number" &&
                    (formData.tipo_genero_idtipo_genero === 1 ||
                      formData.tipo_genero_idtipo_genero === 3) && (
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
                          ? "border-red-500"
                          : "border-gray-200"
                      } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                      value={formData.tipo_raca_idtipo_raca}
                      onChange={handleChange}
                      disabled={isLoading || isLoadingOptions}
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
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.escolaridade_idescolaridade}
                      onChange={handleChange}
                      disabled={isLoading || isLoadingOptions}
                    >
                      <option value="">Selecione</option>
                      {escolaridadeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.descricao}
                        </option>
                      ))}
                    </select>
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
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          contato: value,
                        }))
                      }
                      label="Contato Telefônico"
                      placeholder="Digite o número de telefone"
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
              disabled={isLoading || isLoadingOptions}
              className={`inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                isLoading || isLoadingOptions
                  ? "opacity-70 cursor-not-allowed"
                  : ""
              }`}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </button>
            {!isModal && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading || isLoadingOptions}
                className={`inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                  isLoading || isLoadingOptions
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
              disabled={isLoading}
              className={`inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
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

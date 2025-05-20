// src/features/notificationForms/utils/formUtils.ts
import { FormData, AtendimentoOption, EncerramentoOption } from '@/features/notificationForms/types/index2';
import type { SectionState } from '@/features/notificationForms/hooks/useSectionExpansion';

/**
 * Normaliza texto removendo acentos e convertendo para caixa alta
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  // Remove acentos e converte para caixa alta
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toUpperCase();
}

/**
 * Converte todos os textos de um objeto para caixa alta
 */
export const toUpperCaseAllStrings = (obj: any): any => {
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

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 */
export const formatCPF = (cpf: string): string => {
  // Remove caracteres não numéricos e limita a 11 dígitos
  return cpf.replace(/\D/g, "").slice(0, 11);
};

/**
 * Exibe CPF formatado
 */
export const displayFormattedCPF = (cpf: string): string => {
  // Remove caracteres não numéricos e limita a 11 dígitos
  const cleanCPF = cpf.replace(/\D/g, "").slice(0, 11);

  // Se o CPF não tiver 11 dígitos, retorna ele apenas limpo
  if (cleanCPF.length !== 11) return cleanCPF;

  // Formata como XXX.XXX.XXX-XX
  return `${cleanCPF.substring(0, 3)}.${cleanCPF.substring(3, 6)}.${cleanCPF.substring(6, 9)}-${cleanCPF.substring(9)}`;
};

/**
 * Formata contato telefônico
 */
export const formatContato = (contato: string): string => {
  // Apenas limitando o tamanho máximo para 15 caracteres
  return contato.slice(0, 15);
};

/**
 * Formata contato local 
 */
export const formatContatoLocal = (contato: string): string => {
  // Remove caracteres não numéricos e limita a 11 dígitos
  return contato.replace(/\D/g, "").slice(0, 11);
};

/**
 * Calcula idade com base na data de nascimento
 */
export const calculateAge = (birthdate: string): number => {
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

/**
 * Compara duas datas e verifica se a primeira é igual ou depois da segunda
 */
export const compareDates = (date1: string, date2: string): boolean => {
  if (!date1 || !date2) return true; // Se alguma data estiver faltando, a validação passa

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Verificar se ambas as datas são válidas
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return true;

  // Retorna true se date1 for igual ou depois de date2 (caso válido)
  return d1 >= d2;
};

/**
 * Normaliza dados do formulário para garantir consistência
 */
export const normalizarDadosResidencia = (data: FormData): FormData => {
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

/**
 * Verificar se o tipo de atendimento contém determinado texto
 */
export const isTipoAtendimento = (tipo: string, tipoAtendimento: string, atendimentoOptions: any[]): boolean => {
  // Se não há tipo selecionado, retorna falso
  if (!tipoAtendimento) return false;

  // Encontra a opção selecionada
  const selectedOption = atendimentoOptions.find(
    (option) => option.idtipo_atendimento.toString() === tipoAtendimento.toString()
  );

  if (!selectedOption) return false;

  // Normalizar ambos os textos antes de comparar
  const normalizedDescription = selectedOption.descricao;
  const normalizedTipo = normalizeText(tipo);

  // Verificar se a descrição contém o texto procurado
  return normalizedDescription.includes(normalizedTipo);
};

/**
 * Verificar se o tipo de encerramento contém determinado texto
 */
export const isTipoEncerramento = (tipo: string, tipoEncerramento: string, encerramentoOptions: any[]): boolean => {
  // Se não há tipo selecionado, retorna falso
  if (!tipoEncerramento) return false;

  // Encontra a opção selecionada
  const selectedOption = encerramentoOptions.find(
    (option) => option.idtipo_encerramento.toString() === tipoEncerramento.toString()
  );

  if (!selectedOption) return false;

  // Normalizar ambos os textos antes de comparar
  const normalizedDescription = selectedOption.descricao;
  const normalizedTipo = normalizeText(tipo);

  // Verificar se a descrição contém o texto procurado
  return normalizedDescription.includes(normalizedTipo);
};

/**
 * Validar campos obrigatórios e outras regras de validação
 */
export const validateForm = (
  formData: FormData, 
  errors: Record<string, string>,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setExpandedSections: React.Dispatch<React.SetStateAction<SectionState>>,
  expandedSections: SectionState,
  atendimentoOptions: AtendimentoOption[],
  encerramentoOptions: EncerramentoOption[]
): boolean => {
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
    if (!compareDates(formData.dataAtendimento, formData.dataInicioSintomas)) {
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
    { field: "tipoEncerramento", label: "Tipo de Encerramento" },
    { field: "unidadeNotificadora", label: "Unidade Notificadora" },
  ];

  const newErrors: Record<string, string> = {};
  const missingFields = requiredFields.filter((item) => !formData[item.field]);

  // Adicionar mensagens de erro para cada campo faltante
  missingFields.forEach((item) => {
    newErrors[item.field] = item.message || `O campo ${item.label} é obrigatório`;
  });

  // Adicionar validações específicas para sintomas e traumas baseadas no tipo de atendimento
  if (
    isTipoAtendimento("CLINICO", formData.tipoAtendimento, atendimentoOptions) ||
    isTipoAtendimento("SURTO", formData.tipoAtendimento, atendimentoOptions) ||
    isTipoAtendimento("INCIDENTE QBRN", formData.tipoAtendimento, atendimentoOptions)
  ) {
    if (formData.sinaisESintomas.length === 0) {
      newErrors.sinaisESintomas = "Selecione pelo menos um sinal ou sintoma";
    }
  }

  if (
    isTipoAtendimento("TRAUMA", formData.tipoAtendimento, atendimentoOptions) ||
    isTipoAtendimento("MULTIPLAS VITIMAS", formData.tipoAtendimento, atendimentoOptions)
  ) {
    if (formData.tipoTrauma.length === 0) {
      newErrors.tipoTrauma = "Selecione pelo menos um tipo de trauma";
    }
  }

  // Validar se unidadeNotificadora é um número válido
  if (formData.unidadeNotificadora && !/^\d+$/.test(formData.unidadeNotificadora)) {
    newErrors.unidadeNotificadora = "Selecione uma unidade notificadora válida";
  }

  // Verificar se tipoEncerramento é "Transferido" e se localEncaminhamento está preenchido
  if (
    isTipoEncerramento("transferido", formData.tipoEncerramento, encerramentoOptions) && 
    !formData.localEncaminhamento
  ) {
    newErrors.localEncaminhamento = "O local de encaminhamento é obrigatório para transferência";
  }

  // Atualizar o estado com os erros encontrados
  setErrors(newErrors);

  // Se houver erros, expandir as seções relevantes
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
      newErrors.dataInicioSintomas
    ) {
      newExpandedSections.atendimento = true;
    }

    if (
      newErrors.tipoEncerramento ||
      newErrors.unidadeNotificadora ||
      newErrors.dataAtendimento ||
      newErrors.localEncaminhamento
    ) {
      newExpandedSections.encerramento = true;
      newExpandedSections.unidadeNotificadora = true;
    }

    setExpandedSections(newExpandedSections);
    return false;
  }

  return true;
};
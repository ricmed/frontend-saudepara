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
  // ========================================
  // IMPORTANTE: Coletar TODOS os erros de uma vez
  // ========================================
  const newErrors: Record<string, string> = {};

  // ========================================
  // 1. VALIDAÇÕES DE CAMPOS OBRIGATÓRIOS
  // ========================================
  
  // Seção 1: Dados Gerais
  if (!formData.evento || formData.evento === "") {
    newErrors.evento = "O campo Evento é obrigatório";
  }
  
  if (!formData.publicoAtendido || formData.publicoAtendido === "") {
    newErrors.publicoAtendido = "O campo Público Atendido é obrigatório";
  }
  // ========================================
  // SEÇÃO 2: PROCEDÊNCIA (CORRIGIDA)
  // ========================================
  if (!formData.residenteBelem || formData.residenteBelem === "") {
    newErrors.residenteBelem = "O campo Residente em Belém é obrigatório";
  } else {
    // Só validar país de procedência se já selecionou "Estrangeiro"
    if (formData.residenteBelem === "3") {
      if (!formData.paisProcedencia || formData.paisProcedencia === "") {
        newErrors.paisProcedencia = "O campo País de Procedência é obrigatório para estrangeiros";
      }
    }
    
    // Validações condicionais para outras opções
    if (formData.residenteBelem === "1") { // Residente em Belém
      if (!formData.bairro || formData.bairro === "") {
        newErrors.bairro = "O campo Bairro é obrigatório para residentes em Belém";
      }
    } else if (formData.residenteBelem === "2") { // Não residente em Belém (outro estado BR)
      if (!formData.uf || formData.uf === "") {
        newErrors.uf = "O campo UF é obrigatório para não residentes em Belém";
      }
      if (!formData.municipio || formData.municipio === "") {
        newErrors.municipio = "O campo Município é obrigatório para não residentes em Belém";
      }
    }
  }

  // Seção 3: Identificação do Paciente
  if (!formData.paciente || formData.paciente.trim() === "") {
    newErrors.paciente = "O nome do paciente é obrigatório";
  }

  // Validações opcionais mas importantes
  if (formData.cpf && formData.cpf.length > 0 && formData.cpf.length !== 11) {
    newErrors.cpf = "CPF deve ter 11 dígitos";
  }

  if (formData.idade && parseInt(formData.idade) > 120) {
    newErrors.idade = "A idade não pode ser maior que 120 anos";
  }

  // Seção 4: Informações do Atendimento
  if (!formData.tipoAtendimento || formData.tipoAtendimento === "") {
    newErrors.tipoAtendimento = "O campo Tipo de Atendimento é obrigatório";
  }

  // Validações específicas baseadas no tipo de atendimento
  if (formData.tipoAtendimento) {
    if (
      isTipoAtendimento("CLINICO", formData.tipoAtendimento, atendimentoOptions) ||
      isTipoAtendimento("INCIDENTE QBRN", formData.tipoAtendimento, atendimentoOptions)
    ) {
      if (!formData.sinaisESintomas || formData.sinaisESintomas.length === 0) {
        newErrors.sinaisESintomas = "Selecione pelo menos um sinal ou sintoma";
      }
    }

    if (
      isTipoAtendimento("TRAUMA", formData.tipoAtendimento, atendimentoOptions) ||
      isTipoAtendimento("MULTIPLAS VITIMAS", formData.tipoAtendimento, atendimentoOptions)
    ) {
      if (!formData.tipoTrauma || formData.tipoTrauma.length === 0) {
        newErrors.tipoTrauma = "Selecione pelo menos um tipo de trauma";
      }
    }
  }

  // Seção 5: Unidade Notificadora
  if (!formData.unidadeNotificadora || formData.unidadeNotificadora === "") {
    newErrors.unidadeNotificadora = "O campo Unidade Notificadora é obrigatório";
  }

  // Validar se unidadeNotificadora é um número válido
  if (formData.unidadeNotificadora && !/^\d+$/.test(formData.unidadeNotificadora)) {
    newErrors.unidadeNotificadora = "Selecione uma unidade notificadora válida";
  }

  // Seção 6: Desfecho do Caso
  if (!formData.tipoEncerramento || formData.tipoEncerramento === "") {
    newErrors.tipoEncerramento = "O campo Desfecho é obrigatório";
  }

  // Verificar se tipoEncerramento é "Transferido" e se localEncaminhamento está preenchido
  if (
    isTipoEncerramento("transferido", formData.tipoEncerramento, encerramentoOptions) && 
    (!formData.localEncaminhamento || formData.localEncaminhamento === "")
  ) {
    newErrors.localEncaminhamento = "O local de encaminhamento é obrigatório para transferência";
  }

  // ========================================
  // 2. VALIDAÇÕES DE RELAÇÕES ENTRE DATAS
  // ========================================
  
  // Verificar relações entre datas se ambas estiverem presentes
  if (formData.dataAtendimento && formData.dataInicioSintomas) {
    if (!compareDates(formData.dataAtendimento, formData.dataInicioSintomas)) {
      newErrors.dataAtendimento =
        "A data de atendimento não pode ser anterior à data de início dos sintomas";
    }
  }

  // Verificar se dataInicioSintomas não é futura
  if (formData.dataInicioSintomas) {
    const hoje = new Date();
    const dataInicioSintomas = new Date(formData.dataInicioSintomas);
    
    if (dataInicioSintomas > hoje) {
      newErrors.dataInicioSintomas = "A data de início dos sintomas não pode ser futura";
    }
  }

  // Verificar se dataAtendimento não é futura
  if (formData.dataAtendimento) {
    const hoje = new Date();
    const dataAtendimento = new Date(formData.dataAtendimento);
    
    if (dataAtendimento > hoje) {
      newErrors.dataAtendimento = "A data de atendimento não pode ser futura";
    }
  }

  // Verificar se dataEncerramento não é futura
  if (formData.dataEncerramento) {
    const hoje = new Date();
    const dataEncerramento = new Date(formData.dataEncerramento);
    
    if (dataEncerramento > hoje) {
      newErrors.dataEncerramento = "A data de desfecho não pode ser futura";
    }
  }

  // ========================================
  // 3. APLICAR TODOS OS ERROS DE UMA VEZ
  // ========================================
  
  // Atualizar o estado com TODOS os erros encontrados
  setErrors(newErrors);

  // ========================================
  // 4. EXPANDIR SEÇÕES COM ERROS
  // ========================================
  
  // Se houver erros, expandir as seções relevantes
  if (Object.keys(newErrors).length > 0) {
    const newExpandedSections = { ...expandedSections };

    // Seção 1: Dados Gerais
    if (newErrors.evento || newErrors.publicoAtendido) {
      newExpandedSections.dadosGerais = true;
    }

    // Seção 2: Procedência
    if (
      newErrors.residenteBelem ||
      newErrors.bairro ||
      newErrors.municipio ||
      newErrors.uf ||
      newErrors.paisProcedencia ||
      newErrors.localHospedagem ||
      newErrors.contatoLocal
    ) {
      newExpandedSections.procedencia = true;
    }

    // Seção 3: Identificação
    if (
      newErrors.paciente ||
      newErrors.nomeMae ||
      newErrors.dataNascimento ||
      newErrors.idade ||
      newErrors.cpf ||
      newErrors.identidadeGenero ||
      newErrors.gestante ||
      newErrors.raca ||
      newErrors.escolaridade ||
      newErrors.profissao ||
      newErrors.contatoTelefonico
    ) {
      newExpandedSections.identificacao = true;
    }

    // Seção 4: Atendimento
    if (
      newErrors.tipoAtendimento ||
      newErrors.sinaisESintomas ||
      newErrors.dataInicioSintomas ||
      newErrors.observacaoSintomas ||
      newErrors.hipoteseDiagnostica ||
      newErrors.observacaoHipotese ||
      newErrors.tipoTrauma ||
      newErrors.observacaoTrauma ||
      newErrors.relacionadoSurto ||
      newErrors.observacaoIncidente
    ) {
      newExpandedSections.atendimento = true;
    }

    // Seção 5: Unidade Notificadora
    if (
      newErrors.dataAtendimento ||
      newErrors.unidadeNotificadora ||
      newErrors.nomeNotificador ||
      newErrors.contatoNotificador
    ) {
      newExpandedSections.unidadeNotificadora = true;
    }

    // Seção 6: Desfecho
    if (
      newErrors.dataEncerramento ||
      newErrors.tipoEncerramento ||
      newErrors.localEncaminhamento
    ) {
      newExpandedSections.encerramento = true;
    }

    setExpandedSections(newExpandedSections);

    // ========================================
    // 5. SCROLL PARA O RESUMO DE ERROS
    // ========================================
    
    // Scroll para o resumo de erros após um breve delay
    setTimeout(() => {
      const errorSummary = document.getElementById('error-summary');
      if (errorSummary) {
        errorSummary.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 150);

    return false; // Formulário inválido
  }

  return true; // Formulário válido
};
import { FormData } from '../types/FormTypes';

/**
 * Formata um CPF: 12345678900 -> 123.456.789-00
 */
export const formatCPF = (cpf: string): string => {
  // Remove qualquer formatação existente
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return cleanCPF;
  
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Valida um CPF
 */
export const validateCPF = (cpf: string): boolean => {
  // Remove qualquer formatação
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
};

/**
 * Calcula a idade a partir da data de nascimento
 */
export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Atualiza a idade automaticamente quando a data de nascimento é alterada
 */
export const updateAgeFromBirthDate = (formData: FormData): FormData => {
  if (!formData.dataNascimento) return formData;
  
  const age = calculateAge(formData.dataNascimento);
  return {
    ...formData,
    idade: age.toString()
  };
};

/**
 * Valida se uma seção específica do formulário está completa
 */
export const validateFormSection = (
  formData: FormData,
  section: 'dadosGerais' | 'procedencia' | 'identificacao' | 'atendimento' | 'unidadeNotificadora' | 'encerramento'
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  switch (section) {
    case 'dadosGerais':
      if (!formData.evento) errors.push("Evento é obrigatório");
      if (!formData.publicoAtendido) errors.push("Público Atendido é obrigatório");
      break;
      
    case 'procedencia':
      if (!formData.residenteBelem) errors.push("Residência em Belém é obrigatória");
      
      if (formData.residenteBelem === "1" && !formData.bairro) {
        errors.push("Bairro é obrigatório para residentes de Belém");
      }
      
      if (formData.residenteBelem === "2") {
        if (!formData.uf) errors.push("UF é obrigatória");
        if (!formData.municipio) errors.push("Município é obrigatório");
      }
      
      if (formData.residenteBelem === "3") {
        if (!formData.paisProcedencia) errors.push("País de Procedência é obrigatório");
        if (!formData.localHospedagem) errors.push("Local de Hospedagem é obrigatório");
      }
      break;
      
    case 'identificacao':
      if (!formData.paciente) errors.push("Nome do paciente é obrigatório");
      if (!formData.dataNascimento && !formData.idade) errors.push("Data de Nascimento ou Idade é obrigatória");
      if (!formData.identidadeGenero) errors.push("Identidade de Gênero é obrigatória");
      if (!formData.raca) errors.push("Raça é obrigatória");
      
      if (formData.identidadeGenero === "1" && !formData.gestante) {
        errors.push("Campo Gestante é obrigatório para mulheres cisgênero");
      }
      break;
      
    case 'atendimento':
      if (!formData.tipoAtendimento) errors.push("Tipo de Atendimento é obrigatório");
      
      if (formData.tipoAtendimento === "1") {
        if (formData.sinaisESintomas.length === 0) errors.push("Pelo menos um Sinal ou Sintoma deve ser selecionado");
        if (!formData.dataInicioSintomas) errors.push("Data de Início dos Sintomas é obrigatória");
      }
      
      if (formData.tipoAtendimento === "2") {
        if (formData.tipoTrauma.length === 0) errors.push("Pelo menos um Tipo de Trauma deve ser selecionado");
        if (!formData.dataOcorrencia) errors.push("Data da Ocorrência é obrigatória");
      }
      
      if (["3", "4", "5"].includes(formData.tipoAtendimento) && !formData.relacionadoSurto) {
        errors.push("Campo 'Relacionado a Surto' é obrigatório");
      }
      break;
      
    case 'unidadeNotificadora':
      if (!formData.dataAtendimento) errors.push("Data de Atendimento é obrigatória");
      if (!formData.unidadeNotificadora) errors.push("Unidade Notificadora é obrigatória");
      if (!formData.nomeNotificador) errors.push("Nome do Notificador é obrigatório");
      if (!formData.contatoNotificador) errors.push("Contato do Notificador é obrigatório");
      break;
      
    case 'encerramento':
      // Encerramento é opcional, mas se tiver dados, valida
      if (formData.dataEncerramento || formData.tipoEncerramento || formData.localEncaminhamento) {
        if (!formData.dataEncerramento) errors.push("Data de Encerramento é obrigatória");
        if (!formData.tipoEncerramento) errors.push("Tipo de Encerramento é obrigatório");
        
        if (formData.tipoEncerramento === "4" && !formData.localEncaminhamento) {
          errors.push("Local de Encaminhamento é obrigatório para transferências");
        }
        
        if (formData.tipoEncerramento === "5" && !formData.localEncaminhamento) {
          errors.push("Local de Encaminhamento é obrigatório para óbitos");
        }
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida o formulário completo
 */
export const validateForm = (formData: FormData): { isValid: boolean; errors: Record<string, string[]> } => {
  const sections = ['dadosGerais', 'procedencia', 'identificacao', 'atendimento', 'unidadeNotificadora', 'encerramento'] as const;
  const errors: Record<string, string[]> = {};
  let isValid = true;

  sections.forEach(section => {
    const validation = validateFormSection(formData, section);
    if (!validation.isValid) {
      errors[section] = validation.errors;
      isValid = false;
    }
  });

  return { isValid, errors };
};

/**
 * Prepara os dados do formulário para envio (remove campos de controle da interface)
 */
export const prepareFormDataForSubmission = (formData: FormData): Omit<FormData, 'profissaoSearch' | 'showProfissaoOptions'> => {
  // Cria uma cópia sem os campos de controle da UI
  const { profissaoSearch, showProfissaoOptions, ...dataToSubmit } = formData;
  return dataToSubmit;
};

/**
 * Formata uma data do formato yyyy-mm-dd para dd/mm/yyyy
 */
export const formatDate = (date: string): string => {
  if (!date) return '';
  
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Converte uma data do formato dd/mm/yyyy para yyyy-mm-dd
 */
export const parseDate = (date: string): string => {
  if (!date) return '';
  
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}`;
};
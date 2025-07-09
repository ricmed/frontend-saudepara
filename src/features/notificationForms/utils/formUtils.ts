// src/utils/formUtils.ts

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
 * Converte todos os textos de um objeto para caixa alta, ignorando chaves específicas.
 * ✅ CORRIGIDO: Adicionada uma verificação para não modificar o array 'arquivos'.
 */
export const toUpperCaseAllStrings = (obj: any): any => {
  if (!obj) return obj;

  if (typeof obj === "string") {
    return normalizeText(obj);
  }

  if (Array.isArray(obj)) {
    // Não modifica o array se for o array de arquivos, apenas o retorna.
    // Isso é uma segurança extra, a lógica principal está no handleSubmit.
    if (obj.some(item => typeof item === 'object' && item !== null && 'nome' in item && 'tamanho' in item && 'tipo' in item)) {
        return obj;
    }
    return obj.map((item) => toUpperCaseAllStrings(item));
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // ✅ CONDIÇÃO ADICIONADA: Se a chave for 'arquivos', não a converte.
        if (key === 'arquivos') {
          result[key] = obj[key];
        } else {
          result[key] = toUpperCaseAllStrings(obj[key]);
        }
      }
    }
    return result;
  }

  return obj;
};


// ... O restante das suas funções utilitárias permanecem as mesmas ...
// (formatCPF, calculateAgeInYearsAndMonths, validateForm, etc.)

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
* Calcula idade em anos e meses a partir da data de nascimento
* MELHORADO: Cálculo mais preciso considerando dias
*/
export const calculateAgeInYearsAndMonths = (birthdate: string): { 
idade: string, 
idadeMeses: string,
idadeUnidade: 'anos' | 'meses'
} => {
if (!birthdate) return { idade: "", idadeMeses: "", idadeUnidade: 'anos' };

const birthDate = new Date(birthdate);
const today = new Date();

// Assegura que a hora não interfira no cálculo da data
//  birthDate.setUTCHours(0, 0, 0, 0);
 today.setUTCHours(0, 0, 0, 0);

 if (isNaN(birthDate.getTime())) {
return { idade: "", idadeMeses: "", idadeUnidade: 'anos' };
 }

 // Verifica se a data de nascimento não é futura
 if (birthDate > today) {
return { idade: "", idadeMeses: "", idadeUnidade: 'anos' };
 }

 // Calcula idade total em meses de forma precisa
 let totalMonths = (today.getUTCFullYear() - birthDate.getUTCFullYear()) * 12;
 totalMonths += today.getUTCMonth() - birthDate.getUTCMonth();
 
 // Ajusta se o dia ainda não chegou no mês atual
 if (today.getUTCDate() < birthDate.getUTCDate()) {
totalMonths--;
 }

 // Garante que não seja negativo
 totalMonths = Math.max(0, totalMonths);

 // Calcula anos a partir dos meses totais
 const years = Math.floor(totalMonths / 12);
 
 // Define a unidade baseada na idade
 const idadeUnidade: 'anos' | 'meses' = totalMonths < 12 ? 'meses' : 'anos';
 
 return { 
idade: years.toString(),
idadeMeses: totalMonths.toString(),
idadeUnidade
 };
};

/**
* NOVA FUNÇÃO: Valida idade manual (sem data de nascimento)
*/
export const validateManualAge = (formData: FormData): { 
 isValid: boolean, 
 errors: Record<string, string> 
} => {
 const errors: Record<string, string> = {};
 
 // Se há data de nascimento, não validar idade manual
 if (formData.dataNascimento) {
return { isValid: true, errors: {} };
 }

 const idadeAnos = parseInt(formData.idade) || 0;
 const idadeMeses = parseInt(formData.idadeMeses) || 0;

 // Validar se pelo menos uma idade foi informada
 if (idadeAnos === 0 && idadeMeses === 0) {
errors.idade = "Informe a idade ou a data de nascimento";
return { isValid: false, errors };
 }

 // Validar limite máximo em anos
 if (idadeAnos > 120) {
errors.idade = "A idade não pode ser maior que 120 anos";
 }

 // Validar limite máximo em meses (120 anos = 1440 meses)
 if (idadeMeses > 1440) {
errors.idadeMeses = "A idade não pode ser maior que 120 anos (1440 meses)";
 }

 // NOVA VALIDAÇÃO: Validar que meses não ultrapassem 11 quando há anos
 if (idadeAnos > 0) {
const mesesCalculados = idadeMeses % 12;
if (mesesCalculados > 11) {
 errors.idadeMeses = "Meses devem ser entre 0 e 11 quando há anos informados";
}
 }

 // NOVA VALIDAÇÃO: Para bebês (apenas meses), validar limite de 23 meses
 if (idadeAnos === 0 && idadeMeses > 23) {
errors.idadeMeses = "Para bebês, use anos quando passar de 23 meses";
 }

 // Validar valores negativos
 if (idadeAnos < 0) {
errors.idade = "A idade não pode ser negativa";
 }

 if (idadeMeses < 0) {
errors.idadeMeses = "A idade em meses não pode ser negativa";
 }

 // Validar consistência entre anos e meses
 if (idadeAnos > 0 && idadeMeses > 0) {
const mesesEsperados = idadeAnos * 12;
const diferenca = Math.abs(idadeMeses - mesesEsperados);

// Permitir diferença de até 11 meses (para casos como 2 anos e 6 meses)
if (diferenca > 11) {
 errors.idade = "Inconsistência entre idade em anos e meses";
}
 }

 return { 
isValid: Object.keys(errors).length === 0, 
errors 
 };
};

/**
* NOVA FUNÇÃO: Valida data de nascimento
*/
export const validateBirthDate = (birthDate: string): { 
 isValid: boolean, 
 error?: string 
} => {
 if (!birthDate) {
return { isValid: true }; // Data de nascimento é opcional
 }

 const birth = new Date(birthDate);
 const today = new Date();

 // Verificar se é uma data válida
 if (isNaN(birth.getTime())) {
return { isValid: false, error: "Data de nascimento inválida" };
 }

 // Verificar se não é futura
 if (birth > today) {
return { isValid: false, error: "Data de nascimento não pode ser futura" };
 }

 // Verificar se não é muito antiga (mais de 120 anos)
 const maxAge = new Date();
 maxAge.setFullYear(maxAge.getFullYear() - 120);
 
 if (birth < maxAge) {
return { isValid: false, error: "Data de nascimento não pode ser anterior a 120 anos" };
 }

 return { isValid: true };
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
* MELHORADO: Incluindo validações completas de idade
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

 // ========================================
 // SEÇÃO 3: IDENTIFICAÇÃO DO PACIENTE (MELHORADA)
 // ========================================
 if (!formData.paciente || formData.paciente.trim() === "") {
newErrors.paciente = "O nome do paciente é obrigatório";
 }

 // NOVA VALIDAÇÃO: Data de nascimento
 if (formData.dataNascimento) {
const birthValidation = validateBirthDate(formData.dataNascimento);
if (!birthValidation.isValid) {
 newErrors.dataNascimento = birthValidation.error!;
}
 }

 // NOVA VALIDAÇÃO: Idade manual (quando não há data de nascimento)
 const ageValidation = validateManualAge(formData);
 if (!ageValidation.isValid) {
Object.assign(newErrors, ageValidation.errors);
 }

 // Validação de CPF melhorada
 if (formData.cpf && formData.cpf.length > 0) {
if (formData.cpf.length !== 11) {
 newErrors.cpf = "CPF deve ter 11 dígitos";
} else if (!/^\d{11}$/.test(formData.cpf)) {
 newErrors.cpf = "CPF deve conter apenas números";
}
 }

 // ========================================
 // SEÇÃO 4: INFORMAÇÕES DO ATENDIMENTO
 // ========================================
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

 // ========================================
 // SEÇÃO 5: UNIDADE NOTIFICADORA
 // ========================================
 if (!formData.unidadeNotificadora || formData.unidadeNotificadora === "") {
newErrors.unidadeNotificadora = "O campo Unidade Notificadora é obrigatório";
 }

 // Validar se unidadeNotificadora é um número válido
 if (formData.unidadeNotificadora && !/^\d+$/.test(formData.unidadeNotificadora)) {
newErrors.unidadeNotificadora = "Selecione uma unidade notificadora válida";
 }

 // ========================================
 // SEÇÃO 6: DESFECHO DO CASO
 // ========================================
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
 newErrors.idadeMeses || // NOVO
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

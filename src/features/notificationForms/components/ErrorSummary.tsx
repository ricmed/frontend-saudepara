// ========================================
// COMPONENTE DE RESUMO DE ERROS PARA NOTIFICATIONFORM
// ========================================

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorSummaryProps {
  errors: Record<string, string>;
  onFieldClick: (fieldName: string) => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

const ErrorSummary: React.FC<ErrorSummaryProps> = ({ 
  errors, 
  onFieldClick, 
  expandedSections, 
  toggleSection 
}) => {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) return null;

  // Mapear nomes dos campos para labels amigáveis
  const fieldLabels: Record<string, string> = {
    // Seção 1: Dados Gerais
    evento: "Evento",
    publicoAtendido: "Público Atendido",
    
    // Seção 2: Procedência do Indivíduo
    residenteBelem: "Residente em Belém",
    bairro: "Bairro",
    uf: "UF",
    municipio: "Município",
    paisProcedencia: "País de Procedência",
    localHospedagem: "Local de Hospedagem",
    contatoLocal: "Contato do Local da Hospedagem",
    
    // Seção 3: Identificação do Indivíduo
    paciente: "Nome do Paciente",
    nomeMae: "Nome da Mãe",
    dataNascimento: "Data de Nascimento",
    idade: "Idade",
    cpf: "CPF",
    identidadeGenero: "Identidade de Gênero",
    gestante: "Gestante",
    raca: "Raça",
    escolaridade: "Escolaridade",
    profissao: "Profissão/Ocupação",
    contatoTelefonico: "Contato Telefônico",
    ddi: "DDI",
    
    // Seção 4: Informações do Atendimento
    tipoAtendimento: "Tipo de Atendimento",
    sinaisESintomas: "Sinais e Sintomas",
    dataInicioSintomas: "Data de Início dos Sintomas",
    observacaoSintomas: "Observação dos Sintomas",
    hipoteseDiagnostica: "Hipótese Diagnóstica",
    observacaoHipotese: "Observação da Hipótese",
    tipoTrauma: "Tipo de Trauma",
    observacaoTrauma: "Observação do Trauma",
    relacionadoSurto: "Relacionado a Surto",
    observacaoIncidente: "Observação do Incidente",
    
    // Seção 5: Informações da Unidade Notificadora
    dataAtendimento: "Data do Atendimento",
    unidadeNotificadora: "Unidade Notificadora",
    nomeNotificador: "Nome do Notificador",
    contatoNotificador: "Contato do Notificador",
    
    // Seção 6: Desfecho do Caso
    dataEncerramento: "Data do Desfecho",
    tipoEncerramento: "Desfecho",
    localEncaminhamento: "Local de Encaminhamento"
  };

  // Mapear campos para suas respectivas seções
  const fieldToSection: Record<string, string> = {
    // Seção 1: Dados Gerais
    evento: "dadosGerais",
    publicoAtendido: "dadosGerais",
    
    // Seção 2: Procedência do Indivíduo
    residenteBelem: "procedencia",
    bairro: "procedencia",
    uf: "procedencia",
    municipio: "procedencia",
    paisProcedencia: "procedencia",
    localHospedagem: "procedencia",
    contatoLocal: "procedencia",
    
    // Seção 3: Identificação do Indivíduo
    paciente: "identificacao",
    nomeMae: "identificacao",
    dataNascimento: "identificacao",
    idade: "identificacao",
    cpf: "identificacao",
    identidadeGenero: "identificacao",
    gestante: "identificacao",
    raca: "identificacao",
    escolaridade: "identificacao",
    profissao: "identificacao",
    contatoTelefonico: "identificacao",
    ddi: "identificacao",
    
    // Seção 4: Informações do Atendimento
    tipoAtendimento: "atendimento",
    sinaisESintomas: "atendimento",
    dataInicioSintomas: "atendimento",
    observacaoSintomas: "atendimento",
    hipoteseDiagnostica: "atendimento",
    observacaoHipotese: "atendimento",
    tipoTrauma: "atendimento",
    observacaoTrauma: "atendimento",
    relacionadoSurto: "atendimento",
    observacaoIncidente: "atendimento",
    
    // Seção 5: Informações da Unidade Notificadora
    dataAtendimento: "unidadeNotificadora",
    unidadeNotificadora: "unidadeNotificadora",
    nomeNotificador: "unidadeNotificadora",
    contatoNotificador: "unidadeNotificadora",
    
    // Seção 6: Desfecho do Caso
    dataEncerramento: "encerramento",
    tipoEncerramento: "encerramento",
    localEncaminhamento: "encerramento"
  };

  const handleFieldClick = (fieldName: string) => {
    // Expandir a seção correspondente ao campo
    const sectionName = fieldToSection[fieldName];
    if (sectionName && !expandedSections[sectionName]) {
      toggleSection(sectionName);
    }
    
    // Navegar para o campo
    onFieldClick(fieldName);
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
                    onClick={() => handleFieldClick(fieldName)}
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
export const scrollToField = (
  fieldName: string, 
  expandedSections: Record<string, boolean>,
  toggleSection: (section: string) => void
) => {
  // Mapear campo para seção (mesmo mapeamento do componente)
  const fieldToSection: Record<string, string> = {
    // Seção 1: Dados Gerais
    evento: "dadosGerais",
    publicoAtendido: "dadosGerais",
    
    // Seção 2: Procedência do Indivíduo
    residenteBelem: "procedencia",
    bairro: "procedencia",
    uf: "procedencia",
    municipio: "procedencia",
    paisProcedencia: "procedencia",
    localHospedagem: "procedencia",
    contatoLocal: "procedencia",
    
    // Seção 3: Identificação do Indivíduo
    paciente: "identificacao",
    nomeMae: "identificacao",
    dataNascimento: "identificacao",
    idade: "identificacao",
    cpf: "identificacao",
    identidadeGenero: "identificacao",
    gestante: "identificacao",
    raca: "identificacao",
    escolaridade: "identificacao",
    profissao: "identificacao",
    contatoTelefonico: "identificacao",
    ddi: "identificacao",
    
    // Seção 4: Informações do Atendimento
    tipoAtendimento: "atendimento",
    sinaisESintomas: "atendimento",
    dataInicioSintomas: "atendimento",
    observacaoSintomas: "atendimento",
    hipoteseDiagnostica: "atendimento",
    observacaoHipotese: "atendimento",
    tipoTrauma: "atendimento",
    observacaoTrauma: "atendimento",
    relacionadoSurto: "atendimento",
    observacaoIncidente: "atendimento",
    
    // Seção 5: Informações da Unidade Notificadora
    dataAtendimento: "unidadeNotificadora",
    unidadeNotificadora: "unidadeNotificadora",
    nomeNotificador: "unidadeNotificadora",
    contatoNotificador: "unidadeNotificadora",
    
    // Seção 6: Desfecho do Caso
    dataEncerramento: "encerramento",
    tipoEncerramento: "encerramento",
    localEncaminhamento: "encerramento"
  };

  // Expandir a seção se necessário
  const sectionName = fieldToSection[fieldName];
  if (sectionName && !expandedSections[sectionName]) {
    toggleSection(sectionName);
  }
  
  // Aguardar expansão e fazer scroll
  setTimeout(() => {
    let element: Element | null = null;
    
    // ========================================
    // BUSCA ESPECÍFICA PARA CAMPOS ESPECIAIS
    // ========================================
    
    // Unidade Notificadora
    if (fieldName === 'unidadeNotificadora') {
      element = document.querySelector(`[data-field-type="unidade"]`) ||
                document.querySelector(`input[placeholder*="unidade notificadora"]`) ||
                document.querySelector(`[data-field="unidadeNotificadora"]`);
      console.log('🔍 Procurando Unidade Notificadora:', element);
    }
    // Local de Encaminhamento  
    else if (fieldName === 'localEncaminhamento') {
      element = document.querySelector(`[data-field-type="encaminhamento"]`) ||
                document.querySelector(`input[placeholder*="encaminhamento"]`) ||
                document.querySelector(`[data-field="localEncaminhamento"]`);
      console.log('🔍 Procurando Local de Encaminhamento:', element);
    }
    // Busca padrão para outros campos
    else {
      element = document.querySelector(`[name="${fieldName}"]`) || 
                document.querySelector(`[data-field="${fieldName}"]`) ||
                document.querySelector(`#${fieldName}`);
    }
    
    // ========================================
    // SCROLL E DESTAQUE
    // ========================================
    
    if (element) {
      console.log(`✅ Elemento encontrado para ${fieldName}:`, element);
      
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      // Destacar temporariamente o campo
      (element as HTMLElement).style.transform = 'scale(1.02)';
      (element as HTMLElement).style.transition = 'transform 0.2s ease';
      (element as HTMLElement).style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.3)';
      
      setTimeout(() => {
        (element as HTMLElement).style.transform = 'scale(1)';
        (element as HTMLElement).style.boxShadow = '';
        
        // Tentar focar no elemento se possível
        if ((element as HTMLElement).focus) {
          (element as HTMLElement).focus();
        } else if ((element as HTMLElement).click) {
          // Para campos como UnidadeNotificadoraField, tentar um clique
          (element as HTMLElement).click();
        }
      }, 300);
    } else {
      console.log(`❌ Elemento não encontrado para campo: ${fieldName}`);
      
      // Debug: listar todos os elementos possíveis
      console.log('🔍 Elementos disponíveis com data-field-type:', 
        document.querySelectorAll('[data-field-type]'));
      console.log('🔍 Elementos disponíveis com name:', 
        document.querySelectorAll(`[name*="${fieldName}"]`));
    }
  }, 100);
};

export default ErrorSummary;
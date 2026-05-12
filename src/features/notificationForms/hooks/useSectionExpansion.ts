// src/features/notificationForms/hooks/useSectionExpansion.ts
import { useState } from 'react';

export interface SectionState {
  dadosGerais: boolean;
  procedencia: boolean;
  identificacao: boolean;
  atendimento: boolean;
  unidadeNotificadora: boolean;
  encerramento: boolean;
  anexos: boolean; // 🆕 NOVA SEÇÃO
}

/**
 * Hook para gerenciar a expansão/colapso das seções do formulário
 */
export const useSectionExpansion = (initialState?: Partial<SectionState>) => {
  const [expandedSections, setExpandedSections] = useState<SectionState>({
    dadosGerais: true,
    procedencia: true,
    identificacao: true,
    atendimento: true,
    unidadeNotificadora: true,
    encerramento: true,
    anexos: false, // 🆕 NOVA SEÇÃO
    ...initialState
  });

  /**
   * Função para alternar a expansão de uma seção específica
   */
  const toggleSection = (section: keyof SectionState) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  /**
   * Função para expandir seções específicas com erros de validação
   */
  const expandSectionsWithErrors = (errors: Record<string, string>) => {
    const sectionsToExpand: Partial<SectionState> = {};
    
    // Mapeia campos com erros para suas respectivas seções
    Object.keys(errors).forEach(field => {
      if (['evento', 'publicoAtendido'].includes(field)) {
        sectionsToExpand.dadosGerais = true;
      } else if (['residenteBelem', 'bairro', 'municipio', 'uf', 'paisProcedencia', 'localHospedagem', 'contatoLocal'].includes(field)) {
        sectionsToExpand.procedencia = true;
      } else if (['paciente', 'nomeMae', 'dataNascimento', 'idade', 'cpf', 'cns', 'sexoNascimento', 'eEstrangeiro', 'identidadeGenero', 'gestante', 'raca', 'escolaridade', 'profissao', 'contatoTelefonico'].includes(field)) {
        sectionsToExpand.identificacao = true;
      } else if (['tipoAtendimento', 'sinaisESintomas', 'dataInicioSintomas', 'hipoteseDiagnostica', 'tipoTrauma', 'dataOcorrencia'].includes(field)) {
        sectionsToExpand.atendimento = true;
      } else if (['dataAtendimento', 'unidadeNotificadora', 'nomeNotificador', 'contatoNotificador'].includes(field)) {
        sectionsToExpand.unidadeNotificadora = true;
      } else if (['dataEncerramento', 'tipoEncerramento', 'localEncaminhamento'].includes(field)) {
        sectionsToExpand.encerramento = true;
      } else if (['arquivos'].includes(field)) {
        sectionsToExpand.anexos = true; // 🆕 NOVA SEÇÃO
      }
    });

    // Atualiza o estado apenas para as seções com erros
    if (Object.keys(sectionsToExpand).length > 0) {
      setExpandedSections(prev => ({
        ...prev,
        ...sectionsToExpand
      }));
    }
    
    return sectionsToExpand;
  };

  /**
   * Função para expandir uma seção específica
   */
  const expandSection = (section: keyof SectionState) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: true
    }));
  };

  /**
   * Função para colapsar uma seção específica
   */
  const collapseSection = (section: keyof SectionState) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: false
    }));
  };

  return {
    expandedSections,
    setExpandedSections,
    toggleSection,
    expandSectionsWithErrors,
    expandSection,
    collapseSection
  };
};
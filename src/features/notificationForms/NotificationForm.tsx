// src/features/notificationForms/NotificationForm.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Save,
  X,
  ArrowLeft,
  Download,
  Loader,
  FileText,
  Trash2,
  Menu,
  Printer,
} from "lucide-react";
import ModalBuscaPaciente from "@/features/paginaPacientesComu/components/ModalBuscaPaciente";
// Atualizar a importação do SideMenu
import { SideMenu } from "@/features/home/components/SideMenu";
import ConnectionStatus from "@/components/ConnectionStatus";
import { SAIRE_LOGO_FULL_PNG } from "@/features/home/components/SaireLogo";
import { isSaireEventDescription } from "./utils/saireEventPrefill";
import { prepareDataForExport } from "./components/exportUtilities";
import { toPrintDataMap } from "./utils/caseFichaLayout";
import { relayComunicacaoCasoPrintData } from "./utils/comunicacaoCasoPrintChannel";
import { enrichExportOptions } from "./utils/enrichExportOptions";

// Import custom hooks
import { useNotificationForm } from "./hooks/useNotificationForm";

// Import section components
import GeneralInfoSection from "./components/sections/GeneralInfoSection";
import PersonOriginSection from "./components/sections/PersonOriginSection";
import PersonIdentificationSection from "./components/sections/PersonIdentificationSection";
import AttendanceInfoSection from "./components/sections/AttendanceInfoSection";
import NotifierInfoSection from "./components/sections/NotifierInfoSection";
import CaseClosureSection from "./components/sections/CaseClosureSection";
// import AttachmentsSection from "./components/sections/AttachmentsSection"; // TEMPORARIAMENTE COMENTADO

// Import do novo componente de resumo de erros
import ErrorSummary, { scrollToField } from "./components/ErrorSummary";

// Import do gerador de casos fictícios - TEMPORARIAMENTE COMENTADO
// import MockDataControls from "./components/MockDataControls";

const NotificationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // Adicionar estado para controle do SideMenu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [exportingDocumento, setExportingDocumento] = useState(false);
  const printRelayCleanupRef = useRef<(() => void) | null>(null);
  // Use the main form hook
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    isLoading,
    isSaving,
    isSuccess,
    apiError,
    expandedSections,
    toggleSection,
    handleChange,
    handleCheckboxChange,
    handleContatoLocalChange,
    handlePacienteChange,
    handleSelectPaciente,
    handleSubmit,
    handleClearForm,
    handleExport,
    getExportOptions,
    toggleExportDropdown,
    criarNovoPaciente,
    handleValidationError, // Add this new function
    originalCpf,
    
    // 🆕 ADICIONAR FUNÇÕES PARA ARQUIVOS: - TEMPORARIAMENTE COMENTADO
    // handleArquivosChange,
    // handleRemoveFile, // Adicionar função de remoção
    // validateArquivos,
    
    // ✅ ADICIONAR checkCpfOfflineSafe para validação de CPF
    checkCpfOfflineSafe,
      
    // Dados de pacientes
    pacienteSuggestions,
    showSuggestions,
    isCreatingNewPatient,
    isPatientModalOpen,
    setIsPatientModalOpen,
      
    // Dados de exportação
    isExportDropdownOpen,
      
    // Campo de ajuda de gênero
    showGenderHelp,
    setShowGenderHelp,
      
    // Opções de dropdown
    eventoOptions,
    localidadeEventoOptions,
    modoLocalidadeEvento,
    isLoadingLocalidadesEvento,
    localidadeEventoCatalogAvailable,
    publicoOptions,
    paisOptions,
    estadoOptions,
    municipioOptions,
    generoOptions,
    racaOptions,
    escolaridadeOptions,
    atendimentoOptions,
    sintomaOptions,
    hipoteseDiagOptions,
    traumaOptions,
    encerramentoOptions,
      
    // Estado dos municípios
    isLoadingMunicipios,
    ufError,
      
    // Filtros de busca
    searchSintomas,
    setSearchSintomas,
    searchTrauma,
    setSearchTrauma,
        // Helpers para condicionais
    isTipoAtendimentoFunc,
    isTipoEncerramentoFunc,
  
    // Adicionar estas duas variáveis
    hipoteseDiagFiltradas, 
    isLoadingHipoteses,
  } = useNotificationForm(isEditMode, id);

  const showSaireLogo = useMemo(() => {
    const selected = eventoOptions.find(
      (option) => option.idtipo_evento.toString() === formData.evento,
    );
    return isSaireEventDescription(selected?.descricao);
  }, [eventoOptions, formData.evento]);

  useEffect(() => {
    return () => {
      printRelayCleanupRef.current?.();
    };
  }, []);

  const handleOpenPrintFicha = async () => {
    printRelayCleanupRef.current?.();
    setExportingDocumento(true);
    try {
      const channelId = crypto.randomUUID();
      const exportData = prepareDataForExport(
        formData,
        await enrichExportOptions(getExportOptions(), formData),
      );
      const eventoNome = String(exportData.Evento || "");
      printRelayCleanupRef.current = relayComunicacaoCasoPrintData(channelId, () => ({
        data: toPrintDataMap(exportData as Record<string, unknown>),
        modoLocalidadeEvento: modoLocalidadeEvento ?? "NAO_USA",
        isSaire: showSaireLogo,
        eventoNome,
        returnPath:
          isEditMode && id
            ? `/private/comunicacao-de-caso/editar/${id}`
            : "/private/comunicacao-de-caso/nova",
      }));
      const formFrom = isEditMode ? "editar" : "nova";
      const channelQuery = `channel=${encodeURIComponent(channelId)}&from=${encodeURIComponent(formFrom)}`;
      const path =
        isEditMode && id
          ? `/private/comunicacao-de-caso/imprimir/${id}?${channelQuery}`
          : `/private/comunicacao-de-caso/imprimir?${channelQuery}`;
      window.open(path, "_blank", "noopener,noreferrer");
      if (isExportDropdownOpen) {
        toggleExportDropdown();
      }
    } finally {
      setExportingDocumento(false);
    }
  };

  const handleExportDocumento = async () => {
    setExportingDocumento(true);
    try {
      await handleExport("PDF_DOCUMENTO");
    } finally {
      setExportingDocumento(false);
    }
  };

  // ========================================
  // FUNÇÃO PARA SCROLL PARA CAMPO ESPECÍFICO
  // ========================================
  const handleScrollToField = (fieldName: string) => {
    scrollToField(fieldName, expandedSections as unknown as Record<string, boolean>, (section: string) => {
      toggleSection(section as keyof typeof expandedSections);
    });
  };

  // Wrapper function for toggleSection to handle type compatibility
  const handleToggleSection = (section: string) => {
    toggleSection(section as keyof typeof expandedSections);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 sm:p-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          {/* Linha 1: Controles de navegação e título */}
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Adicionar botão para abrir o SideMenu */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              title="Menu"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </button>
            
            <button
              onClick={() => navigate("/private/comunicacao-de-caso")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </button>
            
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white truncate flex-1">
              {/* Título responsivo */}
              <span className="hidden lg:inline">
                {isEditMode ? "Editar Dados da Ficha de Comunicação" : "Nova Comunicação"}
              </span>
              <span className="hidden sm:inline lg:hidden">
                {isEditMode ? "Editar Comunicação" : "Nova Comunicação"}
              </span>
              <span className="sm:hidden">
                {isEditMode ? "Editar" : "Nova"}
              </span>
            </h1>

            {showSaireLogo && (
              <img
                src={SAIRE_LOGO_FULL_PNG}
                alt="Festival do Sairé 2026"
                className="h-10 sm:h-12 lg:h-14 w-auto object-contain flex-shrink-0 drop-shadow-sm"
              />
            )}
          </div>

          {/* Linha 2: Botões de ação - organizados responsivamente */}
          <div className="flex items-center gap-2 sm:gap-2">
            {/* Botão Exportar - responsivo */}
            <div className="relative order-2 sm:order-1">
              <button
                onClick={toggleExportDropdown}
                className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:gap-2 sm:px-4 sm:py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
                title="Exportar PDF"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>

              {/* Dropdown de Exportação */}
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      type="button"
                      data-testid="export-imprimir-ficha"
                      onClick={() => void handleOpenPrintFicha()}
                      disabled={exportingDocumento}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2 disabled:opacity-70"
                      role="menuitem"
                      title="Abre a ficha preenchida em nova aba, no mesmo espírito da HBV criança exposta"
                    >
                      <Printer className="h-4 w-4" /> Imprimir ficha
                    </button>
                    <button
                      type="button"
                      data-testid="export-pdf-documento"
                      onClick={() => void handleExportDocumento()}
                      disabled={exportingDocumento}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2 disabled:opacity-70"
                      role="menuitem"
                      title="Baixa um PDF institucional, no mesmo espírito da Comunicação DAE"
                    >
                      {exportingDocumento ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {exportingDocumento ? "Gerando PDF…" : "PDF documento"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Grupo de botões principais - responsivo */}
            <div className="flex gap-1 sm:gap-1 ml-auto">
              <button
                type="submit"
                form="notification-form"
                data-testid="notification-save-submit"
                disabled={isSaving}
                className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:gap-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                title="Salvar"
              >
                {isSaving ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{isSaving ? "Salvando..." : "Salvar"}</span>
              </button>
              
              <button
                type="button"
                onClick={handleClearForm}
                className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:gap-2 sm:px-4 sm:py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                title="Limpar"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
              
              <button
                type="button"
                onClick={() => navigate("/private/comunicacao-de-caso")}
                className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:gap-2 sm:px-4 sm:py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                title="Cancelar"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Adicionar o SideMenu */}
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-5xl mx-auto p-6">
        {/* Mensagem de erro da API */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2 text-red-600">
              <div>
                <p className="font-medium">Erro</p>
                <p className="text-sm">{apiError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem de sucesso */}
        {isSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-600">
              <p>
                {isEditMode
                  ? "Notificação atualizada com sucesso!"
                  : "Notificação cadastrada com sucesso!"}
              </p>
            </div>
          </div>
        )}        {/* NOVO: Resumo de Erros com Navegação */}
        <ErrorSummary 
          errors={errors} 
          onFieldClick={handleScrollToField}
          expandedSections={expandedSections as unknown as Record<string, boolean>}
          toggleSection={handleToggleSection}
          usaLocalidadeEvento={modoLocalidadeEvento !== 'NAO_USA'}
        />

        {/* Gerador de Casos Fictícios - apenas para novos formulários */}
        {/* TEMPORARIAMENTE COMENTADO - Gerador de fichas pode ser reativado futuramente */}
        {/* 
        {!isEditMode && (
          <MockDataControls
            setFormData={setFormData}
            setErrors={setErrors}
          />
        )}
        */}

        {/* Adicionar o status de conexão */}
        <ConnectionStatus 
          showForceSync={true}
          className="mb-4"
        />

        {/* Formulário */}
        <form
          id="notification-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Seção 1: Dados Gerais */}
          <GeneralInfoSection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            handleChange={handleChange}
            handleContatoLocalChange={handleContatoLocalChange}
            isExpanded={expandedSections.dadosGerais}
            toggleSection={() => toggleSection("dadosGerais")}
            eventoOptions={eventoOptions}
            publicoOptions={publicoOptions}
            isLoadingMunicipios={isLoadingMunicipios}
            paisOptions={paisOptions}
            handleValidationError={handleValidationError}
          />

          {/* Seção 2: Procedência do indivíduo */}
          <PersonOriginSection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            handleChange={handleChange}
            handleContatoLocalChange={handleContatoLocalChange}
            isExpanded={expandedSections.procedencia}
            toggleSection={() => toggleSection("procedencia")}
            isLoadingMunicipios={isLoadingMunicipios}
            ufError={ufError || undefined}
            paisOptions={paisOptions}
            handleValidationError={handleValidationError}
            modoLocalidadeEvento={modoLocalidadeEvento}
            localidadeEventoOptions={localidadeEventoOptions}
            isLoadingLocalidadesEvento={isLoadingLocalidadesEvento}
            localidadeEventoCatalogAvailable={
              localidadeEventoCatalogAvailable
            }
            estadoOptions={estadoOptions}
            municipioOptions={municipioOptions}
          />          <PersonIdentificationSection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            handleChange={handleChange}
            handleContatoLocalChange={handleContatoLocalChange}
            isExpanded={expandedSections.identificacao}
            toggleSection={() => toggleSection("identificacao")}
            pacienteSuggestions={pacienteSuggestions}
            showSuggestions={showSuggestions}
            isCreatingNewPatient={isCreatingNewPatient}
            handlePacienteChange={handlePacienteChange}
            handleSelectPaciente={handleSelectPaciente}
            criarNovoPaciente={criarNovoPaciente}
            setIsPatientModalOpen={setIsPatientModalOpen}
            showGenderHelp={showGenderHelp}
            setShowGenderHelp={setShowGenderHelp}
            generoOptions={generoOptions}
            racaOptions={racaOptions}
            escolaridadeOptions={escolaridadeOptions}
            isLoadingMunicipios={isLoadingMunicipios}
            paisOptions={paisOptions}
            handleValidationError={handleValidationError}
            originalCpf={originalCpf}
            checkCpfOfflineSafe={checkCpfOfflineSafe}
          />

          {/* Seção 4: Informações do atendimento */}
          <AttendanceInfoSection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
            handleContatoLocalChange={handleContatoLocalChange}
            isExpanded={expandedSections.atendimento}
            toggleSection={() => toggleSection("atendimento")}
            searchSintomas={searchSintomas}
            setSearchSintomas={setSearchSintomas}
            searchTrauma={searchTrauma}
            setSearchTrauma={setSearchTrauma}
            atendimentoOptions={atendimentoOptions}
            sintomaOptions={sintomaOptions}
            traumaOptions={traumaOptions}
            hipoteseDiagOptions={hipoteseDiagOptions}
            hipoteseDiagFiltradas={hipoteseDiagFiltradas} // Nova prop
            isLoadingHipoteses={isLoadingHipoteses} // Nova prop
            isTipoAtendimentoFunc={isTipoAtendimentoFunc}
            isLoadingMunicipios={isLoadingMunicipios}
            paisOptions={paisOptions}
            handleValidationError={handleValidationError}
          />

          {/* Seção 5: Informações da unidade notificadora */}
          <NotifierInfoSection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            handleChange={handleChange}
            handleContatoLocalChange={handleContatoLocalChange}
            isExpanded={expandedSections.unidadeNotificadora}
            toggleSection={() => toggleSection("unidadeNotificadora")}
            isLoadingMunicipios={isLoadingMunicipios}
            paisOptions={paisOptions}
            handleValidationError={handleValidationError}
          />

          {/* Seção 6: Encerramento do Caso */}
          <CaseClosureSection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            handleChange={handleChange}
            handleContatoLocalChange={handleContatoLocalChange}
            isExpanded={expandedSections.encerramento}
            toggleSection={() => toggleSection("encerramento")}
            encerramentoOptions={encerramentoOptions}
            isTipoEncerramentoFunc={isTipoEncerramentoFunc}
            isLoadingMunicipios={isLoadingMunicipios}
            paisOptions={paisOptions}
            handleValidationError={handleValidationError}
          />

          {/* 🆕 NOVA SEÇÃO 7: Arquivos Anexos - TEMPORARIAMENTE OCULTA */}
          {/* 
          <AttachmentsSection
            formData={formData}
            errors={errors}
            isExpanded={expandedSections.anexos}
            toggleSection={() => toggleSection("anexos")}
            handleValidationError={handleValidationError}
            onArquivosChange={handleArquivosChange}
            onRemoveFile={handleRemoveFile}
          />
          */}

          {/* Botões de ação na parte inferior do formulário (centralizados) */}
          <div className="mt-8 flex justify-center space-x-4">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
              onClick={handleClearForm}
              className="inline-flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </button>
            <button
              type="button"
              onClick={() => navigate("/private/comunicacao-de-caso")}
              className="inline-flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
// src/features/notificationForms/NotificationForm.tsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Save,
  X,
  ArrowLeft,
  Download,
  Loader,
  FileChartColumnIncreasing,
  Files,
  ArchiveX,
} from "lucide-react";
import ModalBuscaPaciente from "@/features/paginaPacientesComu/components/ModalBuscaPaciente";
import SideMenu from "@/features/apps/components/SideMenu";

// Import custom hooks
import { useNotificationForm } from "./hooks/useNotificationForm";

// Import section components
import GeneralInfoSection from "./components/sections/GeneralInfoSection";
import PersonOriginSection from "./components/sections/PersonOriginSection";
import PersonIdentificationSection from "./components/sections/PersonIdentificationSection";
import AttendanceInfoSection from "./components/sections/AttendanceInfoSection";
import NotifierInfoSection from "./components/sections/NotifierInfoSection";
import CaseClosureSection from "./components/sections/CaseClosureSection";

const NotificationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

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
    handleCPFChange,
    handleContatoLocalChange,
    handlePacienteChange,
    handleSelectPaciente,
    handleSubmit,
    handleClearForm,
    handleExport,
    toggleExportDropdown,
    criarNovoPaciente,
      
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
    publicoOptions,
    paisOptions,
    estadoOptions,
    municipioOptions,
    bairroOptions,
    generoOptions,
    racaOptions,
    escolaridadeOptions,
    atendimentoOptions,
    sintomaOptions,
    hipoteseDiagOptions,
    traumaOptions,
    encerramentoOptions,
    estabelecimentoOptions,
      
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
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-white">
            <button
              onClick={() => navigate("/lista-comunicacao")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <h1 className="text-2xl font-semibold">
              {isEditMode
                ? "Editar Dados da Ficha de Comunicação"
                : "Nova Comunicação"}
            </h1>
          </div>

          <div className="relative flex items-center gap-3">
            {/* Botão Exportar com Dropdown */}
            <div className="relative">
              <button
                onClick={toggleExportDropdown}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>

              {/* Dropdown de Exportação - Apenas PDF e PNG */}
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => handleExport("PDF")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <Files className="h-4 w-4" /> PDF
                    </button>
                    <button
                      onClick={() => handleExport("PNG")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <FileChartColumnIncreasing className="h-4 w-4" /> PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-white/20 mx-2" /> {/* Separador */}
            {/* Botões de Ação (CABEÇALHO) */}
            <button
              type="submit"
              form="notification-form"
              disabled={isSaving}
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
              onClick={handleClearForm}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <ArchiveX className="h-4 w-4" />
              Limpar
            </button>
            <button
              type="button"
              onClick={() => navigate("/lista-comunicacao")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {/* Mensagens de erro e sucesso */}
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
        )}

        {/* Resumo de erros */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-700 font-medium mb-2">
              Corrija os seguintes erros para continuar:
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field} className="text-red-600 text-sm">
                  {message}
                </li>
              ))}
            </ul>
          </div>
        )}

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
          />

          <PersonIdentificationSection
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
            handleCPFChange={handleCPFChange}
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
          />

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
              <ArchiveX className="h-4 w-4" />
              Limpar
            </button>
            <button
              type="button"
              onClick={() => navigate("/lista-comunicacao")}
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

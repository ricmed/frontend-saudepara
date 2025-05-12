// src/features/notificationForms/components/sections/AttendanceInfoSection.tsx
import React, { useState, useEffect } from 'react';
import { ListChecks, Search, X } from 'lucide-react';
import { FormSectionProps } from '@/features/notificationForms/types/index2';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';
import SearchableCheckboxGroup from '../shared/SearchableCheckboxGroup';
import CustomDateInput from '@/features/notificationForms/components/CustomDateInput';
import { ListaSindromicaService } from '@/services/ListaSindromicaService';
import HipoteseDiagItem from '../shared/HipoteseDiagItem';

// Componente para mostrar sintomas relacionados
const SintomasRelacionados = ({ 
  hipoteseId, 
  qtdSintomas,
  formData,
  sintomaOptions 
}: { 
  hipoteseId: string; 
  qtdSintomas: number;
  formData: any;
  sintomaOptions: any[];
}) => {
  // Estado para controlar a visibilidade do popup
  const [showRelatedSymptoms, setShowRelatedSymptoms] = useState(false);
  
  // Estado para armazenar os sintomas relacionados
  const [relatedSymptoms, setRelatedSymptoms] = useState<{id: string, descricao: string}[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);
  
  // Efeito para buscar os sintomas relacionados quando o popup é aberto
  useEffect(() => {
    if (!showRelatedSymptoms) return;
    
    const fetchRelatedSymptoms = async () => {
      try {
        setIsLoadingRelated(true);
        
        // Buscar sintomas relacionados da API
        const response = await ListaSindromicaService.getSintomasPorHipotese(hipoteseId);
        
        // Mapear para o formato esperado
        const sintomas = response.map((sintoma: any) => ({
          id: sintoma.id.toString(),
          descricao: sintoma.sintoma
        }));
        
        setRelatedSymptoms(sintomas);
      } catch (error) {
        console.error('Erro ao buscar sintomas relacionados:', error);
        
        // Em caso de erro, tentar inferir os sintomas a partir dos selecionados
        const sintomasInferidos = sintomaOptions
          .filter(sintoma => formData.sinaisESintomas.includes(sintoma.idtipo_sintoma.toString()))
          .map(sintoma => ({
            id: sintoma.idtipo_sintoma.toString(),
            descricao: sintoma.descricao
          }));
        
        setRelatedSymptoms(sintomasInferidos);
      } finally {
        setIsLoadingRelated(false);
      }
    };
    
    fetchRelatedSymptoms();
  }, [hipoteseId, showRelatedSymptoms, formData.sinaisESintomas, sintomaOptions]);

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-yellow-600">
        {qtdSintomas} {qtdSintomas === 1 ? 'sintoma relacionado' : 'sintomas relacionados'}
      </span>
      
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowRelatedSymptoms(!showRelatedSymptoms);
        }}
        className="ml-1 text-blue-500 hover:text-blue-700 rounded-full w-5 h-5 flex items-center justify-center bg-blue-50 hover:bg-blue-100 transition-colors"
        title="Ver sintomas relacionados"
      >
        <span role="img" aria-label="Sintomas">🩺</span>
      </button>
      
      {/* Popup com sintomas relacionados */}
      {showRelatedSymptoms && (
        <div className="absolute z-10 top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 max-w-xs w-60 text-xs text-gray-700">
          <div className="font-medium mb-1 text-gray-900">Sintomas relacionados:</div>
          
          {isLoadingRelated ? (
            <div className="flex items-center justify-center p-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-xs text-gray-600">Carregando sintomas...</span>
            </div>
          ) : relatedSymptoms.length === 0 ? (
            <div className="text-gray-500 italic">Nenhum sintoma específico encontrado.</div>
          ) : (
            <ul className="list-disc pl-4 space-y-1 max-h-40 overflow-y-auto">
              {relatedSymptoms.map(sintoma => {
                // Verificar se este sintoma está selecionado
                const isSelecionado = formData.sinaisESintomas.includes(sintoma.id);
                
                return (
                  <li key={sintoma.id} className={isSelecionado ? "text-green-600 font-medium" : ""}>
                    {sintoma.descricao}
                    {isSelecionado && (
                      <span className="ml-1 text-xs text-green-500">(selecionado)</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          
          <div className="absolute right-1 top-1">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowRelatedSymptoms(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface AttendanceInfoSectionProps extends FormSectionProps {
  searchSintomas: string;
  setSearchSintomas: (search: string) => void;
  searchTrauma: string;
  setSearchTrauma: (search: string) => void;
  atendimentoOptions: any[];
  sintomaOptions: any[];
  traumaOptions: any[];
  hipoteseDiagOptions: any[];
  hipoteseDiagFiltradas: any[]; // Nova propriedade
  isLoadingHipoteses: boolean;  // Nova propriedade
  isTipoAtendimentoFunc: (tipo: string) => boolean;
  setErrors?: (errors: any) => void; // Adding setErrors prop
  handleValidationError: (name: string, error: string | null) => void; // Nova prop
}

const AttendanceInfoSection: React.FC<AttendanceInfoSectionProps> = ({
  formData,
  setFormData,
  errors,
  handleChange,
  handleCheckboxChange,
  isExpanded,
  toggleSection,
  searchSintomas,
  setSearchSintomas,
  searchTrauma,
  setSearchTrauma,
  atendimentoOptions,
  sintomaOptions,
  traumaOptions,
  hipoteseDiagOptions,
  hipoteseDiagFiltradas,
  isLoadingHipoteses,
  isTipoAtendimentoFunc,
  setErrors = () => {}, // Default value for setErrors
  handleValidationError
}) => {
  // Estado para pesquisa de hipóteses diagnósticas
  const [searchHipotese, setSearchHipotese] = useState('');
  
  // Estado para controlar se mostra todas as hipóteses ou apenas as relacionadas
  const [showAllHipoteses, setShowAllHipoteses] = useState(false);
  
  // Filtra as hipóteses diagnósticas com base na pesquisa
  const filteredHipoteses = hipoteseDiagFiltradas.filter(
    option => 
      searchHipotese === '' || 
      option.descricao.toLowerCase().includes(searchHipotese.toLowerCase())
  );

  // Limpa todas as hipóteses selecionadas
  const handleClearAllHipoteses = () => {
    if (formData.hipoteseDiagnostica.length > 0 && 
        window.confirm(`Deseja remover a hipótese diagnóstica selecionada?`)) {
      setFormData({
        ...formData,
        hipoteseDiagnostica: []
      });
    }
  };

  // Obtém as hipóteses selecionadas com seus rótulos
  const getSelectedHipoteses = () => {
    return formData.hipoteseDiagnostica.map(id => {
      const option = hipoteseDiagOptions.find(opt => opt.idtipo_hipotese_diag.toString() === id);
      return {
        id,
        label: option ? option.descricao : id
      };
    });
  };

  // Efeito para definir "relacionadoSurto" automaticamente quando o tipo for "SURTO"
  useEffect(() => {
    if (isTipoAtendimentoFunc("SURTO") && !formData.relacionadoSurto) {
      setFormData({
        ...formData,
        relacionadoSurto: "S" // Define como "Sim" automaticamente
      });
    }
  }, [formData.tipoAtendimento]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <SectionHeader
        icon={<ListChecks className="h-5 w-5 text-yellow-500" />}
        title="4. Informações do atendimento"
        isExpanded={isExpanded}
        onToggle={toggleSection}
      />
      
      {isExpanded && (
        <div className="p-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Atendimento */}
            <FormField
              label="Tipo de Atendimento"
              name="tipoAtendimento"
              value={formData.tipoAtendimento}
              onChange={handleChange}
              type="select"
              required
              error={errors.tipoAtendimento}
              options={
                atendimentoOptions?.map((option) => ({
                  value: option.idtipo_atendimento.toString(),
                  label: option.descricao
                })) || []
              }
            />

            {/* Sinais e Sintomas para CLINICO, SURTO, INCIDENTE QBRN */}
            {(isTipoAtendimentoFunc("CLINICO") ||
              isTipoAtendimentoFunc("SURTO") ||
              isTipoAtendimentoFunc("INCIDENTE QBRN")) && (
              <div className="md:col-span-2">
                <SearchableCheckboxGroup
                  label="Sinais e Sintomas"
                  options={sintomaOptions.map(option => ({
                    id: option.idtipo_sintoma.toString(),
                    label: option.descricao
                  }))}
                  selectedValues={formData.sinaisESintomas}
                  onChange={(value) => handleCheckboxChange && handleCheckboxChange('sinaisESintomas', value)}
                  error={errors.sinaisESintomas}
                  maxHeight="96"
                />
              </div>
            )}

            {/* Data de Início dos Sintomas e Observação apenas para CLINICO */}
            {isTipoAtendimentoFunc("CLINICO") && (
              <>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Data de Início dos Sintomas
                  </label>
                  <CustomDateInput
                    name="dataInicioSintomas"
                    className={`w-full p-3 border ${
                      errors.dataInicioSintomas
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                    value={formData.dataInicioSintomas}
                    onChange={handleChange}
                    data-error={errors.dataInicioSintomas ? "true" : "false"}
                    error={errors.dataInicioSintomas}
                    onValidationError={handleValidationError}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    label="Observação"
                    name="observacaoSintomas"
                    value={formData.observacaoSintomas}
                    onChange={handleChange}
                    type="textarea"
                    placeholder="Informações adicionais sobre os sintomas..."
                  />
                </div>
              </>
            )}

            {/* Trauma ou múltiplas vítimas */}
            {(isTipoAtendimentoFunc("TRAUMA") ||
              isTipoAtendimentoFunc("MULTIPLAS VITIMAS")) && (
              <>
                {/* Tipo de Trauma com campo de pesquisa */}
                <div className="md:col-span-2">
                  <SearchableCheckboxGroup
                    label="Tipo de Trauma"
                    options={traumaOptions.map(option => ({
                      id: option.idtipo_trauma.toString(),
                      label: option.descricao
                    }))}
                    selectedValues={formData.tipoTrauma}
                    onChange={(value) => handleCheckboxChange && handleCheckboxChange('tipoTrauma', value)}
                    error={errors.tipoTrauma}
                    maxHeight="96"
                  />
                </div>

                {/* Data da Ocorrência */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Data da Ocorrência <span className="text-red-500">*</span>
                  </label>
                  <CustomDateInput
                    name="dataOcorrencia"
                    className={`w-full p-3 border ${
                      errors.dataOcorrencia
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                    value={formData.dataOcorrencia}
                    onChange={handleChange}
                    data-error={errors.dataOcorrencia ? "true" : "false"}
                    error={errors.dataOcorrencia}
                    onValidationError={handleValidationError}
                  />
                  {errors.dataOcorrencia && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.dataOcorrencia}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <FormField
                    label="Observação"
                    name="observacaoTrauma"
                    value={formData.observacaoTrauma}
                    onChange={handleChange}
                    type="textarea"
                    placeholder="Informações adicionais sobre o trauma..."
                  />
                </div>
              </>
            )}

            {/* Observação do Incidente para SURTO ou INCIDENTE QBRN */}
            {(isTipoAtendimentoFunc("SURTO") ||
              isTipoAtendimentoFunc("INCIDENTE QBRN")) && (
              <>
                <div className="md:col-span-2">
                  <FormField
                    label="Observação do Incidente"
                    name="observacaoIncidente"
                    value={formData.observacaoIncidente}
                    onChange={handleChange}
                    type="textarea"
                    placeholder="Informações adicionais sobre o incidente..."
                  />
                </div>
              </>
            )}

            {/* Data da Ocorrência para outros tipos */}
            {!isTipoAtendimentoFunc("TRAUMA") &&
              !isTipoAtendimentoFunc("MULTIPLAS VITIMAS") && (
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Data da Ocorrência <span className="text-red-500">*</span>
                </label>
                <CustomDateInput
                  name="dataOcorrencia"
                  className={`w-full p-3 border ${
                    errors.dataOcorrencia
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                  value={formData.dataOcorrencia}
                  onChange={handleChange}
                  data-error={errors.dataOcorrencia ? "true" : "false"}
                  error={errors.dataOcorrencia}
                  onValidationError={handleValidationError}
                />
                {errors.dataOcorrencia && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.dataOcorrencia}
                  </p>
                )}
              </div>
            )}

            {/* Hipótese Diagnóstica para TODOS os tipos EXCETO TRAUMA e MULTIPLAS VITIMAS */}
            {!isTipoAtendimentoFunc("TRAUMA") && !isTipoAtendimentoFunc("MULTIPLAS VITIMAS") && (
              <div className="md:col-span-2">
                {/* Estado para controlar se mostra todas as hipóteses já está definido na função principal */}

                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-700">
                    Hipótese Diagnóstica (selecione apenas uma)
                  </label>
                  
                  {/* Campo de pesquisa para hipóteses diagnósticas */}
                  <div className="relative w-64">
                    <input
                      type="text"
                      placeholder="Pesquisar hipóteses..."
                      value={searchHipotese}
                      onChange={(e) => setSearchHipotese(e.target.value)}
                      className="w-full p-2 pl-8 text-sm border border-gray-200 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      disabled={isLoadingHipoteses}
                    />
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {searchHipotese && (
                      <button
                        type="button"
                        onClick={() => setSearchHipotese('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Tags para hipóteses selecionadas */}
                {formData.hipoteseDiagnostica.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      {getSelectedHipoteses().map((hipotese) => (
                        <div
                          key={hipotese.id}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
                        >
                          <span>{hipotese.label}</span>
                          <button
                            type="button"
                            onClick={() => handleCheckboxChange && 
                              handleCheckboxChange("hipoteseDiagnostica", hipotese.id)}
                            className="text-blue-500 hover:text-blue-700 focus:outline-none"
                            aria-label={`Remover ${hipotese.label}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      
                      {formData.hipoteseDiagnostica.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllHipoteses}
                          className="ml-2 text-xs text-gray-500 hover:text-red-500 focus:outline-none"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {isLoadingHipoteses ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-600">Carregando hipóteses diagnósticas...</span>
                  </div>
                ) : (
                  <>
                    {/* Botão para mostrar todas as hipóteses */}
                    {formData.sinaisESintomas.length > 0 && hipoteseDiagFiltradas.length > 0 && !showAllHipoteses && (
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-xs text-gray-500">
                          Mostrando hipóteses diagnósticas ordenadas por relevância com base nos sintomas selecionados.
                        </div>
                        <button 
                          type="button"
                          onClick={() => setShowAllHipoteses(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none flex items-center gap-1"
                        >
                          <span>Ver todas as hipóteses</span>
                        </button>
                      </div>
                    )}
                    
                    {showAllHipoteses && (
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-xs text-gray-500">
                          Mostrando todas as hipóteses diagnósticas disponíveis.
                        </div>
                        <button 
                          type="button"
                          onClick={() => setShowAllHipoteses(false)}
                          className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none flex items-center gap-1"
                        >
                          <span>Ver apenas hipóteses relacionadas</span>
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(() => {
                        // Determina quais hipóteses mostrar com base no estado e na pesquisa
                        let hipotesesToShow = [];
                        
                        if (showAllHipoteses) {
                          // Mostrar todas as hipóteses (filtradas pela pesquisa)
                          // Primeiro, enriquecemos todas as hipóteses com a informação de qtdSintomas
                          const hipotesesEnriquecidas = hipoteseDiagOptions.map(option => {
                            // Procura se esta hipótese está no array de hipóteses filtradas (relacionadas aos sintomas)
                            const matchingSintomaOption = hipoteseDiagFiltradas.find(
                              h => h.idtipo_hipotese_diag === option.idtipo_hipotese_diag
                            );
                            
                            // Se estiver, usa a qtdSintomas dele, senão é 0
                            return {
                              ...option,
                              qtdSintomas: matchingSintomaOption ? matchingSintomaOption.qtdSintomas : 0
                            };
                          });
                          
                          // Agora ordenamos pelo número de sintomas relacionados (do maior para o menor)
                          hipotesesToShow = hipotesesEnriquecidas
                            .sort((a, b) => (b.qtdSintomas || 0) - (a.qtdSintomas || 0))
                            .filter(option => 
                              searchHipotese === '' || 
                              option.descricao.toLowerCase().includes(searchHipotese.toLowerCase())
                            );
                        } else {
                          // Mostrar apenas hipóteses relacionadas (filtradas pela pesquisa)
                          hipotesesToShow = filteredHipoteses;
                        }
                        
                        if (hipotesesToShow.length > 0) {
                          return hipotesesToShow.map((option) => {
                            // Verifica se esta opção está no array hipoteseDiagFiltradas
                            const matchingSintomaOption = hipoteseDiagFiltradas.find(
                              h => h.idtipo_hipotese_diag === option.idtipo_hipotese_diag
                            );
                            
                            // Se estiver no array, usa a qtdSintomas dele, senão é 0
                            const qtdSintomas = matchingSintomaOption ? matchingSintomaOption.qtdSintomas : 0;
                            
                            // Verificamos se esta opção está selecionada
                            const isChecked = formData.hipoteseDiagnostica.includes(option.idtipo_hipotese_diag.toString());
                            
                            return (
                              <HipoteseDiagItem
                                key={option.idtipo_hipotese_diag}
                                option={option}
                                qtdSintomas={qtdSintomas}
                                formData={formData}
                                checked={isChecked}
                                onChange={() => {
                                  // Se já estava selecionada, desmarcar
                                  if (isChecked) {
                                    handleCheckboxChange && handleCheckboxChange("hipoteseDiagnostica", option.idtipo_hipotese_diag.toString());
                                  } else {
                                    // Se não estava selecionada, substituir a seleção atual (se houver) por esta
                                    handleCheckboxChange && setFormData({
                                      ...formData,
                                      hipoteseDiagnostica: [option.idtipo_hipotese_diag.toString()]
                                    });
                                  }
                                }}
                                showAllHipoteses={showAllHipoteses}
                              />
                            );
                          });
                        } else if (searchHipotese) {
                          return (
                            <div className="md:col-span-3 text-center p-3 text-gray-500 italic border border-dashed border-gray-300 rounded-lg">
                              Nenhuma hipótese diagnóstica encontrada para "{searchHipotese}".
                            </div>
                          );
                        } else if (formData.sinaisESintomas.length > 0 && hipoteseDiagFiltradas.length === 0) {
                          return (
                            <div className="md:col-span-3 text-center p-3 text-gray-500 italic border border-dashed border-gray-300 rounded-lg">
                              Nenhuma hipótese diagnóstica encontrada para os sintomas selecionados.
                              <div className="mt-2">
                                <button 
                                  type="button"
                                  onClick={() => setShowAllHipoteses(true)}
                                  className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                                >
                                  Ver todas as hipóteses disponíveis
                                </button>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="md:col-span-3 text-center p-3 text-gray-500 italic border border-dashed border-gray-300 rounded-lg">
                              Selecione sintomas para ver hipóteses diagnósticas relacionadas ou
                              <button 
                                type="button"
                                onClick={() => setShowAllHipoteses(true)}
                                className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                              >
                                veja todas as hipóteses disponíveis
                              </button>.
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Observação da Hipótese para TODOS os tipos de atendimento */}
            <div className="md:col-span-2">
              <FormField
                label="Observação da Hipótese"
                name="observacaoHipotese"
                value={formData.observacaoHipotese}
                onChange={handleChange}
                type="textarea"
                placeholder="Informações adicionais sobre a hipótese diagnóstica..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceInfoSection;
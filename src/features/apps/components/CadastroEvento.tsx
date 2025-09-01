import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useEvento, useCreateEvento, useUpdateEvento, useCheckEventoExisting } from '../hooks/useEvento';
import { MunicipioService } from '@/services/MunicipioService';
import { EstadoService } from '@/services/EstadoService';
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";

import {
  PageLayout,
  PageHeader,
  FormContainer,
  FormInput,
  Alert,
  SubmitButton,
  CancelButton,
  ButtonGroup,
  formatText,
  capitalizeFirstLetter
} from './shared';

interface Municipio {
  idtipo_municipio: number;
  descricao: string;
  tipo_estado_idtipo_estado: number;
}

interface Estado {
  idtipo_estado: number;
  descricao: string;
}

const CadastroTipoEvento = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({ 
    descricao: '', 
    ativo: 'S',
    municipios_ids: [] as number[]
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [selectedMunicipios, setSelectedMunicipios] = useState<number[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<number>(0);
  const [isEventoNacional, setIsEventoNacional] = useState(false);
  const [allMunicipios, setAllMunicipios] = useState<Municipio[]>([]);
  
  // Filtros de pesquisa
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [municipioFilter, setMunicipioFilter] = useState<string>('');
  const [filteredEstados, setFilteredEstados] = useState<Estado[]>([]);
  const [filteredMunicipios, setFilteredMunicipios] = useState<Municipio[]>([]);

  // React Query hooks
  const { data: tipoEvento, isLoading: loadingData } = useEvento(id ? parseInt(id) : 0);
  const createMutation = useCreateEvento();
  const updateMutation = useUpdateEvento();
  const checkExistingMutation = useCheckEventoExisting();

  // Carregar estados na inicialização
  useEffect(() => {
    const loadEstados = async () => {
      try {
        console.log('🔄 Carregando todos os estados...');
        const estadosData = await EstadoService.getAllForSelect();
        console.log(`✅ Carregados ${estadosData?.length || 0} estados do Brasil`);
        setEstados(estadosData || []);
      } catch (error) {
        console.error('❌ Erro ao carregar estados:', error);
        setError('Erro ao carregar estados');
      }
    };

    loadEstados();
  }, []);

  // Carregar todos os municípios para evento nacional
  useEffect(() => {
    const loadAllMunicipios = async () => {
      try {
        console.log('🔄 Carregando todos os municípios para eventos nacionais...');
        const municipiosData = await MunicipioService.getAll();
        console.log(`✅ Carregados ${municipiosData?.length || 0} municípios do Brasil`);
        setAllMunicipios(municipiosData || []);
      } catch (error) {
        console.error('❌ Erro ao carregar todos os municípios:', error);
      }
    };

    loadAllMunicipios();
  }, []);

  // Carregar municípios filtrados por estado
  useEffect(() => {
    if (selectedEstado > 0 && !isEventoNacional) {
      const loadMunicipiosByEstado = async () => {
        setLoadingMunicipios(true);
        try {
          console.log(`🔄 Carregando municípios do estado ${selectedEstado}...`);
          // 🔧 CORREÇÃO: Usar limite alto para carregar TODOS os municípios do estado
          const response = await MunicipioService.getAllPaginated(1, 10000, '', selectedEstado);
          console.log(`✅ Carregados ${response.data?.length || 0} municípios do estado`);
          setMunicipios(response.data || []);
        } catch (error) {
          console.error('❌ Erro ao carregar municípios do estado:', error);
          setError('Erro ao carregar municípios do estado');
        } finally {
          setLoadingMunicipios(false);
        }
      };

      loadMunicipiosByEstado();
    } else if (isEventoNacional) {
      setMunicipios(allMunicipios);
    } else {
      setMunicipios([]);
    }
  }, [selectedEstado, isEventoNacional, allMunicipios]);

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (tipoEvento && !dataLoaded && allMunicipios.length > 0) {
      const municipiosIds = tipoEvento.abrangencia?.map(ab => ab.municipio.idtipo_municipio) || [];
      
      setFormData({
        descricao: tipoEvento.descricao,
        ativo: tipoEvento.ativo || 'S',
        municipios_ids: municipiosIds
      });
      setSelectedMunicipios(municipiosIds);
      
      // Detectar se é evento nacional (todos os municípios ou mais de 80% dos municípios)
      const isNacional = municipiosIds.length >= allMunicipios.length * 0.8;
      
      if (isNacional) {
        setIsEventoNacional(true);
        setSelectedEstado(0);
      } else if (municipiosIds.length > 0) {
        // Detectar estado com base no primeiro município selecionado
        const primeiroMunicipio = allMunicipios.find(m => m.idtipo_municipio === municipiosIds[0]);
        if (primeiroMunicipio) {
          setSelectedEstado(primeiroMunicipio.tipo_estado_idtipo_estado);
        }
      }
      
      setDataLoaded(true);
    }
  }, [tipoEvento, dataLoaded, allMunicipios]);

  // Filtrar estados com base no campo de pesquisa
  useEffect(() => {
    if (estadoFilter.trim() === '') {
      setFilteredEstados(estados);
    } else {
      const filtered = estados.filter(estado =>
        estado.descricao.toLowerCase().includes(estadoFilter.toLowerCase())
      );
      setFilteredEstados(filtered);
    }
  }, [estados, estadoFilter]);

  // Filtrar municípios com base no campo de pesquisa
  useEffect(() => {
    if (municipioFilter.trim() === '') {
      setFilteredMunicipios(municipios);
    } else {
      const filtered = municipios.filter(municipio =>
        municipio.descricao.toLowerCase().includes(municipioFilter.toLowerCase())
      );
      setFilteredMunicipios(filtered);
    }
  }, [municipios, municipioFilter]);

  const handleEventoNacionalToggle = () => {
    setIsEventoNacional(prev => {
      const newValue = !prev;
      console.log(`🌍 Evento Nacional ${newValue ? 'ATIVADO' : 'DESATIVADO'}`);
      
      if (newValue) {
        // Se ativou evento nacional, seleciona todos os municípios e limpa o estado
        setSelectedEstado(0);
        const allIds = allMunicipios.map(m => m.idtipo_municipio);
        console.log(`✅ Selecionando ${allIds.length} municípios para evento nacional`);
        setSelectedMunicipios(allIds);
        setFormData(current => ({
          ...current,
          municipios_ids: allIds
        }));
      } else {
        // Se desativou evento nacional, limpa seleção
        console.log('🔄 Limpando seleção de municípios');
        setSelectedMunicipios([]);
        setFormData(current => ({
          ...current,
          municipios_ids: []
        }));
      }
      return newValue;
    });
  };

  const handleEstadoChange = (estadoId: number) => {
    if (!isEventoNacional) {
      setSelectedEstado(estadoId);
      setSelectedMunicipios([]);
      setFormData(current => ({
        ...current,
        municipios_ids: []
      }));
    }
  };

  const handleSelectAllMunicipios = () => {
    // Se há filtro ativo, seleciona apenas os municípios filtrados, senão seleciona todos
    const municipiosParaSelecionar = municipioFilter.trim() !== '' ? filteredMunicipios : municipios;
    
    if (municipiosParaSelecionar.length > 0) {
      const allIds = municipiosParaSelecionar.map(m => m.idtipo_municipio);
      // Adiciona os IDs aos já selecionados (não substitui)
      const newSelectedIds = [...new Set([...selectedMunicipios, ...allIds])];
      setSelectedMunicipios(newSelectedIds);
      setFormData(current => ({
        ...current,
        municipios_ids: newSelectedIds
      }));
    }
  };

  const handleClearAllMunicipios = () => {
    setSelectedMunicipios([]);
    setFormData(current => ({
      ...current,
      municipios_ids: []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = formatText(formData.descricao);
    const capitalizedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    if (trimmedDesc.length > 60) {
      setError('A descrição deve ter no máximo 60 caracteres.');
      return;
    }

    if (selectedMunicipios.length === 0) {
      setError('Selecione pelo menos um município para a abrangência.');
      return;
    }

    const isSaving = createMutation.isPending || updateMutation.isPending;
    if (isSaving) return;

    try {
      setError(null);
      setSuccess(false);

      // Verificar duplicatas
      const isDuplicate = await checkExistingMutation.mutateAsync({
        descricao: capitalizedDesc,
        excludeId: id ? parseInt(id) : undefined
      });

      if (isDuplicate) {
        setError('Já existe um tipo de evento com essa descrição.');
        return;
      }

      if (id) {
        await updateMutation.mutateAsync({
          id: parseInt(id),
          descricao: capitalizedDesc,
          ativo: formData.ativo,
          municipios_ids: selectedMunicipios
        });
      } else {
        await createMutation.mutateAsync({
          descricao: capitalizedDesc,
          ativo: formData.ativo,
          municipios_ids: selectedMunicipios
        });
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/evento', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar tipo de evento. Verifique os dados e tente novamente.');
    }
  };

  const handleCancel = () => {
    navigate('/private/evento');
  };

  const handleMunicipioToggle = (municipioId: number) => {
    setSelectedMunicipios(prev => {
      const isSelected = prev.includes(municipioId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== municipioId)
        : [...prev, municipioId];
      
      setFormData(current => ({
        ...current,
        municipios_ids: newSelection
      }));
      
      return newSelection;
    });
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Tipo de Evento' : 'Novo Tipo de Evento'}
        onMenuClick={() => setIsMenuOpen(true)}
        onBackClick={() => navigate('/private/apps-auxiliares')}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <FormContainer onSubmit={handleSubmit}>
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={`Tipo de evento ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}


        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
          placeholder="Digite a descrição do tipo de evento"
          required
          disabled={createMutation.isPending || updateMutation.isPending}
          preventSpaceStart
          formatOnBlur
          maxLength={60}
        />

        {/* Campo de Status */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="ativo"
            value={formData.ativo}
            onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.value }))}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="S">Ativo</option>
            <option value="N">Inativo</option>
          </select>
        </div>

        {/* 🆕 SEÇÃO: Abrangência de Municípios */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Abrangência de Municípios *
          </label>
          
          {/* Opção Evento Nacional */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="eventoNacional"
              checked={isEventoNacional}
              onChange={handleEventoNacionalToggle}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="eventoNacional" className="text-sm font-medium text-gray-700 cursor-pointer">
              Evento Nacional (todos os municípios)
            </label>
          </div>

          {/* Seleção de Estado - desabilitado se evento nacional */}
          {!isEventoNacional && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Selecione o Estado
              </label>
              
              {/* Campo de pesquisa para estados */}
              <input
                type="text"
                placeholder="Pesquisar estado..."
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-sm"
              />
              
              <select
                value={selectedEstado}
                onChange={(e) => handleEstadoChange(parseInt(e.target.value))}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value={0}>Selecione um estado</option>
                {filteredEstados.map((estado) => (
                  <option key={estado.idtipo_estado} value={estado.idtipo_estado}>
                    {estado.descricao}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Controles de seleção */}
          {(isEventoNacional || selectedEstado > 0) && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {isEventoNacional ? 'Todos os municípios do Brasil' : 'Municípios do estado selecionado'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllMunicipios}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  disabled={loadingMunicipios || createMutation.isPending || updateMutation.isPending}
                >
                  {municipioFilter.trim() !== '' ? 'Selecionar Filtrados' : 'Selecionar Todos'}
                </button>
                <button
                  type="button"
                  onClick={handleClearAllMunicipios}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  disabled={loadingMunicipios || createMutation.isPending || updateMutation.isPending}
                >
                  Limpar Seleção
                </button>
              </div>
            </div>
          )}

          {/* Lista de municípios */}
          {(isEventoNacional || selectedEstado > 0) && (
            <>
              {loadingMunicipios ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Carregando municípios...</span>
                </div>
              ) : (
                <>
                  {/* Campo de pesquisa para municípios */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Pesquisar Municípios
                    </label>
                    <input
                      type="text"
                      placeholder="Pesquisar município..."
                      value={municipioFilter}
                      onChange={(e) => setMunicipioFilter(e.target.value)}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
                      {filteredMunicipios.map((municipio) => (
                        <label
                          key={municipio.idtipo_municipio}
                          className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMunicipios.includes(municipio.idtipo_municipio)}
                            onChange={() => handleMunicipioToggle(municipio.idtipo_municipio)}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-gray-700">{municipio.descricao}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Mostrar mensagem se não houver resultados na pesquisa */}
                    {filteredMunicipios.length === 0 && municipioFilter.trim() !== '' && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        Nenhum município encontrado para "{municipioFilter}"
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="text-sm text-gray-600">
                {isEventoNacional ? (
                  <span className="font-medium">
                    {selectedMunicipios.length} de {allMunicipios.length} municípios do Brasil selecionados
                    {selectedMunicipios.length === allMunicipios.length && allMunicipios.length > 0 ? 
                      ' ✅ (Todos os municípios)' : ''}
                  </span>
                ) : (
                  <span>
                    {selectedMunicipios.length} município{selectedMunicipios.length !== 1 ? 's' : ''} selecionado{selectedMunicipios.length !== 1 ? 's' : ''}
                    {municipioFilter.trim() !== '' && (
                      <span className="text-blue-600 ml-2">
                        (Mostrando {filteredMunicipios.length} de {municipios.length} municípios)
                      </span>
                    )}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Validação: mostrar aviso se nenhum município selecionado */}
          {!isEventoNacional && selectedEstado === 0 && (
            <div className="text-sm text-gray-500 italic">
              Selecione um estado para ver os municípios ou marque "Evento Nacional"
            </div>
          )}
        </div>

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={createMutation.isPending || updateMutation.isPending}
          />
          <SubmitButton
            isLoading={createMutation.isPending || updateMutation.isPending}
            isDisabled={loadingData || loadingMunicipios}
            defaultText={id ? "Atualizar Tipo de Evento" : "Criar Tipo de Evento"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTipoEvento;
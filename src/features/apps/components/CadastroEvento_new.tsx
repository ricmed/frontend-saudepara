import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useEvento, useCreateEvento, useUpdateEvento, useCheckEventoExisting } from '../hooks/useEvento';
import { MunicipioService } from '@/services/MunicipioService';
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

  // React Query hooks
  const { data: tipoEvento, isLoading: loadingData } = useEvento(id ? parseInt(id) : 0);
  const createMutation = useCreateEvento();
  const updateMutation = useUpdateEvento();
  const checkExistingMutation = useCheckEventoExisting();

  // Carregar municípios na inicialização
  useEffect(() => {
    const loadMunicipios = async () => {
      setLoadingMunicipios(true);
      try {
        const municipiosData = await MunicipioService.getAll();
        setMunicipios(municipiosData);
      } catch (error) {
        console.error('Erro ao carregar municípios:', error);
        setError('Erro ao carregar lista de municípios');
      } finally {
        setLoadingMunicipios(false);
      }
    };

    loadMunicipios();
  }, []);

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (tipoEvento && !dataLoaded) {
      const municipiosIds = tipoEvento.abrangencia?.map(ab => ab.municipio.idtipo_municipio) || [];
      
      setFormData({
        descricao: tipoEvento.descricao,
        ativo: tipoEvento.ativo || 'S',
        municipios_ids: municipiosIds
      });
      setSelectedMunicipios(municipiosIds);
      setDataLoaded(true);
    }
  }, [tipoEvento, dataLoaded]);

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

  const handleSelectAll = () => {
    const allIds = municipios.map(m => m.idtipo_municipio);
    setSelectedMunicipios(allIds);
    setFormData(current => ({
      ...current,
      municipios_ids: allIds
    }));
  };

  const handleDeselectAll = () => {
    setSelectedMunicipios([]);
    setFormData(current => ({
      ...current,
      municipios_ids: []
    }));
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
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Abrangência de Municípios *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                disabled={loadingMunicipios || createMutation.isPending || updateMutation.isPending}
              >
                Selecionar Todos
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                disabled={loadingMunicipios || createMutation.isPending || updateMutation.isPending}
              >
                Limpar Seleção
              </button>
            </div>
          </div>

          {loadingMunicipios ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Carregando municípios...</span>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
                {municipios.map((municipio) => (
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
            </div>
          )}

          <div className="text-sm text-gray-600">
            {selectedMunicipios.length} município{selectedMunicipios.length !== 1 ? 's' : ''} selecionado{selectedMunicipios.length !== 1 ? 's' : ''}
          </div>
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

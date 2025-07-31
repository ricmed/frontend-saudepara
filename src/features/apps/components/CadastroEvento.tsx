import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useEvento, useCreateEvento, useUpdateEvento, useCheckEventoExisting } from '../hooks/useEvento';
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

const CadastroTipoEvento = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({ descricao: '', ativo: 'S' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // React Query hooks
  const { data: tipoEvento, isLoading: loadingData } = useEvento(id ? parseInt(id) : 0);
  const createMutation = useCreateEvento();
  const updateMutation = useUpdateEvento();
  const checkExistingMutation = useCheckEventoExisting();

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (tipoEvento && !dataLoaded) {
      setFormData({
        descricao: tipoEvento.descricao,
        ativo: tipoEvento.ativo || 'S'
      });
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
          ativo: formData.ativo
        });
      } else {
        await createMutation.mutateAsync({
          descricao: capitalizedDesc,
          ativo: formData.ativo
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

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={createMutation.isPending || updateMutation.isPending}
          />
          <SubmitButton
            isLoading={createMutation.isPending || updateMutation.isPending}
            isDisabled={loadingData}
            defaultText={id ? "Atualizar Tipo de Evento" : "Criar Tipo de Evento"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTipoEvento;
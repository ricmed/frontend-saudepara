import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useTrauma, useCreateTrauma, useUpdateTrauma } from '../hooks/useTrauma';
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

const CadastroTipoTrauma = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({ descricao: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // React Query hooks
  const { data: trauma, isLoading } = useTrauma(id ? parseInt(id) : 0);
  const createMutation = useCreateTrauma();
  const updateMutation = useUpdateTrauma();

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (trauma && !dataLoaded) {
      setFormData({ descricao: trauma.descricao });
      setDataLoaded(true);
    }
  }, [trauma, dataLoaded]);

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

    if (createMutation.isPending || updateMutation.isPending) return;

    try {
      setError(null);
      setSuccess(false);

      if (id) {
        await updateMutation.mutateAsync({ id: parseInt(id), descricao: capitalizedDesc });
      } else {
        await createMutation.mutateAsync(capitalizedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/trauma', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar tipo de trauma. Verifique os dados e tente novamente.');
    }
  };

  const handleCancel = () => {
    navigate('/private/trauma');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Tipo de Trauma' : 'Novo Tipo de Trauma'}
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
            message={`Tipo de trauma ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição do tipo de trauma"
          required
          disabled={createMutation.isPending || updateMutation.isPending}
          preventSpaceStart
          formatOnBlur
          maxLength={60}
        />

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={createMutation.isPending || updateMutation.isPending}
          />
          <SubmitButton
            isLoading={createMutation.isPending || updateMutation.isPending}
            isDisabled={isLoading}
            defaultText={id ? "Atualizar Tipo de Trauma" : "Criar Tipo de Trauma"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTipoTrauma;
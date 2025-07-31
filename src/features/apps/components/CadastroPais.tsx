import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { usePais, useCreatePais, useUpdatePais } from '../hooks/usePais';
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

const CadastroPais = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({ descricao: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // React Query hooks
  const { data: pais, isLoading: loadingData } = usePais(id ? parseInt(id) : 0);
  const createMutation = useCreatePais();
  const updateMutation = useUpdatePais();

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (pais && !dataLoaded) {
      setFormData({ descricao: pais.descricao });
      setDataLoaded(true);
    }
  }, [pais, dataLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = formatText(formData.descricao);
    const formattedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    if (trimmedDesc.length > 50) {
      setError('A descrição deve ter no máximo 50 caracteres.');
      return;
    }

    const isSaving = createMutation.isPending || updateMutation.isPending;
    if (isSaving) return;

    try {
      setError(null);
      setSuccess(false);

      if (id) {
        await updateMutation.mutateAsync({
          id: parseInt(id),
          descricao: formattedDesc
        });
      } else {
        await createMutation.mutateAsync(formattedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/pais', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar país. Verifique os dados e tente novamente.');
    }
  };

  const handleCancel = () => {
    const hasChanges = formData.descricao.trim() !== '';
    
    if (hasChanges) {
      if (window.confirm('Deseja realmente cancelar? As alterações serão perdidas.')) {
        navigate('/private/pais');
      }
    } else {
      navigate('/private/pais');
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar País' : 'Novo País'}
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
            message={`País ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição do país"
          maxLength={50}
          required
          disabled={createMutation.isPending || updateMutation.isPending}
          preventSpaceStart
          formatOnBlur
        />

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={createMutation.isPending || updateMutation.isPending}
          />
          <SubmitButton
            isLoading={createMutation.isPending || updateMutation.isPending}
            isDisabled={loadingData}
            defaultText={id ? "Atualizar País" : "Criar País"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroPais;
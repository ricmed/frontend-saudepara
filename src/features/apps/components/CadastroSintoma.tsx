import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useSintoma, useCreateSintoma, useUpdateSintoma, useCheckSintomaExisting } from '../hooks/useSintoma';
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

const CadastroTipoSintoma = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({ descricao: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // React Query hooks
  const { data: tipoSintoma, isLoading: loadingData } = useSintoma(id ? parseInt(id) : 0);
  const createMutation = useCreateSintoma();
  const updateMutation = useUpdateSintoma();
  const checkExistingMutation = useCheckSintomaExisting();

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (tipoSintoma && !dataLoaded) {
      setFormData({ descricao: tipoSintoma.descricao });
      setDataLoaded(true);
    }
  }, [tipoSintoma, dataLoaded]);

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
        setError('Já existe um tipo de sintoma com essa descrição.');
        return;
      }

      if (id) {
        await updateMutation.mutateAsync({
          id: parseInt(id),
          descricao: capitalizedDesc
        });
      } else {
        await createMutation.mutateAsync(capitalizedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/sintoma', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar tipo de sintoma. Verifique os dados e tente novamente.');
    }
  };

  const handleCancel = () => {
    navigate('/private/sintoma');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Tipo de Sintoma' : 'Novo Tipo de Sintoma'}
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
            message={`Tipo de sintoma ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição do tipo de sintoma"
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
            isDisabled={loadingData}
            defaultText={id ? "Atualizar Tipo de Sintoma" : "Criar Tipo de Sintoma"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTipoSintoma;
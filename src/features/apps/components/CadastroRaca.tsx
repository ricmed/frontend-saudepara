import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { 
  useRaca, 
  useCreateRaca, 
  useUpdateRaca,
  useCheckRacaExisting 
} from '@/features/apps/hooks/useRaca';
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

const CadastroRaca = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({ descricao: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // React Query hooks
  const { data: raca, isLoading: loadingRaca } = useRaca(Number(id));
  const createMutation = useCreateRaca();
  const updateMutation = useUpdateRaca();
  const checkExistingMutation = useCheckRacaExisting();

  // Carregar dados para edição
  useEffect(() => {
    if (raca) {
      setFormData({ descricao: raca.descricao });
    }
  }, [raca]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedDesc = formatText(formData.descricao);
    const capitalizedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    try {
      setError(null);
      setSuccess(false);
      
      // Verificar duplicata apenas se não estiver editando ou se a descrição foi alterada
      if (!isEditing || trimmedDesc !== raca?.descricao) {
        const exists = await checkExistingMutation.mutateAsync({ descricao: trimmedDesc });
        if (exists) {
          setError('Já existe uma raça com esta descrição.');
          return;
        }
      }

      if (isEditing) {
        await updateMutation.mutateAsync({ id: Number(id), descricao: capitalizedDesc });
      } else {
        await createMutation.mutateAsync(capitalizedDesc);
        setFormData({ descricao: '' });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/private/raca');
      }, 2000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar raça. Verifique os dados e tente novamente.');
    }
  };

  // Loading da raça sendo editada
  if (isEditing && loadingRaca) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageLayout>
    );
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || checkExistingMutation.isPending;

  return (
    <PageLayout>
      <PageHeader
        title={isEditing ? 'Editar Raça' : 'Nova Raça'}
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
            message="Raça criada/atualizada com sucesso!"
            onClose={() => setSuccess(false)}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição da raça"
          required
          disabled={isLoading}
          preventSpaceStart
          formatOnBlur
        />

        <ButtonGroup>
          <CancelButton
            onClick={() => navigate('/private/raca')}
            isDisabled={isLoading}
          />
          <SubmitButton
            isLoading={isLoading}
            isDisabled={loadingRaca}
            defaultText={isEditing ? "Atualizar Raça" : "Criar Raça"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroRaca;

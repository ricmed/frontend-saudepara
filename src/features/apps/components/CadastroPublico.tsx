import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { 
  usePublico, 
  useCreatePublico, 
  useUpdatePublico,
  useCheckPublicoExisting 
} from '@/features/apps/hooks/usePublico';
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

const CadastroPublico = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({ descricao: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // React Query hooks
  const { data: publico, isLoading: loadingPublico } = usePublico(Number(id));
  const createMutation = useCreatePublico();
  const updateMutation = useUpdatePublico();
  const checkExistingMutation = useCheckPublicoExisting();

  // Carregar dados para edição
  useEffect(() => {
    if (publico) {
      setFormData({ descricao: publico.descricao });
    }
  }, [publico]);

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
      if (!isEditing || trimmedDesc !== publico?.descricao) {
        const exists = await checkExistingMutation.mutateAsync({ descricao: trimmedDesc });
        if (exists) {
          setError('Já existe um público com esta descrição.');
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
        navigate('/private/publico');
      }, 2000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar público. Verifique os dados e tente novamente.');
    }
  };

  // Loading do público sendo editado
  if (isEditing && loadingPublico) {
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
        title={isEditing ? 'Editar Público' : 'Novo Público'}
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
            message="Público criado/atualizado com sucesso!"
            onClose={() => setSuccess(false)}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição do público"
          required
          disabled={isLoading}
          preventSpaceStart
          formatOnBlur
        />

        <ButtonGroup>
          <CancelButton
            onClick={() => navigate('/private/publico')}
            isDisabled={isLoading}
          />
          <SubmitButton
            isLoading={isLoading}
            isDisabled={loadingPublico}
            defaultText={isEditing ? "Atualizar Público" : "Criar Público"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroPublico;

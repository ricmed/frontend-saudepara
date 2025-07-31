import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { 
  useNatureza, 
  useCreateNatureza, 
  useUpdateNatureza,
  useCheckNaturezaExisting 
} from '@/features/apps/hooks/useNatureza';
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

const CadastroNatureza = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({ descricao: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // React Query hooks
  const { data: natureza, isLoading: loadingNatureza } = useNatureza(Number(id));
  const createMutation = useCreateNatureza();
  const updateMutation = useUpdateNatureza();
  const checkExistingMutation = useCheckNaturezaExisting();

  // Carregar dados para edição
  useEffect(() => {
    if (natureza) {
      setFormData({ descricao: natureza.descricao });
    }
  }, [natureza]);

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
      if (!isEditing || trimmedDesc !== natureza?.descricao) {
        const exists = await checkExistingMutation.mutateAsync({ descricao: trimmedDesc });
        if (exists) {
          setError('Já existe uma natureza com esta descrição.');
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
      setTimeout(() => navigate('/private/naturezas'), 1500);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar natureza. Verifique os dados e tente novamente.');
    }
  };

  // Loading da natureza sendo editada
  if (isEditing && loadingNatureza) {
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
        title={isEditing ? 'Editar Natureza' : 'Nova Natureza'}
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
            message={`Natureza ${isEditing ? "atualizada" : "criada"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição da natureza"
          required
          disabled={isLoading}
          preventSpaceStart
          formatOnBlur
        />

        <ButtonGroup>
          <CancelButton
            onClick={() => navigate('/private/naturezas')}
            isDisabled={isLoading}
          />
          <SubmitButton
            isLoading={isLoading}
            isDisabled={loadingNatureza}
            defaultText={isEditing ? "Atualizar Natureza" : "Criar Natureza"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroNatureza;
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { 
  useTipoAtendimento, 
  useCreateTipoAtendimento, 
  useUpdateTipoAtendimento,
  useCheckTipoAtendimentoExisting 
} from '@/features/apps/hooks/useAtendimento';
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

const CadastroTipoAtendimento = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  // Estados simples - só UI
  const [formData, setFormData] = useState({ descricao: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // React Query hooks - substituem TODO o useState + useEffect anterior!
  const { data: tipoAtendimento, isLoading: loadingTipoAtendimento } = useTipoAtendimento(Number(id));
  const createMutation = useCreateTipoAtendimento();
  const updateMutation = useUpdateTipoAtendimento();
  const checkExistingMutation = useCheckTipoAtendimentoExisting();

  // Carregar dados para edição
  useEffect(() => {
    if (tipoAtendimento) {
      setFormData({ descricao: tipoAtendimento.descricao });
    }
  }, [tipoAtendimento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedDesc = formatText(formData.descricao);
    const capitalizedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    if (trimmedDesc.length > 45) {
      setError('A descrição deve ter no máximo 45 caracteres.');
      return;
    }

    try {
      setError(null);
      setSuccess(false);

      // Verificar se já existe
      const isDuplicate = await checkExistingMutation.mutateAsync({
        descricao: capitalizedDesc,
        excludeId: id ? parseInt(id) : undefined
      });

      if (isDuplicate) {
        setError('Já existe um tipo de atendimento com essa descrição.');
        return;
      }

      // Criar ou atualizar
      if (isEditing) {
        await updateMutation.mutateAsync({ 
          id: parseInt(id), 
          descricao: capitalizedDesc 
        });
      } else {
        await createMutation.mutateAsync(capitalizedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/atendimento', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar tipo de atendimento. Verifique os dados e tente novamente.');
    }
  };

  // Loading do tipo de atendimento sendo editado
  if (isEditing && loadingTipoAtendimento) {
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
        title={isEditing ? 'Editar Tipo de Atendimento' : 'Novo Tipo de Atendimento'}
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
            message={`Tipo de atendimento ${isEditing ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição do tipo de atendimento"
          required
          disabled={isLoading}
          preventSpaceStart
          formatOnBlur
          maxLength={45}
        />

        <ButtonGroup>
          <CancelButton
            onClick={() => navigate('/private/atendimento')}
            isDisabled={isLoading}
          />
          <SubmitButton
            isLoading={isLoading}
            isDisabled={loadingTipoAtendimento}
            defaultText={isEditing ? "Atualizar Tipo de Atendimento" : "Criar Tipo de Atendimento"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTipoAtendimento;
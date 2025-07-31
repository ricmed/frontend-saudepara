import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { 
  useHabilitacao, 
  useCreateHabilitacao, 
  useUpdateHabilitacao,
  useCheckHabilitacaoCodigoExisting 
} from '@/features/apps/hooks/useHabilitacao';
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

const CadastroHabilitacao = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({ 
    codigo: '', 
    descricao: '' 
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // React Query hooks
  const { data: habilitacao, isLoading: loadingHabilitacao } = useHabilitacao(Number(id));
  const createMutation = useCreateHabilitacao();
  const updateMutation = useUpdateHabilitacao();
  const checkCodigoMutation = useCheckHabilitacaoCodigoExisting();

  // Carregar dados para edição
  useEffect(() => {
    if (habilitacao) {
      setFormData({
        codigo: habilitacao.codigo || '',
        descricao: habilitacao.descricao || ''
      });
    }
  }, [habilitacao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedCodigo = formatText(formData.codigo);
    const trimmedDescricao = formatText(formData.descricao);
    const capitalizedDescricao = capitalizeFirstLetter(trimmedDescricao);

    if (!trimmedCodigo || !trimmedDescricao) {
      setError('Código e descrição não podem estar vazios.');
      return;
    }

    if (trimmedCodigo.length > 4) {
      setError('O código deve ter no máximo 4 caracteres.');
      return;
    }

    try {
      setError(null);
      setSuccess(false);
      // Verificar duplicata de código apenas se não estiver editando ou se o código foi alterado
      if (!isEditing || trimmedCodigo !== habilitacao?.codigo) {
        const codigoExists = await checkCodigoMutation.mutateAsync({ codigo: trimmedCodigo });
        if (codigoExists) {
          setError('Já existe uma habilitação com este código.');
          return;
        }
      }

      const habilitacaoData = {
        codigo: trimmedCodigo,
        descricao: capitalizedDescricao
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: Number(id), data: habilitacaoData });
      } else {
        await createMutation.mutateAsync(habilitacaoData);
        setFormData({ codigo: '', descricao: '' });
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/habilitacao'), 1500);
    } catch (error: any) {
      setError(error.message || 'Erro ao salvar habilitação.');
    }
  };

  // Loading do habilitacao sendo editado
  if (isEditing && loadingHabilitacao) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageLayout>
    );
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || checkCodigoMutation.isPending;

  return (
    <PageLayout>
      <PageHeader
        title={isEditing ? 'Editar Habilitação' : 'Nova Habilitação'}
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
            message={`Habilitação ${isEditing ? "atualizada" : "criada"} com sucesso!`}
          />
        )}

        <FormInput
          label="Código"
          name="codigo"
          value={formData.codigo}
          onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
          placeholder="Digite o código da habilitação"
          required
          disabled={isLoading}
          preventSpaceStart
          formatOnBlur
          maxLength={4}
        />

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
          placeholder="Digite a descrição da habilitação"
          required
          disabled={isLoading}
          preventSpaceStart
          formatOnBlur
        />

        <ButtonGroup>
          <CancelButton
            onClick={() => navigate('/private/habilitacao')}
            isDisabled={isLoading}
          />
          <SubmitButton
            isLoading={isLoading}
            isDisabled={loadingHabilitacao}
            defaultText={isEditing ? "Atualizar Habilitação" : "Criar Habilitação"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroHabilitacao;
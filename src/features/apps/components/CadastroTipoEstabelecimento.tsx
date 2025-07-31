import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useEstabelecimento, useCreateEstabelecimento, useUpdateEstabelecimento } from '../hooks/useEstabelecimento';
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

interface FormData {
  descricao: string;
}

const CadastroTipoEstabelecimento = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState<FormData>({ 
    descricao: '' 
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // React Query hooks
  const { data: estabelecimento, isLoading } = useEstabelecimento(id ? parseInt(id) : 0);
  const createMutation = useCreateEstabelecimento();
  const updateMutation = useUpdateEstabelecimento();

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (estabelecimento && !dataLoaded) {
      setFormData({ 
        descricao: estabelecimento.descricao 
      });
      setDataLoaded(true);
    }
  }, [estabelecimento, dataLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = formatText(formData.descricao);
    const formattedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    if (createMutation.isPending || updateMutation.isPending) return;

    try {
      setError(null);
      setSuccess(false);

      if (id) {
        await updateMutation.mutateAsync({ id: parseInt(id), descricao: formattedDesc });
      } else {
        await createMutation.mutateAsync(formattedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate("/private/tipo-estabelecimentos", { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar estabelecimento. Verifique os dados e tente novamente.');
    }
  };

  const handleCancel = () => {
    navigate('/estabelecimentos');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
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
            message={`Estabelecimento ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Descreva o tipo de estabelecimento"
          required
          disabled={createMutation.isPending || updateMutation.isPending}
          maxLength={255}
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
            isDisabled={isLoading}
            defaultText={id ? "Atualizar Estabelecimento" : "Criar Estabelecimento"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTipoEstabelecimento;
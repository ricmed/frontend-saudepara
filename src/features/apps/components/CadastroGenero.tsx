import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useGenero, useCreateGenero, useUpdateGenero, useCheckGeneroExisting } from '../hooks/useGenero';

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

const CadastroGenero = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const generoId = id ? parseInt(id) : undefined;
  
  const [formData, setFormData] = useState({ descricao: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: generoData, isLoading: loadingGenero } = useGenero(generoId!);
  const createGenero = useCreateGenero();
  const updateGenero = useUpdateGenero();
  const checkExisting = useCheckGeneroExisting();

  // Carregar dados quando disponível
  useEffect(() => {
    if (generoData && !formData.descricao) {
      setFormData({ descricao: generoData.descricao });
    }
  }, [generoData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = formatText(formData.descricao);
    const formattedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    if (createGenero.isPending || updateGenero.isPending) return;

    try {
      setError(null);
      setSuccess(false);

      const existsResult = await checkExisting.mutateAsync({
        descricao: formattedDesc,
        excludeId: generoId
      });

      if (existsResult) {
        setError('Já existe um gênero com essa descrição.');
        return;
      }

      if (generoId) {
        await updateGenero.mutateAsync({ id: generoId, descricao: formattedDesc });
      } else {
        await createGenero.mutateAsync(formattedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/genero', { replace: true }), 1500);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar gênero. Verifique os dados e tente novamente.');
    }
  };

  const handleCancel = () => {
    navigate('/private/genero');
  };

  const isLoading = loadingGenero || createGenero.isPending || updateGenero.isPending;

  return (
    <PageLayout>
      <PageHeader
        title={generoId ? 'Editar Gênero' : 'Novo Gênero'}
        onMenuClick={() => setIsMenuOpen(true)}
        onBackClick={() => navigate('/private/apps-auxiliares')}
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
            message={`Gênero ${generoId ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => {
            const value = e.target.value;
            if (value && /^\d/.test(value)) return; // Previne números no início
            setFormData({ descricao: value });
          }}
          placeholder="Digite a descrição do gênero"
          required
          disabled={isLoading}
          preventSpaceStart
          formatOnBlur
        />

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={isLoading}
          />
          <SubmitButton
            isLoading={isLoading}
            isDisabled={loadingGenero}
            defaultText={generoId ? "Atualizar Gênero" : "Criar Gênero"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroGenero;
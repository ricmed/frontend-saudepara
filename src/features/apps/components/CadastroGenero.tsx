import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { GeneroService } from "@/services/GeneroService";

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
  
  const [formData, setFormData] = useState({ descricao: '' });
  const [loading, setLoading] = useState({
    initial: !!id,
    saving: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const data = await GeneroService.getById(parseInt(id));
        if (data) {
          setFormData({ descricao: data.descricao });
        }
      } catch (err) {
        setError('Erro ao carregar dados do gênero');
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = formatText(formData.descricao);
    const formattedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    if (loading.saving) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);

      const exists = await GeneroService.checkExisting(
        formattedDesc,
        id ? parseInt(id) : undefined
      );

      if (exists) {
        setError('Já existe um gênero com essa descrição.');
        return;
      }

      if (id) {
        await GeneroService.update(parseInt(id), formattedDesc);
      } else {
        await GeneroService.create(formattedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/genero/lista', { replace: true }), 1500);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar gênero. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/genero/lista');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Gênero' : 'Novo Gênero'}
        onMenuClick={() => setIsMenuOpen(true)}
        onBackClick={() => navigate(-1)}
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
            message={`Gênero ${id ? "atualizado" : "criado"} com sucesso!`}
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
          disabled={loading.saving}
          preventSpaceStart
          formatOnBlur
        />

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={loading.saving}
          />
          <SubmitButton
            isLoading={loading.saving}
            isDisabled={loading.initial}
            defaultText={id ? "Atualizar Gênero" : "Criar Gênero"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroGenero;
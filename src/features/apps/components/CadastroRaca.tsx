import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { RacaService } from "@/services/RacaService";

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
        const data = await RacaService.getById(parseInt(id));
        if (data) {
          setFormData({ descricao: data.descricao });
        }
      } catch (err) {
        setError('Erro ao carregar dados da raça');
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

      const exists = await RacaService.checkExisting(
        formattedDesc,
        id ? parseInt(id) : undefined
      );

      if (exists) {
        setError('Já existe uma raça com essa descrição.');
        return;
      }

      if (id) {
        await RacaService.update(parseInt(id), formattedDesc);
      } else {
        await RacaService.create(formattedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/raca', { replace: true }), 1500);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar raça. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/private/raca');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Raça' : 'Nova Raça'}
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
            message={`Raça ${id ? "atualizada" : "criada"} com sucesso!`}
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
          placeholder="Digite a descrição da raça"
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
            defaultText={id ? "Atualizar Raça" : "Criar Raça"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroRaca;
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { TipoBairroService } from '@/services/BairroService';
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

const CadastroTipoBairro = () => {
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
        const tipoBairro = await TipoBairroService.getById(parseInt(id));
        if (tipoBairro) {
          setFormData({ descricao: tipoBairro.descricao });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados do tipo de bairro');
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = formatText(formData.descricao);
    const capitalizedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    if (trimmedDesc.length > 80) {
      setError('A descrição deve ter no máximo 80 caracteres.');
      return;
    }

    if (loading.saving) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);

      // Verifica duplicidade apenas se tiver pelo menos 3 caracteres
      if (capitalizedDesc.length >= 3) {
        const isDuplicate = await TipoBairroService.checkExisting(
          capitalizedDesc,
          id ? parseInt(id) : undefined
        );

        if (isDuplicate) {
          setError('Já existe um tipo de bairro com essa descrição.');
          setLoading(prev => ({ ...prev, saving: false }));
          return;
        }
      }

      if (id) {
        await TipoBairroService.update(parseInt(id), capitalizedDesc);
      } else {
        await TipoBairroService.create(capitalizedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/lista-tipos-bairro', { replace: true }), 1500);
      
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      // Tenta extrair uma mensagem de erro mais amigável se disponível
      setError(err.message || 'Erro ao salvar tipo de bairro. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/lista-tipos-bairro');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Tipo de Bairro' : 'Novo Tipo de Bairro'}
        onMenuClick={() => setIsMenuOpen(true)}
        onBackClick={() => navigate(-1)}
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
            message={`Tipo de bairro ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição do tipo de bairro"
          required
          disabled={loading.saving}
          preventSpaceStart
          formatOnBlur
          maxLength={80}
        />

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={loading.saving}
          />
          <SubmitButton
            isLoading={loading.saving}
            isDisabled={loading.initial}
            defaultText={id ? "Atualizar Tipo de Bairro" : "Criar Tipo de Bairro"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTipoBairro;
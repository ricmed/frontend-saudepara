import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { ComponentsService } from '@/services/ComponentsService';
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

const CadastroComponente = () => {
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
        const component = await ComponentsService.getById(parseInt(id));
        if (component) {
          setFormData({ descricao: component.descricao });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados do componente');
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

    if (loading.saving) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);

      const isDuplicate = await ComponentsService.checkExisting(
        capitalizedDesc,
        id ? parseInt(id) : undefined
      );

      if (isDuplicate) {
        setError('Já existe um componente com essa descrição.');
        return;
      }

      if (id) {
        await ComponentsService.update(parseInt(id), capitalizedDesc);
      } else {
        await ComponentsService.create(capitalizedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/componente', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar componente. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/private/componente');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Componente' : 'Novo Componente'}
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
            message={`Componente ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição do componente"
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
            defaultText={id ? "Atualizar Componente" : "Criar Componente"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroComponente;
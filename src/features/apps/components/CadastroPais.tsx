import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { PaisService } from '@/services/PaisService';
import SideBarMenuAppsAuxiliares from "./SideBarMenuAppsAuxiliares";

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

const CadastroPais = () => {
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
        const pais = await PaisService.getById(parseInt(id));
        if (pais) {
          setFormData({ descricao: pais.descricao });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados do país');
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

    if (trimmedDesc.length > 50) {
      setError('A descrição deve ter no máximo 50 caracteres.');
      return;
    }

    if (loading.saving) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);

      const isDuplicate = await PaisService.checkExisting(
        formattedDesc,
        id ? parseInt(id) : undefined
      );

      if (isDuplicate) {
        setError('Já existe um país com essa descrição.');
        return;
      }

      if (id) {
        await PaisService.update(parseInt(id), formattedDesc);
      } else {
        await PaisService.create(formattedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/pais', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar país. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    const hasChanges = formData.descricao.trim() !== '';
    
    if (hasChanges) {
      if (window.confirm('Deseja realmente cancelar? As alterações serão perdidas.')) {
        navigate('/private/pais');
      }
    } else {
      navigate('/private/pais');
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar País' : 'Novo País'}
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
            message={`País ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição do país"
          maxLength={50}
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
            defaultText={id ? "Atualizar País" : "Criar País"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroPais;
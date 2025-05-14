import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { TiposSintomaService } from '@/services/SintomaService';
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

const CadastroTipoSintoma = () => {
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
        const tipoSintoma = await TiposSintomaService.getById(parseInt(id));
        if (tipoSintoma) {
          setFormData({ descricao: tipoSintoma.descricao });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados do tipo de sintoma');
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

    if (trimmedDesc.length > 60) {
      setError('A descrição deve ter no máximo 60 caracteres.');
      return;
    }

    if (loading.saving) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);

      const isDuplicate = await TiposSintomaService.checkExisting(
        capitalizedDesc,
        id ? parseInt(id) : undefined
      );

      if (isDuplicate) {
        setError('Já existe um tipo de sintoma com essa descrição.');
        return;
      }

      if (id) {
        await TiposSintomaService.update(parseInt(id), capitalizedDesc);
      } else {
        await TiposSintomaService.create(capitalizedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/sintoma', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar tipo de sintoma. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/private/sintoma');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Tipo de Sintoma' : 'Novo Tipo de Sintoma'}
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
            message={`Tipo de sintoma ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição do tipo de sintoma"
          required
          disabled={loading.saving}
          preventSpaceStart
          formatOnBlur
          maxLength={60}
        />

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={loading.saving}
          />
          <SubmitButton
            isLoading={loading.saving}
            isDisabled={loading.initial}
            defaultText={id ? "Atualizar Tipo de Sintoma" : "Criar Tipo de Sintoma"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTipoSintoma;
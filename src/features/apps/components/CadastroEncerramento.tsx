import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { TiposEncerramentoService } from '@/services/EncerramentoService';
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

const CadastroTipoEncerramento = () => {
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
        const tipoEncerramento = await TiposEncerramentoService.getById(parseInt(id));
        if (tipoEncerramento) {
          setFormData({ descricao: tipoEncerramento.descricao });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados do tipo de encerramento');
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

      const isDuplicate = await TiposEncerramentoService.checkExisting(
        capitalizedDesc,
        id ? parseInt(id) : undefined
      );

      if (isDuplicate) {
        setError('Já existe um tipo de encerramento com essa descrição.');
        return;
      }

      if (id) {
        await TiposEncerramentoService.update(parseInt(id), capitalizedDesc);
      } else {
        await TiposEncerramentoService.create(capitalizedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/encerramento', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar tipo de encerramento. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/private/encerramento');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Tipo de Encerramento' : 'Novo Tipo de Encerramento'}
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
            message={`Tipo de encerramento ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição do tipo de encerramento"
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
            defaultText={id ? "Atualizar Tipo de Encerramento" : "Criar Tipo de Encerramento"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTipoEncerramento;
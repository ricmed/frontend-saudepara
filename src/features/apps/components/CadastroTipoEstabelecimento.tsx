import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { EstabelecimentoService } from '@/services/EstabelecimentoService';
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
  const [loading, setLoading] = useState({
    initial: !!id,
    saving: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      
      try {
        const estabelecimento = await EstabelecimentoService.getById(parseInt(id));
        if (estabelecimento) {
          setFormData({ 
            descricao: estabelecimento.descricao 
          });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados do estabelecimento');
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    carregarDados();
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

      const isDuplicate = await EstabelecimentoService.checkExisting(
        formattedDesc,
        id ? parseInt(id) : undefined
      );

      if (isDuplicate) {
        setError('Já existe um estabelecimento com essa descrição.');
        return;
      }

      const payload = {
        descricao: formattedDesc,
        idtipo_estabelecimento: id ? parseInt(id) : 0
      };

      if (id) {
        await EstabelecimentoService.update(parseInt(id), payload);
      } else {
        await EstabelecimentoService.create(payload);
      }

      setSuccess(true);
      setTimeout(() => navigate("/estabelecimentos", { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar estabelecimento. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
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
          disabled={loading.saving}
          maxLength={255}
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
            defaultText={id ? "Atualizar Estabelecimento" : "Criar Estabelecimento"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTipoEstabelecimento;
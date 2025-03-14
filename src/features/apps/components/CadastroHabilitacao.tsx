import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { HabilitacaoService } from '@/services/HabilitacaoService';
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
  codigo: string;
  descricao: string;
}

const CadastroHabilitacao = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState<FormData>({ 
    codigo: '',
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
        const habilitacao = await HabilitacaoService.getById(parseInt(id));
        if (habilitacao) {
          setFormData({ 
            codigo: habilitacao.codigo,
            descricao: habilitacao.descricao 
          });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados da habilitação');
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    carregarDados();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCodigo = formatText(formData.codigo);
    const formattedDesc = capitalizeFirstLetter(formatText(formData.descricao));

    if (!trimmedCodigo || !formattedDesc) {
      setError('Código e descrição não podem estar vazios');
      return;
    }

    if (!(/^\d+$/.test(trimmedCodigo))) {
      setError('O código deve conter apenas números');
      return;
    }

    if (loading.saving) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);

      const [codigoExistente, descricaoExistente] = await Promise.all([
        HabilitacaoService.checkExistingCodigo(trimmedCodigo, id ? parseInt(id) : undefined),
        HabilitacaoService.checkExistingDescricao(formattedDesc, id ? parseInt(id) : undefined)
      ]);

      if (codigoExistente) {
        setError('Já existe uma habilitação com este código');
        return;
      }

      if (descricaoExistente) {
        setError('Já existe uma habilitação com esta descrição');
        return;
      }

      const payload = {
        codigo: trimmedCodigo,
        descricao: formattedDesc,
      };

      if (id) {
        await HabilitacaoService.update(parseInt(id), payload);
      } else {
        await HabilitacaoService.create(payload);
      }

      setSuccess(true);
      setTimeout(() => navigate("/lista-habilitacoes", { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar habilitação. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/lista-habilitacoes');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Habilitação' : 'Nova Habilitação'}
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
            message={`Habilitação ${id ? "atualizada" : "criada"} com sucesso!`}
          />
        )}

        <div className="space-y-4">
          <FormInput
            label="Código"
            name="codigo"
            value={formData.codigo}
            onChange={(e) => {
              const numericValue = e.target.value.replace(/\D/g, '');
              setFormData(prev => ({ ...prev, codigo: numericValue }));
            }}
            placeholder="Digite o código da habilitação"
            maxLength={15}
            required
            disabled={loading.saving}
            preventSpaceStart
            formatOnBlur
          />

          <FormInput
            label="Descrição"
            name="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            placeholder="Descreva a habilitação"
            required
            disabled={loading.saving}
            preventSpaceStart
            formatOnBlur
          />
        </div>

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={loading.saving}
          />
          <SubmitButton
            isLoading={loading.saving}
            isDisabled={loading.initial}
            defaultText={id ? "Atualizar Habilitação" : "Criar Habilitação"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroHabilitacao;
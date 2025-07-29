import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { EstadoService } from '@/services/EstadoService';
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

const CadastroEstado = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({ 
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
    const loadData = async () => {
      if (!id) return;
      
      try {
        const estado = await EstadoService.getById(parseInt(id));
        if (estado) {
          setFormData({ 
            codigo: estado.codigo,
            descricao: estado.descricao 
          });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados do estado');
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    loadData();
  }, [id]);

  const validateForm = () => {
    const trimmedCodigo = formData.codigo.trim();
    const trimmedDesc = formData.descricao.trim();

    if (!trimmedCodigo || !trimmedDesc) {
      setError('Todos os campos são obrigatórios.');
      return false;
    }

    if (trimmedCodigo.length > 5) {
      setError('O código deve ter no máximo 5 caracteres.');
      return false;
    }

    if (trimmedDesc.length > 45) {
      setError('A descrição deve ter no máximo 45 caracteres.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (loading.saving) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);

      const trimmedCodigo = formatText(formData.codigo);
      const formattedDesc = capitalizeFirstLetter(formatText(formData.descricao));

      const isDuplicateCodigo = await EstadoService.checkExisting(
        trimmedCodigo,
        id ? parseInt(id) : undefined
      );

      if (isDuplicateCodigo) {
        setError('Já existe um estado com esse código.');
        return;
      }

      const isDuplicateDescricao = await EstadoService.checkExistingDescricao(
        formattedDesc,
        id ? parseInt(id) : undefined
      );

      if (isDuplicateDescricao) {
        setError('Já existe um estado com essa descrição.');
        return;
      }

      if (id) {
        await EstadoService.update(parseInt(id), trimmedCodigo, formattedDesc);
      } else {
        await EstadoService.create(trimmedCodigo, formattedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/estado', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar estado. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/private/estado');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Estado' : 'Novo Estado'}
        onMenuClick={() => setIsMenuOpen(true)}
        onBackClick={() => navigate('/private/apps-auxiliares')}
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
            message={`Estado ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <div className="space-y-4">
          <FormInput
            label="Código"
            name="codigo"
            value={formData.codigo}
            onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
            placeholder="Digite o código do estado"
            maxLength={5}
            required
            disabled={loading.saving}
            preventSpaceStart
            formatOnBlur
            onlyNumbers={true}
          />

          <FormInput
            label="Descrição"
            name="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            placeholder="Digite a descrição do estado"
            maxLength={45}
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
            defaultText={id ? "Atualizar Estado" : "Criar Estado"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroEstado;
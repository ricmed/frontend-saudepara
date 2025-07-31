import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useEstado, useCreateEstado, useUpdateEstado, useCheckEstadoExisting } from '../hooks/useEstado';
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
  const estadoId = id ? parseInt(id) : undefined;
  
  const [formData, setFormData] = useState({ 
    codigo: '',
    descricao: '' 
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { data: estadoData, isLoading: loadingEstado } = useEstado(estadoId || 0);
  const createEstado = useCreateEstado();
  const updateEstado = useUpdateEstado();
  const checkExisting = useCheckEstadoExisting();

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (estadoData && !dataLoaded) {
      setFormData({ 
        codigo: estadoData.codigo,
        descricao: estadoData.descricao 
      });
      setDataLoaded(true);
    }
  }, [estadoData, dataLoaded]);

  const validateForm = () => {
    const trimmedCodigo = formData.codigo.trim().toUpperCase();
    const trimmedDesc = formData.descricao.trim();

    if (!trimmedCodigo || !trimmedDesc) {
      setError('Todos os campos são obrigatórios.');
      return false;
    }

    if (trimmedCodigo.length !== 2) {
      setError('O código deve ter exatamente 2 letras.');
      return false;
    }

    if (!/^[A-Z]{2}$/.test(trimmedCodigo)) {
      setError('O código deve conter apenas letras.');
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
    if (createEstado.isPending || updateEstado.isPending) return;

    try {
      setError(null);
      setSuccess(false);

      const trimmedCodigo = formData.codigo.trim().toUpperCase();
      const formattedDesc = capitalizeFirstLetter(formatText(formData.descricao));

      const isDuplicateCodigo = await checkExisting.mutateAsync({
        codigo: trimmedCodigo,
        excludeId: estadoId
      });

      if (isDuplicateCodigo) {
        setError('Já existe um estado com esse código.');
        return;
      }
      
      if (estadoId) {
        await updateEstado.mutateAsync({ 
          id: estadoId, 
          codigo: trimmedCodigo, 
          descricao: formattedDesc 
        });
      } else {
        await createEstado.mutateAsync({ 
          codigo: trimmedCodigo, 
          descricao: formattedDesc 
        });
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/estado', { replace: true }), 1500);
      
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError(err.message || 'Erro ao salvar estado. Verifique os dados e tente novamente.');
    }
  };

  const handleCancel = () => {
    navigate('/private/estado');
  };

  const isLoading = loadingEstado || createEstado.isPending || updateEstado.isPending;

  return (
    <PageLayout>
      <PageHeader
        title={estadoId ? 'Editar Estado' : 'Novo Estado'}
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
            message={`Estado ${estadoId ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <div className="space-y-4">
          <FormInput
            label="Código"
            name="codigo"
            value={formData.codigo}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              // Permite apenas letras e limita a 2 caracteres
              if (/^[A-Z]*$/.test(value) && value.length <= 2) {
                setFormData(prev => ({ ...prev, codigo: value }));
              }
            }}
            placeholder="Digite o código do estado (2 letras)"
            maxLength={2}
            required
            disabled={isLoading}
            preventSpaceStart
          />

          <FormInput
            label="Descrição"
            name="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            placeholder="Digite a descrição do estado"
            maxLength={45}
            required
            disabled={isLoading}
            preventSpaceStart
            formatOnBlur
          />
        </div>

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={isLoading}
          />
          <SubmitButton
            isLoading={isLoading}
            isDisabled={loadingEstado}
            defaultText={estadoId ? "Atualizar Estado" : "Criar Estado"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroEstado;
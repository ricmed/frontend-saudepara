import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useMunicipio, useCreateMunicipio, useUpdateMunicipio } from '../hooks/useMunicipio';
import { useEstados } from '../hooks/useEstado';
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";

import {
  PageLayout,
  PageHeader,
  FormContainer,
  FormInput,
  FormSelect,
  Alert,
  SubmitButton,
  CancelButton,
  ButtonGroup,
  formatText,
  capitalizeFirstLetter
} from './shared';

interface Estado {
  idtipo_estado: number;
  codigo: string;
  descricao: string;
}

const CadastroMunicipio = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({ 
    codigo: '',
    descricao: '',
    tipo_estado_idtipo_estado: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // React Query hooks
  const { data: municipio, isLoading: loadingData } = useMunicipio(id ? parseInt(id) : 0);
  const { data: estadosData } = useEstados(1, 100, ''); // Carregar todos os estados
  const createMutation = useCreateMunicipio();
  const updateMutation = useUpdateMunicipio();

  const estados = estadosData?.data || [];

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (municipio && !dataLoaded) {
      setFormData({
        codigo: municipio.codigo,
        descricao: municipio.descricao,
        tipo_estado_idtipo_estado: municipio.tipo_estado_idtipo_estado
      });
      setDataLoaded(true);
    }
  }, [municipio, dataLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = formatText(formData.codigo);
    const trimmedDesc = formatText(formData.descricao);
    const capitalizedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedCode) {
      setError('O código não pode estar vazio.');
      return;
    }

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    if (formData.tipo_estado_idtipo_estado === 0) {
      setError('Selecione um estado.');
      return;
    }

    if (trimmedCode.length > 10) {
      setError('O código deve ter no máximo 10 caracteres.');
      return;
    }

    if (trimmedDesc.length > 60) {
      setError('A descrição deve ter no máximo 60 caracteres.');
      return;
    }

    const isSaving = createMutation.isPending || updateMutation.isPending;
    if (isSaving) return;

    try {
      setError(null);
      setSuccess(false);

      const municipioData = {
        codigo: trimmedCode,
        descricao: capitalizedDesc,
        estadoId: formData.tipo_estado_idtipo_estado
      };

      if (id) {
        await updateMutation.mutateAsync({
          id: parseInt(id),
          ...municipioData
        });
      } else {
        await createMutation.mutateAsync(municipioData);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/municipio', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar município. Verifique os dados e tente novamente.');
    }
  };

  const handleCancel = () => {
    navigate('/private/municipio');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Município' : 'Novo Município'}
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
            message={`Município ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Código"
          name="codigo"
          value={formData.codigo}
          onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
          placeholder="Digite o código do município"
          required
          disabled={createMutation.isPending || updateMutation.isPending}
          preventSpaceStart
          formatOnBlur
          maxLength={10}
        />

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
          placeholder="Digite a descrição do município"
          required
          disabled={createMutation.isPending || updateMutation.isPending}
          preventSpaceStart
          formatOnBlur
          maxLength={60}
        />

        <FormSelect
          label="Estado"
          name="tipo_estado_idtipo_estado"
          value={formData.tipo_estado_idtipo_estado}
          onChange={(e) => setFormData(prev => ({ ...prev, tipo_estado_idtipo_estado: parseInt(e.target.value) }))}
          required
          disabled={createMutation.isPending || updateMutation.isPending}
          options={[
            { value: 0, label: 'Selecione um estado' },
            ...estados.map(estado => ({
              value: estado.idtipo_estado,
              label: `${estado.codigo} - ${estado.descricao}`
            }))
          ]}
        />

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={createMutation.isPending || updateMutation.isPending}
          />
          <SubmitButton
            isLoading={createMutation.isPending || updateMutation.isPending}
            isDisabled={loadingData}
            defaultText={id ? "Atualizar Município" : "Criar Município"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroMunicipio;

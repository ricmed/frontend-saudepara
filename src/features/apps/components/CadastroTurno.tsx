import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useTurno, useCreateTurno, useUpdateTurno } from '../hooks/useTurno';
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

const CadastroTurno = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState<FormData>({ 
    descricao: '' 
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // React Query hooks
  const { data: turno, isLoading } = useTurno(id ? parseInt(id) : 0);
  const createMutation = useCreateTurno();
  const updateMutation = useUpdateTurno();

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (turno && !dataLoaded) {
      setFormData({ descricao: turno.descricao });
      setDataLoaded(true);
    }
  }, [turno, dataLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = formatText(formData.descricao);
    const formattedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    if (createMutation.isPending || updateMutation.isPending) return;

    try {
      setError(null);
      setSuccess(false);

      if (id) {
        await updateMutation.mutateAsync({ id: parseInt(id), descricao: formattedDesc });
      } else {
        await createMutation.mutateAsync(formattedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate("/private/turnos", { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar turno. Verifique os dados e tente novamente.');
    }
  };

  const handleCancel = () => {
    navigate('/private/turnos');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Turno' : 'Novo Turno'}
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
            message={`Turno ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <div className="space-y-4">
          <FormInput
            label="Descrição"
            name="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData({ descricao: e.target.value })}
            placeholder="Digite a descrição do turno"
            required
            disabled={createMutation.isPending || updateMutation.isPending}
            maxLength={255}
            preventSpaceStart
            formatOnBlur
          />
          <p className="text-sm text-gray-500 text-right">
            {formData.descricao.length}/255 caracteres
          </p>
        </div>

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={createMutation.isPending || updateMutation.isPending}
          />
          <SubmitButton
            isLoading={createMutation.isPending || updateMutation.isPending}
            isDisabled={isLoading}
            defaultText={id ? "Atualizar Turno" : "Criar Turno"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTurno;
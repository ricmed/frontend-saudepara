import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { TurnoService } from '@/services/TurnoService';
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
  const [loading, setLoading] = useState({
    initial: Boolean(id),
    saving: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      
      try {
        const turno = await TurnoService.getById(parseInt(id));
        if (turno) {
          setFormData({ 
            descricao: turno.descricao 
          });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados do turno');
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

      const isDuplicate = await TurnoService.checkExisting(
        formattedDesc,
        id ? parseInt(id) : undefined
      );

      if (isDuplicate) {
        setError('Já existe um turno com essa descrição.');
        return;
      }

      const payload = {
        id_turno: 0,
        descricao: formattedDesc
      };

      if (id) {
        await TurnoService.update(parseInt(id), payload);
      } else {
        await TurnoService.create(formattedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate("/private/turnos", { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar turno. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
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
            disabled={loading.saving}
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
            isDisabled={loading.saving}
          />
          <SubmitButton
            isLoading={loading.saving}
            isDisabled={loading.initial}
            defaultText={id ? "Atualizar Turno" : "Criar Turno"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTurno;
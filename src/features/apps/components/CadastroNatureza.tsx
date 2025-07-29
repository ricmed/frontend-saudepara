import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NaturezaService } from "@/services/NaturezaService";
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

const CadastroNatureza = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState<FormData>({
    descricao: "",
  });
  const [loading, setLoading] = useState({
    initial: Boolean(id),
    saving: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;

      try {
        const natureza = await NaturezaService.getById(parseInt(id));
        if (natureza) {
          setFormData({
            descricao: natureza.descricao,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar:", err);
        setError("Erro ao carregar dados da natureza");
      } finally {
        setLoading((prev) => ({ ...prev, initial: false }));
      }
    };

    carregarDados();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = formatText(formData.descricao);
    const formattedDesc = capitalizeFirstLetter(trimmedDesc);
  
    if (!trimmedDesc) {
      setError("A descrição não pode estar vazia.");
      return;
    }
  
    try {
      setLoading((prev) => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);
  
      const exists = await NaturezaService.checkExisting(
        formattedDesc,
        id ? parseInt(id) : undefined
      );
  
      if (exists) {
        setError('Já existe uma natureza com essa descrição.');
        return;
      }
  
      if (id) {
        await NaturezaService.update(parseInt(id), formattedDesc);
      } else {
        await NaturezaService.create(formattedDesc);
      }
  
      setSuccess(true);
      setTimeout(() => navigate("/private/naturezas", { replace: true }), 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar natureza. Verifique os dados e tente novamente.');
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/private/naturezas');
  };
  
  return (
    <PageLayout>
      <PageHeader
        title={id ? "Editar Natureza" : "Nova Natureza"}
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
            message={`Natureza ${id ? "atualizada" : "criada"} com sucesso!`}
          />
        )}

        <div className="space-y-4">
          <FormInput
            label="Descrição"
            name="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData({ descricao: e.target.value })}
            placeholder="Digite a descrição da natureza"
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
            defaultText={id ? "Atualizar Natureza" : "Criar Natureza"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroNatureza;
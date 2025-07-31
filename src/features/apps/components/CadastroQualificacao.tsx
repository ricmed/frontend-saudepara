import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQualificacao, useCreateQualificacao, useUpdateQualificacao } from '../hooks/useQualificacao';
import { useComponentes } from '../hooks/useComponentes';
import SideBarMenuAppsAuxiliares from "./SideBarMenuAppsAuxiliares";

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

interface TipoQualificacao {
  idtipo_qualificacao: number;
  descricao: string;
  idcomponente: number;
}

interface Componente {
  idcomponente: number;
  descricao: string;
}

const CadastroQualificacao = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState<TipoQualificacao>({
    idtipo_qualificacao: 0,
    descricao: "",
    idcomponente: 0,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // React Query hooks
  const { data: qualificacao, isLoading: loadingQualificacao } = useQualificacao(id ? Number(id) : 0);
  const { data: componentesData } = useComponentes(1, 1000); // limite alto para pegar todos
  const createMutation = useCreateQualificacao();
  const updateMutation = useUpdateQualificacao();

  const componentes = componentesData?.data || [];

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (qualificacao && !dataLoaded) {
      setFormData({
        idtipo_qualificacao: qualificacao.idtipo_qualificacao,
        descricao: qualificacao.descricao,
        idcomponente: qualificacao.idcomponente,
      });
      setDataLoaded(true);
    }
  }, [qualificacao, dataLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedDesc = formatText(formData.descricao);
    const formattedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError("A descrição não pode estar vazia.");
      return;
    }

    if (!formData.idcomponente) {
      setError("Selecione um componente.");
      return;
    }

    if (createMutation.isPending || updateMutation.isPending) return;

    try {
      const payload = {
        descricao: formattedDesc,
        idcomponente: formData.idcomponente,
      };

      if (id) {
        await updateMutation.mutateAsync({ 
          id: Number(id), 
          descricao: formattedDesc, 
          idcomponente: formData.idcomponente 
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      setSuccess(true);
      setTimeout(() => navigate("/private/qualificacao"), 1500);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError(
        "Erro. Já existe uma qualificação com essa descrição em outro componente."
      );
    }
  };

  const handleCancel = () => {
    navigate('/private/qualificacao');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? "Editar Qualificação" : "Nova Qualificação"}
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
            message={`Qualificação ${id ? "atualizada" : "criada"} com sucesso!`}
          />
        )}

        <div className="space-y-4">
          <FormInput
            label="Descrição"
            name="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Digite a descrição da qualificação"
            required
            disabled={createMutation.isPending || updateMutation.isPending}
            preventSpaceStart
            formatOnBlur
          />

          <FormSelect
            label="Componente"
            name="componente"
            value={formData.idcomponente}
            onChange={(e) => setFormData({
              ...formData,
              idcomponente: Number(e.target.value),
            })}
            options={componentes.map(comp => ({
              value: comp.idcomponente,
              label: comp.descricao
            }))}
            placeholder="Selecione um componente"
            required
            disabled={componentesData?.meta ? false : true}
          />
        </div>

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={createMutation.isPending || updateMutation.isPending}
          />
          <SubmitButton
            isLoading={createMutation.isPending || updateMutation.isPending}
            isDisabled={loadingQualificacao}
            defaultText={id ? "Atualizar Qualificação" : "Criar Qualificação"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroQualificacao;
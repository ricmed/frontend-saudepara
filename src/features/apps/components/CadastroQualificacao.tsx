import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TipoQualificacaoService } from "@/services/TipoQualificacaoService";
import { ComponentsService } from "@/services/ComponentsService";
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

  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [loading, setLoading] = useState({
    componentes: true,
    qualificacao: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [componentesData, qualificacaoData] = await Promise.all([
          ComponentsService.getAll(),
          id ? TipoQualificacaoService.getById(Number(id)) : null,
        ]);

        setComponentes(componentesData);

        if (id && qualificacaoData) {
          setFormData({
            idtipo_qualificacao: qualificacaoData.idtipo_qualificacao,
            descricao: qualificacaoData.descricao,
            idcomponente: qualificacaoData.idcomponente,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError(
          id
            ? "Erro ao carregar os dados da qualificação"
            : "Erro ao carregar componentes"
        );
      } finally {
        setLoading(prev => ({ ...prev, componentes: false }));
      }
    };

    init();
  }, [id]);

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

    if (loading.qualificacao) return;

    try {
      setLoading(prev => ({ ...prev, qualificacao: true }));

      const isDuplicate = await TipoQualificacaoService.checkExisting(
        formattedDesc,
        formData.idcomponente,
        id ? Number(id) : undefined
      );

      if (isDuplicate) {
        setError(
          "Já existe uma qualificação com esta descrição para o componente selecionado."
        );
        return;
      }

      const payload = {
        descricao: formattedDesc,
        idcomponente: formData.idcomponente,
      };

      if (id) {
        await TipoQualificacaoService.update(Number(id), payload);
      } else {
        await TipoQualificacaoService.create(payload);
      }

      setSuccess(true);
      setTimeout(() => navigate("/qualificacao/lista"), 1500);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError(
        "Erro. Já existe uma qualificação com essa descrição em outro componente."
      );
    } finally {
      setLoading(prev => ({ ...prev, qualificacao: false }));
    }
  };

  const handleCancel = () => {
    navigate('/qualificacao/lista');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? "Editar Qualificação" : "Nova Qualificação"}
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
            disabled={loading.qualificacao}
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
            disabled={loading.componentes || loading.qualificacao}
          />
        </div>

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={loading.qualificacao}
          />
          <SubmitButton
            isLoading={loading.qualificacao}
            isDisabled={loading.componentes}
            defaultText={id ? "Atualizar Qualificação" : "Criar Qualificação"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroQualificacao;
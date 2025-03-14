import React from "react";
import { Building2 } from "lucide-react";
import DualSelectField from "./DualSelectField";
import SectionTitle from "./SectionTitle";

export interface OptionItem {
  id?: number;
  idtipo_qualificacao?: number;
  idtipo_habilitacao?: number;
  idtipo_estabelecimento?: number;
  tipo_estabelecimento_idtipo_estabelecimento?: number;
  descricao: string;
}

interface QualificacoesHabilitacoesProps {
  qualificacoesDisponiveis: OptionItem[];
  setQualificacoesDisponiveis: React.Dispatch<React.SetStateAction<OptionItem[]>>;
  qualificacoesSelecionadas: OptionItem[];
  setQualificacoesSelecionadas: React.Dispatch<React.SetStateAction<OptionItem[]>>;
  habilitacoes: OptionItem[];
  setHabilitacoes: React.Dispatch<React.SetStateAction<OptionItem[]>>;
  habilitacoesSelecionadas: OptionItem[];
  setHabilitacoesSelecionadas: React.Dispatch<React.SetStateAction<OptionItem[]>>;
}

const QualificationsHabilitations: React.FC<QualificacoesHabilitacoesProps> = ({
  qualificacoesDisponiveis,
  setQualificacoesDisponiveis,
  qualificacoesSelecionadas,
  setQualificacoesSelecionadas,
  habilitacoes,
  setHabilitacoes,
  habilitacoesSelecionadas,
  setHabilitacoesSelecionadas,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 transition-shadow hover:shadow-md">
      <SectionTitle
        icon={<Building2 className="h-5 w-5 text-blue-500" />}
        title="Qualificações e Habilitações"
      />
      <div className="space-y-6">
        <DualSelectField
          label="Qualificações"
          sourceItems={qualificacoesDisponiveis.map((q) => ({
            ...q,
            id: q.idtipo_qualificacao || q.id,
            uniqueId: String(q.idtipo_qualificacao || q.id),
          }))}
          targetItems={qualificacoesSelecionadas.map((q) => ({
            ...q,
            id: q.idtipo_qualificacao || q.id,
            uniqueId: String(q.idtipo_qualificacao || q.id),
          }))}
          onChange={(selectedItems) => {
            const updatedItems = selectedItems.map((item) => ({
              ...item,
              id: item.idtipo_qualificacao || item.id,
              idtipo_qualificacao: item.idtipo_qualificacao || item.id,
            }));
            setQualificacoesSelecionadas(updatedItems);
          }}
          onSourceItemsChange={(availableItems) => {
            const updatedItems = availableItems.map((item) => ({
              ...item,
              id: item.idtipo_qualificacao || item.id,
              idtipo_qualificacao: item.idtipo_qualificacao || item.id,
            }));
            setQualificacoesDisponiveis(updatedItems);
          }}
        />
        <DualSelectField
          label="Habilitações"
          sourceItems={habilitacoes.map((h) => ({
            ...h,
            id: h.idtipo_habilitacao || h.id,
            uniqueId: String(h.idtipo_habilitacao || h.id),
          }))}
          targetItems={habilitacoesSelecionadas.map((h) => ({
            ...h,
            id: h.idtipo_habilitacao || h.id,
            uniqueId: String(h.idtipo_habilitacao || h.id),
          }))}
          onChange={(selectedItems) => {
            const updatedItems = selectedItems.map((item) => ({
              ...item,
              id: item.idtipo_habilitacao || item.id,
              idtipo_habilitacao: item.idtipo_habilitacao || item.id,
            }));
            setHabilitacoesSelecionadas(updatedItems);
          }}
          onSourceItemsChange={(availableItems) => {
            const updatedItems = availableItems.map((item) => ({
              ...item,
              id: item.idtipo_habilitacao || item.id,
              idtipo_habilitacao: item.idtipo_habilitacao || item.id,
            }));
            setHabilitacoes(updatedItems);
          }}
        />
      </div>
    </div>
  );
};

export default QualificationsHabilitations;
import { Pencil, Trash } from "lucide-react";
import { Estabelecimento, ColumnDefinition } from "../../types/estabelecimento";
import { formatHabilitacoes } from "../../utils/helpers";

interface TableBodyProps {
  estabelecimentos: Estabelecimento[];
  isLoading: boolean;
  searchTerm: string;
  columns: ColumnDefinition[];
  selectedColumns: string[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const TableBody = ({
  estabelecimentos,
  isLoading,
  searchTerm,
  columns,
  selectedColumns,
  onEdit,
  onDelete,
}: TableBodyProps) => {
  console.log("TableBody renderizando:", { 
    estabelecimentos, 
    isLoading, 
    estabelecimentosLength: estabelecimentos.length 
  });
  if (isLoading) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={selectedColumns.length + 1}
            className="px-8 py-6 text-center text-gray-500"
          >
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (estabelecimentos.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={selectedColumns.length + 1}
            className="px-8 py-6 text-center text-gray-500"
          >
            {searchTerm
              ? "Nenhum resultado encontrado."
              : "Nenhum estabelecimento cadastrado."}
          </td>
        </tr>
      </tbody>
    );
  }

  const renderCellContent = (estab: Estabelecimento, colKey: string) => {
    if (colKey === "habilitacoes") {
      // Verificar se temos dados de habilitação no formato esperado
      // @ts-ignore
      if (estab.estabelecimento_has_tipo_habilitacao) {
        try {
          // @ts-ignore
          const habilitacoes = estab.estabelecimento_has_tipo_habilitacao;
          return habilitacoes.length > 0
            ? habilitacoes
                .map((h: any) => h.tipo_habilitacao?.descricao || "")
                .filter(Boolean)
                .join(", ")
            : "Nenhuma";
        } catch (error) {
          // Fallback para a função formatHabilitacoes original
          return formatHabilitacoes(estab);
        }
      } else {
        // Usar a função original como fallback
        return formatHabilitacoes(estab);
      }
    }
    
    if (colKey === "qualificacoes") {
      try {
        // @ts-ignore
        const qualificacoes = estab.estabelecimento_has_tipo_qualificacao || [];
        return qualificacoes.length > 0
          ? qualificacoes
              .map((q: any) => q.tipo_qualificacao?.descricao || "")
              .filter(Boolean)
              .join(", ")
          : "Nenhuma";
      } catch (error) {
        // Fallback para o comportamento original
        return (estab.qualificacoes?.length || 0) > 0
          ? `${estab.qualificacoes?.length} qualificação(ões)`
          : "Nenhuma";
      }
    }
    
    if (colKey === "ativo") {
      // O valor já chega como "Sim" ou "Não", então vamos apenas retorná-lo
      return estab.ativo;
    }
    
    if (colKey === "natureza") {
      // @ts-ignore
      if (estab.tipo_natureza) {
        // @ts-ignore
        return estab.tipo_natureza.descricao || "";
      }
      return "";
    }
    
    // Para outros campos, retorna o valor como antes
    return colKey in estab
      ? String(estab[colKey as keyof Estabelecimento])
      : "";
  };

  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {estabelecimentos.map((estab) => (
        <tr
          key={estab.idestabelecimento}
          className="hover:bg-blue-50 transition-colors"
        >
          {columns
            .filter((col) => selectedColumns.includes(col.key))
            .map((col) => (
              <td
                key={col.key}
                className="px-8 py-4 text-gray-700 font-medium whitespace-nowrap"
              >
                {renderCellContent(estab, col.key)}
              </td>
            ))}
          <td className="px-8 py-4 text-right">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => onEdit(estab.idestabelecimento)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                aria-label="Editar"
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(estab.idestabelecimento)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                aria-label="Excluir"
              >
                <Trash className="h-5 w-5" />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

export default TableBody;
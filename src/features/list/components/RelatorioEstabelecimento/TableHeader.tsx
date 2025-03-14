import { ColumnDefinition, Estabelecimento } from "../../types/estabelecimento";

interface TableHeaderProps {
  columns: ColumnDefinition[];
  selectedColumns: string[];
  sortKey: keyof Estabelecimento;
  sortOrder: "asc" | "desc";
  onSortChange: (key: keyof Estabelecimento) => void;
}

export const TableHeader = ({
  columns,
  selectedColumns,
  sortKey,
  sortOrder,
  onSortChange,
}: TableHeaderProps) => {
  return (
    <thead className="bg-blue-50">
      <tr>
        {columns
          .filter((col) => selectedColumns.includes(col.key))
          .map((col) => (
            <th
              key={col.key}
              className="px-8 py-4 text-left text-sm font-semibold text-blue-600 uppercase whitespace-nowrap cursor-pointer"
              onClick={() => onSortChange(col.key)}
            >
              {col.label}
              {sortKey === col.key && (
                <span className="ml-2">{sortOrder === "asc" ? "▲" : "▼"}</span>
              )}
            </th>
          ))}
        <th className="px-8 py-4 text-right text-sm font-semibold text-blue-600 uppercase">
          Ações
        </th>
      </tr>
    </thead>
  );
};

export default TableHeader;

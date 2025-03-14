import { ColumnDefinition } from "../../types/estabelecimento";

interface ColumnsMenuProps {
  isOpen: boolean;
  columns: ColumnDefinition[];
  selectedColumns: string[];
  onToggleColumn: (colKey: string) => void;
}

export const ColumnsMenu = ({
  isOpen,
  columns,
  selectedColumns,
  onToggleColumn,
}: ColumnsMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
      {columns.map((col) => (
        <label
          key={col.key}
          className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selectedColumns.includes(col.key)}
            onChange={() => onToggleColumn(col.key)}
          />
          <span className="text-sm text-gray-700">{col.label}</span>
        </label>
      ))}
    </div>
  );
};

export default ColumnsMenu;

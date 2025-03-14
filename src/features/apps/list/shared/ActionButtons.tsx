import { Pencil, Trash } from "lucide-react";

interface ActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  isProcessing: boolean;
  itemName: string;
}

const ActionButtons = ({
  onEdit,
  onDelete,
  isProcessing,
  itemName
}: ActionButtonsProps) => {
  return (
    <div className="flex justify-end gap-3">
      <button
        onClick={onEdit}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
        disabled={isProcessing}
        aria-label={`Editar ${itemName}`}
      >
        <Pencil className="h-5 w-5" />
      </button>
      <button
        onClick={onDelete}
        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
        disabled={isProcessing}
        aria-label={`Excluir ${itemName}`}
      >
        {isProcessing ? (
          <span className="animate-pulse">Excluindo...</span>
        ) : (
          <Trash className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

export default ActionButtons;
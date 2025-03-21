import React from 'react';
import { Save, Plus, X } from 'lucide-react';

interface ActionButtonsProps {
  handleSave?: () => void;
  handleReset: () => void;
  handleCancel: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  handleSave,
  handleReset,
  handleCancel
}) => {
  return (
    <div className="flex justify-center gap-4 mt-8 pb-8">
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Save className="h-4 w-4" />
        Salvar
      </button>
      <button
        type="button"
        onClick={handleReset}
        className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Novo Registro
      </button>
      <button
        type="button"
        onClick={handleCancel}
        className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        <X className="h-4 w-4" />
        Cancelar
      </button>
    </div>
  );
};

export default ActionButtons;
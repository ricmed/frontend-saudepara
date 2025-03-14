import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface Item {
  id?: number;
  idtipo_qualificacao?: number;
  idtipo_habilitacao?: number;
  tipo_habilitacao_idtipo_habilitacao?: number;
  descricao: string;
  uniqueId?: string;
}

interface DualSelectFieldProps {
  label: string;
  sourceItems: Item[];
  targetItems: Item[];
  onChange?: (selectedItems: Item[]) => void;
  onSourceItemsChange?: (availableItems: Item[]) => void;
}

const DualSelectField: React.FC<DualSelectFieldProps> = ({
  label,
  sourceItems: initialSourceItems,
  targetItems,
  onChange,
  onSourceItemsChange,
}) => {
  const [sourceSelection, setSourceSelection] = useState<string[]>([]);
  const [targetSelection, setTargetSelection] = useState<string[]>([]);
  const [localSourceItems, setLocalSourceItems] = useState<Item[]>([]);
  const [sourceSearchTerm, setSourceSearchTerm] = useState("");
  const [targetSearchTerm, setTargetSearchTerm] = useState("");

  const getItemId = (item: Item, index: number): string => {
    let itemId = `index-${index}`;
    if (item.id) itemId = String(item.id);
    if (item.idtipo_qualificacao) itemId = String(item.idtipo_qualificacao);
    if (item.idtipo_habilitacao) itemId = String(item.idtipo_habilitacao);
    return itemId;
  };

  useEffect(() => {
    const mappedItems = initialSourceItems.map((item, index) => ({
      ...item,
      uniqueId: getItemId(item, index),
    }));
    const availableItems = mappedItems.filter(
      (sourceItem) =>
        !targetItems.some((targetItem, tIndex) => {
          const targetUniqueId =
            targetItem.uniqueId || getItemId(targetItem, tIndex);
          return targetUniqueId === sourceItem.uniqueId;
        })
    );
    setLocalSourceItems(
      availableItems.sort((a, b) => a.descricao.localeCompare(b.descricao))
    );
  }, [initialSourceItems, targetItems]);

  const handleSourceSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeout(() => {
      const selectedIds = Array.from(event.target.selectedOptions, (option) => option.value);
      setSourceSelection(selectedIds);
    }, 0);
  };

  const handleTargetSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeout(() => {
      const selectedIds = Array.from(event.target.selectedOptions, (option) => option.value);
      setTargetSelection(selectedIds);
    }, 0);
  };

  const moveToTarget = () => {
    if (sourceSelection.length === 0) return;
    const itemsToMove = localSourceItems.filter(item => item.uniqueId && sourceSelection.includes(item.uniqueId));
    const newTargetItems = [...targetItems, ...itemsToMove].sort((a, b) =>
      a.descricao.localeCompare(b.descricao)
    );
    onChange?.([...newTargetItems]);
    const newSourceItems = localSourceItems.filter(item => item.uniqueId ? !sourceSelection.includes(item.uniqueId) : false);
    setLocalSourceItems([...newSourceItems]);
    onSourceItemsChange?.(newSourceItems);
    setSourceSelection([]);
  };

  const moveToSource = () => {
    if (targetSelection.length === 0) return;
    const itemsToMoveBack = targetItems.filter((item, index) => {
      const uniqueId = item.uniqueId || getItemId(item, index);
      return targetSelection.includes(uniqueId);
    });
    const newTargetItems = targetItems.filter((item, index) => {
      const uniqueId = item.uniqueId || getItemId(item, index);
      return !targetSelection.includes(uniqueId);
    });
    onChange?.([...newTargetItems]);
    const newSourceItems = [...localSourceItems, ...itemsToMoveBack].sort(
      (a, b) => a.descricao.localeCompare(b.descricao)
    );
    setLocalSourceItems([...newSourceItems]);
    onSourceItemsChange?.(newSourceItems);
    setTargetSelection([]);
  };

  const moveAllToTarget = () => {
    const newTargetItems = [...targetItems, ...localSourceItems].sort((a, b) =>
      a.descricao.localeCompare(b.descricao)
    );
    onChange?.(newTargetItems);
    setLocalSourceItems([]);
    onSourceItemsChange?.([]);
    setSourceSelection([]);
  };

  const moveAllToSource = () => {
    const newSourceItems = [...localSourceItems, ...targetItems].sort((a, b) =>
      a.descricao.localeCompare(b.descricao)
    );
    setLocalSourceItems(newSourceItems);
    onSourceItemsChange?.(newSourceItems);
    onChange?.([]);
    setTargetSelection([]);
  };

  const fieldId = `dual-select-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const filteredSourceItems = localSourceItems.filter((item) =>
    item.descricao.toLowerCase().includes(sourceSearchTerm.toLowerCase().trim())
  );
  const filteredTargetItems = targetItems.filter((item) =>
    (item.descricao || "").toLowerCase().includes(targetSearchTerm.toLowerCase().trim())
  );

  return (
    <div className="mb-8">
      <label className="block mb-3 font-medium text-gray-700">{label}</label>
      <div className="flex flex-row gap-4 overflow-x-auto">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm text-gray-500">Disponíveis</div>
            <div className="relative flex-1">
              <input
                type="text"
                value={sourceSearchTerm}
                onChange={(e) => setSourceSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1 text-sm border border-gray-200 rounded-md"
              />
              <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <select
            id={`${fieldId}-source`}
            multiple
            size={8}
            onChange={handleSourceSelect}
            className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            {filteredSourceItems.map((item, index) => (
              <option
                key={`source-${item.uniqueId || getItemId(item, index)}`}
                value={item.uniqueId || getItemId(item, index)}
                className="p-2 cursor-pointer"
              >
                {item.descricao}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-row md:flex-col justify-center gap-2 my-2">
          <button
            type="button"
            onClick={moveAllToTarget}
            className="p-2 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
            disabled={localSourceItems.length === 0}
          >
            {">>"}
          </button>
          <button
            type="button"
            onClick={moveToTarget}
            className="p-2 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
            disabled={sourceSelection.length === 0}
          >
            {">"}
          </button>
          <button
            type="button"
            onClick={moveToSource}
            className="p-2 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
            disabled={targetSelection.length === 0}
          >
            {"<"}
          </button>
          <button
            type="button"
            onClick={moveAllToSource}
            className="p-2 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
            disabled={targetItems.length === 0}
          >
            {"<<"}
          </button>
        </div>
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm text-gray-500">Selecionados</div>
            <div className="relative flex-1">
              <input
                type="text"
                value={targetSearchTerm}
                onChange={(e) => setTargetSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1 text-sm border border-gray-200 rounded-md"
              />
              <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <select
            id={`${fieldId}-target`}
            multiple
            size={8}
            onChange={handleTargetSelect}
            className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            {filteredTargetItems.map((item, index) => (
              <option
                key={`target-${item.uniqueId || getItemId(item, index)}`}
                value={item.uniqueId || getItemId(item, index)}
                className="p-2 cursor-pointer"
              >
                {item.descricao}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DualSelectField;
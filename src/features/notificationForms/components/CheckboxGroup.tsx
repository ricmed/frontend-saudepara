import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { SelectOption } from '../types/FormTypes';

interface CheckboxGroupProps {
  label: string;
  options: SelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchPlaceholder?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  searchPlaceholder = "Pesquisar..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleCheckboxChange = (value: string) => {
    const updatedValues = selectedValues.includes(value)
      ? selectedValues.filter(item => item !== value)
      : [...selectedValues, value];
    
    onChange(updatedValues);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Filtra as opções baseado no termo de busca
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <label className="font-medium text-gray-700">
          {label}
        </label>
        <div className="relative w-64">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-8 text-sm border border-gray-200 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
        {filteredOptions.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 group"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => handleCheckboxChange(option.value)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200 group-hover:border-blue-400"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {searchTerm && filteredOptions.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          Nenhuma opção encontrada para "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default CheckboxGroup;
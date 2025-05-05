// src/features/notificationForms/components/shared/SearchableCheckboxGroup.tsx
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface Option {
  id: string | number;
  label: string;
}

interface SearchableCheckboxGroupProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (value: string) => void;
  error?: string;
  maxHeight?: string;
}

const SearchableCheckboxGroup: React.FC<SearchableCheckboxGroupProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  error,
  maxHeight = '96'
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(
    (option) =>
      searchTerm === '' ||
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="font-medium text-gray-700">
          {label} {error && <span className="text-red-500">*</span>}
        </label>
        <div className="relative w-64">
          <input
            type="text"
            placeholder={`Pesquisar ${label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-8 text-sm border border-gray-200 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-1 mb-2 text-sm text-red-500">{error}</p>
      )}

      <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 max-h-${maxHeight} overflow-y-auto`}>
        {filteredOptions.map((option) => (
          <label
            key={option.id}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 group"
            translate="no"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option.id.toString())}
              onChange={() => onChange(option.id.toString())}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200 group-hover:border-blue-400"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
              {option.label}
            </span>
          </label>
        ))}
      </div>

      {filteredOptions.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          Nenhum resultado encontrado para "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default SearchableCheckboxGroup;
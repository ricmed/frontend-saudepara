import React from 'react';
import { FormData } from '../NotificationForm';

interface DadosGeraisSectionProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  eventoOptions: string[];
  publicoAtendidoOptions: { value: string; label: string }[];
}

const DadosGeraisSection: React.FC<DadosGeraisSectionProps> = ({
  formData,
  handleChange,
  eventoOptions,
  publicoAtendidoOptions
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Evento */}
      <div>
        <label className="block mb-2 font-medium text-gray-700">
          Evento
        </label>
        <select
          name="evento"
          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          value={formData.evento}
          onChange={handleChange}
        >
          <option value="">Selecione</option>
          {eventoOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Público Atendido */}
      <div>
        <label className="block mb-2 font-medium text-gray-700">
          Público Atendido
        </label>
        <select
          name="publicoAtendido"
          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          value={formData.publicoAtendido}
          onChange={handleChange}
        >
          <option value="">Selecione</option>
          {publicoAtendidoOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DadosGeraisSection;
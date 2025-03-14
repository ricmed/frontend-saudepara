// src/features/apps/components/shared/Form/FormSelect.tsx
interface FormSelectProps {
    label: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Array<{ value: string | number; label: string }>;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
  }
  
  export const FormSelect = ({
    label,
    name,
    value,
    onChange,
    options,
    placeholder = "Selecione uma opção",
    required = false,
    disabled = false,
  }: FormSelectProps) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={required}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };
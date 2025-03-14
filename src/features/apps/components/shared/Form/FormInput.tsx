// src/features/apps/components/shared/Form/FormInput.tsx
import { formatText, capitalizeFirstLetter } from '../utils/textFormat';

interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  formatOnBlur?: boolean;
  preventSpaceStart?: boolean;
  onlyNumbers?: boolean;
}

export const FormInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  maxLength,
  onBlur,
  formatOnBlur = true,
  preventSpaceStart = true,
  onlyNumbers = false
}: FormInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (onlyNumbers) {
      newValue = newValue.replace(/\D/g, '');
    } else {
      if (preventSpaceStart && newValue.startsWith(' ')) {
        return;
      }
      // Previne múltiplos espaços em sequência
      newValue = newValue.replace(/\s+/g, ' ');
    }
    
    const updatedEvent = {
      ...e,
      target: {
        ...e.target,
        value: newValue
      }
    };
    
    onChange(updatedEvent);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (formatOnBlur && !onlyNumbers) {
      const formattedValue = capitalizeFirstLetter(formatText(e.target.value));
      const updatedEvent = {
        ...e,
        target: {
          ...e.target,
          value: formattedValue
        }
      };
      onChange(updatedEvent);
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </label>
      <input
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        type={onlyNumbers ? "text" : "text"}
        inputMode={onlyNumbers ? "numeric" : "text"}
        pattern={onlyNumbers ? "[0-9]*" : undefined}
      />
    </div>
  );
};
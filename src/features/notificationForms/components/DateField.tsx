import React from "react";

interface DateFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
  min?: string;
  max?: string;
}

const DateField: React.FC<DateFieldProps> = ({
  label,
  name,
  value,
  onChange,
  required = false,
  className = "",
  min,
  max,
}) => {
  return (
    <div>
      <label className="block mb-2 font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        max={max}
        className={`w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${className}`}
      />
    </div>
  );
};

export default DateField;
import React from "react";

interface FormFieldProps {
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  name?: string;
  placeholder?: string;
  maxLength?: number;
  value?: string;
  onChange?: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  error?: string;
  [key: string]: any;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type = "text",
  required = false,
  name = "",
  placeholder,
  maxLength,
  value,
  onChange,
  error,
  ...props
}) => {
  if (type === "select") {
    return (
      <div className="mb-6">
        <label htmlFor={name} className="block mb-2 font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          id={name}
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          className={`w-full p-3 border rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${
            error ? "border-red-500" : "border-gray-200"
          }`}
          {...props}
        >
          <option value="">Selecione uma opção</option>
          {props.options?.map((opt) => (
            <option key={opt} value={opt} title={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label htmlFor={name} className="block mb-2 font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        className={`w-full p-3 border rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${
          error ? "border-red-500" : "border-gray-200"
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FormField;
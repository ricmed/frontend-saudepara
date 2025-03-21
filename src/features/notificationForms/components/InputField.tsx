import React from "react";

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  leftIcon?: React.ReactNode;
  rightButton?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
  className = "",
  minLength,
  maxLength,
  pattern,
  leftIcon,
  rightButton,
}) => {
  return (
    <div>
      <label className="block mb-2 font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className={`flex gap-2 ${rightButton ? "items-center" : ""}`}>
        <div className={`relative flex-1 ${leftIcon ? "pl-8" : ""}`}>
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            minLength={minLength}
            maxLength={maxLength}
            pattern={pattern}
            className={`w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${
              leftIcon ? "pl-9" : ""
            } ${className}`}
          />
        </div>
        {rightButton && rightButton}
      </div>
    </div>
  );
};

export default InputField;
import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { OrderedFormError } from '../utils/dynamicFormFieldNav';

export interface DynamicFormErrorSummaryProps {
  errors: OrderedFormError[];
  onFieldClick: (fieldKey: string) => void;
  showTabNames?: boolean;
}

const DynamicFormErrorSummary: React.FC<DynamicFormErrorSummaryProps> = ({
  errors,
  onFieldClick,
  showTabNames = false,
}) => {
  if (errors.length === 0) return null;

  return (
    <div
      className="mb-6 rounded-r-lg border-l-4 border-red-400 bg-red-50 p-4 shadow-sm"
      id="dynamic-form-error-summary"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" aria-hidden />
        </div>
        <div className="ml-3 w-full">
          <h3 className="text-sm font-medium text-red-800">
            {errors.length === 1
              ? 'Há 1 erro que precisa ser corrigido:'
              : `Há ${errors.length} erros que precisam ser corrigidos:`}
          </h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
            {errors.map(({ key, message, label, tabLabel }) => (
              <li key={key} className="flex items-start">
                <button
                  type="button"
                  onClick={() => onFieldClick(key)}
                  className="text-left hover:underline focus:underline focus:outline-none"
                >
                  <span className="font-medium">
                    {showTabNames && tabLabel ? `${tabLabel} — ${label}` : label}:
                  </span>{' '}
                  {message}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-red-600">
            Clique em qualquer item acima para ir diretamente ao campo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DynamicFormErrorSummary;

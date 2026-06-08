import React from 'react';
import {
  TIPO_EXPOSICAO_AMBOS,
  TIPO_EXPOSICAO_HBV,
  TIPO_EXPOSICAO_HCV,
  TIPO_EXPOSICAO_HEPATITE_KEY,
} from '../utils/hepatiteCriancaExposicao';

type OptionDef = {
  value: string;
  title: string;
  badge: string;
  description: string;
  selectedRing: string;
  selectedBg: string;
};

const OPTIONS: OptionDef[] = [
  {
    value: TIPO_EXPOSICAO_HBV,
    title: 'Hepatite B',
    badge: 'HBV',
    description: 'Mãe HBsAg reagente — CID Z20.5',
    selectedRing: 'ring-[#364fc7]',
    selectedBg: 'bg-[#364fc7]/[0.08] border-[#364fc7]',
  },
  {
    value: TIPO_EXPOSICAO_HCV,
    title: 'Hepatite C',
    badge: 'HCV',
    description: 'Mãe HCV-RNA reagente — CID em branco',
    selectedRing: 'ring-[#0e7490]',
    selectedBg: 'bg-[#06b6d4]/[0.08] border-[#0891b2]',
  },
  {
    value: TIPO_EXPOSICAO_AMBOS,
    title: 'Co-infecção',
    badge: 'HBV + HCV',
    description: 'Exposição aos dois vírus — CID Z20.5',
    selectedRing: 'ring-[#5c3d99]',
    selectedBg: 'bg-[#7950f2]/[0.08] border-[#7950f2]',
  },
];

type HepatiteTipoExposicaoSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
};

export const HepatiteTipoExposicaoSelector: React.FC<HepatiteTipoExposicaoSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  hint,
}) => {
  const selected = String(value ?? '').trim();

  return (
    <div className="w-full">
      <fieldset disabled={disabled} className="min-w-0 border-0 p-0 m-0">
        <legend className="mb-3 block text-sm font-semibold text-gray-800">
          Tipo de exposição
          {required ? <span className="text-red-500 ml-1">*</span> : null}
        </legend>
        {hint ? <p className="mb-3 text-xs text-gray-600 leading-relaxed">{hint}</p> : null}
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Tipo de exposição hepática"
        >
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <label
                key={opt.value}
                className={[
                  'relative flex cursor-pointer flex-col rounded-lg border-2 px-4 py-3 transition-all',
                  'focus-within:ring-2 focus-within:ring-offset-1',
                  disabled ? 'cursor-not-allowed opacity-60' : 'hover:shadow-sm',
                  isSelected
                    ? `${opt.selectedBg} ${opt.selectedRing} shadow-sm`
                    : 'border-gray-200 bg-white hover:border-gray-300',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name={TIPO_EXPOSICAO_HEPATITE_KEY}
                  value={opt.value}
                  checked={isSelected}
                  onChange={() => onChange(opt.value)}
                  disabled={disabled}
                  className="sr-only"
                />
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-gray-900">{opt.title}</span>
                  <span
                    className={[
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                      isSelected ? 'bg-white/80 text-gray-800' : 'bg-gray-100 text-gray-600',
                    ].join(' ')}
                  >
                    {opt.badge}
                  </span>
                </div>
                <span className="text-xs text-gray-600 leading-snug">{opt.description}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {!selected && !error ? (
        <p className="mt-2 text-xs text-amber-700">Selecione uma opção para liberar os campos da ficha.</p>
      ) : null}
    </div>
  );
};

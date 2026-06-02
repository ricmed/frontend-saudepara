import React from 'react';
import { RadioGroupField } from '@/features/dynamic-forms/components/AdvancedFields';
import { DateField } from '@/features/dynamic-forms/components/FormFields';
import type { FormField } from '@/services/FormService';

export interface CriancaVacinaDoseRowProps {
  doseLabel: string;
  simField: FormField;
  dataField: FormField;
  getValue: (key: string) => unknown;
  setValue: (key: string, value: unknown) => void;
  getError: (key: string) => string | undefined;
  disabled?: boolean;
}

/** Mesmo radio do painel “maternidade” (padrão) + data em coluna fixa — sem 1fr na data. */
const DOSE_DATE_WIDTH = '17rem';
const CRIANCA_DOSE_CELL = 'min-w-0 [&>div]:mb-0';

export const CriancaVacinaDoseRow: React.FC<CriancaVacinaDoseRowProps> = ({
  doseLabel,
  simField,
  dataField,
  getValue,
  setValue,
  getError,
  disabled = false,
}) => {
  const simValue = getValue(simField.key);
  const dataValue = getValue(dataField.key);

  return (
    <div className="grid grid-cols-1 items-end gap-2 rounded-md border border-[#3b5bdb]/15 bg-white/80 p-3 md:grid-cols-[3.25rem_minmax(0,1fr)] md:items-center md:gap-x-3 md:gap-y-2">
      <span className="flex items-center justify-center self-center text-center text-sm font-medium leading-snug text-[#1e6f8c]">
        {doseLabel}
      </span>

      <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,calc(50%-0.75rem))_17rem]">
        <div className={`${CRIANCA_DOSE_CELL} w-full`}>
          <RadioGroupField
            field={{
              ...simField,
              label: `${doseLabel} — aplicada`,
              hideLabel: true,
            }}
            value={simValue}
            onChange={(val) => setValue(simField.key, val)}
            error={getError(simField.key)}
            required={Boolean(simField.required)}
            disabled={disabled}
            getValue={getValue}
            setValue={setValue}
          />
        </div>

        <div
          className="w-full min-w-0 shrink-0 justify-self-start"
          style={{ width: DOSE_DATE_WIDTH, maxWidth: DOSE_DATE_WIDTH }}
        >
          <DateField
            field={{ ...dataField, denseControls: true, denseControlsLargeText: true }}
            value={dataValue}
            onChange={(val) => setValue(dataField.key, val)}
            error={getError(dataField.key)}
            required={Boolean(dataField.required)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

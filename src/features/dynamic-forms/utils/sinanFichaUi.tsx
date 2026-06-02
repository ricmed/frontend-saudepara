import React from 'react';

import type { FormField } from '@/services/FormService';
import { resolveHepatiteCriancaHbvSinanCampo } from '@/features/dynamic-forms/utils/hepatiteCriancaHbvSinanCampos';

/** Detecta rótulos com código SINAN prefixado (`1 — Sim`, `1 - Sim`, `1 · Sim`). */
const CODED_OPTION_LABEL_RE =
  /^(\d+(?:\.\d+)?)\s*(?:\u2014|\u2013|\u00b7|\||-|−)\s*(.+)$/u;

const SINAN_CHOICE_FIELD_TYPES = new Set<FormField['type']>(['select', 'radio']);

export type CodedOptionParts = { code: string; text: string };

export function parseCodedOptionLabel(label: string): CodedOptionParts | null {
  const m = String(label ?? '').trim().match(CODED_OPTION_LABEL_RE);
  if (!m) return null;
  const text = m[2].trim();
  return text ? { code: m[1], text } : null;
}

function isSinanChoiceField(field: FormField | undefined): boolean {
  return Boolean(field?.type && SINAN_CHOICE_FIELD_TYPES.has(field.type));
}

function optionHasNumericValueCode(option: { value: string; label: string }): boolean {
  const code = String(option.value ?? '').trim();
  const text = String(option.label ?? '').trim();
  return /^\d+(?:\.\d+)?$/.test(code) && Boolean(text) && text !== code;
}

function hasNumericCodedOptions(field: FormField): boolean {
  const opts = field.options;
  if (!Array.isArray(opts) || opts.length === 0) return false;
  return opts.some(optionHasNumericValueCode);
}

function shouldPrefixOptionWithValueCode(field: FormField | undefined): boolean {
  if (!field) return false;
  if (field.sinanOptionCodes === true) return true;
  if (!isSinanChoiceField(field)) return false;
  return Boolean(resolveHepatiteCriancaHbvSinanCampo(field)?.trim());
}



export function resolveCodedOptionParts(

  option: { value: string; label: string },

  field?: FormField,

): CodedOptionParts | null {

  const parsed = parseCodedOptionLabel(option.label);

  if (parsed) return parsed;



  if (!shouldPrefixOptionWithValueCode(field)) return null;



  const code = String(option.value ?? '').trim();

  const text = String(option.label ?? '').trim();

  if (!/^\d+(?:\.\d+)?$/.test(code) || !text || text === code) return null;

  return { code, text };

}



/** Texto plano para `<option>` e inputs fechados (sem travessão larga). */

export function formatOptionLabelPlain(

  option: { value: string; label: string },

  field?: FormField,

): string {

  const parts = resolveCodedOptionParts(option, field);

  if (!parts) return option.label;

  return `${parts.code} · ${parts.text}`;

}



export function renderDynamicOptionLabel(props: {

  option: { value: string; label: string };

  field?: FormField;

  selected?: boolean;

}): React.ReactNode {

  const parts = resolveCodedOptionParts(props.option, props.field);
  const labelTone = props.selected ? 'text-blue-900' : 'text-gray-900';

  if (!parts) {
    return (
      <span className={`text-sm font-medium leading-relaxed ${labelTone}`}>
        {props.option.label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-baseline gap-1.5 text-sm font-medium leading-relaxed">
      <span className="text-xs font-normal tabular-nums text-gray-400">{parts.code}</span>
      <span className="text-gray-300 select-none" aria-hidden>
        ·
      </span>
      <span className={labelTone}>{parts.text}</span>
    </span>
  );
}



/**
 * Ativa códigos nas opções (`1 · Sim`) para ficha SINAN/HBV.
 * Normaliza rótulos já codificados no schema para texto puro (o prefixo é renderizado na UI).
 */
export function applySinanFichaToField(field: FormField, hbvSinanFicha: boolean): FormField {
  if (!isSinanChoiceField(field)) return field;

  const sinanCampo = resolveHepatiteCriancaHbvSinanCampo(field)?.trim();
  const enableCodes =
    field.sinanOptionCodes === true ||
    Boolean(sinanCampo) ||
    (hbvSinanFicha && hasNumericCodedOptions(field));

  if (!enableCodes) return field;

  let out: FormField = { ...field, sinanOptionCodes: true };

  if (Array.isArray(out.options)) {
    out = {
      ...out,
      options: out.options.map((opt) => {
        const parsed = parseCodedOptionLabel(opt.label);
        return parsed ? { ...opt, label: parsed.text } : opt;
      }),
    };
  }

  return out;
}



export function renderDynamicFieldLabel(props: {

  field: FormField;

  required?: boolean;

  htmlFor?: string;

  className?: string;

  labelClassName?: string;

  hideLabel?: boolean;

}): React.ReactNode {

  const { field, required, htmlFor, className, labelClassName, hideLabel } = props;

  const LabelTag = htmlFor ? 'label' : 'span';

  const visibility = hideLabel ? 'sr-only' : '';

  return (

    <LabelTag

      {...(htmlFor ? { htmlFor } : {})}

      className={`${visibility} ${className ?? ''}`.trim()}

    >

      <span className={labelClassName}>{field.label}</span>

      {required ? <span className="text-red-500 ml-1">*</span> : null}

    </LabelTag>

  );

}



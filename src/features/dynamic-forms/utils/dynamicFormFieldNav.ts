import type { FormSchema } from '@/services/FormService';

export interface DynamicFormFieldMeta {
  key: string;
  label: string;
  tabId?: string;
  tabLabel?: string;
}

export interface OrderedFormError {
  key: string;
  message: string;
  label: string;
  tabId?: string;
  tabLabel?: string;
}

export function fieldKeyToInputId(key: string): string {
  return `df-${key}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function buildDynamicFormFieldMeta(schema: FormSchema): Map<string, DynamicFormFieldMeta> {
  const tabLabelById = new Map<string, string>();
  for (const tab of schema.tabs ?? []) {
    tabLabelById.set(tab.id, tab.label);
  }

  const map = new Map<string, DynamicFormFieldMeta>();
  for (const section of schema.sections ?? []) {
    const tabId = section.tab;
    const tabLabel = tabId ? tabLabelById.get(tabId) : undefined;
    for (const field of section.fields ?? []) {
      if (!field?.key) continue;
      map.set(field.key, {
        key: field.key,
        label: field.label || field.key,
        tabId,
        tabLabel,
      });
    }
  }
  return map;
}

export function buildOrderedFormErrors(
  errors: Record<string, string>,
  schema: FormSchema,
  fieldMeta: Map<string, DynamicFormFieldMeta>,
): OrderedFormError[] {
  const ordered: OrderedFormError[] = [];
  const seen = new Set<string>();

  for (const section of schema.sections ?? []) {
    for (const field of section.fields ?? []) {
      const key = field?.key;
      if (!key || seen.has(key)) continue;
      const message = errors[key];
      if (!message) continue;
      seen.add(key);
      const meta = fieldMeta.get(key);
      ordered.push({
        key,
        message,
        label: meta?.label ?? field.label ?? key,
        tabId: meta?.tabId ?? section.tab,
        tabLabel: meta?.tabLabel,
      });
    }
  }

  for (const [key, message] of Object.entries(errors)) {
    if (seen.has(key)) continue;
    const meta = fieldMeta.get(key);
    ordered.push({
      key,
      message,
      label: meta?.label ?? key,
      tabId: meta?.tabId,
      tabLabel: meta?.tabLabel,
    });
  }

  return ordered;
}

export function getFirstOrderedErrorKey(
  errors: Record<string, string>,
  schema: FormSchema,
): string | undefined {
  for (const section of schema.sections ?? []) {
    for (const field of section.fields ?? []) {
      const key = field?.key;
      if (key && errors[key]) return key;
    }
  }
  const keys = Object.keys(errors);
  return keys.length ? keys[0] : undefined;
}

function findElementByLabel(label: string): HTMLElement | null {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return null;

  const labelEl = Array.from(document.querySelectorAll('label')).find((el) => {
    const text = el.textContent?.trim().toLowerCase() ?? '';
    return text === normalized || text.startsWith(`${normalized} `) || text.includes(normalized);
  });
  if (labelEl) {
    return (labelEl.closest('[data-field-key]') as HTMLElement) ?? (labelEl.parentElement as HTMLElement);
  }
  return null;
}

export function scrollToDynamicFormField(fieldKey: string, label?: string): void {
  const inputId = fieldKeyToInputId(fieldKey);
  let element: HTMLElement | null =
    document.getElementById(inputId) ??
    (document.querySelector(`[data-field-key="${fieldKey}"]`) as HTMLElement | null) ??
    (document.querySelector(`[name="${fieldKey}"]`) as HTMLElement | null) ??
    (document.querySelector(`[data-field="${fieldKey}"]`) as HTMLElement | null);

  if (!element && label) {
    element = findElementByLabel(label.replace(/\s*\*$/, '').trim());
  }

  if (!element) return;

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  element.style.transform = 'scale(1.02)';
  element.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
  element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.4)';
  element.style.borderRadius = '8px';

  window.setTimeout(() => {
    element!.style.transform = 'scale(1)';
    element!.style.boxShadow = '';

    const focusable = element!.querySelector(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])',
    ) as HTMLElement | null;
    if (focusable?.focus) {
      focusable.focus();
    } else if (element!.focus) {
      element!.focus();
    }
  }, 400);
}

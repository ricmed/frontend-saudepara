type BackendErrors = Record<string, unknown>;

const toErrorString = (value: unknown): string => {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : String(first ?? '');
  }
  return String(value ?? '');
};

export const mapBackendValidationErrors = (
  backendErrors: unknown,
  fieldMapping: Record<string, string> = {}
): Record<string, string> => {
  if (!backendErrors || typeof backendErrors !== 'object') {
    return {};
  }

  const mappedErrors: Record<string, string> = {};
  Object.entries(backendErrors as BackendErrors).forEach(([key, value]) => {
    const fieldName = fieldMapping[key] || key;
    mappedErrors[fieldName] = toErrorString(value);
  });
  return mappedErrors;
};

export const extractBackendMessage = (
  error: any,
  fallbackMessage: string
): string => {
  const data = error?.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }
  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error;
  }
  const detail =
    data?.details?.[0]?.message ||
    data?.errors?.[0]?.message;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  const axiosMessage = typeof error?.message === 'string' ? error.message : '';
  if (axiosMessage && !axiosMessage.startsWith('Request failed with status code')) {
    return axiosMessage;
  }
  if (error?.response?.status === 400 || error?.response?.status === 422) {
    return 'Dado obrigatório faltando ou inválido. Confira a ficha.';
  }
  if (axiosMessage) return axiosMessage;
  return fallbackMessage;
};

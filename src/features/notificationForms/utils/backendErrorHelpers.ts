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
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return fallbackMessage;
};

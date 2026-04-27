import axios from 'axios';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_URL = `${server}:${port}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export type ResponseStatus = 'draft' | 'submitted' | 'synced';

export interface FormResponsesListResponse {
  data: Array<{
    id: number;
    status: ResponseStatus;
    created_at: string;
    submitted_at?: string | null;
    synced_at?: string | null;
    created_by: string;
    form_version_id: number;
    data_json: Record<string, any>;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class FormResponsesService {
  async list(formId: number, filters?: { page?: number; limit?: number; status?: ResponseStatus }) {
    const response = await api.get<FormResponsesListResponse>(`/forms/${formId}/responses`, { params: filters });
    return response.data;
  }

  async downloadExport(formId: number, params?: { format?: 'csv' | 'xlsx'; status?: ResponseStatus }) {
    const response = await api.get(`/forms/${formId}/responses/export`, {
      params,
      responseType: 'blob',
    });
    const blob = response.data as Blob;
    const disp = response.headers['content-disposition'];
    const match = typeof disp === 'string' ? /filename="?([^"]+)"?/.exec(disp) : null;
    const filename = match?.[1] ?? `form-${formId}-respostas.${params?.format ?? 'xlsx'}`;
    return { blob, filename };
  }
}

export default new FormResponsesService();


import axios from 'axios';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';

const API_URL = getRuntimeApiRoot();

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export type ResponseStatus = 'draft' | 'submitted' | 'synced';

export type FormResponsesListFilters = {
  page?: number;
  limit?: number;
  status?: ResponseStatus;
  search?: string;
  search_field?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  data_inicio?: string;
  data_fim?: string;
};

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
  async list(formId: number, filters?: FormResponsesListFilters) {
    const response = await api.get<FormResponsesListResponse>(`/forms/${formId}/responses`, { params: filters });
    return response.data;
  }

  /**
   * Todas as respostas do formulário (paginação no cliente), para pré-visualização / cópia.
   * Limite de segurança: `maxPages` × `pageSize` registros.
   */
  async listAllResponses(
    formId: number,
    filters?: Omit<FormResponsesListFilters, 'page' | 'limit'> & { pageSize?: number; maxPages?: number },
  ): Promise<FormResponsesListResponse['data']> {
    const pageSize = filters?.pageSize ?? 500;
    const maxPages = filters?.maxPages ?? 500;
    const { pageSize: _ps, maxPages: _mp, ...listFilters } = filters ?? {};
    const out: FormResponsesListResponse['data'] = [];
    let page = 1;
    while (page <= maxPages) {
      const res = await this.list(formId, { ...listFilters, page, limit: pageSize });
      out.push(...res.data);
      if (page >= res.totalPages || res.data.length === 0) break;
      page += 1;
    }
    return out;
  }

  async downloadExport(
    formId: number,
    params?: FormResponsesListFilters & { format?: 'csv' | 'xlsx' },
  ) {
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

  async deleteResponse(responseId: number, deletedBy?: string): Promise<void> {
    await api.delete(`/submissions/${responseId}`, {
      data: deletedBy ? { deleted_by: deletedBy } : undefined,
    });
  }
}

export default new FormResponsesService();

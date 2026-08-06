import axios from 'axios';
import type { FormVersion } from './FormService';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';

const API_URL = getRuntimeApiRoot();

// Instância do axios com credenciais (cookies de autenticação)
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // ✅ Envia cookies de autenticação automaticamente
});

// Types
export interface FormSubmission {
  id: number;
  form_version_id: number;
  client_uuid?: string;
  status: 'draft' | 'submitted' | 'synced';
  data_json: Record<string, any>;
  dt_notificacao?: string;
  municipio_id?: number;
  unidade_id?: number;
  paciente_sexo?: string;
  faixa_etaria?: string;
  agravo_cid?: string;
  cpf_hash?: string;
  created_offline: boolean;
  device_id?: string;
  created_by: string;
  created_at: string;
  submitted_at?: string;
  synced_at?: string;
  updated_at: string;
  form_version?: FormVersion;
  estabelecimento?: any;
  tipo_municipio?: any;
  events?: FormSubmissionEvent[];
}

export interface FormSubmissionEvent {
  id: number;
  submission_id: number;
  event_type: string;
  by_user: string;
  at: string;
  diff_json?: any;
  metadata?: any;
}

export interface FormSubmissionFilters {
  form_version_id?: number;
  status?: 'draft' | 'submitted' | 'synced';
  dt_notificacao_inicio?: string;
  dt_notificacao_fim?: string;
  municipio_id?: number;
  unidade_id?: number;
  created_by?: string;
  /** Filtro por CRS (data_json.crs_id – ex.: entomologia) */
  crs_id?: number;
  /** Filtro por competência mês/ano (data_json.competencia – ex.: "2026-01") */
  competencia?: string;
  page?: number;
  limit?: number;
  /** `1` = incluir `data_json` (monitoramento / relatórios; combine com paginação). */
  with_form_payload?: '1';
}

export interface FormSubmissionListResponse {
  data: FormSubmission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Service
class FormSubmissionService {
  // Listar submissions com filtros
  async getSubmissions(filters: FormSubmissionFilters = {}): Promise<FormSubmissionListResponse> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/submissions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar submissions:', error);
      throw error;
    }
  }

  /**
   * Busca todas as páginas com `data_json` (até `maxPages` páginas × `pageSize` itens).
   * Uso: consolidados QDQQ / relatório operacional regional / Entomologia.
   */
  async getSubmissionsAllPagesWithFormPayload(
    form_version_id: number,
    opts?: {
      pageSize?: number;
      maxPages?: number;
      crs_id?: number;
      competencia?: string;
    },
  ): Promise<FormSubmission[]> {
    const pageSize = opts?.pageSize ?? 500;
    const maxPages = opts?.maxPages ?? 200;
    const out: FormSubmission[] = [];
    let page = 1;
    while (page <= maxPages) {
      const res = await this.getSubmissions({
        form_version_id,
        limit: pageSize,
        page,
        with_form_payload: '1',
        ...(opts?.crs_id != null ? { crs_id: opts.crs_id } : {}),
        ...(opts?.competencia ? { competencia: opts.competencia } : {}),
      });
      out.push(...res.data);
      if (page >= res.totalPages || res.data.length === 0) break;
      page += 1;
    }
    return out;
  }

  // Buscar submission por ID
  async getSubmissionById(id: number): Promise<FormSubmission> {
    try {
      const response = await api.get(`/submissions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar submission:', error);
      throw error;
    }
  }

  // Criar novo rascunho
  async createSubmission(data: {
    form_version_id: number;
    client_uuid?: string;
    data_json: Record<string, any>;
    dt_notificacao?: string;
    municipio_id?: number;
    unidade_id?: number;
    paciente_sexo?: string;
    faixa_etaria?: string;
    agravo_cid?: string;
    cpf_hash?: string;
    created_offline?: boolean;
    device_id?: string;
    created_by: string;
  }): Promise<FormSubmission> {
    try {
      const response = await api.post('/submissions', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar submission:', error);
      throw error;
    }
  }

  // Atualizar rascunho
  async updateSubmission(
    id: number,
    data: {
      data_json?: Record<string, any>;
      dt_notificacao?: string;
      municipio_id?: number;
      unidade_id?: number;
      paciente_sexo?: string;
      faixa_etaria?: string;
      agravo_cid?: string;
      cpf_hash?: string;
    },
    updated_by: string
  ): Promise<FormSubmission> {
    try {
      const response = await api.put(`/submissions/${id}`, {
        ...data,
        updated_by,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar submission:', error);
      throw error;
    }
  }

  // Enviar submission (finalizar)
  async submitSubmission(id: number, submitted_by: string): Promise<FormSubmission> {
    try {
      const response = await api.post(`/submissions/${id}/submit`, {
        submitted_by,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar submission:', error);
      throw error;
    }
  }

  // Sincronizar submission (offline)
  async syncSubmission(id: number, synced_by: string): Promise<FormSubmission> {
    try {
      const response = await api.post(`/submissions/${id}/sync`, {
        synced_by,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao sincronizar submission:', error);
      throw error;
    }
  }

  // Deletar submission (apenas rascunho)
  async deleteSubmission(id: number, deleted_by: string): Promise<void> {
    try {
      await api.delete(`/submissions/${id}`, {
        data: { deleted_by },
      });
    } catch (error) {
      console.error('Erro ao deletar submission:', error);
      throw error;
    }
  }

  /**
   * Download da exportação (Excel ou PDF) para formulário Entomologia – Controle de Qualidade de Larvas.
   * Retorna o blob e o nome do arquivo para disparar o download no cliente.
   */
  async downloadExport(id: number, format: 'xlsx' | 'pdf'): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get(`/submissions/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    const blob = response.data as Blob;
    const disp = response.headers['content-disposition'];
    const match = typeof disp === 'string' ? /filename="?([^"]+)"?/.exec(disp) : null;
    const filename = match?.[1] ?? `entomologia-larvas-${id}.${format}`;
    return { blob, filename };
  }

  /** Excel consolidado Entomologia (filtros CRS/competência). */
  async downloadEntomologiaConsolidatedExport(params: {
    form_version_id: number;
    crs_id?: number;
    competencia?: string;
  }): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get(`/submissions/export-entomologia`, {
      params: {
        form_version_id: params.form_version_id,
        ...(params.crs_id != null ? { crs_id: params.crs_id } : {}),
        ...(params.competencia ? { competencia: params.competencia } : {}),
      },
      responseType: 'blob',
    });
    const blob = response.data as Blob;
    const disp = response.headers['content-disposition'];
    const match = typeof disp === 'string' ? /filename="?([^"]+)"?/.exec(disp) : null;
    const filename = match?.[1] ?? 'entomologia-larvas-consolidado.xlsx';
    return { blob, filename };
  }
}

export default new FormSubmissionService();

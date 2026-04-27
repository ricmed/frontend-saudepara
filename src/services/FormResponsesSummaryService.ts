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

export type SummaryResponse = {
  form: { id: number; nome: string; form_key: string };
  status: 'draft' | 'submitted' | 'synced';
  total: number;
  analyzed: number;
  fields: Array<{
    key: string;
    label: string;
    top: Array<{ value: string; count: number }>;
  }>;
};

class FormResponsesSummaryService {
  async get(formId: number, params?: { status?: 'draft' | 'submitted' | 'synced'; sampleLimit?: number }) {
    const response = await api.get(`/forms/${formId}/responses/summary`, { params: params ?? {} });
    return response.data as SummaryResponse;
  }
}

export default new FormResponsesSummaryService();


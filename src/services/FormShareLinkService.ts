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

export interface FormShareLink {
  id: number;
  form_id: number;
  kind: 'RESPOND' | 'VIEW';
  token: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_by: string;
  created_at: string;
}

class FormShareLinkService {
  async list(formId: number): Promise<FormShareLink[]> {
    const response = await api.get(`/forms/${formId}/share-links`);
    return response.data;
  }

  async createRespond(formId: number, params?: { expires_at?: string }) {
    const response = await api.post(`/forms/${formId}/share-links/respond`, params ?? {});
    return response.data as FormShareLink;
  }

  async revoke(formId: number, linkId: number) {
    const response = await api.post(`/forms/${formId}/share-links/${linkId}/revoke`);
    return response.data as FormShareLink;
  }
}

export default new FormShareLinkService();


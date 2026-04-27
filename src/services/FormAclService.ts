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

export type FormAclRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface FormAclItem {
  id: number;
  form_id: number;
  user_id: string;
  role: FormAclRole;
  created_at: string;
  user: { id: string; username: string; email?: string | null; name?: string | null };
}

export interface UserPick {
  id: string;
  username: string;
  email?: string | null;
  name?: string | null;
}

class FormAclService {
  async list(formId: number): Promise<FormAclItem[]> {
    const response = await api.get(`/forms/${formId}/acl`);
    return response.data;
  }

  async searchUsers(formId: number, q: string): Promise<UserPick[]> {
    const response = await api.get(`/forms/${formId}/acl/users`, { params: { q } });
    return response.data;
  }

  async upsert(formId: number, params: { user_id: string; role: FormAclRole }): Promise<FormAclItem> {
    const response = await api.post(`/forms/${formId}/acl`, params);
    return response.data;
  }

  async remove(formId: number, aclId: number): Promise<void> {
    await api.delete(`/forms/${formId}/acl/${aclId}`);
  }
}

export default new FormAclService();


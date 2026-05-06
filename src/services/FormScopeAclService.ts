import axios from 'axios';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';

const API_URL = getRuntimeApiRoot();

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export type FormScopeType = 'STATE' | 'CRS' | 'MUNICIPIO' | 'UNIDADE';
export type FormAclRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface FormScopeAclItem {
  id: number;
  form_id: number;
  scope_type: FormScopeType;
  scope_id: number;
  role: FormAclRole;
  created_at: string;
}

export interface ScopeTargetPick {
  id: number;
  label: string;
  meta?: any;
}

class FormScopeAclService {
  async list(formId: number): Promise<FormScopeAclItem[]> {
    const response = await api.get(`/forms/${formId}/scope-acl`);
    return response.data;
  }

  async searchTargets(formId: number, params: { type: FormScopeType; q: string }): Promise<ScopeTargetPick[]> {
    const response = await api.get(`/forms/${formId}/scope-acl/targets`, { params });
    return response.data;
  }

  async upsert(formId: number, params: { scope_type: FormScopeType; scope_id: number; role: FormAclRole }): Promise<FormScopeAclItem> {
    const response = await api.post(`/forms/${formId}/scope-acl`, params);
    return response.data;
  }

  async remove(formId: number, scopeType: FormScopeType, scopeId: number): Promise<void> {
    await api.delete(`/forms/${formId}/scope-acl/${scopeType}/${scopeId}`);
  }
}

export default new FormScopeAclService();


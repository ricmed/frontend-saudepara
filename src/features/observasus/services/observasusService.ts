import api from '@/utils/axiosRetry';
import type {
  ObservaSusHomeResponse,
  ObservaSusPanelEmbedResponse,
  ObservaSusResource,
  ObservaSusResourceFilters,
  ObservaSusResourceListResponse,
} from '../types/observasus';

const BASE = '/api/observasus';

function sanitizeObservaSusQueryParams<T extends Record<string, unknown>>(params?: T): T | undefined {
  if (!params) return undefined;
  const entries = Object.entries(params).filter(
    ([, value]) => value !== '' && value !== null && value !== undefined
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries) as T;
}

export async function getObservaSusHome(): Promise<ObservaSusHomeResponse> {
  const response = await api.get(`${BASE}/home`);
  return response.data;
}

export async function getObservaSusResources(
  params?: ObservaSusResourceFilters
): Promise<ObservaSusResourceListResponse> {
  const response = await api.get(`${BASE}/resources`, {
    params: sanitizeObservaSusQueryParams(params),
  });
  return response.data;
}

export async function getObservaSusResourceBySlug(slug: string): Promise<ObservaSusResource> {
  const response = await api.get(`${BASE}/resources/slug/${slug}`);
  return response.data;
}

export async function getObservaSusPanelEmbed(slug: string): Promise<ObservaSusPanelEmbedResponse> {
  const response = await api.get(`${BASE}/panels/${slug}/embed`);
  return response.data;
}

export async function getObservaSusDataStorage(
  params?: ObservaSusResourceFilters
): Promise<ObservaSusResourceListResponse> {
  const response = await api.get(`${BASE}/datastorage`, {
    params: sanitizeObservaSusQueryParams(params),
  });
  return response.data;
}

export async function getObservaSusDataStorageBySystem(
  systemSlug: string,
  params?: ObservaSusResourceFilters
): Promise<ObservaSusResourceListResponse & { system: string }> {
  const response = await api.get(`${BASE}/datastorage/${systemSlug}`, {
    params: sanitizeObservaSusQueryParams(params),
  });
  return response.data;
}

export async function getObservaSusPublications(
  params?: ObservaSusResourceFilters
): Promise<ObservaSusResourceListResponse> {
  const response = await api.get(`${BASE}/publications`, {
    params: sanitizeObservaSusQueryParams(params),
  });
  return response.data;
}

export async function downloadObservaSusResource(resourceId: number, filename: string): Promise<void> {
  const response = await api.get(`${BASE}/resources/${resourceId}/download`, {
    responseType: 'blob',
  });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export type ObservaSusAdminPayload = {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  type: string;
  system: string;
  status: string;
  visibility: string;
  route?: string | null;
  externalUrl?: string | null;
  sortOrder?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  requiredRoles?: string[];
};

export async function getObservaSusAdminResources(
  params?: ObservaSusResourceFilters
): Promise<ObservaSusResourceListResponse> {
  const response = await api.get(`${BASE}/admin/resources`, {
    params: sanitizeObservaSusQueryParams(params),
  });
  return response.data;
}

export async function getObservaSusAdminResource(id: number): Promise<ObservaSusResource> {
  const response = await api.get(`${BASE}/admin/resources/${id}`);
  return response.data;
}

export async function createObservaSusAdminResource(
  payload: ObservaSusAdminPayload
): Promise<ObservaSusResource> {
  const response = await api.post(`${BASE}/admin/resources`, payload);
  return response.data;
}

export async function updateObservaSusAdminResource(
  id: number,
  payload: Partial<ObservaSusAdminPayload>
): Promise<ObservaSusResource> {
  const response = await api.patch(`${BASE}/admin/resources/${id}`, payload);
  return response.data;
}

export async function archiveObservaSusAdminResource(id: number): Promise<ObservaSusResource> {
  const response = await api.delete(`${BASE}/admin/resources/${id}`);
  return response.data;
}

export async function uploadObservaSusAdminFile(
  id: number,
  file: File
): Promise<ObservaSusResource> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`${BASE}/admin/resources/${id}/file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteObservaSusAdminFile(id: number): Promise<ObservaSusResource> {
  const response = await api.delete(`${BASE}/admin/resources/${id}/file`);
  return response.data;
}

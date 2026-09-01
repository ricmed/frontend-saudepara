import api from '@/utils/axiosRetry';
import type {
  ObservaSusHomeResponse,
  ObservaSusResource,
  ObservaSusResourceFilters,
  ObservaSusResourceListResponse,
} from '../types/observasus';

const BASE = '/api/observasus';

export async function getObservaSusHome(): Promise<ObservaSusHomeResponse> {
  const response = await api.get(`${BASE}/home`);
  return response.data;
}

export async function getObservaSusResources(
  params?: ObservaSusResourceFilters
): Promise<ObservaSusResourceListResponse> {
  const response = await api.get(`${BASE}/resources`, { params });
  return response.data;
}

export async function getObservaSusResourceBySlug(slug: string): Promise<ObservaSusResource> {
  const response = await api.get(`${BASE}/resources/slug/${slug}`);
  return response.data;
}

export async function getObservaSusDataStorage(
  params?: ObservaSusResourceFilters
): Promise<ObservaSusResourceListResponse> {
  const response = await api.get(`${BASE}/datastorage`, { params });
  return response.data;
}

export async function getObservaSusDataStorageBySystem(
  systemSlug: string,
  params?: ObservaSusResourceFilters
): Promise<ObservaSusResourceListResponse & { system: string }> {
  const response = await api.get(`${BASE}/datastorage/${systemSlug}`, { params });
  return response.data;
}

export async function getObservaSusPublications(
  params?: ObservaSusResourceFilters
): Promise<ObservaSusResourceListResponse> {
  const response = await api.get(`${BASE}/publications`, { params });
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
  const response = await api.get(`${BASE}/admin/resources`, { params });
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

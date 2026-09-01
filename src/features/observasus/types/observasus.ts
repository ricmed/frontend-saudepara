export type ObservaSusResourceStatus =
  | 'AVAILABLE'
  | 'MIGRATING'
  | 'COMING_SOON'
  | 'ARCHIVED';

export type ObservaSusResourceType =
  | 'PANEL'
  | 'DATASET'
  | 'DOCUMENT'
  | 'MANUAL'
  | 'LINK'
  | 'PUBLICATION';

export type ObservaSusSystem =
  | 'SIM'
  | 'SINASC'
  | 'SINAN'
  | 'ESUS_NOTIFICA'
  | 'COVID_19'
  | 'DEMOGRAFICO'
  | 'PQAVS'
  | 'GERAL';

export type ObservaSusResourceVisibility = 'PUBLIC' | 'AUTHENTICATED' | 'RESTRICTED';

export interface ObservaSusResource {
  id: number;
  slug: string;
  type: ObservaSusResourceType;
  system: ObservaSusSystem;
  title: string;
  subtitle: string | null;
  description: string | null;
  status: ObservaSusResourceStatus;
  visibility: ObservaSusResourceVisibility;
  route: string | null;
  externalUrl: string | null;
  originalFileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  publishedAt: string | null;
  sortOrder: number;
  isFeatured: boolean;
  hasFile: boolean;
  updatedAt: string;
  requiredRoles?: string[];
  metadata: unknown;
}

export interface ObservaSusResourceFilters {
  type?: ObservaSusResourceType;
  system?: ObservaSusSystem;
  status?: ObservaSusResourceStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export interface ObservaSusPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ObservaSusResourceListResponse {
  items: ObservaSusResource[];
  pagination: ObservaSusPagination;
}

export interface ObservaSusHomeResponse {
  panels: ObservaSusResource[];
  dataStorage: ObservaSusResource[];
  featuredPublications: ObservaSusResource[];
  updatedAt: string;
}

export interface ObservaSusPanel {
  id: string;
  slug: string;
  system: ObservaSusSystem;
  title: string;
  subtitle: string;
  description: string;
  status: ObservaSusResourceStatus;
  icon: 'baby' | 'heart-pulse' | 'activity' | 'virus' | 'users' | 'award';
  /** ID do recurso na API (quando vem do admin). */
  resourceId?: number;
  visibility?: ObservaSusResourceVisibility;
  /** Destino do CTA: rota interna ou URL externa. */
  href?: string;
  isExternal?: boolean;
  hasFile?: boolean;
}

export interface ObservaSusDataSystem {
  id: string;
  slug: string;
  system: ObservaSusSystem;
  title: string;
  subtitle: string;
  description: string;
  fileCount?: number;
  lastUpdated?: string;
  status: ObservaSusResourceStatus;
  route: string;
}

export interface ObservaSusPublication {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  status: ObservaSusResourceStatus;
}

export interface ObservaSusQuickLink {
  title: string;
  description: string;
  route: string;
  icon: 'map' | 'heart' | 'book' | 'message';
}

export const SYSTEM_SLUG_BY_ENUM: Record<ObservaSusSystem, string> = {
  SIM: 'sim',
  SINASC: 'sinasc',
  SINAN: 'sinan',
  ESUS_NOTIFICA: 'esus-notifica',
  COVID_19: 'covid-19',
  DEMOGRAFICO: 'demografico',
  PQAVS: 'pqa-vs',
  GERAL: 'repositorio',
};

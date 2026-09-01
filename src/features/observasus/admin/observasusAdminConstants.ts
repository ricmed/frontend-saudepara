export const OBSERVASUS_DOWNLOAD_ROLE_OPTIONS = [
  { name: 'observasus.download.sim', label: 'SIM' },
  { name: 'observasus.download.sinasc', label: 'SINASC' },
  { name: 'observasus.download.sinan', label: 'SINAN (todos)' },
  { name: 'observasus.download.sinan.dengue', label: 'SINAN / dengue' },
  { name: 'observasus.download.sinan.arboviroses', label: 'SINAN / arboviroses' },
  { name: 'observasus.download.esus-notifica', label: 'e-SUS Notifica' },
  { name: 'observasus.download.covid-19', label: 'COVID-19' },
  { name: 'observasus.download.demografico', label: 'Demográfico' },
  { name: 'observasus.download.pqavs', label: 'PQA-VS' },
  { name: 'observasus.download.geral', label: 'Repositório geral' },
  { name: 'observasus.download-restricted', label: 'Restrito geral (legado)' },
] as const;

export type ObservaSusAdminFormValues = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  type: string;
  system: string;
  status: string;
  visibility: string;
  route: string;
  externalUrl: string;
  sortOrder: number;
  isFeatured: boolean;
  isActive: boolean;
  requiredRoles: string[];
};

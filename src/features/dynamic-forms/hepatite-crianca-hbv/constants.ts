/** Chave do formulário dinâmico — Criança exposta ao HBV/HCV (SINAN SES-PA). */
export const HEPATITE_CRIANCA_HBV_FORM_KEY = 'HEPATITE_CRIANCA_HBV';

export const HEPATITE_CRIANCA_DASHBOARD_TABS = [
  { id: 'epidemiologico', label: 'Epidemiológico' },
  { id: 'perfil_materno', label: 'Perfil Materno' },
  { id: 'cobertura_vacinal', label: 'Cobertura Vacinal' },
  { id: 'seguimento_lab', label: 'Seguimento Lab.' },
  { id: 'desfecho_alertas', label: 'Desfecho / Alertas' },
] as const;

export type HepatiteCriancaDashboardTabId =
  (typeof HEPATITE_CRIANCA_DASHBOARD_TABS)[number]['id'];

import React, { createContext, useContext } from 'react';
import type { Form, FormSchema } from '@/services/FormService';
import type { FormSubmission } from '@/services/FormSubmissionService';
import {
  collectMonitorOperReportFilterOptions,
  type MonitorOperRegionalReport,
  type MonitorOperReportFilters,
  type MonitorOperRow,
  type MonitorOperSubmissionSummary,
} from '../utils/monitorOperRegionalReport';
import type { GeoDimensoesCatalog } from '../utils/monitorOperGeoDimensoes';

export type MonitorOperFilterOptions = ReturnType<typeof collectMonitorOperReportFilterOptions>;

export type MonitorOperReportContextValue = {
  agravo: string;
  form: Form | null;
  schema: FormSchema | null;
  submissionsAll: FormSubmission[];
  filteredSubmissions: FormSubmission[];
  filters: MonitorOperReportFilters;
  setFilters: React.Dispatch<React.SetStateAction<MonitorOperReportFilters>>;
  filterOptions: MonitorOperFilterOptions;
  rows: MonitorOperRow[];
  report: MonitorOperRegionalReport;
  summaries: MonitorOperSubmissionSummary[];
  crsLabels: Record<string, string>;
  /** idtipo_municipio (string) → descrição — para `acao.municipios_alcancados`. */
  municipioLabels: Record<string, string>;
  /** Catálogo geo PA (pode ser null se API/seed ainda não disponíveis). */
  geoCatalog: GeoDimensoesCatalog | null;
  downloadCsv: () => void;
};

const MonitorOperReportContext = createContext<MonitorOperReportContextValue | null>(null);

export function MonitorOperReportProvider({
  value,
  children,
}: {
  value: MonitorOperReportContextValue;
  children: React.ReactNode;
}) {
  return <MonitorOperReportContext.Provider value={value}>{children}</MonitorOperReportContext.Provider>;
}

export function useMonitorOperReport(): MonitorOperReportContextValue {
  const v = useContext(MonitorOperReportContext);
  if (!v) throw new Error('useMonitorOperReport deve ser usado dentro do painel de relatório do monitor operacional.');
  return v;
}

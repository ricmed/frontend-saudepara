/** Resposta de GET /api/crs/monitor-oper-regional-scope (alinhada ao backend). */
export type MonitorOperRegionalScopePayload = {
  canSelectAnyCrs: boolean;
  allowedCrsIds: number[];
  ui: 'full_select' | 'restricted_select' | 'readonly' | 'none';
  readonlyCrs: { id: number; nome: string } | null;
};

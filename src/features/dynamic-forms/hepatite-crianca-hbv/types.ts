export type HepatiteCriancaSubmission = {
  id: number;
  dtNotificacao: string | null;
  tipoExposicao: string;
  municipioNotificacaoIbge: string;
  municipioResidenciaIbge: string;
  nascimentoMunicipioIbge: string;
  dataEncerramento: string | null;
  lat: number | null;
  lng: number | null;
  idadeMeses: number | null;
  maeRacaCor: string;
  maeEscolaridade: string;
  maeHivAids: string;
  maeSifilis: string;
  maeSorologiaReagenteHbv: string;
  maeLabHbvHbsag: string;
  maeHbQuandoAntesPrenatal: string;
  maeHbQuandoDurantePrenatal: string;
  maeHbQuandoMaternidade: string;
  prenatalFezPrenatal: string;
  prenatalTratamentoHepatiteB: string;
  prenatalMedicamento: string;
  vacinaMaternidade: string;
  maternidadeNaoRealizadoQual: string;
  imunoglobulinaHbig: string;
  vacinaDose1: string;
  vacinaDose2: string;
  vacinaDose3: string;
  vacinaDose4: string;
  labE1Hbsag: string;
  labE1AntiHbs: string;
  labE1HbvDna: string;
  labE1Alt: string;
  labE2Hbsag: string;
  labE2AntiHbs: string;
  labE2HbvDna: string;
  acompM36HcvRna: string;
  acompAntiHcv: string;
  acompHcvRna: string;
  conclusaoEvolucaoCaso: string;
  conclusaoClassificacaoEtiologica: string;
  numeroSinanMae: string;
};

export type HepatiteChartItem = {
  name: string;
  value: number;
  id?: string;
};

export type HepatiteSerieTemporalPoint = {
  date: string;
  total: number;
  HBV: number;
  HCV: number;
  Ambos: number;
};

export type HepatiteSemanaEpidemiologicaPoint = {
  name: string;
  ano: number;
  value: number;
};

export type HepatiteMapaPonto = {
  id: string;
  lat: number;
  lng: number;
  fichasCount: number;
  tipo: 'notificacao' | 'residencia' | 'nascimento';
};

export interface HepatiteActiveFilters {
  tipo_exposicao: string | string[] | null;
  municipio_notificacao_ibge: string | string[] | null;
  municipio_residencia_ibge: string | string[] | null;
  encerrado: boolean | null;
}

export type HepatiteDashboardStats = {
  total: number;
  comHbvMaterno: number;
  comHcvMaterno: number;
  casosEncerrados: number;
};

export type HepatitePerfilMaternoCharts = {
  racaCor: HepatiteChartItem[];
  escolaridade: HepatiteChartItem[];
  hbsagTiming: HepatiteChartItem[];
  medicamentos: HepatiteChartItem[];
  kpis: {
    total: number;
    fezPrenatalSim: number;
    fezPrenatalInformado: number;
    hivSim: number;
    sifilisSim: number;
  };
};

export type HepatiteCoberturaVacinalCharts = {
  alertaHbsagSemHbig: number;
  funilDoses: HepatiteChartItem[];
  hbigRamo: HepatiteChartItem[];
  kpis: {
    esquemaCompleto: number;
    hbigRecebido: number;
    vacinaMaternidade: number;
    elegiveisHbig: number;
    semHbig: number;
    totalHbv: number;
  };
};

export type HepatiteSeguimentoLabCharts = {
  esquema1: {
    elegiveis: number;
    examinadas: number;
    pendentes: number;
    hbsagPos: number;
    antiHbsPos: number;
    hbvDnaPos: number;
    inconclusivo: number;
    completas: number;
  };
  esquema2: {
    elegiveis: number;
    examinadas: number;
    pendentes: number;
    antiHbsPos: number;
  };
  hcv36: {
    elegiveis: number;
    realizadas: number;
    reagentes: number;
  };
  hcv18: {
    elegiveis: number;
    realizadas: number;
    reagentes: number;
  };
  gapLaboratorial: number;
  alertaEsquema1Pendente: number;
};

export type ReferenceLabelMaps = {
  raca: Record<string, string>;
  escolaridade: Record<string, string>;
};

export type HepatiteAlertaTipo =
  | 'hbig_pendente'
  | 'esquema1_pendente'
  | 'esquema2_pendente'
  | 'hcv_36_pendente'
  | 'hcv_18_pendente'
  | 'idade_acima_limite'
  | 'sem_evolucao';

export type HepatiteAlertaResumo = {
  tipo: HepatiteAlertaTipo;
  label: string;
  severidade: 'alta' | 'media' | 'baixa';
  count: number;
};

export type HepatiteCasoAbertoRow = {
  id: number;
  numeroSinanMae: string;
  tipoExposicaoLabel: string;
  idadeMeses: number | null;
  municipioLabel: string;
  dtNotificacao: string | null;
  evolucaoLabel: string;
  alertas: HepatiteAlertaTipo[];
};

export type HepatiteDesfechoAlertasCharts = {
  kpis: {
    total: number;
    emAberto: number;
    encerrados: number;
    detectados: number;
    naoDetectados: number;
    perdaSeguimento: number;
    obitos: number;
    comAlerta: number;
  };
  evolucaoCaso: HepatiteChartItem[];
  classificacaoEtiologica: HepatiteChartItem[];
  alertasResumo: HepatiteAlertaResumo[];
  casosEmAberto: HepatiteCasoAbertoRow[];
};

import React, { useEffect, useState } from "react";
import axios from "axios";
import { AdminHeader } from "@/keycloak/admin/components/AdminHeader";
import { SideMenu } from "@/features/home/components/SideMenu";
import { useNavigate } from "react-router-dom";
import { Language } from "@/i18n/types";
import {
  ArrowLeft, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Clock, Wifi, WifiOff, Building2, Calendar, ClipboardList,
  Activity, Copy, Check
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface IndicadoresValidacao {
  unidades_treinadas: number;
  unidades_com_notificacao: number;
  periodo_operacao: {
    inicio: string | null;
    fim: string | null;
    dias_totais: number;
  };
  disponibilidade: {
    dias_com_registro: number;
    dias_totais_operacao: number;
    percentual: number;
  };
  sincronizacao_offline: {
    total_offline: number;
    total_sincronizados: number;
    total_pendentes: number;
    taxa_sincronizacao_pct: number;
    com_tempo_rastreado: number;
    /** Igual ao export Excel: epoch em `offline_id` → `created_at` (minutos). */
    tempo_medio_minutos: number | null;
    tempo_minimo_minutos: number | null;
    tempo_maximo_minutos: number | null;
    latencia_sync_ms_media?: number | null;
    latencia_sync_ms_min?: number | null;
    latencia_sync_ms_max?: number | null;
    criacao_ate_updated_at_media_min?: number | null;
    nota: string;
  };
  completude_campos_criticos: {
    total_notificacoes: number;
    notificacoes_completas: number;
    percentual: number;
    campos_avaliados: string[];
  };
  incidentes_indisponibilidade: {
    dias_sem_registro: number;
    percentual_indisponibilidade: number;
  };
  gerado_em: string;
}

// ─── Config de API ────────────────────────────────────────────────────────────

const server = import.meta.env.VITE_API_SERVER || "http://localhost";
const port = import.meta.env.VITE_API_PORT || "3000";
const API_URL = `${server}:${port}`;

// ─── Helpers visuais ──────────────────────────────────────────────────────────

function statusIcon(percentual: number, meta: number, invertido = false) {
  const ok = invertido ? percentual <= meta : percentual >= meta;
  if (ok) return <CheckCircle className="h-5 w-5 text-emerald-500" />;
  if (Math.abs(percentual - meta) <= 5)
    return <AlertTriangle className="h-5 w-5 text-amber-400" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

function barColor(pct: number, meta: number, invertido = false) {
  const ok = invertido ? pct <= meta : pct >= meta;
  if (ok) return "bg-emerald-500";
  if (Math.abs(pct - meta) <= 5) return "bg-amber-400";
  return "bg-red-500";
}

function ProgressBar({ value, max = 100, meta, invertido = false }: { value: number; max?: number; meta: number; invertido?: boolean }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
      <div
        className={`h-2 rounded-full transition-all duration-700 ${barColor(value, meta, invertido)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtNum(n: number | null, decimais = 1) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: decimais, maximumFractionDigits: decimais });
}

// ─── Componente principal ─────────────────────────────────────────────────────

const ValidacaoCientificaPage: React.FC = () => {
  const [selectedLanguage] = useState<Language>("pt-BR");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dados, setDados] = useState<IndicadoresValidacao | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [dataInicio, setDataInicio] = useState('2025-11-03');
  const [dataFim, setDataFim] = useState('2025-11-25');
  const navigate = useNavigate();

  const buscarDados = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await axios.get(`${API_URL}/api/v1/validacao-cientifica`, {
        withCredentials: true,
        params: { inicio: dataInicio, fim: dataFim },
      });
      setDados(resp.data.dados);
    } catch (e: any) {
      setErro(e?.response?.data?.mensagem || e?.message || "Erro ao carregar indicadores.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { buscarDados(); }, []);

  const copiarJson = () => {
    if (!dados) return;
    navigator.clipboard.writeText(JSON.stringify(dados, null, 2));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <AdminHeader
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        selectedLanguage={selectedLanguage}
      />
      <SideMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* ── Cabeçalho ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 bg-white hover:bg-gray-50 text-gray-600 rounded-xl shadow-sm border border-gray-200 transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Validação Científica</h1>
                <p className="text-sm text-gray-500 mt-0.5">Indicadores operacionais — App Saúde Pará · COP 30</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">De</span>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="text-sm text-gray-700 border-none outline-none bg-transparent"
                />
                <span className="text-xs text-gray-500 font-medium">até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  className="text-sm text-gray-700 border-none outline-none bg-transparent"
                />
              </div>
              {dados && (
                <button
                  onClick={copiarJson}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl shadow-sm hover:bg-gray-50 transition"
                >
                  {copiado ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copiado ? "Copiado!" : "Copiar JSON"}
                </button>
              )}
              <button
                onClick={buscarDados}
                disabled={carregando}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
                Atualizar
              </button>
            </div>
          </div>

          {/* ── Estado de carregamento / erro ── */}
          {carregando && !dados && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <RefreshCw className="h-10 w-10 animate-spin mb-4 text-blue-400" />
              <p className="text-sm">Calculando indicadores a partir do banco de dados…</p>
            </div>
          )}

          {erro && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 mb-6">
              <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Não foi possível carregar os indicadores</p>
                <p className="text-sm mt-1">{erro}</p>
                <p className="text-xs mt-2 text-red-500">
                  Verifique se o backend está rodando e se você tem role <code className="bg-red-100 px-1 rounded">admin_master</code> ou <code className="bg-red-100 px-1 rounded">admin_cievs</code>.
                </p>
              </div>
            </div>
          )}

          {/* ── Conteúdo principal ── */}
          {dados && (
            <div className="space-y-6">

              {/* Data de geração */}
              <p className="text-xs text-gray-400 text-right">
                Dados extraídos em {new Date(dados.gerado_em).toLocaleString("pt-BR")}
                {carregando && <span className="ml-2 text-blue-400">(atualizando…)</span>}
              </p>

              {/* ── Linha 1: Cards de destaque ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

                <Card className="text-center">
                  <Building2 className="h-7 w-7 text-blue-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{dados.unidades_treinadas}</p>
                  <p className="text-xs text-gray-500 mt-1">Unidades treinadas</p>
                  <p className="text-xs text-gray-400">({dados.unidades_com_notificacao} com registros)</p>
                </Card>

                <Card className="text-center">
                  <Calendar className="h-7 w-7 text-purple-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{dados.periodo_operacao.dias_totais}</p>
                  <p className="text-xs text-gray-500 mt-1">Dias em operação</p>
                  <p className="text-xs text-gray-400">{fmtDate(dados.periodo_operacao.inicio)}</p>
                </Card>

                <Card className="text-center">
                  <ClipboardList className="h-7 w-7 text-teal-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">
                    {dados.completude_campos_criticos.total_notificacoes.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Notificações totais</p>
                  <Badge
                    label={`${fmtNum(dados.completude_campos_criticos.percentual, 1)}% completas`}
                    color="bg-teal-50 text-teal-700"
                  />
                </Card>

                <Card className="text-center">
                  <Activity className="h-7 w-7 text-emerald-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">
                    {fmtNum(dados.disponibilidade.percentual, 1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Disponibilidade</p>
                  <p className="text-xs text-gray-400">{dados.disponibilidade.dias_com_registro} de {dados.disponibilidade.dias_totais_operacao} dias</p>
                </Card>
              </div>

              {/* ── Linha 2: Indicadores detalhados ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* 3. Disponibilidade */}
                <Card>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                      <Activity className="h-4 w-4 text-emerald-500" />
                      Disponibilidade operacional
                    </div>
                    {statusIcon(dados.disponibilidade.percentual, 90)}
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {fmtNum(dados.disponibilidade.percentual, 1)}%
                  </p>
                  <ProgressBar value={dados.disponibilidade.percentual} meta={90} />
                  <p className="text-xs text-gray-400 mt-2">
                    {dados.disponibilidade.dias_com_registro} dias com registro · meta ≥ 90%
                  </p>
                </Card>

                {/* 5. Taxa offline sincronizada */}
                <Card>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                      <Wifi className="h-4 w-4 text-blue-500" />
                      Taxa offline sincronizada
                    </div>
                    {statusIcon(dados.sincronizacao_offline.taxa_sincronizacao_pct, 95)}
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {fmtNum(dados.sincronizacao_offline.taxa_sincronizacao_pct, 1)}%
                  </p>
                  <ProgressBar value={dados.sincronizacao_offline.taxa_sincronizacao_pct} meta={95} />
                  <p className="text-xs text-gray-400 mt-2">
                    {dados.sincronizacao_offline.total_sincronizados.toLocaleString("pt-BR")} de{" "}
                    {dados.sincronizacao_offline.total_offline.toLocaleString("pt-BR")} registros · meta ≥ 95%
                  </p>
                </Card>

                {/* 6. Completude */}
                <Card>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                      <ClipboardList className="h-4 w-4 text-teal-500" />
                      Completude de campos críticos
                    </div>
                    {statusIcon(dados.completude_campos_criticos.percentual, 90)}
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {fmtNum(dados.completude_campos_criticos.percentual, 1)}%
                  </p>
                  <ProgressBar value={dados.completude_campos_criticos.percentual} meta={90} />
                  <p className="text-xs text-gray-400 mt-2">
                    {dados.completude_campos_criticos.notificacoes_completas.toLocaleString("pt-BR")} completas · meta ≥ 90%
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {dados.completude_campos_criticos.campos_avaliados.map((c) => (
                      <span key={c} className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-mono">{c.replace("_id", "").replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </Card>

                {/* 7. Incidentes */}
                <Card>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                      <WifiOff className="h-4 w-4 text-red-400" />
                      Incidentes de indisponibilidade
                    </div>
                    {statusIcon(dados.incidentes_indisponibilidade.percentual_indisponibilidade, 10, true)}
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {dados.incidentes_indisponibilidade.dias_sem_registro} dias
                  </p>
                  <ProgressBar
                    value={dados.incidentes_indisponibilidade.percentual_indisponibilidade}
                    meta={10}
                    invertido
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {fmtNum(dados.incidentes_indisponibilidade.percentual_indisponibilidade, 1)}% do período · meta ≤ 10%
                  </p>
                </Card>
              </div>

              {/* ── Sincronização offline — detalhes ── */}
              <Card>
                <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-4">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Sincronização offline — detalhes
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Total offline</p>
                    <p className="text-xl font-bold text-gray-900">{dados.sincronizacao_offline.total_offline.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-gray-400 mt-0.5">criados sem conexão</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Sincronizados</p>
                    <p className="text-xl font-bold text-emerald-600">{dados.sincronizacao_offline.total_sincronizados.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-gray-400 mt-0.5">com synced_at no servidor</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Tempo médio (regra Excel)</p>
                    <p className="text-xl font-bold text-blue-600">
                      {dados.sincronizacao_offline.tempo_medio_minutos != null
                        ? `${fmtNum(dados.sincronizacao_offline.tempo_medio_minutos, 1)} min`
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {dados.sincronizacao_offline.com_tempo_rastreado > 0
                        ? `offline_id → created_at · ${dados.sincronizacao_offline.com_tempo_rastreado} registro(s)`
                        : dados.sincronizacao_offline.total_offline === 0
                          ? "sem registros offline no período"
                          : "sem offline_id parseável no período"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Mín / Máx (fila, min)</p>
                    <p className="text-xl font-bold text-gray-700">
                      {dados.sincronizacao_offline.tempo_minimo_minutos != null &&
                      dados.sincronizacao_offline.tempo_maximo_minutos != null
                        ? `${fmtNum(dados.sincronizacao_offline.tempo_minimo_minutos, 0)} / ${fmtNum(dados.sincronizacao_offline.tempo_maximo_minutos, 0)} min`
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">mesma base do export da lista</p>
                  </div>
                </div>
                {dados.sincronizacao_offline.latencia_sync_ms_media != null && (
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mt-3">
                    Carimbos no servidor (referência técnica):{" "}
                    <span className="font-medium">
                      média {fmtNum(dados.sincronizacao_offline.latencia_sync_ms_media, 2)} ms
                    </span>
                    {dados.sincronizacao_offline.latencia_sync_ms_min != null &&
                      dados.sincronizacao_offline.latencia_sync_ms_max != null && (
                      <>
                        {" "}
                        (mín / máx{" "}
                        {fmtNum(dados.sincronizacao_offline.latencia_sync_ms_min, 2)} /{" "}
                        {fmtNum(dados.sincronizacao_offline.latencia_sync_ms_max, 2)} ms
                        , |created_at − synced_at|)
                      </>
                    )}
                    .
                  </p>
                )}
                {dados.sincronizacao_offline.criacao_ate_updated_at_media_min != null && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                    Média <span className="font-medium">criação → última atualização</span> no servidor:{" "}
                    <span className="font-semibold">
                      {fmtNum(dados.sincronizacao_offline.criacao_ate_updated_at_media_min, 1)} min
                    </span>
                    {" "}— inclui edições posteriores; não use como latência de sync em rede.
                  </p>
                )}
                {dados.sincronizacao_offline.nota && (
                  <p className="text-xs text-gray-400 mt-3 italic">{dados.sincronizacao_offline.nota}</p>
                )}
              </Card>

              {/* ── Período de operação ── */}
              <Card>
                <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-4">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  Período de operação
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Primeiro registro</p>
                    <p className="text-lg font-semibold text-gray-800">{fmtDate(dados.periodo_operacao.inicio)}</p>
                  </div>
                  <div className="hidden sm:block text-gray-300 font-light text-2xl">→</div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Último registro</p>
                    <p className="text-lg font-semibold text-gray-800">{fmtDate(dados.periodo_operacao.fim)}</p>
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <p className="text-xs text-blue-500 mb-1">Total em operação</p>
                    <p className="text-2xl font-bold text-blue-700">{dados.periodo_operacao.dias_totais} dias</p>
                  </div>
                </div>
              </Card>

              {/* ── Tabela resumo para o artigo ── */}
              <Card>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Tabela resumo para o artigo
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-700 text-white">
                        {["Indicador", "Resultado", "Meta", "Status"].map((h) => (
                          <th key={h} className="px-4 py-2 text-left font-semibold text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          indicador: "Unidades treinadas",
                          resultado: `${dados.unidades_treinadas} unidades`,
                          meta: "≥ 30",
                          pct: dados.unidades_treinadas, metaNum: 30
                        },
                        {
                          indicador: "Período de operação",
                          resultado: `${dados.periodo_operacao.dias_totais} dias`,
                          meta: "COP 30 (03–25/11)",
                          pct: 100, metaNum: 100 // sempre "atingido" — é o evento completo
                        },
                        {
                          indicador: "Disponibilidade operacional",
                          resultado: `${fmtNum(dados.disponibilidade.percentual, 1)}%`,
                          meta: "≥ 90%",
                          pct: dados.disponibilidade.percentual, metaNum: 90
                        },
                        {
                          indicador: "Taxa offline sincronizada",
                          resultado: `${fmtNum(dados.sincronizacao_offline.taxa_sincronizacao_pct, 1)}%`,
                          meta: "≥ 95%",
                          pct: dados.sincronizacao_offline.taxa_sincronizacao_pct, metaNum: 95
                        },
                        {
                          indicador: "Tempo médio de sincronização (regra Excel)",
                          resultado:
                            dados.sincronizacao_offline.tempo_medio_minutos != null
                              ? `${fmtNum(dados.sincronizacao_offline.tempo_medio_minutos, 1)} min · ${dados.sincronizacao_offline.com_tempo_rastreado.toLocaleString("pt-BR")} reg.`
                              : "—",
                          meta: "offline_id → created_at",
                          informativo: true as const,
                        },
                        {
                          indicador: "Completude de campos críticos",
                          resultado: `${fmtNum(dados.completude_campos_criticos.percentual, 1)}%`,
                          meta: "≥ 90%",
                          pct: dados.completude_campos_criticos.percentual, metaNum: 90
                        },
                        {
                          indicador: "Incidentes de indisponibilidade",
                          resultado: `${dados.incidentes_indisponibilidade.dias_sem_registro} dias (${fmtNum(dados.incidentes_indisponibilidade.percentual_indisponibilidade, 1)}%)`,
                          meta: "≤ 10%",
                          pct: dados.incidentes_indisponibilidade.percentual_indisponibilidade, metaNum: 10, invertido: true
                        },
                      ].map(({ indicador, resultado, meta, pct, metaNum, invertido, informativo }, i) => {
                        if (informativo) {
                          return (
                            <tr key={indicador} className={i % 2 === 0 ? "bg-blue-50/40" : "bg-white"}>
                              <td className="px-4 py-2 font-medium text-gray-800">{indicador}</td>
                              <td className="px-4 py-2 font-semibold text-gray-900">{resultado}</td>
                              <td className="px-4 py-2 text-gray-500">{meta}</td>
                              <td className="px-4 py-2">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  <Activity className="h-3 w-3" />
                                  Referência
                                </span>
                              </td>
                            </tr>
                          );
                        }
                        const ok = invertido ? pct <= metaNum : pct >= metaNum;
                        return (
                          <tr key={indicador} className={i % 2 === 0 ? "bg-blue-50/40" : "bg-white"}>
                            <td className="px-4 py-2 font-medium text-gray-800">{indicador}</td>
                            <td className="px-4 py-2 font-semibold text-gray-900">{resultado}</td>
                            <td className="px-4 py-2 text-gray-500">{meta}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                                {ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {ok ? "Atingido" : "Abaixo da meta"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ValidacaoCientificaPage;

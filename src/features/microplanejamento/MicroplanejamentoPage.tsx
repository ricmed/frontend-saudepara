import { Navigate, NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Syringe } from 'lucide-react';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { useAuth } from '@/keycloak/AuthProvider';
import { microplanejamentoApi } from './api';
import { searchSemCiclo, useMpFiltro } from './useMp';
import { FiltroUbsCiclo, FiltrosTerritorio } from './FiltrosTerritorio';
import { STATUS_CICLO } from './FormularioCiclo';
import { inputClass } from './ui';
import { InicioPage } from './pages/InicioPage';
import { LocalidadesPage } from './pages/LocalidadesPage';
import { GovernancaPage } from './pages/GovernancaPage';
import { DiagnosticoPage } from './pages/DiagnosticoPage';
import { ChecklistPage, PreparacaoPage } from './pages/PreparacaoPage';
import { MetasPage } from './pages/MetasPage';
import { PlanoPage } from './pages/PlanoPage';
import { ExecucaoPage } from './pages/ExecucaoPage';
import { AvaliacaoPage } from './pages/AvaliacaoPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { ParametrosPage } from './pages/ParametrosPage';

const SECOES = [
  { id: '', rotulo: 'Início' },
  { id: 'localidades', rotulo: 'Localidades' },
  { id: 'governanca', rotulo: 'Governança' },
  { id: 'diagnostico', rotulo: 'Diagnóstico' },
  { id: 'preparacao', rotulo: 'Preparação' },
  { id: 'checklist', rotulo: 'Checklist' },
  { id: 'metas', rotulo: 'Metas e insumos' },
  { id: 'plano', rotulo: 'Plano de ação' },
  { id: 'comunicacao', rotulo: 'Comunicação' },
  { id: 'execucao', rotulo: 'Execução' },
  { id: 'avaliacao', rotulo: 'Avaliação e alertas' },
  { id: 'relatorios', rotulo: 'Relatórios' },
  { id: 'parametros', rotulo: 'Parâmetros', estadual: true },
];

function secaoAtual(pathname: string) {
  const resto = pathname.replace(/^\/private\/microplanejamento\/?/, '');
  return resto.split('/')[0] || '';
}

export default function MicroplanejamentoPage() {
  const location = useLocation();
  const secao = secaoAtual(location.pathname);
  const { user } = useAuth();
  const roles: string[] = user?.roles ?? [];
  const veParametros = roles.includes('admin') || roles.includes('admin.estado');
  const filtro = useMpFiltro();
  const ciclos = useQuery({
    queryKey: ['mp-ciclos', filtro.municipioId],
    enabled: secao === '',
    queryFn: () => microplanejamentoApi.ciclos({ municipioId: filtro.municipioId, limit: 100 }),
  });
  useQuery({
    queryKey: ['mp-catalogo-vacina'],
    queryFn: () => microplanejamentoApi.catalogo('VACINA'),
    staleTime: 60_000,
  });

  const search = location.search;
  const precisaCiclo = secao !== '' && secao !== 'parametros';
  if (precisaCiclo && !filtro.cicloId) {
    return <Navigate to={`/private/microplanejamento${searchSemCiclo(search)}`} replace />;
  }

  const visiveis = SECOES.filter((item) => {
    if (item.estadual) return veParametros;
    if (!item.id) return true;
    return Boolean(filtro.cicloId);
  });

  return (
    <AppPageLayout title="Microplanejamento" subtitle="Ciclo de vacinação" icon={<Syringe />} variant="desktop" contentWidth="wide">
      <div className="space-y-4">
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {visiveis.map((item) => (
            <NavLink
              key={item.id || 'inicio'}
              end={item.id === ''}
              to={{
                pathname: item.id ? `/private/microplanejamento/${item.id}` : '/private/microplanejamento',
                search: item.id ? search : searchSemCiclo(search),
              }}
              className={({ isActive }) => `whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${isActive ? 'bg-blue-700 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
            >
              {item.rotulo}
            </NavLink>
          ))}
        </nav>

        {secao === '' && (
          <section className="bg-white border border-gray-200 rounded-lg p-3 grid gap-3 md:grid-cols-4">
            <FiltrosTerritorio />
            <label className="text-sm text-gray-700">
              Ciclo
              <select className={`${inputClass} mt-1`} value={filtro.cicloId ?? ''} onChange={(e) => filtro.setFiltro('cicloId', e.target.value)}>
                <option value="">Todos</option>
                {(ciclos.data?.data ?? []).map((ciclo) => (
                  <option key={ciclo.id} value={ciclo.id}>{ciclo.ano} · {ciclo.nome} · {ciclo.estrategia}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Status
              <select className={`${inputClass} mt-1`} value={filtro.status ?? ''} onChange={(e) => filtro.setFiltro('status', e.target.value)}>
                <option value="">Todos</option>
                {STATUS_CICLO.map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>{rotulo}</option>
                ))}
              </select>
            </label>
          </section>
        )}

        {secao !== '' && secao !== 'parametros' && secao !== 'localidades' && (
          <FiltroUbsCiclo
            aplicaLocalidade={secao === 'governanca' || secao === 'plano' || secao === 'execucao' || secao === 'diagnostico'}
            somenteUbs={secao === 'preparacao' || secao === 'checklist'}
          />
        )}

        {secao === '' && <InicioPage />}
        {secao === 'localidades' && <LocalidadesPage />}
        {secao === 'governanca' && <GovernancaPage />}
        {secao === 'diagnostico' && <DiagnosticoPage />}
        {secao === 'preparacao' && <PreparacaoPage />}
        {secao === 'checklist' && <ChecklistPage />}
        {secao === 'metas' && <MetasPage />}
        {secao === 'plano' && <PlanoPage modo="plano" />}
        {secao === 'comunicacao' && <PlanoPage modo="comunicacao" />}
        {secao === 'execucao' && <ExecucaoPage />}
        {secao === 'avaliacao' && <AvaliacaoPage />}
        {secao === 'relatorios' && <RelatoriosPage />}
        {secao === 'parametros' && veParametros && <ParametrosPage />}
      </div>
    </AppPageLayout>
  );
}

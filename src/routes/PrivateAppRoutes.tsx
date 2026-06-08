import { lazy } from 'react';
import { Outlet, Route } from 'react-router-dom';
import ProtectedRoute from '@/keycloak/ProtectedRoute';
import UserProfile from '@/keycloak/pages/UserProfile';
import LogoutConfirmation from '@/keycloak/pages/LogoutConfirmation';
import PaginaAppsAuxiliares from '@/features/apps/components/PaginaAppsAuxiliares';
import PaginaEscolhaAppsAuxiliares from '@/features/apps/components/PaginaEscolhaAppsAuxiliares';
import PaginaAppsAuxiliaresDae from '@/features/apps/components/PaginaAppsAuxiliaresDae';
import ListaComponentes from '@/features/apps/list/ListaComponentes';
import CadastroComponente from '@/features/apps/components/CadastroComponente';
import ListaTiposEncerramento from '@/features/apps/list/ListaTipoEncerramento';
import CadastroTipoEncerramento from '@/features/apps/components/CadastroEncerramento';
import ListaTiposPublico from '@/features/apps/list/ListaPublico';
import CadastroTipoPublico from '@/features/apps/components/CadastroPublico';
import ListaTiposEvento from '@/features/apps/list/ListaEvento';
import CadastroTipoEvento from '@/features/apps/components/CadastroEvento';
import ListaTiposTrauma from '@/features/apps/list/ListaTrauma';
import CadastroTipoTrauma from '@/features/apps/components/CadastroTrauma';
import ListaTiposAtendimento from '@/features/apps/list/ListaAtendimento';
import CadastroTipoAtendimento from '@/features/apps/components/CadastroAtendimento';
import ListaTiposHipoteseDiag from '@/features/apps/list/ListaHipoteseDiag';
import CadastroTipoHipoteseDiag from '@/features/apps/components/CadastroHipoteseDiag';
import ListaTiposSintoma from '@/features/apps/list/ListaSintoma';
import CadastroTipoSintoma from '@/features/apps/components/CadastroSintoma';
import RelatorioQualificacao from '@/features/apps/list/ListaQualificacao';
import CadastroQualificacao from '@/features/apps/components/CadastroQualificacao';
import ListaHabilitacoes from '@/features/apps/list/ListaHabilitacoes';
import CadastroHabilitacao from '@/features/apps/components/CadastroHabilitacao';
import ListaEstabelecimentos from '@/features/apps/list/ListaEstabelecimentos';
import CadastroEstabelecimento from '@/features/apps/components/CadastroTipoEstabelecimento';
import ListaTurnos from '@/features/apps/list/ListaTurno';
import CadastroTurno from '@/features/apps/components/CadastroTurno';
import ListaNaturezas from '@/features/apps/list/ListaNatureza';
import CadastroNatureza from '@/features/apps/components/CadastroNatureza';
import ListaRacas from '@/features/apps/list/ListaRaca';
import CadastroRaca from '@/features/apps/components/CadastroRaca';
import ListaCBO from '@/features/apps/list/ListaCBO';
import CadastroCBO from '@/features/apps/components/CadastroCBO';
import ListaEscolaridade from '@/features/apps/list/ListaEscolaridade';
import CadastroEscolaridade from '@/features/apps/components/CadastroEscolaridade';
import ListaEstados from '@/features/apps/list/ListaEstados';
import CadastroEstado from '@/features/apps/components/CadastroEstado';
import ListaMunicipios from '@/features/apps/list/ListaMunicipios';
import CadastroMunicipio from '@/features/apps/components/CadastroMunicipio';
import ListaPaises from '@/features/apps/list/ListaPaises';
import CadastroPais from '@/features/apps/components/CadastroPais';
import ListaGeneros from '@/features/apps/list/ListaGenero';
import CadastroGenero from '@/features/apps/components/CadastroGenero';
import ListaBairros from '@/features/apps/list/ListaBairro';
import CadastroBairro from '@/features/apps/components/CadastroBairro';
import FormularioPaciente from '@/features/paginaPacientesComu/components/FormularioPaciente';
import ListaPacientes from '@/features/paginaPacientesComu/components/ListaPacientes';
import OfflineManagementPage from '@/features/offlinePage/pages/OfflineManagementPage';
import RelatorioEstabelecimento from '@/features/list/views/RelatorioEstabelecimento';
import QualificarEstabelecimentos from '@/features/forms/EstablishmentForm';
import DaePage from '@/features/comunicacao-dae/DaePage';
import NhePage from '@/features/comunicacao-dae/NhePage';
import CievsPage from '@/features/comunicacao-dae/CievsPage';
import CrsPage from '@/features/comunicacao-dae/CrsPage';
import { DynamicFormPage } from '@/features/dynamic-forms/pages/DynamicFormPage';
import { DynamicFormPrintPage } from '@/features/dynamic-forms/pages/DynamicFormPrintPage';
import { FormsListPage } from '@/features/dynamic-forms/pages/FormsListPage';
import FormBuilderPage from '@/features/dynamic-forms/pages/FormBuilderPage';
import FixedColumnsConfigPage from '@/features/dynamic-forms/pages/FixedColumnsConfigPage';
import { FormAdminListPage } from '@/features/dynamic-forms/pages/FormAdminListPage';
import { FormSubmissionsListPage } from '@/features/dynamic-forms/pages/FormSubmissionsListPage';
import { MonitorOperRegionalReportPage } from '@/features/dynamic-forms/pages/MonitorOperRegionalReportPage';
import { FormResponsesPage } from '@/features/dynamic-forms/pages/FormResponsesPage';
import { FormResponsesSummaryPage } from '@/features/dynamic-forms/pages/FormResponsesSummaryPage';
import { MyFormsPage } from '@/features/dynamic-forms/pages/MyFormsPage';
import { FormShareSettingsPage } from '@/features/dynamic-forms/pages/FormShareSettingsPage';
import { FormShareSinanSettingsPage } from '@/features/dynamic-forms/pages/FormShareSinanSettingsPage';

const ListaNotificacoes = lazy(() => import('@/features/notificationForms/ListaNotificacoes'));
const NotificationForm = lazy(() => import('@/features/notificationForms/NotificationForm'));
const ComunicacaoDaePage = lazy(() => import('@/features/comunicacao-dae/ComunicacaoDaePage'));
const ComunicacaoDaeDashboard = lazy(() => import('@/features/comunicacao-dae/ComunicacaoDaeDashboard'));
const ComunicacaoDaeFormPage = lazy(() => import('@/features/comunicacao-dae/ComunicacaoDaeFormPage'));

const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
};

export const getPrivateAppRoutes = () => {
  return (
    <>
      <Route path="/private" element={<ProtectedLayout />}>
        <Route path="/private/escolha-apps-auxiliares" element={<PaginaEscolhaAppsAuxiliares />} />
        <Route path="/private/apps-auxiliares" element={<PaginaAppsAuxiliares />} />
        <Route path="/private/apps-auxiliares-dae" element={<PaginaAppsAuxiliaresDae />} />
        <Route path="/private/offline-management" element={<OfflineManagementPage />} />

        <Route path="/private/qualificacao" element={<RelatorioQualificacao />} />
        <Route path="/private/qualificacao/nova" element={<CadastroQualificacao />} />
        <Route path="/private/qualificacao/editar/:id" element={<CadastroQualificacao />} />

        <Route path="/private/habilitacao" element={<ListaHabilitacoes />} />
        <Route path="/private/habilitacao/nova" element={<CadastroHabilitacao />} />
        <Route path="/private/habilitacao/editar/:id" element={<CadastroHabilitacao />} />

        <Route path="/private/tipo-estabelecimentos" element={<RelatorioEstabelecimento />} />
        <Route path="/private/tipo-estabelecimentos/nova" element={<CadastroEstabelecimento />} />
        <Route path="/private/tipo-estabelecimentos/editar/:id" element={<CadastroEstabelecimento />} />

        <Route path="/private/turnos" element={<ListaTurnos />} />
        <Route path="/private/turnos/nova" element={<CadastroTurno />} />
        <Route path="/private/turnos/editar/:id" element={<CadastroTurno />} />

        <Route path="/private/naturezas" element={<ListaNaturezas />} />
        <Route path="/private/naturezas/nova" element={<CadastroNatureza />} />
        <Route path="/private/naturezas/editar/:id" element={<CadastroNatureza />} />

        <Route path="/private/raca" element={<ListaRacas />} />
        <Route path="/private/raca/nova" element={<CadastroRaca />} />
        <Route path="/private/raca/editar/:id" element={<CadastroRaca />} />

        <Route path="/private/cbo" element={<ListaCBO />} />
        <Route path="/private/cbo/nova" element={<CadastroCBO />} />
        <Route path="/private/cbo/editar/:id" element={<CadastroCBO />} />

        <Route path="/private/escolaridade" element={<ListaEscolaridade />} />
        <Route path="/private/escolaridade/nova" element={<CadastroEscolaridade />} />
        <Route path="/private/escolaridade/editar/:id" element={<CadastroEscolaridade />} />

        <Route path="/private/estado" element={<ListaEstados />} />
        <Route path="/private/estado/nova" element={<CadastroEstado />} />
        <Route path="/private/estado/editar/:id" element={<CadastroEstado />} />

        <Route path="/private/municipio" element={<ListaMunicipios />} />
        <Route path="/private/municipio/nova" element={<CadastroMunicipio />} />
        <Route path="/private/municipio/editar/:id" element={<CadastroMunicipio />} />

        <Route path="/private/pais" element={<ListaPaises />} />
        <Route path="/private/pais/nova" element={<CadastroPais />} />
        <Route path="/private/pais/editar/:id" element={<CadastroPais />} />

        <Route path="/private/genero" element={<ListaGeneros />} />
        <Route path="/private/genero/nova" element={<CadastroGenero />} />
        <Route path="/private/genero/editar/:id" element={<CadastroGenero />} />

        <Route path="/private/bairro" element={<ListaBairros />} />
        <Route path="/private/bairro/nova" element={<CadastroBairro />} />
        <Route path="/private/bairro/editar/:id" element={<CadastroBairro />} />

        <Route path="/private/encerramento" element={<ListaTiposEncerramento />} />
        <Route path="/private/encerramento/nova" element={<CadastroTipoEncerramento />} />
        <Route path="/private/encerramento/editar/:id" element={<CadastroTipoEncerramento />} />

        <Route path="/private/publico" element={<ListaTiposPublico />} />
        <Route path="/private/publico/nova" element={<CadastroTipoPublico />} />
        <Route path="/private/publico/editar/:id" element={<CadastroTipoPublico />} />

        <Route path="/private/evento" element={<ListaTiposEvento />} />
        <Route path="/private/evento/nova" element={<CadastroTipoEvento />} />
        <Route path="/private/evento/editar/:id" element={<CadastroTipoEvento />} />

        <Route path="/private/trauma" element={<ListaTiposTrauma />} />
        <Route path="/private/trauma/nova" element={<CadastroTipoTrauma />} />
        <Route path="/private/trauma/editar/:id" element={<CadastroTipoTrauma />} />

        <Route path="/private/atendimento" element={<ListaTiposAtendimento />} />
        <Route path="/private/atendimento/nova" element={<CadastroTipoAtendimento />} />
        <Route path="/private/atendimento/editar/:id" element={<CadastroTipoAtendimento />} />

        <Route path="/private/hipotese-diagnostica" element={<ListaTiposHipoteseDiag />} />
        <Route path="/private/hipotese-diagnostica/nova" element={<CadastroTipoHipoteseDiag />} />
        <Route path="/private/hipotese-diagnostica/editar/:id" element={<CadastroTipoHipoteseDiag />} />

        <Route path="/private/sintoma" element={<ListaTiposSintoma />} />
        <Route path="/private/sintoma/nova" element={<CadastroTipoSintoma />} />
        <Route path="/private/sintoma/editar/:id" element={<CadastroTipoSintoma />} />

        <Route path="/private/componente" element={<ListaComponentes />} />
        <Route path="/private/componente/nova" element={<CadastroComponente />} />
        <Route path="/private/componente/editar/:id" element={<CadastroComponente />} />

        <Route path="/private/tipo-estabelecimentos/lista" element={<ListaEstabelecimentos />} />

        <Route path="/private/relatorio-estabelecimentos" element={<RelatorioEstabelecimento />} />
        <Route path="/private/relatorio-estabelecimentos/nova" element={<QualificarEstabelecimentos />} />
        <Route path="/private/relatorio-estabelecimentos/editar/:id" element={<QualificarEstabelecimentos />} />

        <Route element={<ProtectedRoute requiredRoles={['notificador']} requiredGroups={['/grupo_notificador']}><Outlet /></ProtectedRoute>}>
          <Route path="/private/pacientes/nova" element={<FormularioPaciente />} />
          <Route path="/private/pacientes/editar/:id" element={<FormularioPaciente />} />
          <Route path="/private/comunicacao-de-caso" element={<ListaNotificacoes />} />
          <Route path="/private/comunicacao-de-caso/nova" element={<NotificationForm />} />
          <Route path="/private/comunicacao-de-caso/editar/:id" element={<NotificationForm />} />
        </Route>

        <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          <Route path="/private/formularios" element={<FormsListPage />} />
          <Route
            path="/private/formularios/:id/permissoes"
            element={
              <ProtectedRoute>
                <FormShareSinanSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/private/formularios/:agravo/relatorio/*" element={<MonitorOperRegionalReportPage />} />
          <Route path="/private/formularios/:agravo" element={<FormSubmissionsListPage />} />
          <Route path="/private/formularios/:agravo/imprimir/:id" element={<DynamicFormPrintPage />} />
          <Route path="/private/formularios/:agravo/imprimir" element={<DynamicFormPrintPage />} />
          <Route path="/private/formularios/:agravo/nova" element={<DynamicFormPage />} />
          <Route path="/private/formularios/:agravo/editar/:id" element={<DynamicFormPage />} />
          <Route path="/private/formularios/:agravo/visualizar/:id" element={<DynamicFormPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredRoles={['admin']}><Outlet /></ProtectedRoute>}>
          <Route path="/private/formularios-admin" element={<FormAdminListPage />} />
          <Route path="/private/formularios-admin/novo" element={<FormBuilderPage />} />
          <Route path="/private/formularios-admin/editar/:id" element={<FormBuilderPage />} />
          <Route
            path="/private/formularios-admin/:formId/versoes/:versionId/campos-fixos"
            element={<FixedColumnsConfigPage />}
          />
          <Route path="/private/formularios-admin/:id/compartilhar" element={<FormShareSinanSettingsPage />} />
          <Route path="/private/formularios-admin/respostas/:id" element={<FormResponsesPage />} />
          <Route path="/private/formularios-admin/respostas/:id/resumo" element={<FormResponsesSummaryPage />} />
        </Route>

        <Route path="/private/meus-formularios" element={<MyFormsPage />} />
        <Route path="/private/meus-formularios/novo" element={<FormBuilderPage />} />
        <Route path="/private/meus-formularios/:id/compartilhar" element={<FormShareSettingsPage />} />
        <Route path="/private/meus-formularios/:id/editar" element={<FormBuilderPage />} />
        <Route path="/private/meus-formularios/:id/respostas" element={<FormResponsesPage />} />
        <Route path="/private/meus-formularios/:id/respostas/resumo" element={<FormResponsesSummaryPage />} />

        <Route element={<ProtectedRoute requiredRoles={['admin']}><Outlet /></ProtectedRoute>}>
          <Route path="/private/pacientes" element={<ListaPacientes />} />
        </Route>

        <Route element={<ProtectedRoute requiredRoles={['comunicacao.dae', 'admin', 'admin.estado', 'admin.crs']}><Outlet /></ProtectedRoute>}>
          <Route path="/private/comunicacao-dae" element={<ComunicacaoDaePage />} />
          <Route path="/private/comunicacao-dae/dashboard" element={<ComunicacaoDaeDashboard />} />
          <Route path="/private/comunicacao-dae/nova" element={<ComunicacaoDaeFormPage />} />
          <Route path="/private/comunicacao-dae/:id" element={<ComunicacaoDaeFormPage />} />
          <Route path="/private/comunicacao-dae/editar/:id" element={<ComunicacaoDaeFormPage />} />

          <Route path="/private/apps/comunicacao-dae/dae" element={<DaePage />} />
          <Route path="/private/apps/comunicacao-dae/dae/:id" element={<DaePage />} />
          <Route path="/private/apps/comunicacao-dae/nhe" element={<NhePage />} />
          <Route path="/private/apps/comunicacao-dae/nhe/:id" element={<NhePage />} />
          <Route path="/private/apps/comunicacao-dae/cievs" element={<CievsPage />} />
          <Route path="/private/apps/comunicacao-dae/cievs/:id" element={<CievsPage />} />
          <Route path="/private/apps/comunicacao-dae/crs" element={<CrsPage />} />
          <Route path="/private/apps/comunicacao-dae/crs/:id" element={<CrsPage />} />
        </Route>
      </Route>

      <Route path="/perfil" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/logout" element={<ProtectedRoute><LogoutConfirmation /></ProtectedRoute>} />
    </>
  );
};

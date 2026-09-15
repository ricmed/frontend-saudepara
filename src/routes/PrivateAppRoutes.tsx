import { Outlet, Route } from 'react-router-dom';
import ProtectedRoute from '@/keycloak/ProtectedRoute';
import { lazyNamed, lazyPage } from '@/routes/lazyPage';

const UserProfile = lazyPage(() => import('@/keycloak/pages/UserProfile'));
const LogoutConfirmation = lazyPage(
  () => import('@/keycloak/pages/LogoutConfirmation'),
);
const PaginaAppsAuxiliares = lazyPage(
  () => import('@/features/apps/components/PaginaAppsAuxiliares'),
);
const PaginaEscolhaAppsAuxiliares = lazyPage(
  () => import('@/features/apps/components/PaginaEscolhaAppsAuxiliares'),
);
const PaginaAppsAuxiliaresDae = lazyPage(
  () => import('@/features/apps/components/PaginaAppsAuxiliaresDae'),
);
const ListaComponentes = lazyPage(
  () => import('@/features/apps/list/ListaComponentes'),
);
const CadastroComponente = lazyPage(
  () => import('@/features/apps/components/CadastroComponente'),
);
const ListaTiposEncerramento = lazyPage(
  () => import('@/features/apps/list/ListaTipoEncerramento'),
);
const CadastroTipoEncerramento = lazyPage(
  () => import('@/features/apps/components/CadastroEncerramento'),
);
const ListaTiposPublico = lazyPage(
  () => import('@/features/apps/list/ListaPublico'),
);
const CadastroTipoPublico = lazyPage(
  () => import('@/features/apps/components/CadastroPublico'),
);
const ListaTiposEvento = lazyPage(
  () => import('@/features/apps/list/ListaEvento'),
);
const CadastroTipoEvento = lazyPage(
  () => import('@/features/apps/components/CadastroEvento'),
);
const ListaTiposTrauma = lazyPage(
  () => import('@/features/apps/list/ListaTrauma'),
);
const CadastroTipoTrauma = lazyPage(
  () => import('@/features/apps/components/CadastroTrauma'),
);
const ListaTiposAtendimento = lazyPage(
  () => import('@/features/apps/list/ListaAtendimento'),
);
const CadastroTipoAtendimento = lazyPage(
  () => import('@/features/apps/components/CadastroAtendimento'),
);
const ListaTiposHipoteseDiag = lazyPage(
  () => import('@/features/apps/list/ListaHipoteseDiag'),
);
const CadastroTipoHipoteseDiag = lazyPage(
  () => import('@/features/apps/components/CadastroHipoteseDiag'),
);
const ListaTiposSintoma = lazyPage(
  () => import('@/features/apps/list/ListaSintoma'),
);
const CadastroTipoSintoma = lazyPage(
  () => import('@/features/apps/components/CadastroSintoma'),
);
const RelatorioQualificacao = lazyPage(
  () => import('@/features/apps/list/ListaQualificacao'),
);
const CadastroQualificacao = lazyPage(
  () => import('@/features/apps/components/CadastroQualificacao'),
);
const ListaHabilitacoes = lazyPage(
  () => import('@/features/apps/list/ListaHabilitacoes'),
);
const CadastroHabilitacao = lazyPage(
  () => import('@/features/apps/components/CadastroHabilitacao'),
);
const ListaEstabelecimentos = lazyPage(
  () => import('@/features/apps/list/ListaEstabelecimentos'),
);
const CadastroEstabelecimento = lazyPage(
  () => import('@/features/apps/components/CadastroTipoEstabelecimento'),
);
const ListaTurnos = lazyPage(() => import('@/features/apps/list/ListaTurno'));
const CadastroTurno = lazyPage(
  () => import('@/features/apps/components/CadastroTurno'),
);
const ListaNaturezas = lazyPage(
  () => import('@/features/apps/list/ListaNatureza'),
);
const CadastroNatureza = lazyPage(
  () => import('@/features/apps/components/CadastroNatureza'),
);
const ListaRacas = lazyPage(() => import('@/features/apps/list/ListaRaca'));
const CadastroRaca = lazyPage(
  () => import('@/features/apps/components/CadastroRaca'),
);
const ListaCBO = lazyPage(() => import('@/features/apps/list/ListaCBO'));
const CadastroCBO = lazyPage(
  () => import('@/features/apps/components/CadastroCBO'),
);
const ListaEscolaridade = lazyPage(
  () => import('@/features/apps/list/ListaEscolaridade'),
);
const CadastroEscolaridade = lazyPage(
  () => import('@/features/apps/components/CadastroEscolaridade'),
);
const ListaEstados = lazyPage(
  () => import('@/features/apps/list/ListaEstados'),
);
const CadastroEstado = lazyPage(
  () => import('@/features/apps/components/CadastroEstado'),
);
const ListaMunicipios = lazyPage(
  () => import('@/features/apps/list/ListaMunicipios'),
);
const CadastroMunicipio = lazyPage(
  () => import('@/features/apps/components/CadastroMunicipio'),
);
const ListaPaises = lazyPage(() => import('@/features/apps/list/ListaPaises'));
const CadastroPais = lazyPage(
  () => import('@/features/apps/components/CadastroPais'),
);
const ListaGeneros = lazyPage(
  () => import('@/features/apps/list/ListaGenero'),
);
const CadastroGenero = lazyPage(
  () => import('@/features/apps/components/CadastroGenero'),
);
const ListaBairros = lazyPage(() => import('@/features/apps/list/ListaBairro'));
const CadastroBairro = lazyPage(
  () => import('@/features/apps/components/CadastroBairro'),
);
const FormularioPaciente = lazyPage(
  () => import('@/features/paginaPacientesComu/components/FormularioPaciente'),
);
const ListaPacientes = lazyPage(
  () => import('@/features/paginaPacientesComu/components/ListaPacientes'),
);
const OfflineManagementPage = lazyPage(
  () => import('@/features/offlinePage/pages/OfflineManagementPage'),
);
const RelatorioEstabelecimento = lazyPage(
  () => import('@/features/list/views/RelatorioEstabelecimento'),
);
const QualificarEstabelecimentos = lazyPage(
  () => import('@/features/forms/EstablishmentForm'),
);
const DaePage = lazyPage(() => import('@/features/comunicacao-dae/DaePage'));
const NhePage = lazyPage(() => import('@/features/comunicacao-dae/NhePage'));
const CievsPage = lazyPage(() => import('@/features/comunicacao-dae/CievsPage'));
const CrsPage = lazyPage(() => import('@/features/comunicacao-dae/CrsPage'));

const DynamicFormPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/DynamicFormPage'),
  'DynamicFormPage',
);
const DynamicFormPrintPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/DynamicFormPrintPage'),
  'DynamicFormPrintPage',
);
const FormsListPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/FormsListPage'),
  'FormsListPage',
);
const FormBuilderPage = lazyPage(
  () => import('@/features/dynamic-forms/pages/FormBuilderPage'),
);
const FixedColumnsConfigPage = lazyPage(
  () => import('@/features/dynamic-forms/pages/FixedColumnsConfigPage'),
);
const FormAdminListPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/FormAdminListPage'),
  'FormAdminListPage',
);
const FormSubmissionsListPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/FormSubmissionsListPage'),
  'FormSubmissionsListPage',
);
const MonitorOperRegionalReportPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/MonitorOperRegionalReportPage'),
  'MonitorOperRegionalReportPage',
);
const FormResponsesPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/FormResponsesPage'),
  'FormResponsesPage',
);
const FormResponsesSummaryPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/FormResponsesSummaryPage'),
  'FormResponsesSummaryPage',
);
const MyFormsPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/MyFormsPage'),
  'MyFormsPage',
);
const FormShareSettingsPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/FormShareSettingsPage'),
  'FormShareSettingsPage',
);
const FormShareSinanSettingsPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/FormShareSinanSettingsPage'),
  'FormShareSinanSettingsPage',
);
const EntomologiaLarvasDashboardPage = lazyPage(
  () => import('@/features/dynamic-forms/pages/EntomologiaLarvasDashboardPage'),
);

const ListaNotificacoes = lazyPage(
  () => import('@/features/notificationForms/ListaNotificacoes'),
);
const NotificationForm = lazyPage(
  () => import('@/features/notificationForms/NotificationForm'),
);
const ComunicacaoDaePage = lazyPage(
  () => import('@/features/comunicacao-dae/ComunicacaoDaePage'),
);
const ComunicacaoDaeDashboard = lazyPage(
  () => import('@/features/comunicacao-dae/ComunicacaoDaeDashboard'),
);
const ComunicacaoDaeFormPage = lazyPage(
  () => import('@/features/comunicacao-dae/ComunicacaoDaeFormPage'),
);
const HepatiteCriancaHbvDashboardPage = lazyPage(
  () =>
    import(
      '@/features/dynamic-forms/hepatite-crianca-hbv/HepatiteCriancaHbvDashboardPage'
    ),
);

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
        <Route
          path="/private/escolha-apps-auxiliares"
          element={<PaginaEscolhaAppsAuxiliares />}
        />
        <Route path="/private/apps-auxiliares" element={<PaginaAppsAuxiliares />} />
        <Route
          path="/private/apps-auxiliares-dae"
          element={<PaginaAppsAuxiliaresDae />}
        />
        <Route
          path="/private/offline-management"
          element={<OfflineManagementPage />}
        />

        <Route path="/private/qualificacao" element={<RelatorioQualificacao />} />
        <Route path="/private/qualificacao/nova" element={<CadastroQualificacao />} />
        <Route
          path="/private/qualificacao/editar/:id"
          element={<CadastroQualificacao />}
        />

        <Route path="/private/habilitacao" element={<ListaHabilitacoes />} />
        <Route path="/private/habilitacao/nova" element={<CadastroHabilitacao />} />
        <Route
          path="/private/habilitacao/editar/:id"
          element={<CadastroHabilitacao />}
        />

        <Route
          path="/private/tipo-estabelecimentos"
          element={<RelatorioEstabelecimento />}
        />
        <Route
          path="/private/tipo-estabelecimentos/nova"
          element={<CadastroEstabelecimento />}
        />
        <Route
          path="/private/tipo-estabelecimentos/editar/:id"
          element={<CadastroEstabelecimento />}
        />

        <Route path="/private/turnos" element={<ListaTurnos />} />
        <Route path="/private/turnos/nova" element={<CadastroTurno />} />
        <Route path="/private/turnos/editar/:id" element={<CadastroTurno />} />

        <Route path="/private/naturezas" element={<ListaNaturezas />} />
        <Route path="/private/naturezas/nova" element={<CadastroNatureza />} />
        <Route
          path="/private/naturezas/editar/:id"
          element={<CadastroNatureza />}
        />

        <Route path="/private/raca" element={<ListaRacas />} />
        <Route path="/private/raca/nova" element={<CadastroRaca />} />
        <Route path="/private/raca/editar/:id" element={<CadastroRaca />} />

        <Route path="/private/cbo" element={<ListaCBO />} />
        <Route path="/private/cbo/nova" element={<CadastroCBO />} />
        <Route path="/private/cbo/editar/:id" element={<CadastroCBO />} />

        <Route path="/private/escolaridade" element={<ListaEscolaridade />} />
        <Route
          path="/private/escolaridade/nova"
          element={<CadastroEscolaridade />}
        />
        <Route
          path="/private/escolaridade/editar/:id"
          element={<CadastroEscolaridade />}
        />

        <Route path="/private/estado" element={<ListaEstados />} />
        <Route path="/private/estado/nova" element={<CadastroEstado />} />
        <Route path="/private/estado/editar/:id" element={<CadastroEstado />} />

        <Route path="/private/municipio" element={<ListaMunicipios />} />
        <Route path="/private/municipio/nova" element={<CadastroMunicipio />} />
        <Route
          path="/private/municipio/editar/:id"
          element={<CadastroMunicipio />}
        />

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
        <Route
          path="/private/encerramento/nova"
          element={<CadastroTipoEncerramento />}
        />
        <Route
          path="/private/encerramento/editar/:id"
          element={<CadastroTipoEncerramento />}
        />

        <Route path="/private/publico" element={<ListaTiposPublico />} />
        <Route path="/private/publico/nova" element={<CadastroTipoPublico />} />
        <Route
          path="/private/publico/editar/:id"
          element={<CadastroTipoPublico />}
        />

        <Route path="/private/evento" element={<ListaTiposEvento />} />
        <Route path="/private/evento/nova" element={<CadastroTipoEvento />} />
        <Route
          path="/private/evento/editar/:id"
          element={<CadastroTipoEvento />}
        />

        <Route path="/private/trauma" element={<ListaTiposTrauma />} />
        <Route path="/private/trauma/nova" element={<CadastroTipoTrauma />} />
        <Route
          path="/private/trauma/editar/:id"
          element={<CadastroTipoTrauma />}
        />

        <Route path="/private/atendimento" element={<ListaTiposAtendimento />} />
        <Route
          path="/private/atendimento/nova"
          element={<CadastroTipoAtendimento />}
        />
        <Route
          path="/private/atendimento/editar/:id"
          element={<CadastroTipoAtendimento />}
        />

        <Route
          path="/private/hipotese-diagnostica"
          element={<ListaTiposHipoteseDiag />}
        />
        <Route
          path="/private/hipotese-diagnostica/nova"
          element={<CadastroTipoHipoteseDiag />}
        />
        <Route
          path="/private/hipotese-diagnostica/editar/:id"
          element={<CadastroTipoHipoteseDiag />}
        />

        <Route path="/private/sintoma" element={<ListaTiposSintoma />} />
        <Route path="/private/sintoma/nova" element={<CadastroTipoSintoma />} />
        <Route
          path="/private/sintoma/editar/:id"
          element={<CadastroTipoSintoma />}
        />

        <Route path="/private/componente" element={<ListaComponentes />} />
        <Route path="/private/componente/nova" element={<CadastroComponente />} />
        <Route
          path="/private/componente/editar/:id"
          element={<CadastroComponente />}
        />

        <Route
          path="/private/tipo-estabelecimentos/lista"
          element={<ListaEstabelecimentos />}
        />

        <Route
          path="/private/relatorio-estabelecimentos"
          element={<RelatorioEstabelecimento />}
        />
        <Route
          path="/private/relatorio-estabelecimentos/nova"
          element={<QualificarEstabelecimentos />}
        />
        <Route
          path="/private/relatorio-estabelecimentos/editar/:id"
          element={<QualificarEstabelecimentos />}
        />

        <Route
          element={
            <ProtectedRoute
              requiredRoles={['notificador']}
              requiredGroups={['/grupo_notificador']}
            >
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/private/pacientes/nova" element={<FormularioPaciente />} />
          <Route
            path="/private/pacientes/editar/:id"
            element={<FormularioPaciente />}
          />
          <Route
            path="/private/comunicacao-de-caso"
            element={<ListaNotificacoes />}
          />
          <Route
            path="/private/comunicacao-de-caso/nova"
            element={<NotificationForm />}
          />
          <Route
            path="/private/comunicacao-de-caso/editar/:id"
            element={<NotificationForm />}
          />
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
          <Route
            path="/private/entomologia-larvas"
            element={<EntomologiaLarvasDashboardPage />}
          />
          <Route
            path="/private/formularios/:agravo/relatorio/*"
            element={<MonitorOperRegionalReportPage />}
          />
          <Route
            path="/private/formularios/:agravo/dashboard"
            element={<HepatiteCriancaHbvDashboardPage />}
          />
          <Route
            path="/private/formularios/:agravo"
            element={<FormSubmissionsListPage />}
          />
          <Route
            path="/private/formularios/:agravo/imprimir/:id"
            element={<DynamicFormPrintPage />}
          />
          <Route
            path="/private/formularios/:agravo/imprimir"
            element={<DynamicFormPrintPage />}
          />
          <Route
            path="/private/formularios/:agravo/nova"
            element={<DynamicFormPage />}
          />
          <Route
            path="/private/formularios/:agravo/editar/:id"
            element={<DynamicFormPage />}
          />
          <Route
            path="/private/formularios/:agravo/visualizar/:id"
            element={<DynamicFormPage />}
          />
        </Route>

        <Route
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route
            path="/private/formularios-admin"
            element={<FormAdminListPage />}
          />
          <Route
            path="/private/formularios-admin/novo"
            element={<FormBuilderPage />}
          />
          <Route
            path="/private/formularios-admin/editar/:id"
            element={<FormBuilderPage />}
          />
          <Route
            path="/private/formularios-admin/:formId/versoes/:versionId/campos-fixos"
            element={<FixedColumnsConfigPage />}
          />
          <Route
            path="/private/formularios-admin/:id/compartilhar"
            element={<FormShareSinanSettingsPage />}
          />
          <Route
            path="/private/formularios-admin/respostas/:id"
            element={<FormResponsesPage />}
          />
          <Route
            path="/private/formularios-admin/respostas/:id/resumo"
            element={<FormResponsesSummaryPage />}
          />
        </Route>

        <Route path="/private/meus-formularios" element={<MyFormsPage />} />
        <Route path="/private/meus-formularios/novo" element={<FormBuilderPage />} />
        <Route
          path="/private/meus-formularios/:id/compartilhar"
          element={<FormShareSettingsPage />}
        />
        <Route
          path="/private/meus-formularios/:id/editar"
          element={<FormBuilderPage />}
        />
        <Route
          path="/private/meus-formularios/:id/respostas"
          element={<FormResponsesPage />}
        />
        <Route
          path="/private/meus-formularios/:id/respostas/resumo"
          element={<FormResponsesSummaryPage />}
        />

        <Route
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/private/pacientes" element={<ListaPacientes />} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              requiredRoles={[
                'comunicacao.dae',
                'admin',
                'admin.estado',
                'admin.crs',
              ]}
            >
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route
            path="/private/comunicacao-dae"
            element={<ComunicacaoDaePage />}
          />
          <Route
            path="/private/comunicacao-dae/dashboard"
            element={<ComunicacaoDaeDashboard />}
          />
          <Route
            path="/private/comunicacao-dae/nova"
            element={<ComunicacaoDaeFormPage />}
          />
          <Route
            path="/private/comunicacao-dae/:id"
            element={<ComunicacaoDaeFormPage />}
          />
          <Route
            path="/private/comunicacao-dae/editar/:id"
            element={<ComunicacaoDaeFormPage />}
          />

          <Route path="/private/apps/comunicacao-dae/dae" element={<DaePage />} />
          <Route
            path="/private/apps/comunicacao-dae/dae/:id"
            element={<DaePage />}
          />
          <Route path="/private/apps/comunicacao-dae/nhe" element={<NhePage />} />
          <Route
            path="/private/apps/comunicacao-dae/nhe/:id"
            element={<NhePage />}
          />
          <Route
            path="/private/apps/comunicacao-dae/cievs"
            element={<CievsPage />}
          />
          <Route
            path="/private/apps/comunicacao-dae/cievs/:id"
            element={<CievsPage />}
          />
          <Route path="/private/apps/comunicacao-dae/crs" element={<CrsPage />} />
          <Route
            path="/private/apps/comunicacao-dae/crs/:id"
            element={<CrsPage />}
          />
        </Route>
      </Route>

      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logout"
        element={
          <ProtectedRoute>
            <LogoutConfirmation />
          </ProtectedRoute>
        }
      />
    </>
  );
};

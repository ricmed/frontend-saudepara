import { Navigate, Route } from 'react-router-dom';
import ProtectedRoute from '@/keycloak/ProtectedRoute';
import { lazyNamed, lazyPage } from '@/routes/lazyPage';

// --- Páginas já lazy / a tornar lazy (fora do bundle da home) ---
const AdminRoutes = lazyPage(() => import('@/keycloak/admin/AdminRoutes'));
const MapaLocais = lazyPage(() => import('@/features/maps/google'));
const MapaPage = lazyPage(() => import('@/features/maps/MapaPage'));
const MapaLeaflet = lazyPage(() => import('@/features/maps/leaflet/MapaLeaflet'));
const HealthCampaignsPage = lazyPage(
  () => import('@/features/campaigns/pages/HealthCampaignsPage'),
);
const DezembroVermelho = lazyPage(
  () => import('@/features/campaigns/pages/details/RedDecemberPage'),
);
const SetembroVerde = lazyPage(
  () => import('@/features/campaigns/pages/details/GreenSeptemberPage'),
);
const SetembroAmarelo = lazyPage(
  () => import('@/features/campaigns/pages/details/YellowSeptemberPage'),
);
const NovembroAzul = lazyPage(
  () => import('@/features/campaigns/pages/details/BlueNovemberPage'),
);
const JaneiroRoxoPage = lazyPage(
  () => import('@/features/campaigns/pages/details/JaneiroRoxoPage'),
);
const GoldenAugustPage = lazyPage(
  () => import('@/features/campaigns/pages/details/GoldenAugustPage'),
);
const EducationalMaterialsPage = lazyPage(
  () => import('@/features/educational-materials/pages/EducationalMaterialsPage'),
);
const OralHealthPage = lazyPage(
  () => import('@/features/educational-materials/pages/details/OralHealthPage'),
);
const AntiSmokingPage = lazyPage(
  () => import('@/features/educational-materials/pages/details/AntiSmokingPage'),
);
const CDCNTPage = lazyPage(
  () => import('@/features/educational-materials/pages/details/CDCNTPage'),
);
const ChildrensHealthPage = lazyPage(
  () =>
    import('@/features/educational-materials/pages/details/ChildrensHealthPage'),
);
const SexualViolencePage = lazyPage(
  () =>
    import('@/features/educational-materials/pages/details/SexualViolencePage'),
);
const HIVPreventionPage = lazyPage(
  () =>
    import('@/features/educational-materials/pages/details/HIVPreventionPage'),
);
const LeprosyPage = lazyPage(
  () => import('@/features/educational-materials/pages/details/LeprosyPage'),
);
const TuberculosisPage = lazyPage(
  () =>
    import('@/features/educational-materials/pages/details/TuberculosisPage'),
);
const HIVMandalaPage = lazyPage(
  () => import('@/features/educational-materials/pages/details/HIVMandalaPage'),
);
const MPOXPage = lazyPage(
  () => import('@/features/educational-materials/pages/details/MPOXPage'),
);
const WomensHealthPage = lazyPage(
  () =>
    import('@/features/educational-materials/pages/details/WomensHealthPage'),
);
const SyphilisPage = lazyPage(
  () => import('@/features/educational-materials/pages/details/SyphilisPage'),
);
const HomePage = lazyPage(() => import('@/features/home/HomePage'));
const FaleConoscoPage = lazyPage(
  () => import('@/features/contact/FaleConoscoPage'),
);
const AscomPage = lazyPage(() => import('@/features/contact/AscomPage'));
const OuvidoriaPage = lazyPage(
  () => import('@/features/contact/OuvidoriaPage'),
);
const PublicDynamicFormPage = lazyNamed(
  () => import('@/features/dynamic-forms/pages/PublicDynamicFormPage'),
  'PublicDynamicFormPage',
);
const QrCodeGeneratorPage = lazyPage(
  () => import('@/features/qrcode/pages/QrCodeGeneratorPage'),
);

const ChatAdminDashboard = lazyPage(
  () => import('@/features/chat/pages/ChatAdminDashboard'),
);
const DesktopPage = lazyPage(() => import('@/features/desktop/DesktopPage'));
const DashboardPageCirio = lazyPage(
  () => import('@/features/dashboard/DashboardPageCirio'),
);
const LoginPage = lazyPage(() => import('@/features/auth/pages/LoginPage'));
const OfflineLoginPage = lazyPage(
  () => import('@/features/auth/pages/OfflineLoginPage'),
);
const AccessDeniedPage = lazyPage(
  () => import('@/features/auth/pages/AccessDeniedPage'),
);
const VersionPage = lazyPage(() => import('@/features/info/pages/VersionPage'));
const ValidacaoCientificaPage = lazyPage(
  () => import('@/features/info/pages/ValidacaoCientificaPage'),
);

// TODO(reativar ObservaSUS): lazy + rotas abaixo
// ObservaSUS permanece desativado — ver spec performance e notas ObservaSUS.

export const getPublicAppRoutes = () => {
  return (
    <>
      <Route path="/" element={<DesktopPage />} />
      <Route path="/teste" element={<HomePage />} />
      <Route path="/gerador-qrcode" element={<QrCodeGeneratorPage />} />
      <Route path="/f/:slug" element={<PublicDynamicFormPage />} />
      <Route path="/mapa" element={<MapaLeaflet />} />
      <Route path="/mapa-google" element={<MapaPage />} />
      <Route
        path="/mapa-google/fullscreen"
        element={<MapaPage fullScreen={true} />}
      />
      <Route path="/mapa-original" element={<MapaLocais />} />
      <Route path="/mapa-leaflet" element={<MapaLeaflet />} />
      <Route path="/campanhas" element={<HealthCampaignsPage />} />

      <Route path="/dashboard" element={<Navigate to="/dashboard-page" replace />} />
      <Route
        path="/dashboard-page"
        element={
          <ProtectedRoute requiredRoles={['notificador', 'dashboard']}>
            <DashboardPageCirio />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard-normal"
        element={<Navigate to="/dashboard-page" replace />}
      />

      <Route path="/setembro-verde" element={<SetembroVerde />} />
      <Route path="/setembro-amarelo" element={<SetembroAmarelo />} />
      <Route path="/agosto-dourado" element={<GoldenAugustPage />} />
      <Route path="/janeiro-roxo" element={<JaneiroRoxoPage />} />
      <Route path="/campanha-dezembro-vermelho" element={<DezembroVermelho />} />
      <Route path="/campanha-novembro-azul" element={<NovembroAzul />} />

      <Route path="/materiais-educativos" element={<EducationalMaterialsPage />} />
      <Route path="/material-saude-bucal" element={<OralHealthPage />} />
      <Route path="/material-anti-tabagismo" element={<AntiSmokingPage />} />
      <Route path="/material-cdcnt" element={<CDCNTPage />} />
      <Route path="/material-saude-crianca" element={<ChildrensHealthPage />} />
      <Route path="/material-violencia-sexual" element={<SexualViolencePage />} />
      <Route path="/material-prevencao-hiv" element={<HIVPreventionPage />} />
      <Route path="/material-hanseniase" element={<LeprosyPage />} />
      <Route path="/material-tuberculose" element={<TuberculosisPage />} />
      <Route path="/material-mandala-hiv" element={<HIVMandalaPage />} />
      <Route path="/material-mpox" element={<MPOXPage />} />
      <Route path="/material-saude-mulher" element={<WomensHealthPage />} />
      <Route path="/material-sifilis" element={<SyphilisPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/offline-login" element={<OfflineLoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="/fale-conosco" element={<FaleConoscoPage />} />
      <Route path="/fale-conosco/ascom" element={<AscomPage />} />
      <Route path="/fale-conosco/ouvidoria" element={<OuvidoriaPage />} />
      <Route path="/versao" element={<VersionPage />} />

      <Route
        path="/validacao-cientifica"
        element={
          <ProtectedRoute>
            <ValidacaoCientificaPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/chat-suporte"
        element={
          <ProtectedRoute>
            <ChatAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/admin/*" element={<AdminRoutes />} />
    </>
  );
};

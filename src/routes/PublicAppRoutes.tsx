import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import AdminRoutes from '@/keycloak/admin/AdminRoutes';
import ProtectedRoute from '@/keycloak/ProtectedRoute';
import MapaLocais from '@/features/maps/google';
import MapaPage from '@/features/maps/MapaPage';
import MapaLeaflet from '@/features/maps/leaflet/MapaLeaflet';
import HealthCampaignsPage from '@/features/campaigns/pages/HealthCampaignsPage';
import DezembroVermelho from '@/features/campaigns/pages/details/RedDecemberPage';
import SetembroVerde from '@/features/campaigns/pages/details/GreenSeptemberPage';
import SetembroAmarelo from '@/features/campaigns/pages/details/YellowSeptemberPage';
import NovembroAzul from '@/features/campaigns/pages/details/BlueNovemberPage';
import JaneiroRoxoPage from '@/features/campaigns/pages/details/JaneiroRoxoPage';
import GoldenAugustPage from '@/features/campaigns/pages/details/GoldenAugustPage';
import EducationalMaterialsPage from '@/features/educational-materials/pages/EducationalMaterialsPage';
import OralHealthPage from '@/features/educational-materials/pages/details/OralHealthPage';
import AntiSmokingPage from '@/features/educational-materials/pages/details/AntiSmokingPage';
import CDCNTPage from '@/features/educational-materials/pages/details/CDCNTPage';
import ChildrensHealthPage from '@/features/educational-materials/pages/details/ChildrensHealthPage';
import SexualViolencePage from '@/features/educational-materials/pages/details/SexualViolencePage';
import HIVPreventionPage from '@/features/educational-materials/pages/details/HIVPreventionPage';
import LeprosyPage from '@/features/educational-materials/pages/details/LeprosyPage';
import TuberculosisPage from '@/features/educational-materials/pages/details/TuberculosisPage';
import HIVMandalaPage from '@/features/educational-materials/pages/details/HIVMandalaPage';
import MPOXPage from '@/features/educational-materials/pages/details/MPOXPage';
import WomensHealthPage from '@/features/educational-materials/pages/details/WomensHealthPage';
import SyphilisPage from '@/features/educational-materials/pages/details/SyphilisPage';
import HomePage from '@/features/home/HomePage';
import FaleConoscoPage from '@/features/contact/FaleConoscoPage';
import AscomPage from '@/features/contact/AscomPage';
import OuvidoriaPage from '@/features/contact/OuvidoriaPage';
import { PublicDynamicFormPage } from '@/features/dynamic-forms/pages/PublicDynamicFormPage';

const ChatAdminDashboard = lazy(() => import('@/features/chat/pages/ChatAdminDashboard'));
const DesktopPage = lazy(() => import('@/features/desktop/DesktopPage'));
const DashboardPageCirio = lazy(() => import('@/features/dashboard/DashboardPageCirio'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const OfflineLoginPage = lazy(() => import('@/features/auth/pages/OfflineLoginPage'));
const AccessDeniedPage = lazy(() => import('@/features/auth/pages/AccessDeniedPage'));
const VersionPage = lazy(() => import('@/features/info/pages/VersionPage'));
const ValidacaoCientificaPage = lazy(() => import('@/features/info/pages/ValidacaoCientificaPage'));

export const getPublicAppRoutes = () => {
  return (
    <>
      <Route path="/" element={<DesktopPage />} />
      <Route path="/teste" element={<HomePage />} />
      <Route path="/f/:slug" element={<PublicDynamicFormPage />} />
      <Route path="/mapa" element={<MapaLeaflet />} />
      <Route path="/mapa-google" element={<MapaPage />} />
      <Route path="/mapa-google/fullscreen" element={<MapaPage fullScreen={true} />} />
      <Route path="/mapa-original" element={<MapaLocais />} />
      <Route path="/mapa-leaflet" element={<MapaLeaflet />} />
      <Route path="/campanhas" element={<HealthCampaignsPage />} />

      <Route path="/dashboard" element={<Navigate to="/dashboard-page" replace />} />
      <Route path="/dashboard-page" element={<ProtectedRoute requiredRoles={['notificador', 'dashboard']}><DashboardPageCirio /></ProtectedRoute>} />
      <Route path="/dashboard-normal" element={<Navigate to="/dashboard-page" replace />} />

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

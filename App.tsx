import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import AdminRoutes from "@/keycloak/admin/AdminRoutes";
import ChatAdminDashboard from "@/features/chat/pages/ChatAdminDashboard";
import { useEffect } from 'react';
import indexedDBService from '@/services/indexedDB';
import syncService from '@/services/syncService';

import MapaLocais from "@/features/maps/google";
import MapaPage from "@/features/maps/MapaPage";
import MapaLeaflet from "@/features/maps/leaflet/MapaLeaflet";
import AccessDenied from "@/paginas/AccessDenied";
import HealthCampaignsPage from "@/features/campaigns/pages/HealthCampaignsPage";
import ProtectedRoute from "@/keycloak/ProtectedRoute";
import DesktopPage from "@/features/desktop/DesktopPage";
import UserProfile from "@/keycloak/pages/UserProfile";
import LogoutConfirmation from "@/keycloak/pages/LogoutConfirmation";
import NotificationDashboard from "@/features/dashboard/NotificationDashboard";
// Features - Campanhas
import DezembroVermelho from "@/features/campaigns/pages/details/RedDecemberPage";
import SetembroVerde from "@/features/campaigns/pages/details/GreenSeptemberPage";
import SetembroAmarelo from "@/features/campaigns/pages/details/YellowSeptemberPage";
import NovembroAzul from "@/features/campaigns/pages/details/BlueNovemberPage";
import JaneiroRoxoPage from "@/features/campaigns/pages/details/JaneiroRoxoPage";
import GoldenAugustPage from "@/features/campaigns/pages/details/GoldenAugustPage";
// Features - Materiais Educativos
import EducationalMaterialsPage from "@/features/educational-materials/pages/EducationalMaterialsPage";
import OralHealthPage from "@/features/educational-materials/pages/details/OralHealthPage";
import AntiSmokingPage from "@/features/educational-materials/pages/details/AntiSmokingPage";
import CDCNTPage from "@/features/educational-materials/pages/details/CDCNTPage";
import ChildrensHealthPage from "@/features/educational-materials/pages/details/ChildrensHealthPage";
import SexualViolencePage from "@/features/educational-materials/pages/details/SexualViolencePage";
import HIVPreventionPage from "@/features/educational-materials/pages/details/HIVPreventionPage";
import LeprosyPage from "@/features/educational-materials/pages/details/LeprosyPage";
import TuberculosisPage from "@/features/educational-materials/pages/details/TuberculosisPage";
import HIVMandalaPage from "@/features/educational-materials/pages/details/HIVMandalaPage";
import MPOXPage from "@/features/educational-materials/pages/details/MPOXPage";
import WomensHealthPage from "@/features/educational-materials/pages/details/WomensHealthPage";
import SyphilisPage from "@/features/educational-materials/pages/details/SyphilisPage";
// Features - Componentes
import ListaComponentes from "@/features/apps/list/ListaComponentes";
import PaginaAppsAuxiliares from "@/features/apps/components/PaginaAppsAuxiliares";
import CadastroComponente from "@/features/apps/components/CadastroComponente";
// Features - Tipos de Encerramento
import ListaTiposEncerramento from "@/features/apps/list/ListaTipoEncerramento";
import CadastroTipoEncerramento from "@/features/apps/components/CadastroEncerramento";
// Features - Tipos de Público
import ListaTiposPublico from "@/features/apps/list/ListaPublico";
import CadastroTipoPublico from "@/features/apps/components/CadastroPublico";
// Features - Tipos de Evento
import ListaTiposEvento from "@/features/apps/list/ListaEvento";
import CadastroTipoEvento from "@/features/apps/components/CadastroEvento";
// Features - Tipos de Trauma
import ListaTiposTrauma from "@/features/apps/list/ListaTrauma";
import CadastroTipoTrauma from "@/features/apps/components/CadastroTrauma";
// Features - Tipos de Atendimento
import ListaTiposAtendimento from "@/features/apps/list/ListaAtendimento";
import CadastroTipoAtendimento from "@/features/apps/components/CadastroAtendimento";
// Features - Tipos de Hipótese Diagnóstica
import ListaTiposHipoteseDiag from "@/features/apps/list/ListaHipoteseDiag";
import CadastroTipoHipoteseDiag from "@/features/apps/components/CadastroHipoteseDiag";
// Features - Tipos de Sintoma
import ListaTiposSintoma from "@/features/apps/list/ListaSintoma";
import CadastroTipoSintoma from "@/features/apps/components/CadastroSintoma";
// Features - Qualificações
import RelatorioQualificacao from "@/features/apps/list/ListaQualificacao";
import CadastroQualificacao from "@/features/apps/components/CadastroQualificacao";
// Features - Habilitações
import ListaHabilitacoes from "@/features/apps/list/ListaHabilitacoes";
import CadastroHabilitacao from "@/features/apps/components/CadastroHabilitacao";
// Features - Tipos de Estabelecimentos
import ListaEstabelecimentos from "@/features/apps/list/ListaEstabelecimentos";
import CadastroEstabelecimento from "@/features/apps/components/CadastroTipoEstabelecimento";
// Features - Turnos
import ListaTurnos from "@/features/apps/list/ListaTurno";
import CadastroTurno from "@/features/apps/components/CadastroTurno";
// Features - Natureza
import ListaNaturezas from "@/features/apps/list/ListaNatureza";
import CadastroNatureza from "@/features/apps/components/CadastroNatureza";
// Features - Raça
import ListaRacas from "@/features/apps/list/ListaRaca";
import CadastroRaca from "@/features/apps/components/CadastroRaca";
// Features - CBO
import ListaCBO from "@/features/apps/list/ListaCBO";
import CadastroCBO from "@/features/apps/components/CadastroCBO";
// Features - Escolaridade
import ListaEscolaridade from "@/features/apps/list/ListaEscolaridade";
import CadastroEscolaridade from "@/features/apps/components/CadastroEscolaridade";
// Features - Estados
import ListaEstados from "@/features/apps/list/ListaEstados";
import CadastroEstado from "@/features/apps/components/CadastroEstado";
// Features - Municipios
import ListaMunicipios from "@/features/apps/list/ListaMunicipios";
import CadastroMunicipio from "@/features/apps/components/CadastroMunicipio";
// Features - Paises
import ListaPaises from "@/features/apps/list/ListaPaises";
import CadastroPais from "@/features/apps/components/CadastroPais";
// Features - Generos
import ListaGeneros from "@/features/apps/list/ListaGenero";
import CadastroGenero from "@/features/apps/components/CadastroGenero";
// Features - Bairros
import ListaBairros from "@/features/apps/list/ListaBairro";
import CadastroBairro from "@/features/apps/components/CadastroBairro";
// Features - Pacientes
import FormularioPaciente from "@/features/paginaPacientesComu/components/FormularioPaciente";
import ListaPacientes from "@/features/paginaPacientesComu/components/ListaPacientes";
// Páginas
import LoginPage from "@/paginas/LoginPage";
import OfflineLoginPage from "@/features/auth/pages/OfflineLoginPage";
import QualificarEstabelecimentos from "@/features/forms/EstablishmentForm";
// Importação temporariamente comentada - será usada no futuro
// import PaginaPacientesFicha from "@/features/paginaPacientesComu/components/PaginaPacientesFicha";
import { LanguageProvider } from "@/contexts/LanguageContext";
import RelatorioEstabelecimento from "@/features/list/views/RelatorioEstabelecimento";
// Formulários de Notificação
import NotificationForm from "@/features/notificationForms/NotificationForm";
import ListaNotificacoes from "@/features/notificationForms/ListaNotificacoes";
import HomePage from "@/features/home/HomePage";
import DashboardPage from '@/features/dashboard/DashboardPage';
import DashboardPageCirio from '@/features/dashboard/DashboardPageCirio'; // 🎉 Dashboard Círio de Nazaré com Modo TV
import OfflineManagementPage from '@/features/offlinePage/pages/OfflineManagementPage';
// Contact pages
import FaleConoscoPage from '@/features/contact/FaleConoscoPage';
import AscomPage from '@/features/contact/AscomPage';
import OuvidoriaPage from '@/features/contact/OuvidoriaPage';
// Version page
import VersionPage from '@/pages/VersionPage';
// Componente de layout protegido
const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
};

function App() {
  // *** ADICIONAR ESTE useEffect PARA INICIALIZAR SISTEMA OFFLINE ***
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        await indexedDBService.init();
        syncService.startPeriodicSync(); // Iniciar sync periódico
        console.log('✅ Sistema offline inicializado');
      } catch (error) {
        console.error('❌ Erro ao inicializar offline:', error);
      }
    };

    initializeOffline();

    // Cleanup no unmount
    return () => {
      syncService.stopPeriodicSync();
    };
  }, []);
  
  return (
    <LanguageProvider>
      <Router>
        <Routes>          <Route path="/private" element={<ProtectedLayout />}>
            <Route path="/private/apps-auxiliares" element={<PaginaAppsAuxiliares />} />
            <Route path="/private/offline-management" element={<OfflineManagementPage />} />
            {/* Rotas de Qualificações */}
            <Route path="/private/qualificacao" element={<RelatorioQualificacao />} />
            <Route path="/private/qualificacao/nova" element={<CadastroQualificacao />} />
            <Route path="/private/qualificacao/editar/:id" element={<CadastroQualificacao />} />
            {/* Rotas de Habilitações */}
            <Route path="/private/habilitacao" element={<ListaHabilitacoes />} />
            <Route path="/private/habilitacao/nova" element={<CadastroHabilitacao />} />
            <Route path="/private/habilitacao/editar/:id" element={<CadastroHabilitacao />} />
            {/* Rotas de Estabelecimentos */}
            <Route path="/private/tipo-estabelecimentos" element={<RelatorioEstabelecimento />} />
            <Route path="/private/tipo-estabelecimentos/nova" element={<CadastroEstabelecimento />} />
            <Route path="/private/tipo-estabelecimentos/editar/:id" element={<CadastroEstabelecimento />} />
            {/* Rotas de Turnos */}
            <Route path="/private/turnos" element={<ListaTurnos />} />
            <Route path="/private/turnos/nova" element={<CadastroTurno />} />
            <Route path="/private/turnos/editar/:id" element={<CadastroTurno />} />
            {/* Rotas de Natureza */}
            <Route path="/private/naturezas" element={<ListaNaturezas />} />
            <Route path="/private/naturezas/nova" element={<CadastroNatureza />} />
            <Route path="/private/naturezas/editar/:id" element={<CadastroNatureza />} />
            {/* Rotas de Raça */}
            <Route path="/private/raca" element={<ListaRacas />} />
            <Route path="/private/raca/nova" element={<CadastroRaca />} />
            <Route path="/private/raca/editar/:id" element={<CadastroRaca />} />
            {/* Rotas de CBO */}
            <Route path="/private/cbo" element={<ListaCBO />} />
            <Route path="/private/cbo/nova" element={<CadastroCBO />} />
            <Route path="/private/cbo/editar/:id" element={<CadastroCBO />} />
            {/* Rotas de Escolaridade */}
            <Route path="/private/escolaridade" element={<ListaEscolaridade />} />
            <Route path="/private/escolaridade/nova" element={<CadastroEscolaridade />} />
            <Route path="/private/escolaridade/editar/:id" element={<CadastroEscolaridade />} />
            {/* Rotas de Estados */}
            <Route path="/private/estado" element={<ListaEstados />} />
            <Route path="/private/estado/nova" element={<CadastroEstado />} />
            <Route path="/private/estado/editar/:id" element={<CadastroEstado />} />
            {/* Rotas de Municipios */}
            <Route path="/private/municipio" element={<ListaMunicipios />} />
            <Route path="/private/municipio/nova" element={<CadastroMunicipio />} />
            <Route path="/private/municipio/editar/:id" element={<CadastroMunicipio />} />
            {/* Rotas de Paises */}
            <Route path="/private/pais" element={<ListaPaises />} />
            <Route path="/private/pais/nova" element={<CadastroPais />} />
            <Route path="/private/pais/editar/:id" element={<CadastroPais />} />
            {/* Rotas de Generos */}
            <Route path="/private/genero" element={<ListaGeneros />} />
            <Route path="/private/genero/nova" element={<CadastroGenero />} />
            <Route path="/private/genero/editar/:id" element={<CadastroGenero />} />
            {/* Rotas de Bairros */}
            <Route path="/private/bairro" element={<ListaBairros />} />
            <Route path="/private/bairro/nova" element={<CadastroBairro />} />
            <Route path="/private/bairro/editar/:id" element={<CadastroBairro />} />
            {/* Rotas de Tipos de Encerramento */}
            <Route path="/private/encerramento" element={<ListaTiposEncerramento />} />
            <Route path="/private/encerramento/nova" element={<CadastroTipoEncerramento />} />
            <Route path="/private/encerramento/editar/:id" element={<CadastroTipoEncerramento />} />
            {/* Rotas de Tipos de Público */}
            <Route path="/private/publico" element={<ListaTiposPublico />} />
            <Route path="/private/publico/nova" element={<CadastroTipoPublico />} />
            <Route path="/private/publico/editar/:id" element={<CadastroTipoPublico />} />
            {/* Rotas de Tipos de Evento */}
            <Route path="/private/evento" element={<ListaTiposEvento />} />
            <Route path="/private/evento/nova" element={<CadastroTipoEvento />} />
            <Route path="/private/evento/editar/:id" element={<CadastroTipoEvento />} />
            {/* Rotas de Tipos de Trauma */}
            <Route path="/private/trauma" element={<ListaTiposTrauma />} />
            <Route path="/private/trauma/nova" element={<CadastroTipoTrauma />} />
            <Route path="/private/trauma/editar/:id" element={<CadastroTipoTrauma />} />
            {/* Rotas de Tipos de Atendimento */}
            <Route path="/private/atendimento" element={<ListaTiposAtendimento />} />
            <Route path="/private/atendimento/nova" element={<CadastroTipoAtendimento />} />
            <Route path="/private/atendimento/editar/:id" element={<CadastroTipoAtendimento />} />
            {/* Rotas de Tipos de Hipótese Diagnóstica */}
            <Route path="/private/hipotese-diagnostica" element={<ListaTiposHipoteseDiag />} />
            <Route path="/private/hipotese-diagnostica/nova" element={<CadastroTipoHipoteseDiag />} />
            <Route path="/private/hipotese-diagnostica/editar/:id" element={<CadastroTipoHipoteseDiag />} />
            {/* Rotas de Tipos de Sintoma */}
            <Route path="/private/sintoma" element={<ListaTiposSintoma />} />
            <Route path="/private/sintoma/nova" element={<CadastroTipoSintoma />} />
            <Route path="/private/sintoma/editar/:id" element={<CadastroTipoSintoma />} />
            {/* Rotas de Componentes */}
            <Route path="/private/componente" element={<ListaComponentes />} />
            <Route path="/private/componente/nova" element={<CadastroComponente />} />
            <Route path="/private/componente/editar/:id" element={<CadastroComponente />} />
            {/* Rotas de Estabelecimentos */}
            <Route path="/private/tipo-estabelecimentos/lista" element={<ListaEstabelecimentos />} />
            <Route path="/private/tipo-estabelecimentos/nova" element={<CadastroEstabelecimento />} />
            <Route path="/private/tipo-estabelecimentos/editar/:id" element={<CadastroEstabelecimento />} />
            {/* Rotas de Relatório de Estabelecimentos */}
            <Route path="/private/relatorio-estabelecimentos" element={<RelatorioEstabelecimento />} />
            <Route path="/private/relatorio-estabelecimentos/nova" element={<QualificarEstabelecimentos />} />
            <Route path="/private/relatorio-estabelecimentos/editar/:id" element={<QualificarEstabelecimentos />} />
           
           
            {/* Rotas de Pacientes e Notificações - Protegidas para Notificador */}
            <Route element={<ProtectedRoute requiredRoles={['notificador']} requiredGroups={['/grupo_notificador']}><Outlet /></ProtectedRoute>}>
            {/* Rotas Filhas Protegidas de Pacientes e Notificações - Protegidas para Notificador */}
              <Route path="/private/pacientes/nova" element={<FormularioPaciente />} />
              <Route path="/private/pacientes/editar/:id" element={<FormularioPaciente />} />
              {/* Rota temporariamente desabilitada - módulo será usado no futuro */}
              {/* <Route path="/private/pagina-paciente-ficha" element={<PaginaPacientesFicha />} /> */}
              <Route path="/private/comunicacao-de-caso" element={<ListaNotificacoes />} />
              <Route path="/private/comunicacao-de-caso/nova" element={<NotificationForm />} />
              <Route path="/private/comunicacao-de-caso/editar/:id" element={<NotificationForm />} />
            </Route>
            
            {/* ✅ NOVO: Rota de Lista de Pacientes - Protegida apenas para Admin Master */}
            <Route element={<ProtectedRoute requiredRoles={['admin']}><Outlet /></ProtectedRoute>}>
              <Route path="/private/pacientes" element={<ListaPacientes />} />
            </Route>
          </Route>
          <Route path="/perfil" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/logout" element={<ProtectedRoute><LogoutConfirmation /></ProtectedRoute>} />
          {/* Rotas de Apps Auxiliares */}
          {/* Rotas Públicas */}
          <Route path="/" element={<DesktopPage />} />          
          <Route path="/teste" element={<HomePage />} />
          <Route path="/mapa" element={<MapaLeaflet />} />
          <Route path="/mapa-google" element={<MapaPage />} />
          <Route path="/mapa-google/fullscreen" element={<MapaPage fullScreen={true} />} />
          <Route path="/mapa-original" element={<MapaLocais />} />
          <Route path="/mapa-leaflet" element={<MapaLeaflet />} />
          <Route path="/campanhas" element={<HealthCampaignsPage />} />
          
          {/* Rotas do Dashboard - Protegidas para Notificador OU Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute requiredRoles={['notificador', 'dashboard']}><NotificationDashboard /></ProtectedRoute>} />
          {/* 🎉 CÍRIO DE NAZARÉ 2025: Dashboard com Modo TV para exibição em telões */}
          <Route path="/dashboard-page" element={<ProtectedRoute requiredRoles={['notificador', 'dashboard']}><DashboardPageCirio /></ProtectedRoute>} />
          {/* Dashboard padrão ainda disponível em rota alternativa */}
          <Route path="/dashboard-normal" element={<ProtectedRoute requiredRoles={['notificador', 'dashboard']}><DashboardPage /></ProtectedRoute>} />
          
          {/* Rotas de Campanhas */}
          <Route path="/setembro-verde" element={<SetembroVerde />} />
          <Route path="/setembro-amarelo" element={<SetembroAmarelo />} />
          <Route path="/agosto-dourado" element={<GoldenAugustPage />} />
          <Route path="/janeiro-roxo" element={<JaneiroRoxoPage />} />
          <Route path="/campanha-dezembro-vermelho" element={<DezembroVermelho />} />
          <Route path="/campanha-novembro-azul" element={<NovembroAzul />} />
          
          {/* Rotas de Materiais Educativos */}
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
          <Route path="/access-denied" element={<AccessDenied />} />
          {/* Contact Pages */}
          <Route path="/fale-conosco" element={<FaleConoscoPage />} />
          <Route path="/fale-conosco/ascom" element={<AscomPage />} />
          <Route path="/fale-conosco/ouvidoria" element={<OuvidoriaPage />} />
          
          {/* Version Page */}
          <Route path="/versao" element={<VersionPage />} />
          
          {/* ✅ NOVO: Rota para Admin do Chat de Suporte */}
          <Route 
            path="/admin/chat-suporte" 
            element={
              <ProtectedRoute>
                <ChatAdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/admin/*" element={<AdminRoutes />}></Route>
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
  } from "react-router-dom";
  import { LanguageProvider } from "@/contexts/LanguageContext";
  
  // Auth components
  import LoginPage from "@/paginas/LoginPage";
  // import PrivateRoute from "@/components/PrivateRoute"; // Will be implemented by your friend
  
  // Public pages
  import DesktopPage from "@/features/desktop/DesktopPage";
  import MapaLocais from "@/features/maps";
  import HealthCampaignsPage from "@/features/campaigns/pages/HealthCampaignsPage";
  import HomePage from "@/features/home/HomePage";
  
  // Public campaign details
  import DezembroVermelho from "@/features/campaigns/pages/details/RedDecemberPage";
  import SetembroVerde from "@/features/campaigns/pages/details/GreenSeptemberPage";
  import MalariaZero from "@/features/campaigns/pages/details/MalariaZeroPage";
  import NovembroAzul from "@/features/campaigns/pages/details/BlueNovemberPage";
  import BirthfeedingPage from "@/features/campaigns/pages/details/BirthfeedingPage";
  
  // Private pages - Dashboard
  import DashboardPage from "@/features/dashboard/DashboardPage";
  import NotificationDashboard from "@/features/dashboard/NotificationDashboard";
  
  // Private pages - Apps Auxiliares
  import PaginaAppsAuxiliares from "@/features/apps/components/PaginaAppsAuxiliares";
  
  // Private pages - Componentes
  import ListaComponentes from "@/features/apps/list/ListaComponentes";
  import CadastroComponente from "@/features/apps/components/CadastroComponente";
  
  // Private pages - Tipos de Encerramento
  import ListaTiposEncerramento from "@/features/apps/list/ListaTipoEncerramento";
  import CadastroTipoEncerramento from "@/features/apps/components/CadastroEncerramento";
  
  // Private pages - Tipos de Público
  import ListaTiposPublico from "@/features/apps/list/ListaPublico";
  import CadastroTipoPublico from "@/features/apps/components/CadastroPublico";
  
  // Private pages - Tipos de Evento
  import ListaTiposEvento from "@/features/apps/list/ListaEvento";
  import CadastroTipoEvento from "@/features/apps/components/CadastroEvento";
  
  // Private pages - Tipos de Trauma
  import ListaTiposTrauma from "@/features/apps/list/ListaTrauma";
  import CadastroTipoTrauma from "@/features/apps/components/CadastroTrauma";
  
  // Private pages - Tipos de Atendimento
  import ListaTiposAtendimento from "@/features/apps/list/ListaAtendimento";
  import CadastroTipoAtendimento from "@/features/apps/components/CadastroAtendimento";
  
  // Private pages - Tipos de Hipótese Diagnóstica
  import ListaTiposHipoteseDiag from "@/features/apps/list/ListaHipoteseDiag";
  import CadastroTipoHipoteseDiag from "@/features/apps/components/CadastroHipoteseDiag";
  
  // Private pages - Tipos de Sintoma
  import ListaTiposSintoma from "@/features/apps/list/ListaSintoma";
  import CadastroTipoSintoma from "@/features/apps/components/CadastroSintoma";
  
  // Private pages - Qualificações
  import RelatorioQualificacao from "@/features/apps/list/ListaQualificacao";
  import CadastroQualificacao from "@/features/apps/components/CadastroQualificacao";
  
  // Private pages - Habilitações
  import ListaHabilitacoes from "@/features/apps/list/ListaHabilitacoes";
  import CadastroHabilitacao from "@/features/apps/components/CadastroHabilitacao";
  
  // Private pages - Estabelecimentos
  import ListaEstabelecimentos from "@/features/apps/list/ListaEstabelecimentos";
  import CadastroEstabelecimento from "@/features/apps/components/CadastroTipoEstabelecimento";
  import RelatorioEstabelecimento from "@/features/list/views/RelatorioEstabelecimento";
  import QualificarEstabelecimentos from "@/features/forms/EstablishmentForm";
  
  // Private pages - Turnos
  import ListaTurnos from "@/features/apps/list/ListaTurno";
  import CadastroTurno from "@/features/apps/components/CadastroTurno";
  
  // Private pages - Natureza
  import ListaNaturezas from "@/features/apps/list/ListaNatureza";
  import CadastroNatureza from "@/features/apps/components/CadastroNatureza";
  
  // Private pages - Raça
  import ListaRacas from "@/features/apps/list/ListaRaca";
  import CadastroRaca from "@/features/apps/components/CadastroRaca";
  
  // Private pages - CBO
  import ListaCBO from "@/features/apps/list/ListaCBO";
  import CadastroCBO from "@/features/apps/components/CadastroCBO";
  
  // Private pages - Escolaridade
  import ListaEscolaridade from "@/features/apps/list/ListaEscolaridade";
  import CadastroEscolaridade from "@/features/apps/components/CadastroEscolaridade";
  
  // Private pages - Localidades
  import ListaEstados from "@/features/apps/list/ListaEstados";
  import CadastroEstado from "@/features/apps/components/CadastroEstado";
  import ListaMunicipios from "@/features/apps/list/ListaMunicipios";
  import CadastroMunicipio from "@/features/apps/components/CadastroMunicipio";
  import ListaPaises from "@/features/apps/list/ListaPaises";
  import CadastroPais from "@/features/apps/components/CadastroPais";
  import ListaBairros from "@/features/apps/list/ListaBairro";
  import CadastroBairro from "@/features/apps/components/CadastroBairro";
  
  // Private pages - Generos e Orientação
  import ListaGeneros from "@/features/apps/list/ListaGenero";
  import CadastroGenero from "@/features/apps/components/CadastroGenero";
  
  // Private pages - Pacientes
  import FormularioPaciente from "@/features/paginaPacientesComu/components/FormularioPaciente";
  import ListaPacientes from "@/features/paginaPacientesComu/components/ListaPacientes";
  import PaginaPacientesFicha from "@/features/paginaPacientesComu/components/PaginaPacientesFicha";
  
  // Private pages - Notificações
  import NotificationForm from "@/features/notificationForms/NotificationForm";
  import ListaNotificacoes from "@/features/notificationForms/ListaNotificacoes";
  
  const App: React.FC = () => {
    return (
      <LanguageProvider>
        <Router>
          <Routes>
            {/* PUBLIC ROUTES - Accessible without authentication */}
            <Route path="/" element={<DesktopPage />} />
            <Route path="/inicio" element={<HomePage />} />
            <Route path="/mapa" element={<MapaLocais />} />
            <Route path="/campanhas" element={<HealthCampaignsPage />} />
  
            {/* Public Campaign Details */}
            <Route
              path="/campanhas/dezembro-vermelho"
              element={<DezembroVermelho />}
            />
            <Route path="/campanhas/setembro-verde" element={<SetembroVerde />} />
            <Route path="/campanhas/malaria-zero" element={<MalariaZero />} />
            <Route path="/campanhas/novembro-azul" element={<NovembroAzul />} />
            <Route path="/campanhas/amamentacao" element={<BirthfeedingPage />} />
  
            {/* Authentication */}
            <Route path="/login" element={<LoginPage />} />
  
            {/* 
              PRIVATE ROUTES - Will require authentication
              TODO: Your friend will implement Keycloak and wrap these routes with PrivateRoute
              For now, they are directly accessible for development purposes
            */}
  
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/dashboard/notificacoes"
              element={<NotificationDashboard />}
            />
  
            {/* Apps Auxiliares */}
            <Route path="/apps-auxiliares" element={<PaginaAppsAuxiliares />} />
  
            {/* Componentes */}
            <Route path="/componentes" element={<ListaComponentes />} />
            <Route
              path="/componentes/cadastro"
              element={<CadastroComponente />}
            />
            <Route
              path="/componentes/editar/:id"
              element={<CadastroComponente />}
            />
  
            {/* Estabelecimentos */}
            <Route path="/estabelecimentos" element={<ListaEstabelecimentos />} />
            <Route
              path="/estabelecimentos/cadastro"
              element={<CadastroEstabelecimento />}
            />
            <Route
              path="/estabelecimentos/editar/:id"
              element={<CadastroEstabelecimento />}
            />
            <Route
              path="/estabelecimentos/relatorio"
              element={<RelatorioEstabelecimento />}
            />
            <Route
              path="/estabelecimentos/qualificar"
              element={<QualificarEstabelecimentos />}
            />
            <Route
              path="/estabelecimentos/qualificar/:id"
              element={<QualificarEstabelecimentos />}
            />
  
            {/* Qualificações */}
            <Route path="/qualificacoes" element={<RelatorioQualificacao />} />
            <Route
              path="/qualificacoes/cadastro"
              element={<CadastroQualificacao />}
            />
            <Route
              path="/qualificacoes/editar/:id"
              element={<CadastroQualificacao />}
            />
  
            {/* Habilitações */}
            <Route path="/habilitacoes" element={<ListaHabilitacoes />} />
            <Route
              path="/habilitacoes/cadastro"
              element={<CadastroHabilitacao />}
            />
            <Route
              path="/habilitacoes/editar/:id"
              element={<CadastroHabilitacao />}
            />
  
            {/* Turnos */}
            <Route path="/turnos" element={<ListaTurnos />} />
            <Route path="/turnos/cadastro" element={<CadastroTurno />} />
            <Route path="/turnos/editar/:id" element={<CadastroTurno />} />
  
            {/* Naturezas */}
            <Route path="/naturezas" element={<ListaNaturezas />} />
            <Route path="/naturezas/cadastro" element={<CadastroNatureza />} />
            <Route path="/naturezas/editar/:id" element={<CadastroNatureza />} />
  
            {/* Raças */}
            <Route path="/racas" element={<ListaRacas />} />
            <Route path="/racas/cadastro" element={<CadastroRaca />} />
            <Route path="/racas/editar/:id" element={<CadastroRaca />} />
  
            {/* CBO */}
            <Route path="/cbo" element={<ListaCBO />} />
            <Route path="/cbo/cadastro" element={<CadastroCBO />} />
            <Route path="/cbo/editar/:id" element={<CadastroCBO />} />
  
            {/* Escolaridade */}
            <Route path="/escolaridades" element={<ListaEscolaridade />} />
            <Route
              path="/escolaridades/cadastro"
              element={<CadastroEscolaridade />}
            />
            <Route
              path="/escolaridades/editar/:id"
              element={<CadastroEscolaridade />}
            />
  
            {/* Estados */}
            <Route path="/estados" element={<ListaEstados />} />
            <Route path="/estados/cadastro" element={<CadastroEstado />} />
            <Route path="/estados/editar/:id" element={<CadastroEstado />} />
  
            {/* Municípios */}
            <Route path="/municipios" element={<ListaMunicipios />} />
            <Route path="/municipios/cadastro" element={<CadastroMunicipio />} />
            <Route
              path="/municipios/editar/:id"
              element={<CadastroMunicipio />}
            />
  
            {/* Países */}
            <Route path="/paises" element={<ListaPaises />} />
            <Route path="/paises/cadastro" element={<CadastroPais />} />
            <Route path="/paises/editar/:id" element={<CadastroPais />} />
  
            {/* Bairros */}
            <Route path="/bairros" element={<ListaBairros />} />
            <Route path="/bairros/cadastro" element={<CadastroBairro />} />
            <Route path="/bairros/editar/:id" element={<CadastroBairro />} />
  
            {/* Gêneros */}
            <Route path="/generos" element={<ListaGeneros />} />
            <Route path="/generos/cadastro" element={<CadastroGenero />} />
            <Route path="/generos/editar/:id" element={<CadastroGenero />} />
  
            {/* Tipos de Encerramento */}
            <Route
              path="/tipos-encerramento"
              element={<ListaTiposEncerramento />}
            />
            <Route
              path="/tipos-encerramento/cadastro"
              element={<CadastroTipoEncerramento />}
            />
            <Route
              path="/tipos-encerramento/editar/:id"
              element={<CadastroTipoEncerramento />}
            />
  
            {/* Tipos de Público */}
            <Route path="/tipos-publico" element={<ListaTiposPublico />} />
            <Route
              path="/tipos-publico/cadastro"
              element={<CadastroTipoPublico />}
            />
            <Route
              path="/tipos-publico/editar/:id"
              element={<CadastroTipoPublico />}
            />
  
            {/* Tipos de Evento */}
            <Route path="/tipos-evento" element={<ListaTiposEvento />} />
            <Route
              path="/tipos-evento/cadastro"
              element={<CadastroTipoEvento />}
            />
            <Route
              path="/tipos-evento/editar/:id"
              element={<CadastroTipoEvento />}
            />
  
            {/* Tipos de Trauma */}
            <Route path="/tipos-trauma" element={<ListaTiposTrauma />} />
            <Route
              path="/tipos-trauma/cadastro"
              element={<CadastroTipoTrauma />}
            />
            <Route
              path="/tipos-trauma/editar/:id"
              element={<CadastroTipoTrauma />}
            />
  
            {/* Tipos de Atendimento */}
            <Route
              path="/tipos-atendimento"
              element={<ListaTiposAtendimento />}
            />
            <Route
              path="/tipos-atendimento/cadastro"
              element={<CadastroTipoAtendimento />}
            />
            <Route
              path="/tipos-atendimento/editar/:id"
              element={<CadastroTipoAtendimento />}
            />
  
            {/* Tipos de Hipótese Diagnóstica */}
            <Route
              path="/tipos-hipotese-diagnostica"
              element={<ListaTiposHipoteseDiag />}
            />
            <Route
              path="/tipos-hipotese-diagnostica/cadastro"
              element={<CadastroTipoHipoteseDiag />}
            />
            <Route
              path="/tipos-hipotese-diagnostica/editar/:id"
              element={<CadastroTipoHipoteseDiag />}
            />
  
            {/* Tipos de Sintoma */}
            <Route path="/tipos-sintoma" element={<ListaTiposSintoma />} />
            <Route
              path="/tipos-sintoma/cadastro"
              element={<CadastroTipoSintoma />}
            />
            <Route
              path="/tipos-sintoma/editar/:id"
              element={<CadastroTipoSintoma />}
            />
  
            {/* Pacientes */}
            <Route path="/pacientes" element={<ListaPacientes />} />
            <Route path="/pacientes/cadastro" element={<FormularioPaciente />} />
            <Route
              path="/pacientes/editar/:id"
              element={<FormularioPaciente />}
            />
            <Route path="/pacientes/ficha" element={<PaginaPacientesFicha />} />
  
            {/* Notificações */}
            <Route path="/notificacoes" element={<ListaNotificacoes />} />
            <Route path="/notificacoes/cadastro" element={<NotificationForm />} />
            <Route
              path="/notificacoes/editar/:id"
              element={<NotificationForm />}
            />
  
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    );
  };
  
  export default App;
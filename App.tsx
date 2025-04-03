import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapaLocais from "@/features/maps";
import HealthCampaignsPage from "@/features/campaigns/pages/HealthCampaignsPage";

import DesktopPage from "@/features/desktop/DesktopPage";

import NotificationDashboard from "@/features/dashboard/NotificationDashboard";

// Features - Campanhas
import DezembroVermelho from "@/features/campaigns/pages/details/RedDecemberPage";
import SetembroVerde from "@/features/campaigns/pages/details/GreenSeptemberPage";
import MalariaZero from "@/features/campaigns/pages/details/MalariaZeroPage";
import NovembroAzul from "@/features/campaigns/pages/details/BlueNovemberPage";
import BirthfeedingPage from "@/features/campaigns/pages/details/BirthfeedingPage";

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
import QualificarEstabelecimentos from "@/features/forms/EstablishmentForm";
import PaginaPacientesFicha from "@/features/paginaPacientesComu/components/PaginaPacientesFicha";

import { LanguageProvider } from "@/contexts/LanguageContext";

import RelatorioEstabelecimento from "@/features/list/views/RelatorioEstabelecimento";

// Formulários de Notificação
import NotificationForm from "@/features/notificationForms/NotificationForm";
import ListaNotificacoes from "@/features/notificationForms/ListaNotificacoes";
import HomePage from "@/features/home/HomePage";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/desktop" element={<DesktopPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/mapa" element={<MapaLocais />} />
          <Route path="/campanhas" element={<HealthCampaignsPage />} />{" "}
          {/* Updated to use HealthCampaignsPage */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/apps-auxiliares" element={<PaginaAppsAuxiliares />} />
          {/* Rotas de Qualificações */}
          <Route
            path="/qualificacao/lista"
            element={<RelatorioQualificacao />}
          />
          <Route
            path="/qualificacao/cadastro"
            element={<CadastroQualificacao />}
          />
          <Route
            path="/qualificacao/editar/:id"
            element={<CadastroQualificacao />}
          />
          {/* Rotas de Habilitações */}
          <Route path="/lista-habilitacoes" element={<ListaHabilitacoes />} />
          <Route
            path="/cadastrar-habilitacao"
            element={<CadastroHabilitacao />}
          />
          <Route
            path="/editar-habilitacao/:id"
            element={<CadastroHabilitacao />}
          />
          {/* Rotas de Estabelecimentos */}
          <Route
            path="/estabelecimentos"
            element={<RelatorioEstabelecimento />}
          />
          <Route
            path="/cadastrar-estabelecimento"
            element={<CadastroEstabelecimento />}
          />
          <Route
            path="/editar-estabelecimento/:id"
            element={<CadastroEstabelecimento />}
          />
          {/* Rotas de Turnos */}
          <Route path="/turnos" element={<ListaTurnos />} />
          <Route path="/cadastrar-turno" element={<CadastroTurno />} />
          <Route path="/editar-turno/:id" element={<CadastroTurno />} />
          {/* Rotas de Natureza */}
          <Route path="/naturezas" element={<ListaNaturezas />} />
          <Route path="/cadastrar-natureza" element={<CadastroNatureza />} />
          <Route path="/editar-natureza/:id" element={<CadastroNatureza />} />
          {/* Rotas de Raça */}
          <Route path="/raca/lista" element={<ListaRacas />} />
          <Route path="/raca/cadastrar" element={<CadastroRaca />} />
          <Route path="/raca/editar/:id" element={<CadastroRaca />} />
          {/* Rotas de CBO */}
          <Route path="/cbo/lista" element={<ListaCBO />} />
          <Route path="/cbo/cadastro" element={<CadastroCBO />} />
          <Route path="/cbo/editar/:id" element={<CadastroCBO />} />
          {/* Rotas de Escolaridade */}
          <Route path="escolaridade/lista" element={<ListaEscolaridade />} />
          <Route
            path="escolaridade/cadastro"
            element={<CadastroEscolaridade />}
          />
          <Route
            path="escolaridade/editar/:id"
            element={<CadastroEscolaridade />}
          />
          {/* Rotas de Estados */}
          <Route path="/estado/lista" element={<ListaEstados />} />
          <Route path="/estado/cadastro" element={<CadastroEstado />} />
          <Route path="/estado/editar/:id" element={<CadastroEstado />} />
          {/* Rotas de Municipios */}
          <Route path="/municipio/lista" element={<ListaMunicipios />} />
          <Route path="/municipio/cadastro" element={<CadastroMunicipio />} />
          <Route path="/municipio/editar/:id" element={<CadastroMunicipio />} />
          {/* Rotas de Paises */}
          <Route path="/pais/lista" element={<ListaPaises />} />
          <Route path="/pais/cadastro" element={<CadastroPais />} />
          <Route path="/pais/editar/:id" element={<CadastroPais />} />
          {/* Rotas de Generos */}
          <Route path="/genero/lista" element={<ListaGeneros />} />
          <Route path="/genero/cadastro" element={<CadastroGenero />} />
          <Route path="/genero/editar/:id" element={<CadastroGenero />} />
          {/* Rotas de Bairros */}
          <Route path="/bairro/lista" element={<ListaBairros />} />
          <Route path="/bairro/cadastro" element={<CadastroBairro />} />
          <Route path="/bairro/editar/:id" element={<CadastroBairro />} />
          {/* Rotas de Tipos de Encerramento */}
          <Route
            path="/lista-tipos-encerramento"
            element={<ListaTiposEncerramento />}
          />
          <Route
            path="/cadastrar-tipo-encerramento"
            element={<CadastroTipoEncerramento />}
          />
          <Route
            path="/editar-tipo-encerramento/:id"
            element={<CadastroTipoEncerramento />}
          />
          {/* Rotas de Tipos de Público */}
          <Route path="/lista-tipos-publico" element={<ListaTiposPublico />} />
          <Route
            path="/cadastrar-tipo-publico"
            element={<CadastroTipoPublico />}
          />
          <Route
            path="/editar-tipo-publico/:id"
            element={<CadastroTipoPublico />}
          />
          {/* Rotas de Tipos de Evento */}
          <Route path="/lista-tipos-evento" element={<ListaTiposEvento />} />
          <Route
            path="/cadastrar-tipo-evento"
            element={<CadastroTipoEvento />}
          />
          <Route
            path="/editar-tipo-evento/:id"
            element={<CadastroTipoEvento />}
          />
          {/* Rotas de Tipos de Trauma */}
          <Route path="/lista-tipos-trauma" element={<ListaTiposTrauma />} />
          <Route
            path="/cadastrar-tipo-trauma"
            element={<CadastroTipoTrauma />}
          />
          <Route
            path="/editar-tipo-trauma/:id"
            element={<CadastroTipoTrauma />}
          />
          {/* Rotas de Tipos de Atendimento */}
          <Route
            path="/lista-tipos-atendimento"
            element={<ListaTiposAtendimento />}
          />
          <Route
            path="/cadastrar-tipo-atendimento"
            element={<CadastroTipoAtendimento />}
          />
          <Route
            path="/editar-tipo-atendimento/:id"
            element={<CadastroTipoAtendimento />}
          />
          {/* Rotas de Tipos de Hipótese Diagnóstica */}
          <Route
            path="/lista-tipos-hipotese-diag"
            element={<ListaTiposHipoteseDiag />}
          />
          <Route
            path="/cadastrar-tipo-hipotese-diag"
            element={<CadastroTipoHipoteseDiag />}
          />
          <Route
            path="/editar-tipo-hipotese-diag/:id"
            element={<CadastroTipoHipoteseDiag />}
          />
          {/* Rotas de Tipos de Sintoma */}
          <Route path="/lista-tipos-sintoma" element={<ListaTiposSintoma />} />
          <Route
            path="/cadastrar-tipo-sintoma"
            element={<CadastroTipoSintoma />}
          />
          <Route
            path="/editar-tipo-sintoma/:id"
            element={<CadastroTipoSintoma />}
          />
          {/* Rotas de Campanhas */}
          <Route path="/amamentacao" element={<BirthfeedingPage />} />
          <Route
            path="/campanha-dezembro-vermelho"
            element={<DezembroVermelho />}
          />
          <Route path="/setembro-verde" element={<SetembroVerde />} />
          <Route path="/malaria-zero" element={<MalariaZero />} />
          <Route path="/campanha-novembro-azul" element={<NovembroAzul />} />
          {/* Rotas de Componentes */}
          <Route path="/ficha-comunicacao" element={<NotificationForm />} />
          <Route path="/lista-componentes" element={<ListaComponentes />} />
          <Route
            path="/cadastrar-componente"
            element={<CadastroComponente />}
          />
          <Route
            path="/editar-componente/:id"
            element={<CadastroComponente />}
          />
          {/* Rotas de Estabelecimentos */}
          <Route
            path="/estabelecimentos/lista"
            element={<ListaEstabelecimentos />}
          />
          <Route
            path="/cadastrar-estabelecimento"
            element={<CadastroEstabelecimento />}
          />
          <Route
            path="/editar-estabelecimento/:id"
            element={<CadastroEstabelecimento />}
          />
          {/* Nova rota para seu relatório */}
          <Route
            path="/relatorio-estabelecimentos"
            element={<RelatorioEstabelecimento />}
          />
          <Route
            path="/qualificar-estabelecimentos"
            element={<QualificarEstabelecimentos />}
          />
          <Route
            path="/editar-o-estabelecimento/:id"
            element={<QualificarEstabelecimentos />}
          />
          {/* Rotas de Pacientes - Atualizado */}
          <Route path="/pacientes" element={<ListaPacientes />} />
          <Route path="/pacientes/lista" element={<ListaPacientes />} />
          <Route path="/pacientes/cadastro" element={<FormularioPaciente />} />
          <Route
            path="/pacientes/editar/:id"
            element={<FormularioPaciente />}
          />
          <Route
            path="/modulo-pacientes-ficha"
            element={<PaginaPacientesFicha />}
          />
          {/* Rotas de Notificações */}
          <Route path="/lista-comunicacao" element={<ListaNotificacoes />} />
          <Route path="/formulario-comunicacao" element={<NotificationForm />} />
          <Route path="/formulario-comunicacao/nova" element={<NotificationForm />} />
          <Route
            path="/formulario-comunicacao/editar/:id"
            element={<NotificationForm />}
          />
          {/* Rotas de Dashboard */}
          <Route path="/dashboard" element={<NotificationDashboard />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;

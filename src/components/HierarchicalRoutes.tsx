import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MasterOnlyRoute, ScopedAdminRoute, SpecificScopeRoute } from '../components/RouteGuards';
import { useAccessScope } from '../hooks/useAccessScope';

/**
 * Páginas de exemplo para cada nível hierárquico
 */

// Página Master - Apenas Masters
const MasterDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-purple-800 mb-4">
        👑 Dashboard Master
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Usuários Globais</h3>
          <p className="text-purple-600">Gerenciar todos os usuários do sistema</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Configurações Gerais</h3>
          <p className="text-purple-600">Alterar configurações do sistema</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Relatórios Completos</h3>
          <p className="text-purple-600">Acessar todos os dados</p>
        </div>
      </div>
    </div>
  );
};

// Página Estado - Masters + Admins Estado
const EstadoDashboard: React.FC = () => {
  const { userInfo } = useAccessScope();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-800 mb-4">
        🏛️ Dashboard do Estado
      </h1>
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <p className="text-green-700">
          <strong>Escopo:</strong> {userInfo?.isMaster ? 'Todos os Estados' : `Estado ID: ${userInfo?.scope?.tipo_estado_id}`}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Gerenciar Municípios</h3>
          <p className="text-green-600">Administrar municípios do estado</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Relatórios Estaduais</h3>
          <p className="text-green-600">Dados consolidados do estado</p>
        </div>
      </div>
    </div>
  );
};

// Página Município - Masters + Admins Município
const MunicipioDashboard: React.FC = () => {
  const { userInfo } = useAccessScope();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-orange-800 mb-4">
        🏘️ Dashboard do Município
      </h1>
      <div className="bg-orange-50 p-4 rounded-lg mb-6">
        <p className="text-orange-700">
          <strong>Escopo:</strong> {userInfo?.isMaster ? 'Todos os Municípios' : `Município ID: ${userInfo?.scope?.tipo_municipio_id}`}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-orange-100 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800">Gerenciar Unidades</h3>
          <p className="text-orange-600">Administrar unidades do município</p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800">Relatórios Municipais</h3>
          <p className="text-orange-600">Dados do município</p>
        </div>
      </div>
    </div>
  );
};

// Página Unidade - Masters + Admins Unidade
const UnidadeDashboard: React.FC = () => {
  const { userInfo } = useAccessScope();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-red-800 mb-4">
        🏥 Dashboard da Unidade
      </h1>
      <div className="bg-red-50 p-4 rounded-lg mb-6">
        <p className="text-red-700">
          <strong>Escopo:</strong> {userInfo?.isMaster ? 'Todas as Unidades' : `Estabelecimento ID: ${userInfo?.scope?.estabelecimento_id}`}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800">Gerenciar Notificadores</h3>
          <p className="text-red-600">Administrar usuários da unidade</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800">Relatórios da Unidade</h3>
          <p className="text-red-600">Dados específicos da unidade</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Roteador principal com guards aplicados
 */
export const HierarchicalRoutes: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Rota Master - Apenas Masters */}
        <Route 
          path="/master/*" 
          element={
            <MasterOnlyRoute>
              <MasterDashboard />
            </MasterOnlyRoute>
          } 
        />

        {/* Rota Estado - Masters + Admins Estado */}
        <Route 
          path="/estado/*" 
          element={
            <ScopedAdminRoute requiredScope="estado" allowMaster={true}>
              <EstadoDashboard />
            </ScopedAdminRoute>
          } 
        />

        {/* Rota Município - Masters + Admins Município */}
        <Route 
          path="/municipio/*" 
          element={
            <ScopedAdminRoute requiredScope="municipio" allowMaster={true}>
              <MunicipioDashboard />
            </ScopedAdminRoute>
          } 
        />

        {/* Rota Unidade - Masters + Admins Unidade */}
        <Route 
          path="/unidade/*" 
          element={
            <ScopedAdminRoute requiredScope="unidade" allowMaster={true}>
              <UnidadeDashboard />
            </ScopedAdminRoute>
          } 
        />

        {/* Rotas específicas sem Masters */}
        <Route 
          path="/estado-only/*" 
          element={
            <SpecificScopeRoute requiredScope="estado" allowMaster={false}>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-green-800">
                  🏛️ Apenas Admins de Estado
                </h1>
                <p className="text-green-600 mt-2">
                  Esta página é exclusiva para administradores de estado.
                  Masters não têm acesso.
                </p>
              </div>
            </SpecificScopeRoute>
          } 
        />

        <Route 
          path="/municipio-only/*" 
          element={
            <SpecificScopeRoute requiredScope="municipio" allowMaster={false}>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-orange-800">
                  🏘️ Apenas Admins de Município
                </h1>
                <p className="text-orange-600 mt-2">
                  Esta página é exclusiva para administradores de município.
                  Masters não têm acesso.
                </p>
              </div>
            </SpecificScopeRoute>
          } 
        />

        <Route 
          path="/unidade-only/*" 
          element={
            <SpecificScopeRoute requiredScope="unidade" allowMaster={false}>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-red-800">
                  🏥 Apenas Admins de Unidade
                </h1>
                <p className="text-red-600 mt-2">
                  Esta página é exclusiva para administradores de unidade.
                  Masters não têm acesso.
                </p>
              </div>
            </SpecificScopeRoute>
          } 
        />

        {/* Rota padrão */}
        <Route 
          path="*" 
          element={
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                🛡️ Navegação Hierárquica
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <a 
                  href="/admin/hierarchical/master"
                  className="block p-4 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-purple-800">👑 Master</h3>
                  <p className="text-purple-600 text-sm">Apenas Masters</p>
                </a>
                
                <a 
                  href="/admin/hierarchical/estado"
                  className="block p-4 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-green-800">🏛️ Estado</h3>
                  <p className="text-green-600 text-sm">Masters + Estado</p>
                </a>
                
                <a 
                  href="/admin/hierarchical/municipio"
                  className="block p-4 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-orange-800">🏘️ Município</h3>
                  <p className="text-orange-600 text-sm">Masters + Município</p>
                </a>
                
                <a 
                  href="/admin/hierarchical/unidade"
                  className="block p-4 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-red-800">🏥 Unidade</h3>
                  <p className="text-red-600 text-sm">Masters + Unidade</p>
                </a>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  🔒 Rotas Exclusivas (Sem Masters)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a 
                    href="/admin/hierarchical/estado-only"
                    className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                  >
                    <h3 className="font-semibold text-green-800">🏛️ Estado Only</h3>
                    <p className="text-green-600 text-sm">Apenas Admins Estado</p>
                  </a>
                  
                  <a 
                    href="/admin/hierarchical/municipio-only"
                    className="block p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
                  >
                    <h3 className="font-semibold text-orange-800">🏘️ Município Only</h3>
                    <p className="text-orange-600 text-sm">Apenas Admins Município</p>
                  </a>
                  
                  <a 
                    href="/admin/hierarchical/unidade-only"
                    className="block p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                  >
                    <h3 className="font-semibold text-red-800">🏥 Unidade Only</h3>
                    <p className="text-red-600 text-sm">Apenas Admins Unidade</p>
                  </a>
                </div>
              </div>
            </div>
          } 
        />
      </Routes>
    </div>
  );
};

export default HierarchicalRoutes;

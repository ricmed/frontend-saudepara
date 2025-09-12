import React, { useState } from 'react';
import { HierarchicalSelect, SimpleHierarchicalSelect } from '../components/HierarchicalSelect';
import { EstadoSelect, MunicipioSelect, UnidadeSelect } from '../components/SmartSelects';
import { useEstados, useMunicipios, useUnidades } from '../hooks/useScopeData';
import { useAccessScope } from '../hooks/useAccessScope';

/**
 * Demonstração dos Selects Inteligentes Hierárquicos
 */
const SmartSelectsDemo: React.FC = () => {
  const { userInfo, isLoading, error } = useAccessScope();
  const [selectedData, setSelectedData] = useState<any>(null);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">🎯 Selects Inteligentes Hierárquicos</h1>
        <p className="text-blue-100">
          Demonstração dos componentes de seleção Estado → Município → Unidade com escopo inteligente
        </p>
      </div>

      {/* Informações do Usuário */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">👤 Informações do Usuário Atual</h2>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ) : error ? (
          <div className="text-red-600">
            ❌ Erro ao carregar informações: {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Usuário:</label>
              <p className="text-lg">
                {userInfo?.isMaster ? '👑 Master (Acesso Total)' : '🎯 Admin com Escopo Limitado'}
              </p>
            </div>
            
            {userInfo?.scope && !userInfo?.isMaster && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Escopo de Acesso:</label>
                <p className="text-lg">
                  {userInfo.scope.tipo === 'estado' && `🏛️ Estado ID: ${userInfo.scope.tipo_estado_id}`}
                  {userInfo.scope.tipo === 'municipio' && `🏙️ Município ID: ${userInfo.scope.tipo_municipio_id}`}
                  {userInfo.scope.tipo === 'unidade' && `🏥 Unidade ID: ${userInfo.scope.estabelecimento_id}`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Demonstração 1: Componente Integrado */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">🎯 Demo 1: Componente Integrado</h2>
        <p className="text-gray-600 mb-4">
          Seleção hierárquica completa com auto-preenchimento baseado no escopo do usuário
        </p>
        
        <HierarchicalSelect
          onSelectionChange={(selection) => {
            console.log('Seleção alterada:', selection);
            setSelectedData(selection);
          }}
          layout="grid"
          className="border border-gray-200 p-4 rounded-lg"
        />

        {selectedData && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">✅ Última Seleção:</h3>
            <pre className="text-sm text-green-700">
              {JSON.stringify(selectedData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Demonstração 2: Componente Simplificado */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">📱 Demo 2: Versão Simplificada</h2>
        <p className="text-gray-600 mb-4">
          Layout vertical otimizado para formulários
        </p>
        
        <SimpleHierarchicalSelect
          onSelectionChange={(selection) => {
            console.log('Seleção simples:', selection);
          }}
        />
      </div>

      {/* Demonstração 3: Selects Individuais */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">🔧 Demo 3: Selects Individuais</h2>
        <p className="text-gray-600 mb-4">
          Uso dos componentes separadamente para casos específicos
        </p>
        
        <IndividualSelectsDemo />
      </div>

      {/* Demonstração 4: Casos de Uso Específicos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">💼 Demo 4: Casos de Uso Específicos</h2>
        <UseCaseDemo />
      </div>

      {/* Informações Técnicas */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">⚙️ Informações Técnicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">📋 Funcionalidades:</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>✅ Filtragem automática por escopo de usuário</li>
              <li>✅ Auto-preenchimento quando há apenas uma opção</li>
              <li>✅ Seleção em cascata (Estado → Município → Unidade)</li>
              <li>✅ Estados de loading e error</li>
              <li>✅ Layouts flexíveis (vertical, horizontal, grid)</li>
              <li>✅ Callbacks para integração com formulários</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">🔌 Endpoints Utilizados:</h3>
            <ul className="text-sm space-y-1 text-gray-700 font-mono">
              <li>GET /admin-scoped/scopes/estados</li>
              <li>GET /admin-scoped/scopes/municipios?estado_id=X</li>
              <li>GET /admin-scoped/scopes/unidades?municipio_id=X</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Demo dos selects individuais
 */
const IndividualSelectsDemo: React.FC = () => {
  const [estadoId, setEstadoId] = useState<number | undefined>();
  const [municipioId, setMunicipioId] = useState<number | undefined>();
  const [unidadeId, setUnidadeId] = useState<number | undefined>();

  const estados = useEstados();
  const municipios = useMunicipios(estadoId);
  const unidades = useUnidades(estadoId, municipioId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EstadoSelect
          value={estadoId}
          onChange={(id) => {
            setEstadoId(id);
            setMunicipioId(undefined);
            setUnidadeId(undefined);
          }}
          estados={estados.data}
          loading={estados.loading}
          error={estados.error}
        />

        <MunicipioSelect
          value={municipioId}
          onChange={(id) => {
            setMunicipioId(id);
            setUnidadeId(undefined);
          }}
          municipios={municipios.data}
          loading={municipios.loading}
          error={municipios.error}
          estadoSelected={!!estadoId}
        />

        <UnidadeSelect
          value={unidadeId}
          onChange={setUnidadeId}
          unidades={unidades.data}
          loading={unidades.loading}
          error={unidades.error}
          municipioSelected={!!municipioId}
        />
      </div>

      {(estadoId || municipioId || unidadeId) && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">📊 IDs Selecionados:</h4>
          <div className="text-sm text-blue-700">
            {estadoId && <div>Estado ID: {estadoId}</div>}
            {municipioId && <div>Município ID: {municipioId}</div>}
            {unidadeId && <div>Unidade ID: {unidadeId}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Demo de casos de uso específicos
 */
const UseCaseDemo: React.FC = () => {
  const [useCase, setUseCase] = useState<'form' | 'filter' | 'report'>('form');

  return (
    <div className="space-y-4">
      {/* Seletor de Caso de Uso */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Caso de Uso:
        </label>
        <select 
          value={useCase} 
          onChange={(e) => setUseCase(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="form">📝 Formulário de Cadastro</option>
          <option value="filter">🔍 Filtro de Pesquisa</option>
          <option value="report">📊 Geração de Relatório</option>
        </select>
      </div>

      {/* Componente baseado no caso de uso */}
      <div className="border border-gray-200 p-4 rounded-lg">
        {useCase === 'form' && (
          <div>
            <h3 className="font-medium mb-4">📝 Formulário de Cadastro de Usuário</h3>
            <HierarchicalSelect
              showEstado={true}
              showMunicipio={true}
              showUnidade={true}
              layout="vertical"
              onSelectionChange={(selection) => {
                console.log('Dados para cadastro:', selection);
              }}
            />
          </div>
        )}

        {useCase === 'filter' && (
          <div>
            <h3 className="font-medium mb-4">🔍 Filtro de Notificações</h3>
            <HierarchicalSelect
              showEstado={true}
              showMunicipio={true}
              showUnidade={false}
              layout="horizontal"
              onSelectionChange={(selection) => {
                console.log('Filtros aplicados:', selection);
              }}
            />
          </div>
        )}

        {useCase === 'report' && (
          <div>
            <h3 className="font-medium mb-4">📊 Escopo de Relatório</h3>
            <SimpleHierarchicalSelect
              onSelectionChange={(selection) => {
                console.log('Escopo do relatório:', selection);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSelectsDemo;

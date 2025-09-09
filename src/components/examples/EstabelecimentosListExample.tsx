import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { usuarioGestaoService } from '../../services/UsuarioGestaoService';

/**
 * Exemplo de Lista de Estabelecimentos com Filtros Hierárquicos
 * 
 * - Usuário de estabelecimento: Vê apenas SEU estabelecimento
 * - Usuário de município: Vê estabelecimentos do SEU município  
 * - Usuário de estado: Vê estabelecimentos do SEU estado
 * - Admin: Vê TODOS os estabelecimentos
 */
const EstabelecimentosListExample: React.FC = () => {
  const permissions = useUserPermissions();
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Carregar estabelecimentos filtrados
  const loadEstabelecimentos = async () => {
    if (permissions.loading) return;

    try {
      setLoading(true);
      console.log('🔍 Carregando estabelecimentos com filtros:', permissions);
      
      // Usar o método filtrado que aplica automaticamente os filtros baseado no nível
      const data = await usuarioGestaoService.getEstabelecimentosFiltrados(permissions);
      
      console.log(`✅ Carregados ${data.length} estabelecimentos para o usuário`);
      setEstabelecimentos(data);
    } catch (error) {
      console.error('Erro ao carregar estabelecimentos:', error);
      message.error('Erro ao carregar estabelecimentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstabelecimentos();
  }, [permissions.loading, permissions.estabelecimentoId, permissions.municipioId, permissions.estadoId]);

  // Colunas da tabela (condicionais baseadas no nível)
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
    },
    // Mostrar coluna de município apenas para estado e admin
    ...(permissions.isEstado || permissions.isAdmin ? [{
      title: 'Município',
      dataIndex: 'municipio',
      key: 'municipio',
      render: (municipio: any) => municipio?.nome || 'N/A'
    }] : []),
    // Mostrar coluna de estado apenas para admin
    ...(permissions.isAdmin ? [{
      title: 'Estado',
      dataIndex: 'estado', 
      key: 'estado',
      render: (estado: any) => estado?.nome || 'N/A'
    }] : []),
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <div className="space-x-2">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          
          {/* Apenas admin ou município/estado podem excluir */}
          {(!permissions.isEstabelecimento) && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Excluir
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    console.log('Editando estabelecimento:', record);
    // Implementar modal de edição
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: `Deseja excluir o estabelecimento "${record.nome}"?`,
      okText: 'Sim',
      cancelText: 'Não',
      onOk: async () => {
        try {
          // await usuarioGestaoService.deleteEstabelecimento(record.id);
          console.log('Estabelecimento excluído:', record.id);
          message.success('Estabelecimento excluído com sucesso');
          loadEstabelecimentos(); // Recarregar lista
        } catch (error) {
          console.error('Erro ao excluir:', error);
          message.error('Erro ao excluir estabelecimento');
        }
      }
    });
  };

  const handleCreate = () => {
    console.log('Criar novo estabelecimento');
    // Implementar modal de criação
  };

  // Renderização condicional do loading
  if (permissions.loading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando estabelecimentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com informações do usuário */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Lista de Estabelecimentos</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <div>
            <strong>Seu nível:</strong> {permissions.nivel} 
            {permissions.estabelecimentoId && ` (ID: ${permissions.estabelecimentoId})`}
            {permissions.municipioId && ` (Município: ${permissions.municipioId})`}
            {permissions.estadoId && ` (Estado: ${permissions.estadoId})`}
          </div>
          <div>
            <strong>Filtro aplicado:</strong> 
            {permissions.isEstabelecimento && ' Apenas SEU estabelecimento'}
            {permissions.isMunicipio && ' Estabelecimentos do SEU município'}
            {permissions.isEstado && ' Estabelecimentos do SEU estado'}
            {permissions.isAdmin && ' TODOS os estabelecimentos'}
          </div>
          <div>
            <strong>Total encontrado:</strong> {estabelecimentos.length} estabelecimento(s)
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          {/* Botão de criar apenas para níveis superiores */}
          {(!permissions.isEstabelecimento) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Novo Estabelecimento
            </Button>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          {permissions.isEstabelecimento ? 
            'Usuários de estabelecimento podem apenas visualizar e editar seu próprio estabelecimento' :
            'Você pode gerenciar estabelecimentos conforme seu nível de acesso'
          }
        </div>
      </div>

      {/* Tabela */}
      <Table
        columns={columns}
        dataSource={estabelecimentos}
        loading={loading}
        rowKey="id"
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total} estabelecimentos`,
        }}
      />

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <details>
            <summary className="cursor-pointer font-semibold">Debug Info</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify({ permissions, estabelecimentosCount: estabelecimentos.length }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default EstabelecimentosListExample;

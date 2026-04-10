import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowLeft, X, Menu } from 'lucide-react';
import SideBarMenuAppsAuxiliaresDae from '@/features/apps/components/SideBarMenuAppsAuxiliaresDae';

interface GenericEntity {
  id_dae?: number;
  id_nhe?: number;
  id_cievs?: number;
  id_crs?: number;
  nome: string;
  codigo?: string;
  created_at?: string;
  updated_at?: string;
}

interface EntityService {
  getAll: (page: number, limit: number) => Promise<{ data: any[]; total: number }>;
  getById: (id: number) => Promise<any>;
  create: (data: { nome: string; codigo?: string }) => Promise<any>;
  update: (id: number, data: { nome?: string; codigo?: string }) => Promise<any>;
  delete: (id: number) => Promise<void>;
}

interface GenericEntityManagerProps {
  entityName: string; // 'DAE', 'NHE', 'CIEVS', 'CRS'
  entityTitle: string; // 'Doenças de Agravo e Evento'
  service: EntityService;
  idField: 'id_dae' | 'id_nhe' | 'id_cievs' | 'id_crs';
  basePath: string; // '/private/apps/comunicacao-dae/dae'
}

export const GenericEntityManager: React.FC<GenericEntityManagerProps> = ({
  entityName,
  entityTitle,
  service,
  idField,
  basePath,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [entities, setEntities] = useState<GenericEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome: '', codigo: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadEntities();
  }, [currentPage]);

  useEffect(() => {
    if (id) {
      loadEntity(Number(id));
    }
  }, [id]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await service.getAll(currentPage, itemsPerPage);
      setEntities(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.message || `Erro ao carregar ${entityName}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEntity = async (entityId: number) => {
    try {
      const data = await service.getById(entityId);
      setFormData({ nome: data.nome, codigo: data.codigo || '' });
      setEditingId(entityId);
      setShowForm(true);
    } catch (err: any) {
      setError(err.response?.data?.message || `Erro ao carregar ${entityName}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`📝 Salvando ${entityName}:`, formData);

      if (editingId) {
        const result = await service.update(editingId, formData);
        console.log(`✅ ${entityName} atualizado:`, result);
        alert(`${entityName} atualizado com sucesso!`);
      } else {
        const result = await service.create(formData);
        console.log(`✅ ${entityName} criado:`, result);
        alert(`${entityName} criado com sucesso!`);
      }

      setShowForm(false);
      setFormData({ nome: '', codigo: '' });
      setEditingId(null);
      loadEntities();
      navigate(basePath);
    } catch (err: any) {
      console.error(`❌ Erro ao salvar ${entityName}:`, err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || `Erro ao salvar ${entityName}`;
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entityId: number) => {
    if (!confirm(`Tem certeza que deseja excluir este ${entityName}?`)) return;

    try {
      await service.delete(entityId);
      alert(`${entityName} excluído com sucesso!`);
      loadEntities();
    } catch (err: any) {
      alert(err.response?.data?.message || `Erro ao excluir ${entityName}`);
    }
  };

  const handleEdit = (entity: GenericEntity) => {
    setEditingId(entity[idField] as number);
    setFormData({ nome: entity.nome, codigo: entity.codigo || '' });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ nome: '', codigo: '' });
    setEditingId(null);
    setError(null);
    navigate(basePath);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com padrão dos Apps Auxiliares */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                onClick={() => navigate('/private/apps-auxiliares-dae')}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>

              <div>
                <h1 className="text-2xl font-bold">{entityTitle}</h1>
                <p className="text-sm text-blue-100 mt-0.5">Gerenciar {entityName}</p>
              </div>
            </div>

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-6 py-2 bg-white text-blue-600 rounded-full hover:bg-gray-100 transition-colors shadow-md"
                aria-label={`Novo ${entityName}`}
              >
                <Plus className="h-5 w-5" />
                Novo
              </button>
            )}
          </div>
        </div>
      </header>

      <SideBarMenuAppsAuxiliaresDae
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 mb-4 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingId ? `Editar ${entityName}` : `Novo ${entityName}`}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Nome do ${entityName}`}
                  maxLength={150}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Código (opcional)"
                  maxLength={50}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista */}
        {loading && !showForm ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : entities.length === 0 && !showForm ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum {entityName} encontrado</h3>
            <p className="text-sm text-gray-500">Comece criando um novo registro.</p>
          </div>
        ) : !showForm ? (
          <>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-blue-600 uppercase">
                        ID
                      </th>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-blue-600 uppercase">
                        Nome
                      </th>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-blue-600 uppercase">
                        Código
                      </th>
                      <th className="px-8 py-4 text-right text-sm font-semibold text-blue-600 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entities.map((entity, index) => (
                      <tr 
                        key={entity[idField]} 
                        className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                      >
                        <td className="px-8 py-4 text-gray-600">
                          {entity[idField]}
                        </td>
                        <td className="px-8 py-4 text-gray-900 font-medium">
                          {entity.nome}
                        </td>
                        <td className="px-8 py-4 text-gray-600">
                          {entity.codigo || '-'}
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              onClick={() => handleEdit(entity)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(entity[idField] as number)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginação */}
            {Math.ceil(total / itemsPerPage) > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-md px-6 py-4">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold text-blue-600">{total}</span> registros no total
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    Página <span className="font-bold text-blue-600">{currentPage}</span> de <span className="font-bold">{Math.ceil(total / itemsPerPage)}</span>
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(total / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(total / itemsPerPage)}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
};

export default GenericEntityManager;

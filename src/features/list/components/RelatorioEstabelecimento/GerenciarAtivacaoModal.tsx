import React, { useState, useMemo } from 'react';
import { X, Search, Power, PowerOff, Check, AlertCircle, Loader } from 'lucide-react';

interface EstabelecimentoSimples {
  idestabelecimento: number;
  nome: string;
  cnes?: string;
  cidade?: string;
  ativo?: boolean;
}

interface GerenciarAtivacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  estabelecimentos: EstabelecimentoSimples[];
  estabelecimentosAtivos: number[]; // IDs dos estabelecimentos ativos
  onSave: (ativosIds: number[]) => Promise<void>;
  isLoadingEstabelecimentos?: boolean;
}

const GerenciarAtivacaoModal: React.FC<GerenciarAtivacaoModalProps> = ({
  isOpen,
  onClose,
  estabelecimentos,
  estabelecimentosAtivos: ativosIniciais,
  onSave,
  isLoadingEstabelecimentos = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ativosIds, setAtivosIds] = useState<number[]>(ativosIniciais);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'ativos' | 'todos'>('ativos');

  // Função para normalizar texto (remove acentos, cedilhas, etc)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD') // Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos (acentos)
      .replace(/[çÇ]/g, 'c'); // Substitui cedilha
  };

  // Filtrar estabelecimentos com base na busca (case-insensitive e sem acentos)
  const filteredEstabelecimentos = useMemo(() => {
    if (!searchTerm) return estabelecimentos;
    
    const normalizedSearch = normalizeText(searchTerm);
    
    return estabelecimentos.filter(est => {
      const normalizedNome = normalizeText(est.nome || '');
      const normalizedCnes = normalizeText(est.cnes || '');
      const normalizedCidade = normalizeText(est.cidade || '');
      
      return (
        normalizedNome.includes(normalizedSearch) ||
        normalizedCnes.includes(normalizedSearch) ||
        normalizedCidade.includes(normalizedSearch)
      );
    });
  }, [estabelecimentos, searchTerm]);

  // Separar ativos e inativos
  const estabelecimentosAtivos = useMemo(() => 
    filteredEstabelecimentos.filter(est => ativosIds.includes(est.idestabelecimento)),
    [filteredEstabelecimentos, ativosIds]
  );

  const estabelecimentosInativos = useMemo(() => 
    filteredEstabelecimentos.filter(est => !ativosIds.includes(est.idestabelecimento)),
    [filteredEstabelecimentos, ativosIds]
  );

  const handleToggle = (id: number) => {
    setAtivosIds(prev => 
      prev.includes(id) 
        ? prev.filter(estId => estId !== id)
        : [...prev, id]
    );
  };

  const handleToggleAll = (ids: number[], ativar: boolean) => {
    setAtivosIds(prev => {
      if (ativar) {
        // Adicionar todos os IDs que não estão na lista
        const novosIds = ids.filter(id => !prev.includes(id));
        return [...prev, ...novosIds];
      } else {
        // Remover todos os IDs da lista
        return prev.filter(id => !ids.includes(id));
      }
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(ativosIds);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    setAtivosIds(ativosIniciais); // Restaurar estado inicial
    setSearchTerm('');
    setActiveTab('ativos');
    onClose();
  };

  if (!isOpen) return null;

  const mudancas = ativosIds.length !== ativosIniciais.length || 
    !ativosIds.every(id => ativosIniciais.includes(id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Gerenciar Ativação de Estabelecimentos
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Ative ou desative estabelecimentos em lote
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Contador e Pesquisa */}
          <div className="p-6 border-b border-gray-200 space-y-4">
            {/* Estatísticas */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <Power className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {ativosIds.length} Ativos
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <PowerOff className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {estabelecimentos.length - ativosIds.length} Inativos
                </span>
              </div>
              {mudancas && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Alterações não salvas
                  </span>
                </div>
              )}
            </div>

            {/* Barra de Pesquisa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CNES ou cidade..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('ativos')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'ativos'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ativos ({estabelecimentosAtivos.length})
              </button>
              <button
                onClick={() => setActiveTab('todos')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'todos'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos ({filteredEstabelecimentos.length})
              </button>
            </div>
          </div>

          {/* Lista de Estabelecimentos */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingEstabelecimentos ? (
              // Loading state
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Carregando estabelecimentos...</p>
                <p className="text-sm text-gray-500 mt-1">
                  Isso pode levar alguns segundos para ~11.000 estabelecimentos
                </p>
              </div>
            ) : activeTab === 'ativos' ? (
              // Tab de Ativos
              <div className="space-y-3">
                {estabelecimentosAtivos.length > 0 && (
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => handleToggleAll(estabelecimentosAtivos.map(e => e.idestabelecimento), false)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <PowerOff className="h-4 w-4" />
                      Desativar Todos
                    </button>
                  </div>
                )}
                
                {estabelecimentosAtivos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <PowerOff className="h-16 w-16 text-gray-300 mb-3" />
                    <p className="text-gray-500">Nenhum estabelecimento ativo</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Use a aba "Todos" para ativar estabelecimentos
                    </p>
                  </div>
                ) : (
                  estabelecimentosAtivos.map(est => (
                    <div
                      key={est.idestabelecimento}
                      className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Power className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {est.nome}
                        </p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-600">
                          {est.cnes && <span>CNES: {est.cnes}</span>}
                          {est.cidade && <span>• {est.cidade}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(est.idestabelecimento)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 flex-shrink-0"
                      >
                        <PowerOff className="h-3.5 w-3.5" />
                        Desativar
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Tab de Todos
              <div className="space-y-3">
                {estabelecimentosInativos.length > 0 && (
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => handleToggleAll(estabelecimentosInativos.map(e => e.idestabelecimento), true)}
                      className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                    >
                      <Power className="h-4 w-4" />
                      Ativar Todos Inativos
                    </button>
                  </div>
                )}

                {filteredEstabelecimentos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-16 w-16 text-gray-300 mb-3" />
                    <p className="text-gray-500">
                      {searchTerm 
                        ? `Nenhum estabelecimento encontrado para "${searchTerm}"`
                        : 'Nenhum estabelecimento disponível'
                      }
                    </p>
                  </div>
                ) : (
                  filteredEstabelecimentos.map(est => {
                    const isAtivo = ativosIds.includes(est.idestabelecimento);
                    
                    return (
                      <div
                        key={est.idestabelecimento}
                        className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                          isAtivo
                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            type="checkbox"
                            checked={isAtivo}
                            onChange={() => handleToggle(est.idestabelecimento)}
                            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                          />
                        </div>
                        {isAtivo ? (
                          <Power className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <PowerOff className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${
                            isAtivo ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {est.nome}
                          </p>
                          <div className="flex gap-3 mt-1 text-xs text-gray-500">
                            {est.cnes && <span>CNES: {est.cnes}</span>}
                            {est.cidade && <span>• {est.cidade}</span>}
                          </div>
                        </div>
                        {isAtivo && (
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              {ativosIds.length} de {estabelecimentos.length} estabelecimentos ativos
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !mudancas || isLoadingEstabelecimentos}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerenciarAtivacaoModal;

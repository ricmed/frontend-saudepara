import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Trash2, AlertCircle, Clock, Eye } from 'lucide-react';
import syncService from '@/services/syncService';
import { toast } from 'react-toastify';

interface ErrorNotification {
  id: number;
  formData: any;
  errorInfo: {
    message: string;
    timestamp: number;
    retryCount?: number;
    lastError?: string;
  };
}

interface NotificationErrorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onErrorsChanged?: () => void;
}

const NotificationErrorsModal: React.FC<NotificationErrorsModalProps> = ({
  isOpen,
  onClose,
  onErrorsChanged
}) => {
  const [errors, setErrors] = useState<ErrorNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<number | null>(null);
  const [expandedError, setExpandedError] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadErrors();
    }
  }, [isOpen]);

  const loadErrors = async () => {
    try {
      setLoading(true);
      const errorNotifications = await syncService.getErrorNotifications();
      setErrors(errorNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações com erro:', error);
      toast.error('Erro ao carregar lista de erros');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: number) => {
    setRetrying(id);
    try {
      const success = await syncService.retryNotificationSync(id);
      if (success) {
        // Remover da lista local
        setErrors(prev => prev.filter(e => e.id !== id));
        onErrorsChanged?.();
      }
    } catch (error) {
      console.error('Erro ao tentar sincronizar:', error);
    } finally {
      setRetrying(null);
    }
  };

  const handleRemove = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover permanentemente esta notificação? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await syncService.forceRemovePendingNotification(id);
      setErrors(prev => prev.filter(e => e.id !== id));
      onErrorsChanged?.();
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
    }
  };

  const formatError = (errorInfo: ErrorNotification['errorInfo']) => {
    const date = new Date(errorInfo.timestamp).toLocaleString('pt-BR');
    let details = '';
    
    if (errorInfo.lastError) {
      try {
        const parsed = JSON.parse(errorInfo.lastError);
        details = `Status: ${parsed.status || 'N/A'}\nMensagem: ${parsed.message || 'N/A'}`;
      } catch {
        details = errorInfo.lastError;
      }
    }
    
    return { date, details };
  };

  const getNotificationTitle = (formData: any) => {
    const tipoEvento = formData.tipoEvento || 'Tipo não informado';
    const paciente = formData.paciente || 'Paciente não informado';
    return `${tipoEvento} - ${paciente}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Notificações com Erro de Sincronização
            </h2>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
              {errors.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Carregando...</span>
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma notificação com erro encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {errors.map((error) => {
                const { date, details } = formatError(error.errorInfo);
                const isExpanded = expandedError === error.id;

                return (
                  <div key={error.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {getNotificationTitle(error.formData)}
                        </h3>
                        <p className="text-sm text-red-600 mb-2">
                          {error.errorInfo.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {date}
                          </span>
                          {error.errorInfo.retryCount && (
                            <span>Tentativas: {error.errorInfo.retryCount}</span>
                          )}
                          <span>ID: {error.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setExpandedError(isExpanded ? null : error.id)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleRetry(error.id)}
                          disabled={retrying === error.id}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {retrying === error.id ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Tentando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3" />
                              Tentar Novamente
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRemove(error.id)}
                          className="p-1 hover:bg-red-100 rounded-full transition-colors"
                          title="Remover permanentemente"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {isExpanded && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Detalhes do Erro:</h4>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-white p-2 rounded border">
                          {details || 'Nenhum detalhe adicional disponível'}
                        </pre>
                        
                        <h4 className="font-medium text-sm text-gray-700 mb-2 mt-3">Dados da Notificação:</h4>
                        <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                          <div><strong>Tipo:</strong> {error.formData.tipoEvento || 'N/A'}</div>
                          <div><strong>Paciente:</strong> {error.formData.paciente || 'N/A'}</div>
                          <div><strong>Data de Notificação:</strong> {error.formData.dataNotificacao || 'N/A'}</div>
                          <div><strong>Município:</strong> {error.formData.municipio || 'N/A'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-sm text-gray-600">
            💡 <strong>Dica:</strong> As notificações com erro são preservadas e podem ser sincronizadas novamente quando o problema for resolvido.
            Você pode tentar sincronizar individualmente ou aguardar a próxima sincronização automática.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationErrorsModal;
// Componente de exemplo para exibir informações de auditoria
import React from 'react';
import { User, Calendar, Clock } from 'lucide-react';

interface AuditInfoProps {
  created_at?: string;
  updated_at?: string;
  created_by_userid?: string;
  updated_by_userid?: string;
  className?: string;
}

/**
 * Componente para exibir informações de auditoria de uma notificação
 * Mostra quem criou/atualizou e quando
 */
export const AuditInfo: React.FC<AuditInfoProps> = ({
  created_at,
  updated_at,
  created_by_userid,
  updated_by_userid,
  className = ""
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Data inválida";
    }
  };

  const getUserDisplay = (userId?: string) => {
    if (!userId) return "—";
    // TODO: Futuramente, integrar com Keycloak para buscar nome do usuário
    return userId; // Por enquanto mostra apenas o ID
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <Clock className="w-4 h-4 mr-2" />
        Informações de Auditoria
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Informações de Criação */}
        <div className="space-y-2">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="font-medium">Criado em:</span>
          </div>
          <div className="ml-6 text-gray-800">
            {formatDate(created_at)}
          </div>
          
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span className="font-medium">Criado por:</span>
          </div>
          <div className="ml-6 text-gray-800">
            {getUserDisplay(created_by_userid)}
          </div>
        </div>

        {/* Informações de Atualização */}
        <div className="space-y-2">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="font-medium">Atualizado em:</span>
          </div>
          <div className="ml-6 text-gray-800">
            {formatDate(updated_at)}
          </div>
          
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span className="font-medium">Atualizado por:</span>
          </div>
          <div className="ml-6 text-gray-800">
            {getUserDisplay(updated_by_userid)}
          </div>
        </div>
      </div>

      {/* Nota sobre integração futura */}
      {(created_by_userid || updated_by_userid) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 <strong>Próxima atualização:</strong> Os IDs de usuário serão substituídos por nomes reais 
            quando a integração com Keycloak estiver completa.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuditInfo;

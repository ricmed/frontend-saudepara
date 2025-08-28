import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  X, 
  Bell, 
  CheckCircle,
  Info,
  ExternalLink
} from 'lucide-react';

// Configuração de vigilância epidemiológica conforme diretrizes do MS
import { 
  detectarAlertas, 
  VigilanciaConfig 
} from '../config/vigilancia.config';

interface AlertaItem {
  id: string;
  tipo: 'critico' | 'alerta' | 'info';
  titulo: string;
  descricao: string;
  timestamp: Date;
  notificacaoId?: string;
  hipotese?: string;
  pacienteInfo?: string;
  estabelecimento?: string;
  requiresNotification?: boolean; // Notificação compulsória imediata
  legalBasis?: string; // Base legal (Portaria, etc.)
}

interface AlertasPanelProps {
  notificacoes: any[];
}

export const AlertasPanel: React.FC<AlertasPanelProps> = ({ notificacoes = [] }) => {
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [alertasAtivos, setAlertasAtivos] = useState<AlertaItem[]>([]);
  const [showDismissed, setShowDismissed] = useState(false);
  const [alertasDismissed, setAlertasDismissed] = useState<Set<string>>(new Set());

  // Processar alertas baseado nas notificações
  const processarAlertas = useCallback(() => {
    if (!notificacoes || notificacoes.length === 0) {
      setAlertas([]);
      return;
    }

    const novosAlertas: AlertaItem[] = [];

    // Usar o sistema de detecção configurado
    const alertasDetectados = detectarAlertas(notificacoes);

    alertasDetectados.forEach((alerta, index) => {
      const alertaItem: AlertaItem = {
        id: `alerta-${index}-${Date.now()}`,
        tipo: alerta.tipo === 'critico' ? 'critico' : 
              alerta.tipo === 'urgente' ? 'alerta' : 'info',
        titulo: alerta.titulo,
        descricao: alerta.descricao,
        timestamp: new Date(),
        hipotese: alerta.dados?.hipotese,
        pacienteInfo: alerta.dados?.paciente,
        estabelecimento: alerta.dados?.estabelecimento,
        requiresNotification: alerta.dados?.criterioLegal?.includes('imediata'),
        legalBasis: alerta.dados?.criterioLegal || 'Portaria GM/MS nº 264/2020'
      };

      novosAlertas.push(alertaItem);
    });

    // Adicionar alertas de volume se houver muitos casos
    const totalNotificacoes = notificacoes.length;
    if (totalNotificacoes > 50) {
      novosAlertas.push({
        id: `volume-${Date.now()}`,
        tipo: 'alerta',
        titulo: 'Volume Elevado de Notificações',
        descricao: `Detectadas ${totalNotificacoes} notificações. Monitoramento intensificado recomendado.`,
        timestamp: new Date(),
        legalBasis: 'Portaria GM/MS nº 264/2020'
      });
    }

    setAlertas(novosAlertas);
  }, [notificacoes]);

  // Filtrar alertas ativos (não dismissed)
  useEffect(() => {
    const ativos = alertas.filter(alerta => !alertasDismissed.has(alerta.id));
    setAlertasAtivos(ativos);
  }, [alertas, alertasDismissed]);

  // Executar processamento quando notificações mudarem
  useEffect(() => {
    processarAlertas();
  }, [processarAlertas]);

  const dismissAlert = useCallback((alertaId: string) => {
    setAlertasDismissed(prev => new Set([...prev, alertaId]));
  }, []);

  const restoreAlert = useCallback((alertaId: string) => {
    setAlertasDismissed(prev => {
      const newSet = new Set(prev);
      newSet.delete(alertaId);
      return newSet;
    });
  }, []);

  const getAlertIcon = (tipo: AlertaItem['tipo']) => {
    switch (tipo) {
      case 'critico':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'alerta':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertBgColor = (tipo: AlertaItem['tipo']) => {
    switch (tipo) {
      case 'critico':
        return 'bg-red-50 border-red-200';
      case 'alerta':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const alertasParaExibir = showDismissed 
    ? alertas.filter(alerta => alertasDismissed.has(alerta.id))
    : alertasAtivos;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Sistema de Alertas Epidemiológicos
              </h2>
              {alertasAtivos.length > 0 && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  {alertasAtivos.length} ativo{alertasAtivos.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDismissed(!showDismissed)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {showDismissed ? 'Ver Ativos' : 'Ver Dispensados'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {alertasParaExibir.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500">
                {showDismissed 
                  ? 'Nenhum alerta foi dispensado' 
                  : 'Nenhum alerta ativo no momento'
                }
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Sistema monitorando conforme Portaria GM/MS nº 264/2020
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertasParaExibir.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-4 rounded-lg border ${getAlertBgColor(alerta.tipo)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alerta.tipo)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">
                            {alerta.titulo}
                          </h3>
                          {alerta.requiresNotification && (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                              Notificação Compulsória
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-2">
                          {alerta.descricao}
                        </p>
                        
                        {(alerta.hipotese || alerta.pacienteInfo || alerta.estabelecimento) && (
                          <div className="bg-white/50 p-2 rounded text-xs space-y-1">
                            {alerta.hipotese && (
                              <div><strong>Hipótese:</strong> {alerta.hipotese}</div>
                            )}
                            {alerta.pacienteInfo && (
                              <div><strong>Paciente:</strong> {alerta.pacienteInfo}</div>
                            )}
                            {alerta.estabelecimento && (
                              <div><strong>Estabelecimento:</strong> {alerta.estabelecimento}</div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alerta.timestamp.toLocaleString()}
                          </div>
                          {alerta.legalBasis && (
                            <div className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {alerta.legalBasis}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      {showDismissed ? (
                        <button
                          onClick={() => restoreAlert(alerta.id)}
                          className="p-1 hover:bg-white/50 rounded transition-colors"
                          title="Restaurar alerta"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => dismissAlert(alerta.id)}
                          className="p-1 hover:bg-white/50 rounded transition-colors"
                          title="Dispensar alerta"
                        >
                          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {alertasAtivos.length > 0 && !showDismissed && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              <strong>Atenção:</strong> Alertas críticos requerem ação imediata conforme protocolo de vigilância epidemiológica.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertasPanel;

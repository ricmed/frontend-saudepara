// Modal de Detalhes do Estabelecimento - Mostra hipóteses diagnósticas e pacientes
import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, Activity, Users, MapPin, Building, ExternalLink } from 'lucide-react';

interface Notificacao {
  id?: string;
  idnotificacao?: number;
  original?: any;
}

interface EstabelecimentoDetailModalProps {
  estabelecimento: {
    id: string;
    nome: string;
    notificacoes: number;
    urgencia: 'baixa' | 'media' | 'alta' | 'critica';
    endereco?: string;
    tipo?: string;
    temNotificacaoCompulsoria?: boolean;
  };
  notificacoes: Notificacao[];
  exportOptions?: any;
  onClose: () => void;
}

interface HipoteseDiagnostica {
  id: string;
  descricao: string;
  quantidade: number;
  isAlarmante: boolean;
  pacientes: Array<{
    id: string;
    idNotificacao: string | number;
    nome: string;
    idade?: number;
    sexo?: string;
    dataAtendimento?: string;
  }>;
}

const EstabelecimentoDetailModal: React.FC<EstabelecimentoDetailModalProps> = ({
  estabelecimento,
  notificacoes,
  exportOptions = {},
  onClose
}) => {
  const navigate = useNavigate();

  // Função para formatar idade de meses para anos (mesma lógica do AlertasPanel)
  const formatarIdade = useCallback((idadeMeses: number | null | undefined): string => {
    if (idadeMeses === null || idadeMeses === undefined || idadeMeses < 0) {
      return 'Não informada';
    }

    // Se for menor que 12 meses, mostrar em meses
    if (idadeMeses < 12) {
      return `${idadeMeses} mês${idadeMeses !== 1 ? 'es' : ''}`;
    }

    // Para 12 meses ou mais, converter para anos (desconsiderando meses restantes)
    const anos = Math.floor(idadeMeses / 12);
    return `${anos} ano${anos !== 1 ? 's' : ''}`;
  }, []);

  // Função para navegar até a ficha do paciente
  const navegarParaFicha = useCallback((idNotificacao: string | number) => {
    if (idNotificacao && !isNaN(Number(idNotificacao))) {
      const url = `/private/comunicacao-de-caso/editar/${idNotificacao}`;
      navigate(url);
    }
  }, [navigate]);

  // Filtrar notificações deste estabelecimento
  const notificacoesEstabelecimento = useMemo(() => {
    return notificacoes.filter(n => {
      const estabId = n?.original?.estabelecimento_idestabelecimento || n?.original?.estabelecimentoId;
      return String(estabId) === String(estabelecimento.id);
    });
  }, [notificacoes, estabelecimento.id]);

  // Processar hipóteses diagnósticas
  const hipotesesDiagnosticas = useMemo(() => {
    const hipotesesMap = new Map<string, HipoteseDiagnostica>();

    notificacoesEstabelecimento.forEach(notificacao => {
      const hipoteseId = notificacao?.original?.tipo_hipotese_diag_idtipo_hipotese_diag;
      
      if (hipoteseId && exportOptions?.hipoteseDiagOptions?.length > 0) {
        const hipotese = exportOptions.hipoteseDiagOptions.find(
          (h: any) => String(h.idtipo_hipotese_diag) === String(hipoteseId)
        );

        if (hipotese) {
          const hipoteseKey = String(hipoteseId);
          
          // Dados do paciente
          const paciente = {
            id: String(notificacao?.original?.idnotificacao || notificacao?.id || Math.random()),
            idNotificacao: notificacao?.original?.idnotificacao || notificacao?.id || '',
            nome: notificacao?.original?.paciente?.nome || 'Não informado',
            idade: notificacao?.original?.paciente?.idade,
            sexo: notificacao?.original?.paciente?.tipo_genero_idtipo_genero 
              ? (exportOptions.generoOptions?.find((g: any) => 
                  String(g.idtipo_genero) === String(notificacao.original.paciente.tipo_genero_idtipo_genero)
                )?.descricao || 'Não informado')
              : 'Não informado',
            dataAtendimento: notificacao?.original?.data_atendimento 
              ? new Date(notificacao.original.data_atendimento).toLocaleDateString('pt-BR')
              : 'Não informado'
          };

          if (hipotesesMap.has(hipoteseKey)) {
            const existing = hipotesesMap.get(hipoteseKey)!;
            existing.quantidade += 1;
            existing.pacientes.push(paciente);
          } else {
            hipotesesMap.set(hipoteseKey, {
              id: hipoteseKey,
              descricao: hipotese.descricao,
              quantidade: 1,
              isAlarmante: hipotese.alarmante === true || hipotese.isAlarmante === true,
              pacientes: [paciente]
            });
          }
        }
      }
    });

    return Array.from(hipotesesMap.values()).sort((a, b) => {
      // Primeiro: alarmantes
      if (a.isAlarmante && !b.isAlarmante) return -1;
      if (!a.isAlarmante && b.isAlarmante) return 1;
      // Depois: quantidade
      return b.quantidade - a.quantidade;
    });
  }, [notificacoesEstabelecimento, exportOptions]);

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'critica': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgenciaText = (urgencia: string) => {
    switch (urgencia) {
      case 'critica': return 'Crítica';
      case 'alta': return 'Alta';
      case 'media': return 'Média';
      case 'baixa': return 'Baixa';
      default: return 'Indefinida';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b sticky top-0 bg-white rounded-t-lg z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${getUrgenciaColor(estabelecimento.urgencia)}`}></div>
              <h2 className="text-2xl font-bold text-gray-800">{estabelecimento.nome}</h2>
              {estabelecimento.temNotificacaoCompulsoria && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  COMPULSÓRIA
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {estabelecimento.endereco && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {estabelecimento.endereco}
                </div>
              )}
              {estabelecimento.tipo && (
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {estabelecimento.tipo}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Urgência: <span className="font-semibold">{getUrgenciaText(estabelecimento.urgencia)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="font-semibold">{estabelecimento.notificacoes}</span> notificações
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {hipotesesDiagnosticas.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Hipóteses Diagnósticas ({hipotesesDiagnosticas.length})
              </h3>

              {hipotesesDiagnosticas.map((hipotese) => (
                <div 
                  key={hipotese.id}
                  className={`border rounded-lg overflow-hidden ${
                    hipotese.isAlarmante 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Hipótese Header */}
                  <div className={`p-4 ${
                    hipotese.isAlarmante ? 'bg-red-100' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {hipotese.isAlarmante && (
                          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <h4 className={`font-semibold ${
                            hipotese.isAlarmante ? 'text-red-900' : 'text-gray-800'
                          }`}>
                            {hipotese.descricao}
                          </h4>
                          {hipotese.isAlarmante && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-red-200 text-red-800 text-xs font-bold rounded">
                              NOTIFICAÇÃO COMPULSÓRIA
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        hipotese.isAlarmante 
                          ? 'bg-red-200 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {hipotese.quantidade} {hipotese.quantidade === 1 ? 'caso' : 'casos'}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Pacientes */}
                  <div className="divide-y divide-gray-200">
                    {hipotese.pacientes.map((paciente) => (
                      <div 
                        key={paciente.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm flex-1">
                            <div>
                              <span className="text-gray-500">Paciente:</span>
                              <p className="font-medium text-gray-800">{paciente.nome}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Idade:</span>
                              <p className="font-medium text-gray-800">
                                {formatarIdade(paciente.idade)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Sexo:</span>
                              <p className="font-medium text-gray-800">{paciente.sexo}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Data Atendimento:</span>
                              <p className="font-medium text-gray-800">{paciente.dataAtendimento}</p>
                            </div>
                          </div>
                          
                          {/* Botão para navegar à ficha */}
                          <button
                            onClick={() => navegarParaFicha(paciente.idNotificacao)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            title="Abrir ficha do paciente"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver Ficha
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma hipótese diagnóstica registrada para este estabelecimento.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Total: <span className="font-semibold">{notificacoesEstabelecimento.length}</span> notificações neste estabelecimento
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstabelecimentoDetailModal;

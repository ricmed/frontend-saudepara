import React, { useState } from 'react';
import { detectUserTimezone } from '../features/notificationForms/types/index2';

const TestTimeForm: React.FC = () => {
  const agora = new Date();
  const agoraFormatada = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
    
  const [dataAtendimento, setDataAtendimento] = useState(agoraFormatada);
  const [resultado, setResultado] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🧪 TESTE DE HORÁRIO - Dados enviados:', {
      dataAtendimento,
      timezone: detectUserTimezone()
    });

    try {
      const { timezone_name, timezone_offset_minutos } = detectUserTimezone();
      
      const payload = {
        data_atendimento: dataAtendimento + ':00-03:00', // Formato ISO 8601 completo
        timezone_name,
        timezone_offset_minutos,
        // Campos usando IDs existentes conhecidos (baseado na notificação ID 8)
        paciente_idpaciente: 8, // Paciente existente
        tipo_evento_idtipo_evento: 2, // Evento existente
        tipo_publico_idtipo_publico: 1, // Público padrão  
        estabelecimento_idestabelecimento: 14066, // Estabelecimento existente
        tipo_atendimento_idtipo_atendimento: 3, // Atendimento existente
        residente_belem: "S", // Campo obrigatório
        tipo_pais_idtipo_pais: 105, // Brasil (ID 105)
        tipo_encerramento_idtipo_encerramento: 1, // Tipo de encerramento padrão
        tipo_bairro_idtipo_bairro: 32 // Bairro existente
      };
      
      console.log('📤 Enviando payload:', payload);
      
      const response = await fetch('http://localhost:3000/api/notificacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('📥 Resposta do servidor:', data);
      
      setResultado(data);
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setResultado({ error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">🧪 Teste de Horário</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="dataAtendimento" className="block text-sm font-medium text-gray-700 mb-1">
            Data e Hora de Atendimento
          </label>
          <input
            type="datetime-local"
            id="dataAtendimento"
            value={dataAtendimento}
            onChange={(e) => setDataAtendimento(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Timezone detectado: {detectUserTimezone().timezone_name} 
            (offset: {detectUserTimezone().timezone_offset_minutos} min)
          </p>
        </div>
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Testar Horário
        </button>
      </form>
      
      {resultado && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium mb-2">Resultado:</h3>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Hora local agora:</strong> {new Date().toLocaleString()}</p>
        <p><strong>UTC agora:</strong> {new Date().toISOString()}</p>
      </div>
    </div>
  );
};

export default TestTimeForm;

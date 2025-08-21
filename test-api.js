// Teste simples para verificar se a API está retornando dados
async function testarAPI() {
  try {
    // Ajustar URL conforme necessário
    const response = await fetch('http://localhost:3001/api/estabelecimentos/mapa');
    
    if (!response.ok) {
      console.error('Erro na response:', response.status, response.statusText);
      return;
    }
    
    const dados = await response.json();
    console.log('Total de estabelecimentos:', dados.length);
    
    if (dados.length > 0) {
      console.log('Primeiro estabelecimento:', dados[0]);
      console.log('Campos disponíveis:', Object.keys(dados[0]));
      
      // Verificar se tem os campos que precisamos
      const primeiro = dados[0];
      console.log('Verificação de campos:');
      console.log('- endereco:', primeiro.logradouro, primeiro.numero, primeiro.bairro);
      console.log('- tipo_natureza:', primeiro.tipo_natureza);
      console.log('- tipo_turno:', primeiro.tipo_turno);
      console.log('- habilitacoes:', primeiro.estabelecimento_has_tipo_habilitacao?.length || 0);
      console.log('- qualificacoes:', primeiro.estabelecimento_has_tipo_qualificacao?.length || 0);
    }
  } catch (error) {
    console.error('Erro ao testar API:', error);
  }
}

// Executar o teste
testarAPI();

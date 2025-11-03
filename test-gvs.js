// Teste rápido das regras GVS
const { findRuleByHypothesis } = require('./dist/assets/index-Dyqdzx-k.js');

// Testar algumas hipóteses do banco
const hipotesesTeste = [
  'BOTULISMO',
  'DENGUE', 
  'CAXUMBA',
  'DOENÇA MENINGOCÓCICA',
  'TUBERCULOSE',
  'HANSENIASE'
];

console.log('🧪 Testando regras GVS com hipóteses do banco:');
hipotesesTeste.forEach(hipotese => {
  const match = findRuleByHypothesis(hipotese);
  if (match) {
    console.log(`✅ ${hipotese} -> ${match.rule.priority} (${match.key})`);
  } else {
    console.log(`❌ ${hipotese} -> NÃO ENCONTRADO`);
  }
});
yeah its working
// Script para adicionar imports faltantes
const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../src/services');
const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Verifica se usa getApiUrl mas não tem o import
  if (content.includes('getApiUrl(') && !content.includes("from '../config/api'")) {
    // Adiciona o import após o import do axios
    content = content.replace(
      /import axios(.*?);/,
      "import axios$1;\nimport { getApiUrl } from '../config/api';"
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Import adicionado: ${file}`);
  } else if (content.includes('getApiUrl(')) {
    console.log(`⏭️  Já tem import: ${file}`);
  } else {
    console.log(`➖ Não usa getApiUrl: ${file}`);
  }
});

console.log('\n🎉 Imports corrigidos!');

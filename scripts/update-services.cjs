// Script para atualizar todos os services para usar a nova configuração de API

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../src/services');
const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Padrão antigo
  const oldPattern = /const server = import\.meta\.env\.VITE_API_SERVER;\s*const port = import\.meta\.env\.VITE_API_PORT;\s*const API_URL = `\$\{server\}:\$\{port\}\/api\/([^`]+)`/g;
  
  // Novo padrão
  const replacement = (match, endpoint) => {
    // Adicionar import se não existir
    if (!content.includes("import { getApiUrl } from '../config/api'")) {
      content = content.replace(
        /import axios/,
        "import axios;\nimport { getApiUrl } from '../config/api'"
      );
    }
    return `const API_URL = getApiUrl('/${endpoint}')`;
  };
  
  content = content.replace(oldPattern, replacement);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Atualizado: ${file}`);
});

console.log('\n🎉 Todos os serviços foram atualizados!');

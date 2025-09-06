const fs = require('fs');
const path = require('path');

// Lista de componentes para corrigir (excluindo os já corrigidos)
const componentsToFix = [
  'DistribuicaoRacaCorChart.tsx',
  'DistribuicaoPublicoAtendidoChart.tsx', 
  'DesfechoCasosChart.tsx',
  'EstabelecimentosCasosChart.tsx',
  'HipotesesDiagnosticasChart.tsx',
  'PiramideEtariaChart.tsx',
  'PrincipaisSintomasChart.tsx',
  'PublicoAtendidoChart.tsx',
  'TiposTraumaChart.tsx'
];

const chartsDir = './src/features/dashboard/components/charts';

componentsToFix.forEach(filename => {
  const filepath = path.join(chartsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`❌ Arquivo não encontrado: ${filename}`);
    return;
  }
  
  console.log(`🔧 Corrigindo: ${filename}`);
  
  let content = fs.readFileSync(filepath, 'utf8');
  
  // 1. Remover imports obsoletos e adicionar ChartExportMenu
  content = content.replace(
    /import.*{[^}]*Download[^}]*}.*from "lucide-react";/,
    'import { User, MousePointer, BarChart2, PieChart as PieChartIcon } from "lucide-react";\nimport ChartExportMenu from \'../../../../components/common/ChartExportMenu\';'
  );
  
  // 2. Adicionar exportMenu à interface Props (procurar padrão)
  content = content.replace(
    /(interface \w+Props \{[\s\S]*?)\s*(})/,
    '$1  exportMenu?: React.ReactNode; // 🆕 Prop opcional para menu de exportação personalizado\n$2'
  );
  
  // 3. Remover todas as funções de exportação simuladas
  content = content.replace(
    /\/\/ Funções de exportação[\s\S]*?(?=\/\/[^/]|const \w+: React\.FC)/,
    ''
  );
  
  // 4. Remover GraphExportMenu component completo
  content = content.replace(
    /\/\/ Componente de menu de exportação[\s\S]*?(?=\/\/[^/]|const \w+: React\.FC)/,
    ''
  );
  
  // 5. Adicionar exportMenu na assinatura do componente
  content = content.replace(
    /(const \w+: React\.FC<\w+Props> = \(\{[\s\S]*?className[^,}]*)/,
    '$1,\n  exportMenu // 🆕 Prop para menu de exportação personalizado'
  );
  
  // 6. Substituir GraphExportMenu por ChartExportMenu condicional
  content = content.replace(
    /\s*<GraphExportMenu[\s\S]*?\/>/,
    `          {exportMenu || (
            <ChartExportMenu 
              chartId={chartId} 
              chartData={data}
              chartTitle={title}
              buttonVariant="icon"
            />
          )}`
  );
  
  // 7. Limpar linhas vazias excessivas
  content = content.replace(/\n\n\n+/g, '\n\n');
  
  fs.writeFileSync(filepath, content);
  console.log(`✅ Corrigido: ${filename}`);
});

console.log('\n🎉 Todos os componentes foram corrigidos!');

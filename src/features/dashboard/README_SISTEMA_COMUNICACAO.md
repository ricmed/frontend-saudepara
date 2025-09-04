# Sistema de Comunicação Global entre Gráficos

Este sistema implementa comunicação entre gráficos similar ao Power BI, onde clicar em um elemento de um gráfico filtra automaticamente todos os outros gráficos do dashboard.

## 🏗️ Arquitetura

### 1. Contexto Global (`DashboardContext`)
- **Localização**: `src/features/dashboard/context/DashboardContext.tsx`
- **Função**: Gerencia estado global dos filtros e sincronização entre gráficos
- **Características**:
  - Context API do React para compartilhamento de estado
  - Reducer para gerenciar ações de filtro
  - Funções utilitárias para processamento de dados
  - Tipos TypeScript para segurança

### 2. Hook Personalizado (`useChartData`)
- **Localização**: `src/features/dashboard/hooks/useChartData.ts`
- **Função**: Simplifica o uso do contexto nos componentes de gráfico
- **Características**:
  - Processamento automático de dados baseado em filtros
  - Mapeamento de tipos de gráfico para campos de dados
  - Esquemas de cores consistentes
  - Funções de clique e interatividade

### 3. Componentes de Controle
- **FilterControls**: Exibe filtros ativos e estatísticas
- **ConnectedDashboard**: Exemplo completo de dashboard conectado
- **DashboardWithContext**: Wrapper que fornece contexto

## 🚀 Como Usar

### 1. Envolver o Dashboard com Contexto

```tsx
import { DashboardProvider } from './context/DashboardContext';

function App() {
  return (
    <DashboardProvider initialData={meusDados}>
      <MeuDashboard />
    </DashboardProvider>
  );
}
```

### 2. Criar Gráfico Conectado

```tsx
import { useChartData } from '../hooks/useChartData';

const MeuGrafico = ({ rawData }) => {
  const {
    data,           // Dados processados e filtrados
    activeFilter,   // Filtro ativo neste gráfico
    handleClick,    // Função para clicar em itens
    isItemActive,   // Verificar se item está ativo
    hasActiveFilters, // Se há filtros aplicados
  } = useChartData('publico', rawData);

  return (
    <BarChart data={data}>
      <Bar 
        onClick={(item) => handleClick(item.name)}
        // ... outras props
      >
        {data.map((entry, i) => (
          <Cell 
            fill={entry.fill}
            stroke={isItemActive(entry.name) ? "#000" : "none"}
            opacity={hasActiveFilters && !isItemActive(entry.name) ? 0.6 : 1}
          />
        ))}
      </Bar>
    </BarChart>
  );
};
```

### 3. Tipos de Gráfico Suportados

```typescript
type ChartType = 
  | 'publico'          // Público atendido
  | 'tipoAtendimento'  // Tipo de atendimento
  | 'sexo'             // Sexo
  | 'racaCor'          // Raça/Cor
  | 'sintomas'         // Sintomas
  | 'trauma'           // Tipos de trauma
  | 'hipoteses'        // Hipóteses diagnósticas
  | 'faixaEtaria'      // Faixa etária
  | 'estabelecimentos' // Estabelecimentos
  | 'desfecho';        // Desfecho
```

## 📊 Características do Sistema

### ✅ Já Implementado

1. **Context API** para estado global
2. **Hook personalizado** para facilitar uso
3. **Processamento automático** de dados
4. **Filtros cruzados** entre gráficos
5. **Indicadores visuais** de estado ativo
6. **Controles de filtro** centralizados
7. **Exportação** mantida por gráfico
8. **Esquemas de cor** consistentes
9. **Exemplo funcional** (PublicoAtendidoChart)

### 🔄 Para Implementar

1. **Converter gráficos existentes** para usar o contexto
2. **Adicionar mais tipos de gráfico** conforme necessário
3. **Implementar filtros de data/período**
4. **Adicionar persistência** de filtros (localStorage)
5. **Melhorar performance** com memo/useMemo
6. **Adicionar animações** nas transições

## 🔧 Migração de Gráficos Existentes

### Antes (Props diretas):
```tsx
interface MeuGraficoProps {
  data: ChartDataItem[];
  onChartClick?: (itemName: string) => void;
  activeFilter?: string | null;
}
```

### Depois (Com contexto):
```tsx
interface MeuGraficoProps {
  rawData: any[];  // Apenas dados brutos
  // Outras props opcionais
}

// No componente:
const { data, handleClick, isItemActive } = useChartData('tipoGrafico', rawData);
```

## 🎯 Benefícios

1. **Comunicação Automática**: Gráficos se comunicam automaticamente
2. **Estado Centralizado**: Um local para gerenciar todos os filtros
3. **Código Limpo**: Menos props e lógica repetida
4. **Consistência Visual**: Cores e comportamentos padronizados
5. **Facilidade de Manutenção**: Mudanças centralizadas
6. **Experiência do Usuário**: Similar ao Power BI

## 🧪 Exemplo de Uso Completo

```tsx
// Dados de exemplo
const dados = [
  {
    publico_atendido: 'Adulto',
    tipo_atendimento: 'Urgência',
    sexo: 'Masculino',
    // ... outros campos
  }
];

// Dashboard conectado
function Dashboard() {
  return (
    <DashboardProvider initialData={dados}>
      <FilterControls rawData={dados} />
      
      <div className="grid grid-cols-2 gap-4">
        <PublicoAtendidoChart rawData={dados} />
        <TipoAtendimentoChart rawData={dados} />
        {/* Outros gráficos... */}
      </div>
    </DashboardProvider>
  );
}
```

## 📝 Notas de Implementação

1. **Performance**: O hook `useChartData` usa `useMemo` para otimizar recálculos
2. **Tipos**: Todos os componentes têm tipos TypeScript completos
3. **Flexibilidade**: Sistema permite customização de cores, comportamentos, etc.
4. **Compatibilidade**: Mantém compatibilidade com gráficos existentes durante transição
5. **Escalabilidade**: Fácil adicionar novos tipos de gráfico e filtros

Este sistema transforma o dashboard em uma experiência interativa e conectada, onde todos os gráficos trabalham juntos para fornecer insights mais profundos dos dados.

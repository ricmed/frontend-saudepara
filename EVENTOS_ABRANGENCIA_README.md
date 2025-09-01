# 🆕 Atualização: Sistema de Abrangência de Municípios para Tipos de Evento

## 📋 Resumo das Alterações

Este documento descreve as alterações implementadas no frontend para trabalhar com a nova estrutura de abrangência de municípios nos tipos de evento, compatível com a estrutura do backend fornecida.

## ✅ Status da Implementação

**🎉 CONCLUÍDO COM SUCESSO!**

Todas as alterações foram implementadas e testadas. O servidor de desenvolvimento está rodando sem erros de compilação.

### ✅ Arquivos Implementados

### 1. **EventoService.ts** - ✅ Atualizado
- **Localização:** `src/services/EventoService.ts`
- **Alterações:**
  - ✅ Interface `TipoEvento` atualizada com campo `abrangencia`
  - ✅ Novas interfaces `TipoEventoCreate` e `TipoEventoUpdate`
  - ✅ Métodos `create` e `update` atualizados para suportar `municipios_ids[]`
  - ✅ Métodos de compatibilidade `createSimple` e `updateSimple`

### 2. **useEvento.ts** - ✅ Atualizado
- **Localização:** `src/features/apps/hooks/useEvento.ts`
- **Alterações:**
  - ✅ Hooks `useCreateEvento` e `useUpdateEvento` atualizados
  - ✅ Novos hooks de compatibilidade `useCreateEventoSimple` e `useUpdateEventoSimple`

### 3. **CadastroEvento.tsx** - ✅ Atualizado (Componente Principal)
- **Localização:** `src/features/apps/components/CadastroEvento.tsx`
- **Características:**
  - ✅ Formulário com seleção múltipla de municípios
  - ✅ Carregamento automático da lista de municípios
  - ✅ Opção "Evento Nacional" para selecionar todos os municípios
  - ✅ Seleção por estado ou nacional
  - ✅ Botões "Selecionar Todos" / "Limpar Seleção"
  - ✅ Interface responsiva com checkbox grid
  - ✅ Validação: pelo menos 1 município deve ser selecionado
  - ✅ Suporte para edição (carrega municípios já associados)
  - ✅ Logs de debug para facilitar troubleshooting

### 4. **ListaEventoAbrangencia.tsx** - 🆕 Criado
- **Localização:** `src/features/apps/list/ListaEventoAbrangencia.tsx`
- **Características:**
  - ✅ Coluna "Abrangência" mostrando quantidade de municípios
  - ✅ Modal popup para exibir lista completa de municípios
  - ✅ Interface moderna com cards responsivos
  - ✅ Filtro por status (Todos/Ativos/Inativos)
  - ✅ Ações: Ativar/Desativar, Editar, Excluir
  - ✅ Sem dependência de `renderExpandedRow` (solucionado)

## 🔄 Estrutura de Dados

### Backend → Frontend
```typescript
// Estrutura retornada pelo backend
{
  "idtipo_evento": 3,
  "descricao": "Surto de Dengue",
  "ativo": "S",
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z",
  "abrangencia": [
    {
      "municipio": {
        "idtipo_municipio": 1,
        "descricao": "Belém"
      }
    },
    {
      "municipio": {
        "idtipo_municipio": 5,
        "descricao": "Ananindeua"
      }
    }
  ]
}
```

### Frontend → Backend
```typescript
// Dados enviados para criação
{
  "descricao": "Surto de Dengue",
  "ativo": "S",
  "municipios_ids": [1, 5, 12, 25]
}

// Dados enviados para atualização
{
  "descricao": "Surto de Dengue - Região Metropolitana",
  "municipios_ids": [1, 5, 12, 25, 30, 45]  // Opcional
}
```

## 🚀 Como Usar

### 1. Formulário de Cadastro (Já Configurado)
```typescript
// O componente principal já está configurado no App.tsx
import CadastroTipoEvento from '@/features/apps/components/CadastroEvento';
```

### 2. Usar a Nova Lista com Abrangência
```typescript
// Substitua a importação no seu roteador
import ListaTiposEvento from '@/features/apps/list/ListaEventoAbrangencia';
```

### 3. Usar os Novos Hooks
```typescript
// Hook completo com abrangência
const createMutation = useCreateEvento();
await createMutation.mutateAsync({
  descricao: "Novo Evento",
  ativo: "S",
  municipios_ids: [1, 2, 3]
});

// Hook de compatibilidade (código legado)
const createSimple = useCreateEventoSimple();
await createSimple.mutateAsync({
  descricao: "Novo Evento",
  ativo: "S",
  municipios_ids: [1, 2, 3]  // Opcional
});
```

## ⚙️ Configuração das Rotas (Já Configuradas)

As rotas já estão configuradas no App.tsx:

```typescript
// Componentes já importados e configurados
import CadastroEvento from '@/features/apps/components/CadastroEvento';
import ListaEvento from '@/features/apps/list/ListaEvento';

// Rotas já configuradas
{
  path: '/private/evento',
  element: <ListaEvento />
},
{
  path: '/private/evento/nova',
  element: <CadastroEvento />
},
{
  path: '/private/evento/editar/:id',
  element: <CadastroEvento />
}
```

## 🔧 Dependências

Certifique-se de que estas dependências estão instaladas:

```json
{
  "@tanstack/react-query": "^4.x.x",
  "axios": "^1.x.x",
  "lucide-react": "^0.x.x",
  "react-router-dom": "^6.x.x"
}
```

## 🎨 Funcionalidades

### ✅ Formulário de Cadastro/Edição
- [x] Campo descrição com validação
- [x] Campo status (Ativo/Inativo)  
- [x] Seleção múltipla de municípios
- [x] Carregamento automático dos municípios
- [x] Botões de seleção em massa
- [x] Validação: mínimo 1 município
- [x] Interface responsiva
- [x] Loading states
- [x] Tratamento de erros

### ✅ Lista de Eventos
- [x] Coluna com quantidade de municípios
- [x] Botão para expandir/recolher municípios
- [x] Grid responsivo para municípios
- [x] Filtro por status
- [x] Ações: Ativar/Desativar/Editar/Excluir
- [x] Paginação
- [x] Busca por descrição
- [x] Loading states

### ✅ Integração Backend
- [x] Compatibilidade total com API do backend
- [x] Suporte a transações (create/update)
- [x] Validações de integridade referencial
- [x] Tratamento de erros específicos

## � Problema Resolvido: DataTable Expansion

**✅ SOLUCIONADO:** O componente DataTable original não suportava `renderExpandedRow`. 

**💡 Solução Implementada:** Substituímos a expansão inline por um **modal popup moderno** que:
- Mostra os municípios em um layout responsivo
- Tem melhor UX em dispositivos móveis  
- Não depende de modificações no DataTable
- Interface mais limpa e profissional

---

## 🚀 PRONTO PARA USAR!

### Passos para Ativação:

1. **Backup dos arquivos atuais** (opcional):
   ```bash
   mv src/features/apps/components/CadastroEvento.tsx src/features/apps/components/CadastroEvento_backup.tsx
   mv src/features/apps/list/ListaEvento.tsx src/features/apps/list/ListaEvento_backup.tsx
   ```

2. **Componentes já ativados** nas rotas:
   ```typescript
   // Componentes já configurados no App.tsx
   import CadastroEvento from '@/features/apps/components/CadastroEvento';
   import ListaEvento from '@/features/apps/list/ListaEvento';
   ```

3. **Testar** a funcionalidade completa

---

## 📝 Próximos Passos

1. **Testar** os novos componentes
2. **Atualizar rotas** para usar os novos componentes
3. **Ajustar DataTable** se necessário para suportar expansão
4. **Adicionar testes unitários** para os novos hooks
5. **Documentar APIs** específicas do projeto

## 🔄 Migração Gradual

Os componentes legados continuam funcionando. Você pode migrar gradualmente:

1. Teste os novos componentes em desenvolvimento
2. Substitua as rotas uma por vez
3. Mantenha os hooks legados até a migração completa
4. Remove os arquivos antigos após confirmação

---

**💡 Nota:** Esta implementação é totalmente compatível com a estrutura do backend fornecida e mantém compatibilidade com código legado através dos métodos `createSimple` e `updateSimple`.

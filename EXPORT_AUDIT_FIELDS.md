# 📊 Campos de Auditoria nos Exports

## ✅ Alterações Implementadas

### 1. **Interface FormData Atualizada**
- Adicionados campos opcionais `created_at` e `updated_at` na interface `FormData`
- Arquivo: `src\features\notificationForms\components\types.ts`

### 2. **Função prepareDataForExport Atualizada**
- Adicionados campos "Data de Criação" e "Data de Atualização" na seção 7
- Utiliza a função `formatarDataUniversal()` para conversão de timezone
- Arquivo: `src\features\notificationForms\components\exportUtilities.ts`

### 3. **Seções PDF Atualizadas**
- Nova seção "7. Campos de Auditoria" adicionada ao PDF
- Inclui "Data de Criação" e "Data de Atualização"
- Arquivo: `src\features\notificationForms\components\exportUtilities.ts`

### 4. **Função formatNotificacaoForExport Atualizada**
- Adicionados campos de auditoria para exportação de listas
- Processa campos `original.created_at` e `original.updated_at`
- Arquivo: `src\features\notificationForms\components\exportUtilities.ts`

### 5. **Função adjustDatesForExport Atualizada**
- Adicionados `created_at` e `updated_at` à lista de campos de data
- Garante que os campos de auditoria sejam processados corretamente
- Arquivo: `src\features\notificationForms\utils\index.ts`

## 🎯 Formatos de Export Afetados

### ✅ Formulário Individual
- **Excel (.xlsx)** - Inclui campos de auditoria
- **CSV (.csv)** - Inclui campos de auditoria
- **Word (.doc)** - Inclui campos de auditoria
- **PDF (.pdf)** - Nova seção "7. Campos de Auditoria"

### ✅ Lista de Notificações
- **Excel (.xlsx)** - Colunas "Data de Criação" e "Data de Atualização"
- **CSV (.csv)** - Colunas "Data de Criação" e "Data de Atualização"
- **PDF Tabela** - Colunas de auditoria incluídas
- **PDF Fichas** - Seção de auditoria em cada ficha

## 🕒 Comportamento de Timezone

### Conversão Automática
- Os campos `created_at` e `updated_at` são armazenados em **UTC** no banco
- Na exportação, são **automaticamente convertidos** para o timezone local do usuário
- Utiliza a função `detectUserTimezone()` para detecção automática

### Exemplo
```typescript
// Banco de dados (UTC)
created_at: "2025-08-13T21:46:00.000Z"

// Export (timezone local Brasil -3)
"Data de Criação": "13/08/2025"
```

## 🔧 Como os Campos São Processados

### 1. **Formulário Individual**
```typescript
// Seção 7: Campos de Auditoria
"Data de Criação": formatarDataUniversal(formData.created_at),
"Data de Atualização": formatarDataUniversal(formData.updated_at),
```

### 2. **Lista de Notificações**
```typescript
// Campos de Auditoria
"Data de Criação": formatarDataUniversal(original.created_at),
"Data de Atualização": formatarDataUniversal(original.updated_at),
```

### 3. **Função formatarDataUniversal**
```typescript
const { timezone_name } = detectUserTimezone();
return date.toLocaleDateString("pt-BR", {
  timeZone: timezone_name,
  day: "2-digit",
  month: "2-digit", 
  year: "numeric",
});
```

## ⚠️ Observações Importantes

1. **Campos Opcionais**: Os campos de auditoria são opcionais (`created_at?`, `updated_at?`)
2. **Dados Existentes**: Se os campos não estiverem presentes, aparecerão vazios no export
3. **Formato de Data**: Sempre no formato brasileiro DD/MM/AAAA
4. **Timezone**: Conversão automática de UTC para timezone local do usuário

## 🚀 Próximos Passos

1. **Testar Exports**: Verificar se os campos aparecem corretamente em todos os formatos
2. **Validar Timezone**: Confirmar que a conversão UTC → Local está funcionando
3. **Atualizar Backend**: Garantir que os campos `created_at` e `updated_at` sejam retornados pela API
4. **Documentar API**: Atualizar documentação da API para incluir os novos campos

## 📝 Arquivos Modificados

```
frontend-saudepara/
├── src/features/notificationForms/
│   ├── components/
│   │   ├── types.ts                    # ✅ Interface FormData
│   │   └── exportUtilities.ts          # ✅ Funções de export
│   └── utils/
│       └── index.ts                     # ✅ adjustDatesForExport
└── EXPORT_AUDIT_FIELDS.md              # 📄 Esta documentação
```

---

**Data da Implementação**: 13/08/2025  
**Status**: ✅ Concluído  
**Ambiente**: Frontend (React/TypeScript)

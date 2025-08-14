# 👶 Formatação de Idade nos Exports

## ✅ Nova Lógica Implementada

### 📋 **Regras de Formatação**

A idade é sempre inserida em **meses** e formatada seguindo estas regras:

#### 🔢 **Lógica Única: Todos os Valores são Meses**

| Valor Digitado (Meses) | Formato Exibido |
|-------------------------|----------------|
| 0                       | "0 meses"      |
| 1                       | "1 mês"        |
| 2-11                    | "2 meses", "3 meses", ..., "11 meses" |
| 12-23                   | "1 ano"        |
| 24-35                   | "2 anos"       |
| 36-47                   | "3 anos"       |
| 48+                     | "4 anos", "5 anos", etc. |

#### 📊 **Exemplos Práticos:**

```
Digitado: 4 meses   → Export: "4 meses"
Digitado: 11 meses  → Export: "11 meses" 
Digitado: 12 meses  → Export: "1 ano"
Digitado: 18 meses  → Export: "1 ano"
Digitado: 24 meses  → Export: "2 anos"
Digitado: 48 meses  → Export: "4 anos"
Digitado: 480 meses → Export: "40 anos"
```

## 🔧 **Implementação Técnica**

### 1. **Função calculateAge (Para Data de Nascimento)**
```typescript
const calculateAge = (dateString: string): string => {
  // Calcula diferença em meses
  let totalMonths = (hoje - nascimento) em meses;
  
  // Aplica regras de formatação
  if (totalMonths === 1) return "1 mês";
  if (totalMonths >= 2 && totalMonths <= 11) return `${totalMonths} meses`;
  if (totalMonths >= 12 && totalMonths < 24) return "1 ano";
  if (totalMonths >= 24) return `${Math.floor(totalMonths / 12)} anos`;
}
```

### 2. **Funções getAge (Para Idade Digitada)**
```typescript
const getAge = (): string => {
  const idadeNum = parseInt(formData.idade); // Sempre em meses
  
  // 0-11: meses literais
  if (idadeNum >= 0 && idadeNum <= 11) return `${idadeNum} meses`;
  
  // 12+: converter para anos
  if (idadeNum >= 12) {
    const years = Math.floor(idadeNum / 12);
    return `${years} anos`;
  }
}
```

## 📋 **Campos Afetados**

### ✅ **Exportação Individual**
- **Excel (.xlsx)** - Campo "Idade"
- **CSV (.csv)** - Campo "Idade"
- **Word (.doc)** - Campo "Idade"
- **PDF (.pdf)** - Seção 3: "Idade"

### ✅ **Lista de Notificações**
- **Excel (.xlsx)** - Coluna "Idade"
- **CSV (.csv)** - Coluna "Idade"
- **PDF Tabela** - Coluna "Idade"
- **PDF Fichas** - Campo "Idade" em cada ficha

## 🎯 **Cenários de Uso**

### 1. **Idade Digitada Diretamente (Em Meses)**
```typescript
formData.idade = "4"   // 4 meses
// Export: "4 meses"

formData.idade = "48"  // 48 meses  
// Export: "4 anos"
```

### 2. **Idade Calculada pela Data de Nascimento**
```typescript
dataNascimento = "2024-02-13"
dataAtual = "2025-08-13"
// Resultado: 18 meses → "1 ano"
```

## ⚠️ **Importante: Sistema de Entrada**

- ✅ **0-11**: Pode digitar diretamente (0 meses, 1 mês, ..., 11 meses)
- ✅ **12+**: Deve digitar em meses (12 para 1 ano, 24 para 2 anos, etc.)
- ✅ **Automático**: Sistema converte automaticamente para a exibição correta

## 🧪 **Casos de Teste**

| Input (Meses) | Output Esperado |
|---------------|----------------|
| "0" | "0 meses" |
| "1" | "1 mês" |
| "4" | "4 meses" |
| "11" | "11 meses" |
| "12" | "1 ano" |
| "23" | "1 ano" |
| "24" | "2 anos" |
| "48" | "4 anos" |
| "480" | "40 anos" |
| null | "" |
| "abc" | "abc" |

---

**Data da Implementação**: 13/08/2025  
**Status**: ✅ Concluído  
**Ambiente**: Frontend (React/TypeScript)
```typescript
// Se idade < 100: assumir meses
// Se idade >= 100: assumir anos
if (idadeNum < 100) {
  // Processar como meses
} else {
  // Processar como anos
}
```

## 📋 **Campos Afetados**

### ✅ **Exportação Individual**
- **Excel (.xlsx)** - Campo "Idade"
- **CSV (.csv)** - Campo "Idade"
- **Word (.doc)** - Campo "Idade"
- **PDF (.pdf)** - Seção 3: "Idade"

### ✅ **Lista de Notificações**
- **Excel (.xlsx)** - Coluna "Idade"
- **CSV (.csv)** - Coluna "Idade"
- **PDF Tabela** - Coluna "Idade"
- **PDF Fichas** - Campo "Idade" em cada ficha

## 🎯 **Cenários de Uso**

### 1. **Idade Informada Diretamente**
```typescript
formData.idade = "18" // meses
// Export: "1 ano"

formData.idade = "30" // meses  
// Export: "2 anos"
```

### 2. **Idade Calculada pela Data de Nascimento**
```typescript
dataNascimento = "2024-02-13"
dataAtual = "2025-08-13"
// Resultado: 18 meses → "1 ano"
```

### 3. **Idade em Anos (valores altos)**
```typescript
formData.idade = "150" // assume-se anos
// Export: "150 anos"
```

## ⚠️ **Validações e Tratamentos**

### 🛡️ **Validações Implementadas**
- Verificação se valor é numérico
- Tratamento de valores negativos (retorna "0 meses")
- Fallback para string original se não for numérico
- Tratamento de erro com console.error

### 🔄 **Compatibilidade**
- ✅ Mantém compatibilidade com dados existentes
- ✅ Funciona com campos string ou number
- ✅ Suporta cálculo automático por data de nascimento
- ✅ Preserva valores não-numéricos como estão

## 📝 **Arquivos Modificados**

```
frontend-saudepara/
├── src/features/notificationForms/
│   └── components/
│       └── exportUtilities.ts      # ✅ Funções de formatação
└── IDADE_FORMATACAO.md             # 📄 Esta documentação
```

## 🧪 **Casos de Teste**

| Input | Tipo | Output Esperado |
|-------|------|----------------|
| "1" | meses | "1 mês" |
| "11" | meses | "11 meses" |
| "12" | meses | "1 ano" |
| "23" | meses | "1 ano" |
| "24" | meses | "2 anos" |
| "36" | meses | "3 anos" |
| "150" | anos | "150 anos" |
| null | - | "" |
| "abc" | string | "abc" |

---

**Data da Implementação**: 13/08/2025  
**Status**: ✅ Concluído  
**Ambiente**: Frontend (React/TypeScript)

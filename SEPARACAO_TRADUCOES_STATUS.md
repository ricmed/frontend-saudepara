# Organização das Traduções - Status Atual

## ✅ Concluído

### Estrutura de Arquivos
- ✅ Criada pasta `src/i18n/locales/` para organizar traduções por idioma
- ✅ Criado `src/i18n/locales/index.ts` para agregar exportações

### Idiomas Separados em Arquivos Individuais
1. ✅ **Português (pt-BR)** - `locales/pt-BR.ts`
2. ✅ **Inglês (en)** - `locales/en.ts`
3. ✅ **Espanhol (es)** - `locales/es.ts`
4. ✅ **Alemão (de)** - `locales/de.ts`
5. ✅ **Japonês (ja)** - `locales/ja.ts`

### Integração
- ✅ Imports adicionados em `translations.ts`
- ✅ Tipo `Language` atualizado para incluir "de" e "ja"
- ✅ Seletor de idiomas atualizado para mostrar Alemão e Japonês

## ⏳ Pendente

### Idiomas a Separar
Ainda precisam ser extraídos do `translations.ts` para arquivos individuais:

6. ⏳ **Chinês (zh)** - criar `locales/zh.ts`
7. ⏳ **Francês (fr)** - criar `locales/fr.ts`
8. ⏳ **Árabe (ar)** - criar `locales/ar.ts`
9. ⏳ **Russo (ru)** - criar `locales/ru.ts`

### Limpeza do translations.ts
- ⏳ Remover objetos inline duplicados de pt-BR, en, es do arquivo `translations.ts`
- ⏳ Manter apenas as referências aos imports

### Chaves Faltantes
Alguns idiomas estão com chaves faltantes. Precisam ser adicionadas:

**Chaves que faltam em alguns idiomas:**
- `menu.emergencies`
- `menu.consultations`
- `menu.exams`
- `menu.faq`
- `menu.servicos`
- `localize.viewMap`
- `banner.welcome`
- `banner.subtitle`
- `banner.findService`
- `fab.notifique`

## 📋 Próximos Passos

### 1. Criar Arquivos Restantes
Criar os arquivos para Chinês, Francês, Árabe e Russo seguindo o mesmo padrão dos já criados:

```typescript
import { TranslationRecord } from '../types';
import { adminTranslations } from '../../keycloak/admin/translations';

export const [IDIOMA]: TranslationRecord = {
  ...adminTranslations.[idioma],
  // ... traduções específicas
};
```

### 2. Limpar translations.ts
Após criar todos os arquivos, o `translations.ts` deve ficar assim:

```typescript
import { TranslationsType } from './types';
import { ptBR } from './locales/pt-BR';
import { en } from './locales/en';
import { es } from './locales/es';
import { zh } from './locales/zh';
import { fr } from './locales/fr';
import { ar } from './locales/ar';
import { ru } from './locales/ru';
import { de } from './locales/de';
import { ja } from './locales/ja';

export const translations: TranslationsType = {
  "pt-BR": ptBR,
  "en": en,
  "es": es,
  "zh": zh,
  "fr": fr,
  "ar": ar,
  "ru": ru,
  "de": de,
  "ja": ja
};
```

### 3. Completar Chaves Faltantes
Adicionar as chaves faltantes em todos os idiomas para evitar erros de TypeScript.

### 4. Atualizar locales/index.ts
```typescript
export { ptBR } from './pt-BR';
export { en } from './en';
export { es } from './es';
export { zh } from './zh';
export { fr } from './fr';
export { ar } from './ar';
export { ru } from './ru';
export { de } from './de';
export { ja } from './ja';
```

## 🎯 Benefícios da Nova Estrutura

1. **Organização**: Cada idioma em seu próprio arquivo
2. **Manutenibilidade**: Mais fácil encontrar e atualizar traduções
3. **Performance**: Possibilidade futura de lazy loading
4. **Escalabilidade**: Fácil adicionar novos idiomas
5. **Colaboração**: Múltiplos desenvolvedores podem trabalhar em idiomas diferentes simultaneamente

## 📝 Notas Técnicas

- Todos os arquivos de tradução importam `adminTranslations` via spread operator
- O tipo `TranslationRecord` garante type safety
- Bandeiras são carregadas do serviço flagcdn.com
- Cada arquivo exporta uma constante nomeada com o código do idioma

## 🚀 Como Adicionar um Novo Idioma

1. Criar arquivo `src/i18n/locales/[codigo].ts`
2. Adicionar todas as chaves de tradução
3. Exportar no `locales/index.ts`
4. Importar no `translations.ts`
5. Adicionar no objeto `translations`
6. Adicionar no tipo `Language` em `types.ts`
7. Adicionar no array `languages` em `components/LanguageSelector/data.ts`

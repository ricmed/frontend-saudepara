# CLAUDE.md — frontend-saudepara

## Stack

React 18 + Vite + TypeScript. React Router 6, TanStack Query 5 (`staleTime: 5min`, `retry: 1`), Axios, Tailwind 3.4. **PWA + offline com `idb` (IndexedDB) é central**, não opcional. Mapas: Leaflet + markercluster + Google Maps. Charts: Recharts + react-google-charts. Export: xlsx, papaparse, file-saver, docx, react-csv. UI: lucide-react. `react-toastify` está nas deps mas o padrão atual exibe erros via `<Alert>` — toast aparece pouco. Testes: Vitest + Playwright + Testing Library.

PDF: 4 libs em uso real (`@react-pdf/renderer` em DAE, `jspdf`+`jspdf-autotable` espalhado, `pdf-lib` em notificationForms, `@progress/kendo-react-pdf` no `package.json` mas sem uso em `src/`). Não adicionar mais.

`mysql2` no `package.json` **não tem nenhum import em `src/`** — dep morta, pode ser removida.

**Auth no front ainda usa `AuthProvider` Keycloak** (`src/keycloak/AuthProvider`). O backend está migrando para auth interna; o front ainda não. Mudanças aqui têm que considerar isso.

## Estrutura

**Feature-based**, não por tipo. Em `src/features/`: `apps/`, `auth/`, `dashboard/`, `dynamic-forms/`, `notificationForms/`, `comunicacao-dae/`, `chat/`, `campaigns/` — cada uma com `components/`, `hooks/`, `pages/`, `services/`. Globais ficam em `src/components/`, `src/hooks/`, `src/services/`. Não despejar componente de domínio em `src/components/`.

Axios configurado em `src/utils/axiosRetry.ts`: `withCredentials: true`, interceptor de 401 (refresh via `/api/auth/refresh` ou `/api-auth/auth/refresh`) e 429 (backoff + evento `retry429`). **Usar este axios, não `fetch()` direto** — código novo com `fetch` perde o retry e o refresh de auth.

React Query: padrão **hook-per-resource** (`useAtendimento`, `useBairro`, etc.) com `useQuery` + `useMutation` encapsulados. Toda mutation precisa chamar `queryClient.invalidateQueries(...)` explicitamente — não há invalidação automática.

Formulários dinâmicos: `src/features/dynamic-forms/components/FormRenderer.tsx`. Campos especializados: `TextField`, `SelectField`, `CodeListSelectField`, `FileUploadField`, `SignatureField`, `GeoLocationField`, `GoogleMapsAddressField`. Componente é grande (1300+ linhas) — não aumentar, preferir extrair.

Offline: `src/services/offlineDB.ts` e `offlineDataManager.ts`. Object stores em `idb`: `notificacoes` (com index `synced`), `pacientes` (indices `cpf`, `nome`), `cache` (dropdowns). Hoje **não há tratamento explícito de rejeição do backend após sync** — se for tocar fluxo offline, considerar isso.

## Contexto

Sistema de saúde pública (SES-PA), sujeito à LGPD. Trata dados sensíveis: nome de paciente, CPF, CNS, telefone, endereço, anexos médicos, dados de DAE e notificações.

## Regras inegociáveis

1. **Nunca** alterar `.env*`, tokens, chaves de Google Maps ou da OpenAI.

2. **Nunca** salvar dados sensíveis (CPF, CNS, nome de paciente, telefone, endereço, payload de notificação, **API keys**) em `localStorage`/`sessionStorage`. O projeto **já tem violação real**: `aiGlobalConfig` salva chave da OpenAI em texto puro no localStorage. Isso é débito — não replicar o padrão. Para offline, IndexedDB via `idb`.

3. **Nunca** logar dados sensíveis no `console`.

4. **Nunca** chamar OpenAI/Groq/OpenRouter direto do navegador com chave que vaze no bundle ou em localStorage. O caminho certo é proxy via backend.

5. **Nunca** alterar contrato de API (payload, response, query, headers) sem avisar que o backend também muda.

6. **Nunca** usar `fetch()` direto para a API do projeto — usar o axios de `src/utils/axiosRetry.ts`.

7. **Nunca** adicionar lib de PDF, chart, mapa ou export sem checar as existentes.

8. Evitar `any`. Tipar props, payloads, responses, e dados que vêm do IndexedDB.

## Padrões

- Toda chamada de API trata `loading`, `erro`, `estado vazio`.
- Toda mutation invalida as queries correspondentes do React Query.
- Erros de API: extrair `error.response?.data?.message` em vez de mensagem genérica.
- Componentes >500 linhas devem ser quebrados (existem alguns com 1300-1900 linhas — não imitar).
- Lógica reutilizável vai para hook (`src/hooks/` ou `src/features/<x>/hooks/`).
- Em telas offline, pensar no que acontece quando o backend rejeita um registro criado offline.
- Preservar Tailwind existente. Acessibilidade básica.

## Comandos seguros (sem confirmação)

`dev`, `lint`, `test:unit`, `test:e2e`, `build`. Variantes `build:producao`/`build:homologacao` pedem confirmação.

## Como trabalhar

Ler só os arquivos da tela/componente em questão. Antes de criar coisa nova, ver se há equivalente em `src/features/<dominio>/`. Para >3 arquivos, mudança de contrato de API, ou fluxo offline, explicar plano antes. Ao final: arquivos alterados, como testar, se algo no backend precisa mudar.

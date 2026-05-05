Crie ou ajuste a tela/componente solicitado, seguindo os padrões reais do projeto.

## Antes de codar

1. Ler `CLAUDE.md`.
2. Identificar o domínio. Se já existe `src/features/<dominio>/`, trabalhar dentro dele (`components/`, `hooks/`, `pages/`, `services/`). Não criar componente de domínio em `src/components/` (essa pasta é só para coisas globais/genéricas).
3. Localizar o que pode ser reutilizado:
   - hooks de recurso já existentes (padrão `useAtendimento`, `useBairro` — `useQuery`/`useMutation` encapsulados).
   - service correspondente que chama a API.
   - componentes de campo já prontos (`TextField`, `SelectField`, `CodeListSelectField`, `FileUploadField`, `SignatureField`, `GeoLocationField`, `GoogleMapsAddressField` em `src/features/dynamic-forms/components/`).
4. Verificar contrato da API a ser consumida (payload, response, autenticação).
5. Se a alteração for grande (>3 arquivos) ou afetar contrato de API ou fluxo offline, explicar o plano antes de implementar.

## Durante a implementação

- **HTTP**: usar o axios configurado em `src/utils/axiosRetry.ts` (`withCredentials: true`, retry em 401/429). **Não usar `fetch()` direto** — perde refresh de auth e backoff.
- **React Query**: hook por recurso (`useFooBar`) com `useQuery`/`useMutation`. Toda mutation deve chamar `queryClient.invalidateQueries(...)` explicitamente das queries afetadas.
- **Tipagem**: tipar props, payloads e responses. Evitar `any`.
- **Estados**: tratar `loading`, `erro`, `estado vazio` em toda tela que consulta API.
- **Erros**: extrair `error.response?.data?.message` em vez de mensagem genérica. Padrão atual usa `<Alert>` — toast (`react-toastify`) só se já for o padrão da feature.
- **Formulários**: usar os componentes de campo existentes. Validação clara, máscaras (`libphonenumber-js` para telefone), confirmação antes de envio destrutivo.
- **Offline**: se a tela opera offline, usar `idb` via os helpers em `src/services/offlineDB.ts`. Pensar no caso "registro salvo offline → backend rejeita depois" (hoje a maioria dos fluxos não trata; sinalizar se for relevante).
- **Sensível**: não salvar CPF, CNS, nome de paciente, telefone, endereço, payload de notificação ou API key em `localStorage`/`sessionStorage`. Não logar no `console`.
- **Visual**: preservar Tailwind existente. Acessibilidade básica (label, foco visível, contraste).
- **Tamanho**: se o componente passar de ~500 linhas ou múltiplas responsabilidades, quebrar em sub-componentes.

## Ao final

1. Listar arquivos alterados.
2. Indicar se há nova rota ou alteração de roteamento.
3. Como testar — passo a passo na UI ou comando de teste (`test:unit`, `test:e2e`).
4. Se algo no contrato de API mudou ou se um endpoint do backend precisa ser ajustado, sinalizar explicitamente.
5. Se a tela toca offline, descrever o comportamento esperado online vs offline e o que acontece na sincronização.

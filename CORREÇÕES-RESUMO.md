# Resumo das Correções - API Configuration

## O que foi corrigido:

### 1. GitHub Actions (.github/workflows/build-and-deploy.yml)
```yaml
# ANTES (incorreto):
VITE_API_SERVER=""
VITE_API_BASE_URL="/api"

# DEPOIS (correto):
VITE_API_SERVER="https://app-api.saude.pa.gov.br"
VITE_API_BASE_URL=""
```

### 2. Dockerfile.github
```dockerfile
# ANTES (incorreto):
ARG VITE_API_SERVER=""
ARG VITE_API_BASE_URL="/api"

# DEPOIS (correto):
ARG VITE_API_SERVER="https://app-api.saude.pa.gov.br"
ARG VITE_API_BASE_URL=""
```

### 3. Docker Stack (docker-stack-minimal.yml)
```yaml
# Removido proxy complexo, mantido apenas:
environment:
  - API_AUTH_URL=http://172.32.1.98:4000
  - DEBUG=true
```

## Resultado esperado:

- ✅ Chamadas de API irão para: `https://app-api.saude.pa.gov.br/api/usuario-acesso/current`
- ✅ Proxy `/api-auth` funcionará para: `http://172.32.1.98:4000`
- ✅ Aplicação funcionará diretamente sem proxies complexos

## Próximos passos:

1. Aguardar GitHub Actions completar
2. Verificar se nova imagem foi publicada
3. Atualizar stack no Portainer
4. Testar aplicação

---
**Status**: Aguardando build completar...
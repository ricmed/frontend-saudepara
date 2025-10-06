# Deploy Guide - SPA com GitHub Actions e Proxy Reverso

Este guia documenta a configuração de CI/CD para o SPA React/Vite com nginx na porta 80 e suporte a proxy reverso para APIs.

## 📁 Arquivos Criados

### GitHub Actions Workflows
- `.github/workflows/build-and-deploy.yml` - Workflow principal de build e deploy
- `.github/workflows/pr-check.yml` - Verificação rápida para Pull Requests

### Docker
- `Dockerfile.github` - Dockerfile otimizado para GitHub Actions
- `nginx-spa.conf` - Configuração nginx fixa para SPA
- `nginx-spa-template.conf` - Template configurável de nginx
- `entrypoint.sh` - Script de inicialização com configuração dinâmica

### Scripts Locais
- `scripts/local-build.sh` - Script de build local (Linux/Mac)
- `scripts/local-build.ps1` - Script de build local (Windows)
- `scripts/test-proxy.sh` - Teste de configurações de proxy (Linux/Mac)
- `scripts/test-proxy.ps1` - Teste de configurações de proxy (Windows)

### Configuração
- `.env.example` - Exemplo de variáveis de ambiente

## 🚀 Como Funciona

### Workflow Principal (`build-and-deploy.yml`)

1. **Test Job**: Executa testes e lint
2. **Build-and-Push Job**: 
   - Faz build da aplicação
   - Cria imagem Docker
   - Publica no GitHub Container Registry
3. **Deploy Jobs**: Deploy automático para staging (branch develop) e produção (branch main)

### Sistema de Proxy Reverso

O sistema agora suporta configuração dinâmica de proxy:

#### **API-Auth (Fixo)**
- **Rota**: `/api-auth`
- **Destino**: `http://172.32.1.98:4000` (configurável via `API_AUTH_URL`)
- **Uso**: Redirecionamento para Keycloak ou sistema de autenticação

#### **API Backend (Configurável)**
- **Rota**: `/api/` e `:/api/`
- **Destino**: Configurável via `NGINX_PROXY_URL`
- **Controle**: Habilitado/desabilitado via `NGINX_PROXY_BACKEND`

## � Configuração de Variáveis

### Variáveis de Environment

```bash
# Habilitar proxy reverso
NGINX_PROXY_BACKEND=yes

# URL do backend
NGINX_PROXY_URL=http://backend:3000

# URL do serviço de autenticação
API_AUTH_URL=http://172.32.1.98:4000

# Debug (opcional)
DEBUG=true
```

### Para GitHub Actions

Configure os seguintes secrets no repositório:
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_API_SERVER`
- `VITE_API_PORT`

## 🧪 Teste Local

### Windows (PowerShell):
```powershell
# Build e execução
.\scripts\local-build.ps1

# Testes de proxy
.\scripts\test-proxy.ps1
```

### Linux/Mac:
```bash
# Build e execução
chmod +x scripts/local-build.sh scripts/test-proxy.sh
./scripts/local-build.sh

# Testes de proxy
./scripts/test-proxy.sh
```

### Docker Compose:
```bash
# SPA básico
docker-compose up -d

# Com backend mock
docker-compose --profile with-backend up -d

# Desenvolvimento
docker-compose --profile dev up -d
```

Depois acesse:
- Aplicação: http://localhost:8080
- Health check: http://localhost:8080/health

## 📊 Monitoramento

### Health Check
```bash
curl http://localhost:8080/health
# Resposta esperada: "healthy"
```

### Logs do Container
```bash
docker logs spa-test
```

## 🔄 Fluxo de Deploy

### Para Staging (Homologação):
1. Push para branch `develop`
2. GitHub Actions executa automaticamente
3. Deploy para ambiente de staging

### Para Produção:
1. Push para branch `main`
2. GitHub Actions executa automaticamente
3. Deploy para ambiente de produção

## 🛠️ Customização

### Modificar configuração nginx:
Edite o arquivo `nginx-spa.conf` conforme necessário.

### Adicionar novos ambientes:
1. Crie novo environment no GitHub
2. Adicione novo job no workflow
3. Configure as variáveis específicas

### Modificar processo de build:
Edite o `Dockerfile.github` ou os workflows conforme necessário.

## 🔍 Troubleshooting

### Build falha:
1. Verifique os logs do GitHub Actions
2. Teste localmente com os scripts fornecidos
3. Verifique se todas as dependências estão no `package.json`

### Container não inicia:
1. Verifique logs: `docker logs spa-test`
2. Verifique se a porta 8080 não está em uso
3. Teste a configuração nginx

### SPA não carrega rotas:
1. Verifique se `nginx-spa.conf` está sendo usado
2. Confirme se `try_files` está configurado corretamente
3. Verifique se o build está gerando o `index.html`

## 📈 Otimizações Implementadas

- **Multi-stage build**: Reduz tamanho da imagem
- **Cache de dependências**: npm cache no GitHub Actions
- **Compressão**: Gzip habilitado no nginx
- **Cache de assets**: Headers de cache otimizados
- **Segurança**: Headers de segurança configurados
- **Health check**: Monitoramento de saúde da aplicação
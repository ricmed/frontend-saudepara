## 🎯 **RESUMO: Configuração Final - Porta 1001 para Produção**

### ✅ **Arquivos Atualizados:**

1. **`docker-stack.yml`** - Stack completa para produção
2. **`docker-stack-simple.yml`** - Stack simplificada para produção 
3. **`docker-compose.yml`** - Serviço principal atualizado
4. **`PORTAINER_DEPLOY_GUIDE.md`** - Guia atualizado
5. **`PRODUCAO_PORTA_1001.md`** - Guia específico da porta 1001

### 🌐 **Configuração de Rede:**

```
Host (Servidor): Porta 1001
    ↓
Container: Porta 80 (nginx)
    ↓
API Proxy: https://app-api.saude.pa.gov.br
```

### 🚀 **Para Deploy no Portainer:**

#### **1. Acessar Portainer:**
- **Stacks** → **Add stack**
- **Name**: `frontend-saudepara`

#### **2. Stack File:**
Usar conteúdo do `docker-stack-simple.yml`:

```yaml
version: '3.8'

services:
  frontend-saudepara:
    image: ghcr.io/nivspa/frontend-saudepara:latest
    ports:
      - "1001:80"  # ← PORTA 1001 CONFIGURADA
    environment:
      - NGINX_PROXY_BACKEND=yes
      - NGINX_PROXY_URL=https://app-api.saude.pa.gov.br
      - NGINX_PROXY_PATH=/api
      - NGINX_SERVER_NAME=_
      - VITE_API_SERVER=app-api.saude.pa.gov.br
      - VITE_API_PORT=443
    # ... resto da configuração
```

### 🔗 **URLs de Acesso:**

#### **Aplicação Principal:**
```
http://seu-servidor:1001/
```

#### **API Endpoints:**
```
http://seu-servidor:1001/api/health
http://seu-servidor:1001/api/tipo-estado
http://seu-servidor:1001/api-auth/login
```

### 🧪 **Teste Rápido:**

```bash
# Verificar se está funcionando
curl -I http://localhost:1001/

# Testar API proxy
curl http://localhost:1001/api/health
```

### ⚙️ **Comandos Docker Swarm:**

```bash
# Deploy
docker stack deploy -c docker-stack-simple.yml frontend-saudepara

# Verificar
docker service ls

# Logs
docker service logs frontend-saudepara_frontend-saudepara
```

---

✅ **CONFIGURAÇÃO FINALIZADA - PRONTA PARA PRODUÇÃO NA PORTA 1001!**
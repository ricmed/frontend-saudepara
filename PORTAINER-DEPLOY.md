# 🐳 Guia de Deploy no Portainer - SPA Saúde Pará

## 📋 Pré-requisitos

1. **Portainer** instalado e funcionando
2. **Docker Registry** configurado (GitHub Container Registry)
3. **Rede Docker** criada (opcional, mas recomendado)

## 🚀 Deploy via Stack (Recomendado)

### 1️⃣ **Acessar Portainer**
- Acesse seu Portainer: `http://seu-servidor:9000`
- Faça login com suas credenciais

### 2️⃣ **Criar Nova Stack**
1. Vá em **Stacks** → **Add stack**
2. Nome da stack: `spa-saudepara`
3. Método: **Upload** ou **Web editor**

### 3️⃣ **Upload do docker-compose**
- Upload do arquivo: `portainer-stack.yml`
- Ou copie o conteúdo para o Web editor

### 4️⃣ **Configurar Variáveis de Ambiente**

#### **Variáveis Obrigatórias:**
```bash
VITE_GOOGLE_MAPS_API_KEY=sua_chave_do_google_maps
VITE_API_SERVER=https://api.saude.pa.gov.br
VITE_API_PORT=443
```

#### **Configuração para Produção:**
```bash
# API Principal
VITE_API_SERVER=https://api.saude.pa.gov.br
VITE_API_PORT=443

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC...sua_chave_aqui

# Proxy interno (se necessário)
NGINX_PROXY_URL=http://backend-saudepara:3000

# Debug
DEBUG=false
```

#### **Configuração para Homologação:**
```bash
# API Principal
VITE_API_SERVER=https://api.hml.saude.pa.gov.br
VITE_API_PORT=443

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC...sua_chave_aqui

# Debug
DEBUG=true
```

### 5️⃣ **Deploy da Stack**
1. Clique em **Deploy the stack**
2. Aguarde o build e inicialização
3. Verifique os logs em **Containers**

## 🌐 Deploy via Container Individual

### 1️⃣ **Criar Container**
1. Vá em **Containers** → **Add container**
2. Nome: `spa-saudepara`
3. Imagem: `ghcr.io/nivspa/frontend-saudepara:latest`

### 2️⃣ **Configurações de Rede**
- **Porta**: `80:80` (ou `8080:80` para teste)
- **Rede**: `bridge` ou rede personalizada

### 3️⃣ **Variáveis de Ambiente**
Adicione as variáveis da seção anterior.

### 4️⃣ **Configurações Avançadas**
- **Restart policy**: `Unless stopped`
- **Health check**: Habilitado

## 🔧 Configurações de Proxy

### **Com Backend Interno (Mesma rede Docker):**
```bash
NGINX_PROXY_BACKEND=yes
NGINX_PROXY_URL=http://nome-container-backend:3000
```

### **Sem Backend (SPA apenas):**
```bash
NGINX_PROXY_BACKEND=no
```

### **API Auth sempre ativa:**
- A API de autenticação (`/api-auth`) sempre redireciona para: `http://172.32.1.98:4000`
- Para mudar, use: `API_AUTH_URL=http://seu-servidor-auth:4000`

## 🎯 Endpoints Após Deploy

### **URLs do SPA:**
- **Aplicação**: `http://seu-servidor/` ou `http://seu-servidor:porta/`
- **Health Check**: `http://seu-servidor/health`
- **API Auth**: `http://seu-servidor/api-auth/`

### **Testes de Funcionamento:**
```bash
# Health check
curl http://seu-servidor/health
# Resposta esperada: "healthy"

# Página principal
curl http://seu-servidor/
# Resposta: HTML do SPA

# API Auth (se configurada)
curl http://seu-servidor/api-auth/status
```

## 🔍 Troubleshooting

### **Container não inicia:**
1. Verifique logs no Portainer
2. Confirme variáveis de ambiente obrigatórias
3. Teste conectividade de rede

### **Aplicação não carrega:**
1. Verifique porta binding
2. Teste health check
3. Verifique logs nginx

### **API Auth não funciona:**
1. Confirme `API_AUTH_URL` está correto
2. Teste conectividade para `172.32.1.98:4000`
3. Verifique firewall/rede

## 📊 Monitoramento

### **Logs:**
- Acesse via Portainer: **Containers** → **spa-saudepara** → **Logs**

### **Métricas:**
- CPU, Memória, Rede disponíveis no dashboard do container

### **Health Check:**
- Status visível na lista de containers
- Endpoint `/health` para monitoramento externo

## 🔄 Atualização

### **Atualizar Imagem:**
1. **Containers** → **spa-saudepara** → **Recreate**
2. Marcar **Pull latest image**
3. **Deploy container**

### **Atualizar Stack:**
1. **Stacks** → **spa-saudepara** → **Editor**
2. Atualizar `image:` para nova versão
3. **Update the stack**

## 🔐 Configurações de Segurança

### **Headers de Segurança (já incluídos):**
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy

### **HTTPS (se usando Traefik):**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.spa.rule=Host(`app.saude.pa.gov.br`)"
  - "traefik.http.routers.spa.entrypoints=websecure"
  - "traefik.http.routers.spa.tls.certresolver=letsencrypt"
```

## 📝 Variáveis Completas de Exemplo

```bash
# Obrigatórias
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC1234567890abcdef
VITE_API_SERVER=https://api.saude.pa.gov.br
VITE_API_PORT=443

# Opcionais
NGINX_PROXY_BACKEND=yes
NGINX_PROXY_URL=http://backend-saudepara:3000
API_AUTH_URL=http://172.32.1.98:4000
DEBUG=false
NODE_ENV=production
```

🎯 **Pronto!** Sua aplicação estará rodando no Portainer com todas as configurações de proxy e autenticação funcionando!
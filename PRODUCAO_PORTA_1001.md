# 🚀 Configuração de Produção - Porta 1001

## ⚙️ **Configurações de Porta Atualizadas**

### **Mapeamento de Portas:**
- **Host (Servidor)**: Porta 1001
- **Container**: Porta 80 (nginx)
- **Protocolo**: HTTP/HTTPS

### **URLs de Acesso:**

#### **Produção:**
```
http://seu-servidor.com:1001
https://seu-servidor.com:1001  (se tiver SSL)
```

#### **Desenvolvimento Local:**
```
http://localhost:1001
http://ip-do-servidor:1001
```

#### **API Endpoints:**
```bash
# Aplicação principal
http://seu-servidor:1001/

# API proxy (redirecionado para app-api.saude.pa.gov.br)
http://seu-servidor:1001/api/health
http://seu-servidor:1001/api/tipo-estado

# Autenticação proxy
http://seu-servidor:1001/api-auth/login
```

## 🔧 **Configuração no Portainer**

### **Stack Configuration:**
Use o arquivo `docker-stack-simple.yml` que já está configurado com:
```yaml
ports:
  - "1001:80"
```

### **Environment Variables:**
```bash
NGINX_PROXY_BACKEND=yes
NGINX_PROXY_URL=https://app-api.saude.pa.gov.br
NGINX_PROXY_PATH=/api
NGINX_SERVER_NAME=_
VITE_API_SERVER=app-api.saude.pa.gov.br
VITE_API_PORT=443
```

## 🧪 **Testes de Conectividade**

### **Verificar se a aplicação está funcionando:**
```bash
# Teste básico da aplicação
curl -I http://seu-servidor:1001/

# Teste do proxy da API
curl http://seu-servidor:1001/api/health

# Teste do health check
curl http://seu-servidor:1001/health
```

### **Comandos de Debug:**
```bash
# Ver logs do container
docker service logs frontend-saudepara_frontend-saudepara

# Verificar se o serviço está rodando
docker service ls | grep frontend-saudepara

# Verificar as portas abertas
netstat -tlnp | grep 1001
```

## 🔒 **Configurações de Firewall**

### **Abrir a porta 1001:**
```bash
# Ubuntu/Debian
sudo ufw allow 1001/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=1001/tcp
sudo firewall-cmd --reload

# Docker Swarm (se necessário)
sudo iptables -A INPUT -p tcp --dport 1001 -j ACCEPT
```

## 🌐 **Configuração de Load Balancer (Opcional)**

### **Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name saudepara.exemplo.com;
    
    location / {
        proxy_pass http://localhost:1001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Traefik (se usando):**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.frontend-saudepara.rule=Host(`saudepara.exemplo.com`)"
  - "traefik.http.services.frontend-saudepara.loadbalancer.server.port=80"
  - "traefik.docker.network=frontend-network"
```

## 📊 **Monitoramento**

### **Health Checks:**
- **Endpoint**: `http://localhost:1001/health`
- **Interval**: 30s
- **Timeout**: 10s
- **Retries**: 3

### **Logs no Portainer:**
1. Acesse **Services**
2. Clique em `frontend-saudepara_frontend-saudepara`
3. Vá na aba **Logs**
4. Configure **Auto-refresh** para monitoramento em tempo real

## ⚠️ **Troubleshooting**

### **Problemas Comuns:**

1. **Porta 1001 não acessível:**
   ```bash
   # Verificar se o container está rodando
   docker ps | grep frontend-saudepara
   
   # Verificar se a porta está sendo usada
   sudo lsof -i :1001
   ```

2. **Container não inicia:**
   ```bash
   # Ver logs de erro
   docker service logs --tail 50 frontend-saudepara_frontend-saudepara
   ```

3. **API não funciona:**
   ```bash
   # Testar conectividade com a API
   curl -I https://app-api.saude.pa.gov.br/health
   
   # Testar proxy interno
   docker exec -it $(docker ps -q --filter name=frontend-saudepara) curl localhost/api/health
   ```

## 🔄 **Comandos de Deploy**

### **Deploy inicial:**
```bash
docker stack deploy -c docker-stack-simple.yml frontend-saudepara
```

### **Atualizar aplicação:**
```bash
# Baixar nova imagem
docker service update --image ghcr.io/nivspa/frontend-saudepara:latest frontend-saudepara_frontend-saudepara

# Ou redesploy da stack completa
docker stack deploy -c docker-stack-simple.yml frontend-saudepara
```

### **Verificar status:**
```bash
docker service ps frontend-saudepara_frontend-saudepara
```

---

✅ **Configuração finalizada para produção na porta 1001!**
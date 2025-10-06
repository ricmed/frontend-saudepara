# Exemplos de Uso dos Scripts de Validação

## 🔍 Script de Validação Portainer

### **Uso Básico:**
```powershell
.\scripts\validate-portainer.ps1 -ApiServer "https://api.saude.pa.gov.br" -GoogleMapsKey "AIzaSyC1234567890abcdef"
```

### **Produção Completa:**
```powershell
.\scripts\validate-portainer.ps1 `
  -Environment "production" `
  -ApiServer "https://api.saude.pa.gov.br" `
  -GoogleMapsKey "AIzaSyC1234567890abcdef" `
  -ApiPort "443"
```

### **Homologação:**
```powershell
.\scripts\validate-portainer.ps1 `
  -Environment "staging" `
  -ApiServer "https://api.hml.saude.pa.gov.br" `
  -GoogleMapsKey "AIzaSyC1234567890abcdef" `
  -ApiPort "443"
```

### **Desenvolvimento Local:**
```powershell
.\scripts\validate-portainer.ps1 `
  -Environment "development" `
  -ApiServer "http://localhost:3000" `
  -GoogleMapsKey "AIzaSyC1234567890abcdef" `
  -ApiPort "3000"
```

## 📋 Variáveis de Ambiente por Ambiente

### **🟢 Produção:**
```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC1234567890abcdef
VITE_API_SERVER=https://api.saude.pa.gov.br
VITE_API_PORT=443
NGINX_PROXY_BACKEND=yes
NGINX_PROXY_URL=http://backend-saudepara:3000
API_AUTH_URL=http://172.32.1.98:4000
DEBUG=false
NODE_ENV=production
```

### **🟡 Homologação:**
```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC1234567890abcdef
VITE_API_SERVER=https://api.hml.saude.pa.gov.br
VITE_API_PORT=443
NGINX_PROXY_BACKEND=yes
NGINX_PROXY_URL=http://backend-saudepara-hml:3000
API_AUTH_URL=http://172.32.1.98:4000
DEBUG=false
NODE_ENV=production
```

### **🔵 Desenvolvimento:**
```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC1234567890abcdef
VITE_API_SERVER=http://localhost:3000
VITE_API_PORT=3000
NGINX_PROXY_BACKEND=no
API_AUTH_URL=http://172.32.1.98:4000
DEBUG=true
NODE_ENV=development
```

## 🎯 Checklist para Deploy Portainer

### **✅ Antes do Deploy:**
- [ ] Chave Google Maps válida
- [ ] API Server acessível
- [ ] API Auth funcionando (`172.32.1.98:4000`)
- [ ] Rede Docker criada (se necessário)
- [ ] Validação executada sem erros

### **✅ No Portainer:**
- [ ] Stack criada com nome `spa-saudepara`
- [ ] Arquivo `portainer-stack.yml` carregado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy executado com sucesso
- [ ] Container em status "running"
- [ ] Health check OK

### **✅ Após Deploy:**
- [ ] Página principal carrega: `http://servidor/`
- [ ] Health check funciona: `http://servidor/health`
- [ ] API Auth responde: `http://servidor/api-auth/status`
- [ ] Logs sem erros críticos

## 🚀 Comandos Úteis

### **Teste Local Rápido:**
```powershell
# Validar configuração
.\scripts\validate-portainer.ps1 -ApiServer "https://api.saude.pa.gov.br" -GoogleMapsKey "sua_chave"

# Testar localmente
docker-compose up -d

# Verificar funcionamento
.\scripts\test-proxy.ps1
```

### **Deploy Manual (se não usar Portainer):**
```bash
# Usar imagem do registry
docker run -d \
  --name spa-saudepara \
  -p 80:80 \
  -e VITE_GOOGLE_MAPS_API_KEY=sua_chave \
  -e VITE_API_SERVER=https://api.saude.pa.gov.br \
  -e VITE_API_PORT=443 \
  -e NGINX_PROXY_BACKEND=yes \
  -e API_AUTH_URL=http://172.32.1.98:4000 \
  ghcr.io/nivspa/frontend-saudepara:latest
```

## 📞 Suporte

Se encontrar problemas:
1. Execute `.\scripts\validate-portainer.ps1` para diagnóstico
2. Verifique logs no Portainer
3. Consulte `PORTAINER-DEPLOY.md` para troubleshooting
4. Teste localmente com `docker-compose up -d`
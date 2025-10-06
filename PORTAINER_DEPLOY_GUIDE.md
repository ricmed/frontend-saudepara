# Guia de Deploy no Portainer com Docker Swarm

## 1. Configuração no Portainer

### Passo 1: Acessar Stacks
1. Abra o Portainer
2. Navegue para **Stacks**
3. Clique em **Add stack**

### Passo 2: Configurar a Stack
- **Name**: `frontend-saudepara`
- **Build method**: Selecione **Web editor**
- **Stack file**: Cole o conteúdo do arquivo `docker-stack.yml`

### Passo 3: Variáveis de Ambiente (Environment variables)
Adicione as seguintes variáveis:

```bash
VITE_GOOGLE_MAPS_API_KEY=sua_chave_do_google_maps_aqui
```

### Passo 4: Deploy
- Clique em **Deploy the stack**

## 2. Configurações de Endpoint

### Para Produção:
```
Endpoint: https://seu-dominio.com:1001
```

### Para Desenvolvimento/Teste:
```
Endpoint: http://ip-do-servidor:1001
```

## 3. Configurações Avançadas no Portainer

### Load Balancer (se usando Traefik):
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.frontend-saudepara.rule=Host(\`seu-dominio.com\`)"
  - "traefik.http.routers.frontend-saudepara.tls=true"
  - "traefik.http.services.frontend-saudepara.loadbalancer.server.port=80"
```

### Secrets (para variáveis sensíveis):
Se você tiver informações sensíveis, use Docker Secrets:

1. Vá em **Secrets** no Portainer
2. Crie um secret com nome `google_maps_api_key`
3. Modifique a stack para usar secrets

## 4. Comandos Docker Swarm (Alternativos)

### Deploy via CLI:
```bash
docker stack deploy -c docker-stack.yml frontend-saudepara
```

### Atualizar a stack:
```bash
docker stack deploy -c docker-stack.yml frontend-saudepara
```

### Remover a stack:
```bash
docker stack rm frontend-saudepara
```

### Verificar status:
```bash
docker service ls
docker service logs frontend-saudepara_frontend-saudepara
```

## 5. Configurações de Rede

### Para acessar de outros containers:
- Network: `frontend-saudepara_frontend-network`
- Service name: `frontend-saudepara_frontend-saudepara`

### Para acesso externo:
- Port: `1001`
- Protocol: `HTTP`

## 6. Monitoramento

### Health Check no Portainer:
- Acesse **Services** → `frontend-saudepara_frontend-saudepara`
- Veja o status do health check
- Logs estão disponíveis na aba **Logs**

### Métricas:
- CPU e Memory usage visíveis no dashboard do Portainer
- Replicas status e distribuição nos nodes

## 7. Troubleshooting

### Problemas Comuns:

1. **Imagem não encontrada**:
   - Verifique se a imagem existe no registry
   - Confirme as credenciais do registry

2. **Health check falhando**:
   - Verifique se o endpoint `/health` está respondendo
   - Ajuste os tempos de timeout se necessário

3. **Problemas de rede**:
   - Confirme que a porta 1001 está acessível
   - Verifique as configurações de firewall

4. **API não funcionando**:
   - Confirme as configurações de proxy
   - Verifique se `app-api.saude.pa.gov.br` está acessível

## 8. Backup e Restore

### Backup da stack:
```bash
docker stack ps frontend-saudepara > backup-stack-config.txt
```

### Export da configuração:
No Portainer, vá em **Stacks** → `frontend-saudepara` → **Editor** → Copie a configuração
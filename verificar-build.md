# Verificação do Build - Troubleshooting

## Como verificar se a nova imagem está sendo usada:

### 1. Verificar no Portainer
1. Acesse Portainer → Services
2. Clique no serviço `frontend-saudepara_app`
3. Na aba **Logs**, procure por:
   - Data/hora de início do container
   - Se mostra a imagem mais recente sendo baixada

### 2. Verificar variáveis de ambiente no container
1. No Portainer → Services → `frontend-saudepara_app`
2. Clique em **Exec Console**
3. Execute: `env | grep VITE`
4. Deve mostrar:
   ```
   VITE_API_SERVER=
   VITE_API_BASE_URL=/api
   ```

### 3. Verificar configuração do nginx
1. No mesmo console, execute:
   ```bash
   cat /etc/nginx/conf.d/default.conf
   ```
2. Deve mostrar a configuração de proxy para `app-api.saude.pa.gov.br`

### 4. Forçar atualização completa
Se ainda não funcionou:
1. Portainer → Stacks → `frontend-saudepara`
2. **Delete** o stack completamente
3. **Recrie** o stack com o mesmo arquivo `docker-stack.yml`
4. Isso força o download da imagem mais recente

## Checklist de Troubleshooting

- [ ] GitHub Actions completou com sucesso?
- [ ] Nova imagem foi enviada para ghcr.io?
- [ ] Portainer fez "Re-pull images"?
- [ ] Container foi recriado (não apenas reiniciado)?
- [ ] Variáveis VITE estão corretas no container?
- [ ] Nginx está configurado corretamente?

## Próximo Passo
Se o problema persistir, delete e recrie o stack completamente no Portainer.
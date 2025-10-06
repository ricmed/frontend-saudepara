#!/bin/sh

# Entrypoint moderno para SPA com configuração dinâmica de proxy

echo "🚀 Iniciando SPA com configuração dinâmica..."

# Definir valores padrão para variáveis não definidas
NGINX_PROXY_BACKEND=${NGINX_PROXY_BACKEND:-"no"}
NGINX_PROXY_URL=${NGINX_PROXY_URL:-"http://backend:3000"}
API_AUTH_URL=${API_AUTH_URL:-"http://172.32.1.98:4000"}

echo "📋 Configurações detectadas:"
echo "  NGINX_PROXY_BACKEND: $NGINX_PROXY_BACKEND"
echo "  NGINX_PROXY_URL: $NGINX_PROXY_URL"
echo "  API_AUTH_URL: $API_AUTH_URL"

# Função para gerar configuração de proxy para /api/
generate_api_proxy_config() {
    if [ "$NGINX_PROXY_BACKEND" = "yes" ]; then
        cat << 'EOF'
    # Configuração de proxy para /api/
    location /api/ {
        proxy_pass NGINX_PROXY_URL_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host app-api.saude.pa.gov.br;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        # Configurações SSL para proxy HTTPS
        proxy_ssl_verify off;
        proxy_ssl_server_name on;
        proxy_ssl_protocols TLSv1.2 TLSv1.3;
    }
EOF
    else
        cat << 'EOF'
    # API proxy desabilitado - retornar 404 para /api/
    location /api/ {
        return 404 "API proxy não configurado";
        add_header Content-Type text/plain;
    }
EOF
    fi
}

# Configurar nginx baseado no template
echo "🔧 Configurando nginx..."

# Copiar template para arquivo de configuração
cp /etc/nginx/conf.d/nginx-spa-template.conf /etc/nginx/conf.d/default.conf

# Gerar configuração de proxy
API_PROXY_CONFIG=$(generate_api_proxy_config)

# Criar arquivo temporário para a substituição
echo "$API_PROXY_CONFIG" > /tmp/api_proxy_config.txt

# Substituir o placeholder pela configuração de proxy
sed -i '/# PLACEHOLDER_API_PROXY_CONFIG/r /tmp/api_proxy_config.txt' /etc/nginx/conf.d/default.conf
sed -i '/# PLACEHOLDER_API_PROXY_CONFIG/d' /etc/nginx/conf.d/default.conf

# Substituir as URLs nos proxies
sed -i "s|NGINX_PROXY_URL_PLACEHOLDER|$NGINX_PROXY_URL|g" /etc/nginx/conf.d/default.conf
sed -i "s|http://172.32.1.98:4000|$API_AUTH_URL|g" /etc/nginx/conf.d/default.conf

echo "✅ Configuração nginx concluída"

# Testar configuração do nginx
echo "🧪 Testando configuração nginx..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração nginx!"
    cat /etc/nginx/conf.d/default.conf
    exit 1
fi

echo "✅ Configuração nginx válida"

# Salvar configuração de ambiente para referência
CONFIG_FILE="/etc/spa-config.env"
cat > $CONFIG_FILE << EOF
# Configuração SPA gerada em $(date)
NGINX_PROXY_BACKEND=$NGINX_PROXY_BACKEND
NGINX_PROXY_URL=$NGINX_PROXY_URL
API_AUTH_URL=$API_AUTH_URL
EOF

echo "📄 Configuração salva em $CONFIG_FILE"

# Debug: mostrar configuração final
if [ "$DEBUG" = "true" ]; then
    echo "🐛 DEBUG: Configuração nginx final:"
    cat /etc/nginx/conf.d/default.conf
fi

# Iniciar nginx
echo "🌐 Iniciando nginx..."
exec nginx -g "daemon off;"
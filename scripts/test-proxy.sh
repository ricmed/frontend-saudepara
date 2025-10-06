#!/bin/bash

# Script para testar configurações de proxy do SPA

echo "🧪 Testando configurações de proxy do SPA..."

# Verificar se o container está rodando
if ! docker ps | grep -q spa-test; then
    echo "❌ Container spa-test não está rodando"
    echo "Execute primeiro: ./scripts/local-build.sh"
    exit 1
fi

BASE_URL="http://localhost:5174"

echo "📋 Executando testes..."

# Teste 1: Health check
echo "1️⃣ Testando health check..."
response=$(curl -s "$BASE_URL/health")
if [ "$response" = "healthy" ]; then
    echo "✅ Health check OK"
else
    echo "❌ Health check falhou: $response"
fi

# Teste 2: Página principal
echo "2️⃣ Testando página principal..."
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$status" = "200" ]; then
    echo "✅ Página principal OK (HTTP $status)"
else
    echo "❌ Página principal falhou (HTTP $status)"
fi

# Teste 3: SPA routing
echo "3️⃣ Testando SPA routing..."
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/any-route")
if [ "$status" = "200" ]; then
    echo "✅ SPA routing OK (HTTP $status)"
else
    echo "❌ SPA routing falhou (HTTP $status)"
fi

# Teste 4: API-auth proxy
echo "4️⃣ Testando proxy api-auth..."
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api-auth" --max-time 10)
if [ "$status" = "200" ] || [ "$status" = "404" ] || [ "$status" = "302" ]; then
    echo "✅ Proxy api-auth respondendo (HTTP $status)"
else
    echo "⚠️  Proxy api-auth: $status (pode estar normal se serviço não estiver disponível)"
fi

# Teste 5: API proxy
echo "5️⃣ Testando proxy api..."
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/test" --max-time 10)
if [ "$status" = "200" ] || [ "$status" = "404" ] || [ "$status" = "502" ]; then
    echo "✅ Proxy api respondendo (HTTP $status)"
else
    echo "⚠️  Proxy api: $status (pode estar normal se backend não estiver disponível)"
fi

# Teste 6: Verificar configuração nginx
echo "6️⃣ Verificando configuração nginx..."
docker exec spa-test nginx -t 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Configuração nginx válida"
else
    echo "❌ Configuração nginx inválida"
fi

# Teste 7: Verificar logs
echo "7️⃣ Últimas linhas dos logs:"
docker logs spa-test --tail 5

echo ""
echo "🏁 Testes concluídos!"
echo ""
echo "🔗 URLs para teste manual:"
echo "  📱 Aplicação: $BASE_URL"
echo "  ❤️  Health: $BASE_URL/health"
echo "  🔑 Auth: $BASE_URL/api-auth"
echo "  📡 API: $BASE_URL/api/"
echo ""
echo "📊 Para ver logs completos: docker logs spa-test"
echo "🛑 Para parar: docker stop spa-test && docker rm spa-test"
#!/bin/bash

# Script para build e teste local do container

echo "🚀 Iniciando build local do SPA..."

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf dist/
docker rmi spa-local:latest 2>/dev/null || true

# Build da aplicação
echo "📦 Fazendo build da aplicação..."
npm run build

if [ ! -f "dist/index.html" ]; then
    echo "❌ Erro: Build falhou - index.html não encontrado"
    exit 1
fi

echo "✅ Build da aplicação concluído"

# Build do Docker
echo "🐳 Fazendo build do Docker..."
docker build -f Dockerfile.github -t spa-local:latest .

if [ $? -ne 0 ]; then
    echo "❌ Erro: Build do Docker falhou"
    exit 1
fi

echo "✅ Build do Docker concluído"

# Iniciar container
echo "🌐 Iniciando container na porta 8080..."
docker run -d --name spa-test -p 8080:80 \
    -e NGINX_PROXY_BACKEND=yes \
    -e NGINX_PROXY_URL=http://backend:3000 \
    -e API_AUTH_URL=http://172.32.1.98:4000 \
    -e DEBUG=true \
    spa-local:latest

if [ $? -ne 0 ]; then
    echo "❌ Erro: Falha ao iniciar container"
    exit 1
fi

echo "✅ Container iniciado com sucesso!"
echo ""
echo "🌍 Aplicação disponível em: http://localhost:8080"
echo "❤️  Health check: http://localhost:8080/health"
echo ""
echo "Para parar o container: docker stop spa-test"
echo "Para remover o container: docker rm spa-test"
echo "Para ver logs: docker logs spa-test"
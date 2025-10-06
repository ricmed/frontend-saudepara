# Script para build e teste local do container no Windows

Write-Host "🚀 Iniciando build local do SPA..." -ForegroundColor Green

# Limpar builds anteriores
Write-Host "🧹 Limpando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
docker rmi spa-local:latest 2>$null

# Build da aplicação
Write-Host "📦 Fazendo build da aplicação..." -ForegroundColor Blue
npm run build

if (-not (Test-Path "dist\index.html")) {
    Write-Host "❌ Erro: Build falhou - index.html não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build da aplicação concluído" -ForegroundColor Green

# Build do Docker
Write-Host "🐳 Fazendo build do Docker..." -ForegroundColor Blue
docker build -f Dockerfile.github -t spa-local:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro: Build do Docker falhou" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build do Docker concluído" -ForegroundColor Green

# Parar e remover container anterior se existir
docker stop spa-test 2>$null
docker rm spa-test 2>$null

# Iniciar container
Write-Host "🌐 Iniciando container na porta 8080..." -ForegroundColor Blue
docker run -d --name spa-test -p 8080:80 `
    -e NGINX_PROXY_BACKEND=yes `
    -e NGINX_PROXY_URL=http://backend:3000 `
    -e API_AUTH_URL=http://172.32.1.98:4000 `
    -e DEBUG=true `
    spa-local:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro: Falha ao iniciar container" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Container iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "🌍 Aplicação disponível em: http://localhost:8080" -ForegroundColor Cyan
Write-Host "❤️  Health check: http://localhost:8080/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para parar o container: docker stop spa-test" -ForegroundColor Gray
Write-Host "Para remover o container: docker rm spa-test" -ForegroundColor Gray
Write-Host "Para ver logs: docker logs spa-test" -ForegroundColor Gray
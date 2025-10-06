# Script de Teste das Configurações app-api.saude.pa.gov.br

Write-Host "🧪 Testando configurações com app-api.saude.pa.gov.br" -ForegroundColor Green

$baseUrl = "http://localhost:8080"
$apiServer = "https://app-api.saude.pa.gov.br"

Write-Host "`n📋 Executando testes..." -ForegroundColor Blue

# Teste 1: Health check local
Write-Host "1️⃣ Testando health check local..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 10
    if ($response -eq "healthy") {
        Write-Host "✅ Health check OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Health check falhou: $response" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Health check erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Conectividade direta com app-api
Write-Host "2️⃣ Testando conectividade direta com app-api..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $apiServer -TimeoutSec 10
    Write-Host "✅ app-api.saude.pa.gov.br acessível (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ app-api.saude.pa.gov.br erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: API Auth via proxy
Write-Host "3️⃣ Testando API Auth via proxy..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api-auth/status" -TimeoutSec 10
    Write-Host "✅ API Auth via proxy OK (HTTP $($response.StatusCode))" -ForegroundColor Green
    Write-Host "   Resposta: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ API Auth erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 4: Proxy para app-api (endpoint genérico)
Write-Host "4️⃣ Testando proxy para app-api..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
    Write-Host "✅ Proxy app-api respondendo (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 404) {
        Write-Host "⚠️  Proxy funcionando, mas endpoint /api/health não existe (404)" -ForegroundColor Yellow
    } elseif ($status -eq 502 -or $status -eq 503) {
        Write-Host "⚠️  Proxy configurado, mas app-api pode estar offline ($status)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Proxy erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 5: Página principal do SPA
Write-Host "5️⃣ Testando página principal do SPA..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $baseUrl -TimeoutSec 10
    if ($response.StatusCode -eq 200 -and $response.Content -like "*App SaÃºde ParÃ¡*") {
        Write-Host "✅ SPA carregando corretamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SPA carregou mas pode ter problemas no conteúdo" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ SPA erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 6: Configuração nginx no container
Write-Host "6️⃣ Verificando configuração nginx..." -ForegroundColor Cyan
try {
    $nginxTest = docker exec spa-local nginx -t 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Configuração nginx válida" -ForegroundColor Green
    } else {
        Write-Host "❌ Configuração nginx inválida" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar nginx: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 7: Verificar variáveis de ambiente no container
Write-Host "7️⃣ Verificando variáveis de ambiente..." -ForegroundColor Cyan
try {
    $envVars = docker exec spa-local cat /etc/spa-config.env
    Write-Host "✅ Configurações aplicadas:" -ForegroundColor Green
    $envVars | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} catch {
    Write-Host "❌ Erro ao ler configurações: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 Resumo da Configuração:" -ForegroundColor Blue
Write-Host "🔗 Aplicação SPA: $baseUrl" -ForegroundColor Cyan
Write-Host "❤️  Health check: $baseUrl/health" -ForegroundColor Cyan
Write-Host "🔑 API Auth: $baseUrl/api-auth/ → http://172.32.1.98:4000" -ForegroundColor Cyan
Write-Host "📡 API Proxy: $baseUrl/api/ → $apiServer" -ForegroundColor Cyan
Write-Host "🌐 API Direta: $apiServer" -ForegroundColor Cyan

Write-Host "`n🎯 Configuração para Portainer:" -ForegroundColor Blue
Write-Host "VITE_API_SERVER=https://app-api.saude.pa.gov.br" -ForegroundColor White
Write-Host "VITE_API_PORT=443" -ForegroundColor White
Write-Host "NGINX_PROXY_URL=https://app-api.saude.pa.gov.br:443" -ForegroundColor White
Write-Host "NGINX_PROXY_BACKEND=yes" -ForegroundColor White
Write-Host "API_AUTH_URL=http://172.32.1.98:4000" -ForegroundColor White

Write-Host "`n✅ Teste concluído!" -ForegroundColor Green
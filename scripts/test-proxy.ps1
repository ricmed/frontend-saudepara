# Script para testar configurações de proxy do SPA

Write-Host "🧪 Testando configurações de proxy do SPA..." -ForegroundColor Green

# Verificar se o container está rodando
$containerRunning = docker ps --format "table {{.Names}}" | Select-String "spa-local"
if (-not $containerRunning) {
    Write-Host "❌ Container spa-local não está rodando" -ForegroundColor Red
    Write-Host "Execute primeiro: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

$baseUrl = "http://localhost:5174"

Write-Host "📋 Executando testes..." -ForegroundColor Blue

# Teste 1: Health check
Write-Host "1️⃣ Testando health check..." -ForegroundColor Cyan
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

# Teste 2: Página principal
Write-Host "2️⃣ Testando página principal..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Página principal OK (HTTP $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "❌ Página principal falhou (HTTP $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Página principal erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: SPA routing
Write-Host "3️⃣ Testando SPA routing..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/any-route" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SPA routing OK (HTTP $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "❌ SPA routing falhou (HTTP $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ SPA routing erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 4: API-auth proxy
Write-Host "4️⃣ Testando proxy api-auth..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api-auth" -TimeoutSec 10 -ErrorAction SilentlyContinue
    $status = $response.StatusCode
    if ($status -eq 200 -or $status -eq 404 -or $status -eq 302) {
        Write-Host "✅ Proxy api-auth respondendo (HTTP $status)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Proxy api-auth: $status (pode estar normal se serviço não estiver disponível)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Proxy api-auth erro: $($_.Exception.Message) (pode estar normal)" -ForegroundColor Yellow
}

# Teste 5: API proxy
Write-Host "5️⃣ Testando proxy api..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/test" -TimeoutSec 10 -ErrorAction SilentlyContinue
    $status = $response.StatusCode
    if ($status -eq 200 -or $status -eq 404 -or $status -eq 502) {
        Write-Host "✅ Proxy api respondendo (HTTP $status)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Proxy api: $status (pode estar normal se backend não estiver disponível)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Proxy api erro: $($_.Exception.Message) (pode estar normal)" -ForegroundColor Yellow
}

# Teste 6: Verificar configuração nginx
Write-Host "6️⃣ Verificando configuração nginx..." -ForegroundColor Cyan
$nginxTest = docker exec spa-local nginx -t 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Configuração nginx válida" -ForegroundColor Green
} else {
    Write-Host "❌ Configuração nginx inválida" -ForegroundColor Red
}

# Teste 7: Verificar logs
Write-Host "7️⃣ Últimas linhas dos logs:" -ForegroundColor Cyan
docker logs spa-local --tail 5

Write-Host ""
Write-Host "🏁 Testes concluídos!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 URLs para teste manual:" -ForegroundColor Cyan
Write-Host "  📱 Aplicação: $baseUrl" -ForegroundColor Gray
Write-Host "  ❤️  Health: $baseUrl/health" -ForegroundColor Gray
Write-Host "  🔑 Auth: $baseUrl/api-auth" -ForegroundColor Gray
Write-Host "  📡 API: $baseUrl/api/" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Para ver logs completos: docker logs spa-local" -ForegroundColor Gray
Write-Host "🛑 Para parar: docker-compose down" -ForegroundColor Gray
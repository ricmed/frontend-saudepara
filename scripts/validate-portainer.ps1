# Script de Validação para Deploy no Portainer

param(
    [string]$Environment = "production",
    [string]$ApiServer = "",
    [string]$GoogleMapsKey = "",
    [string]$ApiPort = "443"
)

Write-Host "🔍 Validação de Configuração para Portainer" -ForegroundColor Green
Write-Host "Ambiente: $Environment" -ForegroundColor Cyan

# Validações obrigatórias
$errors = @()

if ([string]::IsNullOrEmpty($ApiServer)) {
    $errors += "❌ VITE_API_SERVER não fornecido"
} else {
    Write-Host "✅ API Server: $ApiServer" -ForegroundColor Green
}

if ([string]::IsNullOrEmpty($GoogleMapsKey)) {
    $errors += "❌ VITE_GOOGLE_MAPS_API_KEY não fornecido"
} else {
    $keyPreview = $GoogleMapsKey.Substring(0, [Math]::Min(10, $GoogleMapsKey.Length)) + "..."
    Write-Host "✅ Google Maps Key: $keyPreview" -ForegroundColor Green
}

if ([string]::IsNullOrEmpty($ApiPort)) {
    $errors += "❌ VITE_API_PORT não fornecido"
} else {
    Write-Host "✅ API Port: $ApiPort" -ForegroundColor Green
}

# Teste de conectividade
Write-Host "`n🌐 Testando conectividade..." -ForegroundColor Blue

# Teste API Server
if (-not [string]::IsNullOrEmpty($ApiServer)) {
    try {
        $response = Invoke-WebRequest -Uri $ApiServer -TimeoutSec 10 -ErrorAction SilentlyContinue
        Write-Host "✅ API Server acessível ($($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  API Server não acessível: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Teste API Auth
try {
    $authResponse = Invoke-WebRequest -Uri "http://172.32.1.98:4000" -TimeoutSec 10 -ErrorAction SilentlyContinue
    Write-Host "✅ API Auth acessível" -ForegroundColor Green
} catch {
    Write-Host "⚠️  API Auth não acessível: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Gerar configuração
Write-Host "`n📋 Configuração gerada para Portainer:" -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Gray

$config = @"
# Variáveis de Ambiente para Stack Portainer
VITE_GOOGLE_MAPS_API_KEY=$GoogleMapsKey
VITE_API_SERVER=$ApiServer
VITE_API_PORT=$ApiPort
NGINX_PROXY_BACKEND=yes
NGINX_PROXY_URL=http://backend-saudepara:3000
API_AUTH_URL=http://172.32.1.98:4000
DEBUG=$($Environment -eq "development")
NODE_ENV=$Environment
"@

Write-Host $config -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor Gray

# Salvar em arquivo
$configFile = "portainer-config-$Environment.env"
$config | Out-File -FilePath $configFile -Encoding UTF8
Write-Host "📄 Configuração salva em: $configFile" -ForegroundColor Green

# Resumo de erros
if ($errors.Count -gt 0) {
    Write-Host "`n❌ Erros encontrados:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  $error" -ForegroundColor Red
    }
    Write-Host "`n💡 Corrija os erros antes do deploy" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ Configuração válida! Pronto para deploy." -ForegroundColor Green
    Write-Host "`n🚀 Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Acesse Portainer" -ForegroundColor Gray
    Write-Host "2. Crie nova Stack com portainer-stack.yml" -ForegroundColor Gray
    Write-Host "3. Adicione as variáveis de $configFile" -ForegroundColor Gray
    Write-Host "4. Deploy!" -ForegroundColor Gray
}

Write-Host "`n📖 Para mais detalhes, consulte: PORTAINER-DEPLOY.md" -ForegroundColor Blue
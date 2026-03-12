param(
    [string]$ApiBaseUrl = "http://localhost:5155",
    [string]$Email = "admin@autoprime.com",
    [string]$Password = "Admin@123",
    [string]$DisplayName = "WhatsApp Meta Principal",
    [string]$WabaId,
    [Parameter(Mandatory = $true)][string]$PhoneNumberId,
    [Parameter(Mandatory = $true)][string]$VerifyToken,
    [Parameter(Mandatory = $true)][string]$AccessToken,
    [Parameter(Mandatory = $true)][string]$PublicBaseUrl,
    [switch]$IsPrimary,
    [switch]$IsActive
)

$ErrorActionPreference = "Stop"

if (-not $IsActive.IsPresent) {
    $IsActive = $true
}

if (-not $IsPrimary.IsPresent) {
    $IsPrimary = $true
}

Write-Host "Autenticando em $ApiBaseUrl..." -ForegroundColor Cyan
$login = Invoke-RestMethod `
    -Method Post `
    -Uri "$ApiBaseUrl/api/auth/login" `
    -ContentType "application/json" `
    -Body (@{
        email = $Email
        password = $Password
    } | ConvertTo-Json)

$headers = @{ Authorization = "Bearer $($login.token)" }

Write-Host "Preparando canal Meta..." -ForegroundColor Cyan
$bootstrap = Invoke-RestMethod `
    -Method Post `
    -Uri "$ApiBaseUrl/api/engagement/whatsapp/meta/bootstrap" `
    -Headers $headers `
    -ContentType "application/json" `
    -Body (@{
        displayName = $DisplayName
        wabaId = if ([string]::IsNullOrWhiteSpace($WabaId)) { $null } else { $WabaId }
        phoneNumberId = $PhoneNumberId
        verifyToken = $VerifyToken
        accessToken = $AccessToken
        isActive = [bool]$IsActive
        isPrimary = [bool]$IsPrimary
        publicBaseUrl = $PublicBaseUrl
    } | ConvertTo-Json)

Write-Host "" 
Write-Host "Canal preparado com sucesso." -ForegroundColor Green
Write-Host "ChannelId: $($bootstrap.channelId)"
Write-Host "DisplayName: $($bootstrap.displayName)"
Write-Host "Callback URL: $($bootstrap.callbackUrl)"
Write-Host "Verify Token: $($bootstrap.verifyToken)"
Write-Host "Phone Number ID: $($bootstrap.phoneNumberId)"
Write-Host "WABA ID: $($bootstrap.wabaId)"
Write-Host "Teste OK: $($bootstrap.testSucceeded)"
Write-Host "Status do teste: $($bootstrap.testStatus)"
if ($bootstrap.testError) {
    Write-Host "Erro do teste: $($bootstrap.testError)" -ForegroundColor Yellow
}

Write-Host "" 
Write-Host "Resumo de configuracao para a Meta:" -ForegroundColor Cyan
$setup = Invoke-RestMethod `
    -Method Get `
    -Uri "$ApiBaseUrl/api/engagement/whatsapp/meta/setup?publicBaseUrl=$([uri]::EscapeDataString($PublicBaseUrl))" `
    -Headers $headers

Write-Host "Callback URL: $($setup.callbackUrl)"
Write-Host "Campo de webhook: $($setup.webhookField)"
Write-Host "Webhook path: $($setup.webhookPath)"

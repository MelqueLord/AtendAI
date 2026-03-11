param(
  [string]$ConfigPath = "./ngrok/ngrok.yml"
)

Write-Host "Iniciando tunel ngrok para http://localhost:5155 ..."
Write-Host "Se ainda nao configurou, atualize authtoken em $ConfigPath"

ngrok start --config $ConfigPath atend-ai-api

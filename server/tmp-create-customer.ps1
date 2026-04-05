$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3001/api/v1'
$creds = @{ username = 'admin'; password = 'admin123' } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body $creds -ContentType 'application/json'
$token = $login.data.token
Write-Output "Token: $token"
$headers = @{ Authorization = "Bearer $token" }
$body = @{ name = 'ASCII Customer' } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "$base/customers" -Method Post -Headers $headers -Body $body -ContentType 'application/json'
$res | ConvertTo-Json -Depth 5

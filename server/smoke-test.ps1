$base = 'http://localhost:3001/api/v1'
$pwds = @('admin123','password','admin')
$token = $null

foreach ($p in $pwds) {
  try {
    $body = @{ username = 'admin'; password = $p } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
    $token = $r.data.token
    Write-Output "LOGIN_OK (pwd=$p): $($r.message)"
    break
  } catch {
    Write-Output "LOGIN_FAIL (pwd=$p): $($_.Exception.Message)"
  }
}

if (-not $token) {
  Write-Output 'No token obtained, aborting.'
  exit 0
}

$headers = @{ Authorization = "Bearer $token" }
$endpoints = @('inventory','warehouses','customers','suppliers','sales','purchases','reports/dashboard','settings')

foreach ($ep in $endpoints) {
  try {
    $url = "$base/$ep"
    $res = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -ErrorAction Stop
    Write-Output "--- $ep (OK) ---"
    $res | ConvertTo-Json -Depth 5
  } catch {
    Write-Output "--- $ep (FAILED) ---"
    Write-Output $_.Exception.Message
  }
}

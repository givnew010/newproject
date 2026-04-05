$ErrorActionPreference = 'Stop'

$base = 'http://localhost:3001/api/v1'

Write-Output "1) Login as admin..."
$creds = @{ username = 'admin'; password = 'admin123' } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body $creds -ContentType 'application/json'
$token = $login.data.token
Write-Output "  Token obtained. Message: $($login.message)"

$headers = @{ Authorization = "Bearer $token" }
Write-Output "2) Create sample customer..."
$custName = 'Test Customer Sample'
$custBody = @{ name = $custName; phone = '0500000001'; email = 'cust@example.test'; address = 'Customer Address'; tax_number = ''; credit_limit = 0 } | ConvertTo-Json -Depth 5
try {
  $custRes = Invoke-RestMethod -Uri "$base/customers" -Method Post -Body $custBody -Headers $headers -ContentType 'application/json'
  Write-Output "  Created customer id: $($custRes.data.customer.id) name: $($custRes.data.customer.name)"
} catch {
  Write-Output "  Create customer failed: $($_.Exception.Message) - trying to find existing by name"
  $found = Invoke-RestMethod -Uri ($base + "/customers?search=" + [uri]::EscapeDataString($custName)) -Method Get -Headers $headers
  if ($found.data.customers.Count -gt 0) {
    $existing = $found.data.customers[0]
    $custRes = @{ data = @{ customer = $existing } }
    Write-Output "  Using existing customer id: $($existing.id) name: $($existing.name)"
  } else {
    throw $_
  }
}

Write-Output "3) Create sample supplier..."
$suppName = 'Test Supplier Sample'
$suppBody = @{ name = $suppName; phone = '0500000002'; email = 'supp@example.test'; address = 'Supplier Address' } | ConvertTo-Json -Depth 5
try {
  $suppRes = Invoke-RestMethod -Uri "$base/suppliers" -Method Post -Body $suppBody -Headers $headers -ContentType 'application/json'
  Write-Output "  Created supplier id: $($suppRes.data.supplier.id) name: $($suppRes.data.supplier.name)"
} catch {
  Write-Output "  Create supplier failed: $($_.Exception.Message) - trying to find existing by name"
  $found = Invoke-RestMethod -Uri ($base + "/suppliers?search=" + [uri]::EscapeDataString($suppName)) -Method Get -Headers $headers
  if ($found.data.suppliers.Count -gt 0) {
    $existing = $found.data.suppliers[0]
    $suppRes = @{ data = @{ supplier = $existing } }
    Write-Output "  Using existing supplier id: $($existing.id) name: $($existing.name)"
  } else {
    throw $_
  }
}

Write-Output "4) Read inventory item 10 before purchase..."
try {
  $invBefore = Invoke-RestMethod -Uri "$base/inventory/10" -Method Get -Headers $headers -ErrorAction Stop
  $qBefore = $invBefore.data.item.quantity
  Write-Output "  Item 10 quantity before: $qBefore"
} catch {
  Write-Output "  Warning: could not read item 10. Error: $($_.Exception.Message)"
  $qBefore = $null
}

Write-Output "5) Create purchase invoice (adds stock)..."
$purchaseBody = @{
  supplier_id = $suppRes.data.supplier.id
  payment_type = 'credit'
  items = @(
    @{ item_id = 10; quantity = 50; unit_price = 20; discount = 0 }
  )
  discount_amount = 0
  notes = 'Sample purchase for testing'
} | ConvertTo-Json -Depth 6
$purchaseRes = Invoke-RestMethod -Uri "$base/purchases" -Method Post -Body $purchaseBody -Headers $headers -ContentType 'application/json'
$purchaseId = $purchaseRes.data.id
Write-Output "  Created purchase invoice id: $purchaseId, number: $($purchaseRes.data.invoice_number)"

Write-Output "6) Read inventory item 10 after purchase..."
$invAfterPurchase = Invoke-RestMethod -Uri "$base/inventory/10" -Method Get -Headers $headers
Write-Output "  Item 10 quantity after purchase: $($invAfterPurchase.data.item.quantity)"

Write-Output "7) Register payment for purchase (partial)..."
$paymentPurchaseBody = @{ amount = 100; payment_date = (Get-Date).ToString('yyyy-MM-dd'); payment_method = 'bank'; reference_number = 'PAY-PO-1'; notes = 'payment test' } | ConvertTo-Json -Depth 5
$payPurchaseRes = Invoke-RestMethod -Uri "$base/purchases/$purchaseId/payments" -Method Post -Body $paymentPurchaseBody -Headers $headers -ContentType 'application/json'
Write-Output "  Purchase payment id: $($payPurchaseRes.data.id) amount: $($payPurchaseRes.data.amount)"

Write-Output "8) Create sales invoice (reduces stock)..."
$saleBody = @{
  customer_id = $custRes.data.customer.id
  payment_type = 'credit'
  items = @(
    @{ item_id = 10; quantity = 20; unit_price = 30; discount = 0 }
  )
  discount_amount = 0
  notes = 'sample sale'
} | ConvertTo-Json -Depth 6
$saleRes = Invoke-RestMethod -Uri "$base/sales" -Method Post -Body $saleBody -Headers $headers -ContentType 'application/json'
$saleId = $saleRes.data.id
Write-Output "  Created sale invoice id: $saleId, number: $($saleRes.data.invoice_number)"

Write-Output "9) Read inventory item 10 after sale..."
$invAfterSale = Invoke-RestMethod -Uri "$base/inventory/10" -Method Get -Headers $headers
Write-Output "  Item 10 quantity after sale: $($invAfterSale.data.item.quantity)"

Write-Output "10) Register payment for sale (full)..."
$salePaymentBody = @{ amount = [math]::Round($saleRes.data.total,2); payment_date = (Get-Date).ToString('yyyy-MM-dd'); payment_method = 'cash'; reference_number = 'PAY-SI-1'; notes = 'sale payment test' } | ConvertTo-Json -Depth 5
$paySaleRes = Invoke-RestMethod -Uri "$base/sales/$saleId/payments" -Method Post -Body $salePaymentBody -Headers $headers -ContentType 'application/json'
Write-Output "  Sale payment id: $($paySaleRes.data.id) amount: $($paySaleRes.data.amount)"

Write-Output "11) Fetch payments for purchase and sale..."
$purchasePayments = Invoke-RestMethod -Uri "$base/purchases/$purchaseId/payments" -Method Get -Headers $headers
Write-Output "  Purchase payments count: $($purchasePayments.data.Count)"
$salePayments = Invoke-RestMethod -Uri "$base/sales/$saleId/payments" -Method Get -Headers $headers
Write-Output "  Sale payments count: $($salePayments.data.Count)"

Write-Output "12) Fetch stock movements via backup (filter for item 10)..."
$backup = Invoke-RestMethod -Uri "$base/settings/backup" -Method Post -Headers $headers -ContentType 'application/json'
$movements = $backup.data.stock_movements | Where-Object { $_.item_id -eq 10 }
Write-Output "  Movements for item 10: $($movements.Count)"
foreach ($m in $movements) { Write-Output "    [$($m.id)] type:$($m.type) qty:$($m.quantity) ref_type:$($m.reference_type) ref_id:$($m.reference_id) note:$($m.note) created_at:$($m.created_at)" }

Write-Output "13) Backup size summary:"
Write-Output "  Settings: $($backup.data.settings.Count) rows"
Write-Output "  Inventory: $($backup.data.inventory_items.Count) rows"
Write-Output "  Sales invoices: $($backup.data.sales_invoices.Count) rows"
Write-Output "  Purchase invoices: $($backup.data.purchase_invoices.Count) rows"

Write-Output "Sample data creation and targeted tests completed."

# Echo Contract Deployment (PowerShell)
# Run this yourself: .\contracts\deploy-windows.ps1
#
# Requires: Sui CLI at $env:TEMP\sui-win\sui.exe (already downloaded)
# Private key is read interactively — never stored in script or history.

$SUI = "$env:TEMP\sui-win\sui.exe"
$CONTRACTS = "$PSScriptRoot"

if (-not (Test-Path $SUI)) {
    Write-Error "Sui CLI not found at $SUI. Did the download complete?"
    exit 1
}

Write-Host "Sui CLI: $(& $SUI --version)"

# ── Import key ───────────────────────────────────────────────────────────────
Write-Host "`n▶ Enter your Sui private key (input is hidden):" -ForegroundColor Cyan
$PRIVKEY = (Read-Host -AsSecureString | [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($_)))

$KEYFILE = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($KEYFILE, $PRIVKEY, [System.Text.Encoding]::ASCII)

try {
    $importResult = & $SUI keytool import (Get-Content $KEYFILE) ed25519 2>&1
    Write-Host $importResult
} finally {
    Remove-Item $KEYFILE -Force -ErrorAction SilentlyContinue
}

$ADDRESS = "0xa73d29450da4076e392b29f8e7753cd360aa57da545aa905d75fd0ab07892651"
& $SUI client switch --address $ADDRESS 2>&1 | Select-Object -Last 2

# ── Balance check ─────────────────────────────────────────────────────────────
Write-Host "`n▶ Balance:" -ForegroundColor Cyan
& $SUI client balance 2>&1 | Select-Object -First 10

# ── Build ─────────────────────────────────────────────────────────────────────
Write-Host "`n▶ Building Move package..." -ForegroundColor Cyan
$buildResult = & $SUI move build --path $CONTRACTS 2>&1
Write-Host $buildResult
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}
Write-Host "✅ Build succeeded!" -ForegroundColor Green

# ── Publish ──────────────────────────────────────────────────────────────────
Write-Host "`n▶ Publishing to testnet..." -ForegroundColor Cyan
$publishResult = & $SUI client publish --gas-budget 200000000 --json $CONTRACTS 2>&1
Write-Host $publishResult

# Extract package ID from JSON output
$json = $publishResult | ConvertFrom-Json -ErrorAction SilentlyContinue
$newPkgId = ($json.objectChanges | Where-Object { $_.type -eq "published" }).packageId
$upgCapId = ($json.objectChanges | Where-Object { $_.objectType -like "*UpgradeCap*" }).objectId

if ($newPkgId) {
    Write-Host ""
    Write-Host "✅ DEPLOYED!" -ForegroundColor Green
    Write-Host "   New package ID: $newPkgId" -ForegroundColor Yellow
    Write-Host "   UpgradeCap ID:  $upgCapId" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Add to web/.env.local:" -ForegroundColor Cyan
    Write-Host "   NEXT_PUBLIC_ECHO_PACKAGE_ID=$newPkgId"

    # Update constants automatically
    $envFile = Join-Path $PSScriptRoot "..\web\.env.local"
    if (Test-Path $envFile) {
        $content = Get-Content $envFile
        $content = $content -replace "NEXT_PUBLIC_ECHO_PACKAGE_ID=.*", "NEXT_PUBLIC_ECHO_PACKAGE_ID=$newPkgId"
        Set-Content $envFile $content
        Write-Host "✅ Auto-updated $envFile" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Could not parse package ID from output. Check the JSON above." -ForegroundColor Yellow
}

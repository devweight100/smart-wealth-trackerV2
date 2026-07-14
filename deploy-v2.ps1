$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 Smart Wealth Tracker v2 - Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Create Pages Project
Write-Host "`n[1/7] Creating Pages Project 'smart-wealth-tracker-v2'..." -ForegroundColor Yellow
npx wrangler pages project create smart-wealth-tracker-v2 --production-branch main

# 2. Create D1 Database
Write-Host "`n[2/7] Creating D1 Database 'smart-wealth-db-v2'..." -ForegroundColor Yellow
$d1Output = npx wrangler d1 create smart-wealth-db-v2 | Out-String
Write-Host $d1Output

$d1IdMatch = [regex]::Match($d1Output, 'database_id = "([a-zA-Z0-9\-]+)"')
if ($d1IdMatch.Success) {
    $d1Id = $d1IdMatch.Groups[1].Value
    Write-Host "✅ Extracted D1 ID: $d1Id" -ForegroundColor Green
    
    # Update wrangler.toml
    $tomlPath = "wrangler.toml"
    $tomlContent = Get-Content $tomlPath -Raw
    $tomlContent = $tomlContent -replace 'database_name = "smart-wealth-db"', 'database_name = "smart-wealth-db-v2"'
    $tomlContent = $tomlContent -replace 'database_id   = "[a-zA-Z0-9\-]+"', "database_id   = `"$d1Id`""
    Set-Content -Path $tomlPath -Value $tomlContent
    Write-Host "✅ Updated wrangler.toml with new D1 ID" -ForegroundColor Green
} else {
    Write-Host "⚠️ Warning: Could not automatically find D1 ID. Please update wrangler.toml manually if needed." -ForegroundColor Red
}

# 3. Create R2 Bucket
Write-Host "`n[3/7] Creating R2 Bucket 'smart-wealth-tracker-images-v2'..." -ForegroundColor Yellow
npx wrangler r2 bucket create smart-wealth-tracker-images-v2
$tomlContent = Get-Content $tomlPath -Raw
$tomlContent = $tomlContent -replace 'bucket_name = "smart-wealth-tracker-images"', 'bucket_name = "smart-wealth-tracker-images-v2"'
Set-Content -Path $tomlPath -Value $tomlContent
Write-Host "✅ Updated wrangler.toml for R2 Bucket" -ForegroundColor Green

# 4. Create KV Namespace
Write-Host "`n[4/7] Creating KV Namespace 'smart-wealth-kv-v2'..." -ForegroundColor Yellow
$kvOutput = npx wrangler kv:namespace create smart-wealth-kv-v2 | Out-String
Write-Host $kvOutput

$kvIdMatch = [regex]::Match($kvOutput, 'id = "([a-zA-Z0-9]+)"')
if ($kvIdMatch.Success) {
    $kvId = $kvIdMatch.Groups[1].Value
    Write-Host "✅ Extracted KV ID: $kvId" -ForegroundColor Green
    
    $tomlContent = Get-Content $tomlPath -Raw
    $tomlContent = $tomlContent -replace 'id      = "[a-zA-Z0-9]+"', "id      = `"$kvId`""
    Set-Content -Path $tomlPath -Value $tomlContent
    Write-Host "✅ Updated wrangler.toml with new KV ID" -ForegroundColor Green
}

# 5. Initialize Schema
Write-Host "`n[5/7] Initializing Database Schema (Production)..." -ForegroundColor Yellow
npx wrangler d1 execute smart-wealth-db-v2 --file=migrations/001_initial_schema.sql --remote

# 6. Import Data & Default LINE Config
Write-Host "`n[6/7] Importing Backup Data & LINE Config (Production)..." -ForegroundColor Yellow
npx wrangler d1 execute smart-wealth-db-v2 --file=v2-import.sql --remote

# 7. Deploy to Pages
Write-Host "`n[7/7] Deploying to Cloudflare Pages..." -ForegroundColor Yellow
npx wrangler pages deploy public --project-name=smart-wealth-tracker-v2

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "URL: https://smart-wealth-tracker-v2.pages.dev" -ForegroundColor Green
Write-Host "Login: admin / Htmsxzs7" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# MySQL Setup Script for NEXUS 2.0
# Run as Administrator

Write-Host "Starting MySQL Setup for NEXUS 2.0..." -ForegroundColor Green

# Step 1: Start MySQL Service
Write-Host "`n[1/4] Starting MySQL service..." -ForegroundColor Yellow
$output = net start MySQL80 2>&1
if ($LASTEXITCODE -eq 0 -or $output -like "*already running*") {
    Write-Host "[OK] MySQL service started" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to start MySQL service" -ForegroundColor Red
    Write-Host $output -ForegroundColor Red
    exit 1
}

# Step 2: Wait for MySQL to be ready
Write-Host "`n[2/4] Waiting for MySQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 3: Create database
Write-Host "`n[3/4] Configuring MySQL database..." -ForegroundColor Yellow

$dbOutput = mysql -u root -p1234 -e "CREATE DATABASE IF NOT EXISTS nexus;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database 'nexus' created/verified" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to create database" -ForegroundColor Red
    Write-Host $dbOutput -ForegroundColor Red
    exit 1
}

# Step 4: Verify connection
Write-Host "`n[4/4] Verifying connection..." -ForegroundColor Yellow
$result = mysql -u root -p1234 -e "SELECT 'Connection successful!' as status;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] MySQL connection verified" -ForegroundColor Green
    Write-Host "`n[SUCCESS] MySQL Setup Complete!" -ForegroundColor Green
    Write-Host "`nYour backend will now automatically:" -ForegroundColor Cyan
    Write-Host "  - Connect to: mysql+pymysql://root:1234@localhost:3306/nexus" -ForegroundColor Cyan
    Write-Host "  - Create all required tables" -ForegroundColor Cyan
    Write-Host "`nYou can now start the backend server." -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Connection verification failed" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}

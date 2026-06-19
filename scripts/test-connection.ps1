# Prueba la conexion del backend a MySQL 8.0
# Uso: .\scripts\test-connection.ps1

$ErrorActionPreference = "Stop"

$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$envFile = Join-Path $PSScriptRoot "..\backend\.env"

if (-not (Test-Path $envFile)) {
    Write-Host "No existe backend/.env - copia backend/.env.example primero." -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}

if (-not $env:DB_PASSWORD) {
    $secure = Read-Host "Contrasena MySQL (usuario $($env:DB_USER))" -AsSecureString
    $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    )
}

$env:MYSQL_PWD = $env:DB_PASSWORD

Write-Host "Probando conexion a $($env:DB_HOST):$($env:DB_PORT) / $($env:DB_NAME)..." -ForegroundColor Cyan

$dbName = $env:DB_NAME
$useDbSql = "USE ``$dbName``; SHOW TABLES;"

& $mysqlBin -u $env:DB_USER -h $env:DB_HOST -P $env:DB_PORT -e 'SELECT VERSION() AS version;'
$versionOk = $LASTEXITCODE -eq 0

& $mysqlBin -u $env:DB_USER -h $env:DB_HOST -P $env:DB_PORT -e $useDbSql
$tablesOk = $LASTEXITCODE -eq 0

if ($versionOk -and $tablesOk) {
    Write-Host "Conexion OK." -ForegroundColor Green
} else {
    Write-Host "Conexion fallida. Revisa backend/.env" -ForegroundColor Red
}

Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue

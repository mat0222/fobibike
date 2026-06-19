# Importa fobibike_db.sql en MySQL Server 8.0 (Workbench)
# Uso: .\scripts\import-database.ps1

$ErrorActionPreference = "Stop"

$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$sqlFile = Join-Path $PSScriptRoot "..\fobibike_db.sql"
$dbName = "fobibike_db"

if (-not (Test-Path $mysqlBin)) {
    Write-Host "No se encontro MySQL 8.0 en la ruta predeterminada." -ForegroundColor Red
    Write-Host "Instala MySQL Server 8.0 o ajusta la variable mysqlBin en este script."
    exit 1
}

if (-not (Test-Path $sqlFile)) {
    Write-Host "No se encontro el archivo: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "=== Migracion FobiBike a MySQL 8.0 ===" -ForegroundColor Cyan
Write-Host "Archivo SQL: $sqlFile"
Write-Host ""

$password = Read-Host "Contrasena de MySQL (usuario root)" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

$env:MYSQL_PWD = $plainPassword

try {
    Write-Host "Creando base de datos '$dbName'..." -ForegroundColor Yellow

    $createDbSql = "CREATE DATABASE IF NOT EXISTS ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
    & $mysqlBin -u root -h localhost -P 3306 -e $createDbSql

    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo crear la base de datos. Verifica usuario y contrasena."
    }

    Write-Host "Importando datos (puede tardar unos segundos)..." -ForegroundColor Yellow
    Get-Content $sqlFile -Raw -Encoding UTF8 | & $mysqlBin -u root -h localhost -P 3306 $dbName

    if ($LASTEXITCODE -ne 0) {
        throw "Error durante la importacion del SQL."
    }

    Write-Host ""
    Write-Host "Importacion completada." -ForegroundColor Green
    Write-Host ""
    Write-Host "Verificando tablas..." -ForegroundColor Yellow

    $useDbSql = "USE ``$dbName``; SHOW TABLES;"
    & $mysqlBin -u root -h localhost -P 3306 -e $useDbSql
    & $mysqlBin -u root -h localhost -P 3306 -e 'SELECT COUNT(*) AS total_bicicletas FROM bicicletas;' $dbName
    & $mysqlBin -u root -h localhost -P 3306 -e 'SELECT COUNT(*) AS total_repuestos FROM repuestos;' $dbName

    Write-Host ""
    Write-Host "Siguiente paso: actualiza backend/.env con tu contrasena:" -ForegroundColor Cyan
    Write-Host "  DB_HOST=localhost"
    Write-Host "  DB_PORT=3306"
    Write-Host "  DB_USER=root"
    Write-Host "  DB_PASSWORD=tu_contrasena"
    Write-Host "  DB_NAME=fobibike_db"
}
finally {
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    $plainPassword = $null
}

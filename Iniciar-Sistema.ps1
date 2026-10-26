$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$backendDir = Join-Path $root "backend-node"
$frontendDir = Join-Path $root "Fuentes"
$envPath = Join-Path $backendDir ".env"
$backendPort = 4000
$frontendPort = 5500

function Stop-PortProcess {
  param([int]$Port)

  $connections = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
  $processIds = @($connections | Select-Object -ExpandProperty OwningProcess -Unique)

  foreach ($listenerProcessId in $processIds) {
    $process = Get-Process -Id $listenerProcessId -ErrorAction SilentlyContinue
    $processName = if ($process) { $process.ProcessName } else { "proceso desconocido" }
    $answer = Read-Host "El puerto $Port ya lo usa $processName (PID $listenerProcessId). ¿Deseas cerrarlo? (S/N)"
    if ($answer -notmatch "^[sS]$") {
      throw "Inicio cancelado. Libera el puerto $Port y vuelve a ejecutar el lanzador."
    }

    Stop-Process -Id $listenerProcessId -Force
  }
}

function Read-Default {
  param([string]$Prompt, [string]$Default)

  $value = Read-Host "$Prompt [$Default]"
  if ([string]::IsNullOrWhiteSpace($value)) { return $Default }
  return $value.Trim()
}

try {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "No se encontró Node.js. Instala Node.js 18 o posterior y vuelve a ejecutar este archivo."
  }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "No se encontró npm. Reinstala Node.js activando la opción de agregarlo al PATH."
  }
  if (-not (Get-Command py -ErrorAction SilentlyContinue) -and -not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "No se encontró Python. Instala Python 3 y activa la opción 'Add Python to PATH'."
  }

  if (-not (Test-Path $envPath)) {
    Write-Host "Primera ejecución: configura la conexión con MySQL." -ForegroundColor Cyan
    Write-Host "La base de datos mujermagicabd debe existir en el servidor MySQL."
    $dbHost = Read-Default "Servidor MySQL" "localhost"
    $dbPort = Read-Default "Puerto MySQL" "3306"
    $dbUser = Read-Default "Usuario MySQL" "root"
    $securePassword = Read-Host "Contraseña MySQL (Enter si no tiene)" -AsSecureString
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    try {
      $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    } finally {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
    $dbName = Read-Default "Nombre de la base de datos" "mujermagicabd"
    $escapedPassword = $dbPassword.Replace('\', '\\').Replace('"', '\"')
    $envLines = @(
      "DB_HOST=$dbHost",
      "DB_PORT=$dbPort",
      "DB_USER=$dbUser",
      "DB_PASSWORD=`"$escapedPassword`"",
      "DB_NAME=$dbName",
      "PORT=$backendPort"
    )
    Set-Content -LiteralPath $envPath -Value $envLines -Encoding Ascii
    Write-Host "Configuración creada en backend-node\.env (no se sube a Git)." -ForegroundColor Green
  } else {
    Write-Host "Se conservará la configuración existente de backend-node\.env." -ForegroundColor DarkGray
  }

  if (-not (Test-Path (Join-Path $backendDir "node_modules"))) {
    Write-Host "Instalando dependencias del backend..." -ForegroundColor Cyan
    Push-Location $backendDir
    try { npm install } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { throw "npm install terminó con error." }
  }

  Stop-PortProcess -Port $backendPort
  Stop-PortProcess -Port $frontendPort

  $powershellPath = Join-Path $PSHOME "powershell.exe"
  Start-Process -FilePath $powershellPath `
    -ArgumentList @("-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "npm start") `
    -WorkingDirectory $backendDir

  if (Get-Command py -ErrorAction SilentlyContinue) {
    $frontendCommand = "py -3 -m http.server $frontendPort"
  } else {
    $frontendCommand = "python -m http.server $frontendPort"
  }
  Start-Process -FilePath $powershellPath `
    -ArgumentList @("-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand) `
    -WorkingDirectory $frontendDir

  Write-Host "Backend iniciado en http://localhost:$backendPort" -ForegroundColor Green
  Write-Host "Frontend: http://localhost:$frontendPort/sistema-completo.html" -ForegroundColor Green
  Write-Host "Deja abiertas las dos ventanas de PowerShell mientras uses el sistema."
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
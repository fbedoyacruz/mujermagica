$ErrorActionPreference = 'Stop'

$taskName = 'MujerMagica-BackupDiario-1800'
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$backupScript = Join-Path $PSScriptRoot 'backup.js'
$environmentFile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path -LiteralPath $environmentFile)) {
    throw 'Configura el archivo .env del backend antes de registrar el respaldo.'
}

$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$arguments = '"' + $backupScript + '" --daily'
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing -and ($existing.Actions.Execute -ne $nodePath -or $existing.Actions.Arguments -ne $arguments)) {
    throw 'Ya existe una tarea con ese nombre y otra configuracion. No se modifico.'
}

$action = New-ScheduledTaskAction -Execute $nodePath -Argument $arguments -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -Daily -At '18:00'
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 20) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 10)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Respaldo SQL diario de Mujer Magica a las 18:00, sin modificar datos. Requiere sesion del usuario iniciada y MySQL disponible.' -Force | Out-Null
Get-ScheduledTaskInfo -TaskName $taskName | Select-Object TaskName, NextRunTime, LastTaskResult
@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Iniciar-Sistema.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo iniciar el sistema. Revisa el mensaje anterior.
  pause
)
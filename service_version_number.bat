@echo off
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format dd.MM.yyyy_HHmmss"') do set SERVICE_VERSION=%%i
echo %SERVICE_VERSION%

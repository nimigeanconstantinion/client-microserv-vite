@echo off
call service_version_number.bat

if not defined SERVICE_VERSION (
    echo Error: SERVICE_VERSION is not defined in service_version_number.bat.
    exit /b 1
)

echo ============================================
echo Removing old buildx builders...
echo ============================================
docker buildx rm multiarchbuilder 2>nul
docker buildx rm multiarchbuilder0 2>nul

echo ============================================
echo Creating new multiarch builder (docker-container)...
echo ============================================
docker buildx create --name multiarchbuilder --use --driver docker-container
docker buildx inspect --bootstrap

echo ============================================
echo Building multi-architecture Docker image...
echo Platforms: linux/amd64, linux/arm64
echo Tags: %SERVICE_VERSION%, latest
echo ============================================

docker buildx build ^
  --platform linux/amd64,linux/arm64 ^
  -f Dockerfile ^
  -t ion21/client-vite:%SERVICE_VERSION% ^
  -t ion21/client-vite:latest ^
  --push .

echo ============================================
echo Build & Push DONE
echo Images pushed:
echo   ion21/client-vite:%SERVICE_VERSION%
echo   ion21/client-vite:latest
echo ============================================

pause

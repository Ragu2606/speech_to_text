@echo off
echo 🔐 Starting Medical Transcription App with HTTPS...

REM Check if OpenSSL is available
openssl version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ OpenSSL not found. Please install OpenSSL or use Git Bash.
    echo    Download from: https://slproweb.com/products/Win32OpenSSL.html
    pause
    exit /b 1
)

REM Generate SSL certificates if they don't exist
if not exist ssl\server.crt (
    echo 📜 Generating SSL certificates...
    call ssl\generate-certs.bat
    if %errorlevel% neq 0 (
        echo ❌ Failed to generate SSL certificates
        pause
        exit /b 1
    )
) else (
    echo ✅ SSL certificates already exist
)

REM Start Docker services with HTTPS
echo 🐳 Starting Docker services with HTTPS...
docker-compose --profile https up -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start Docker services
    pause
    exit /b 1
)

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...
curl -k -s https://localhost/health/whisper >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Whisper service is healthy
) else (
    echo ⚠️  Whisper service may still be starting...
)

curl -k -s https://localhost/health/translation >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Translation service is healthy
) else (
    echo ⚠️  Translation service may still be starting...
)

REM Start frontend
echo 🚀 Starting React frontend with HTTPS...
start cmd /k "npm run dev"

echo.
echo 🎉 HTTPS setup complete!
echo.
echo 📱 Access your app at:
echo    Frontend: https://localhost:5173
echo    API:      https://localhost:443
echo.
echo ⚠️  Note: You'll see a security warning for self-signed certificates.
echo    Click "Advanced" and "Proceed to localhost" to continue.
echo.
pause

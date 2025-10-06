@echo off
REM Generate self-signed SSL certificates for HTTPS on Windows
REM For production, use proper certificates from Let's Encrypt or your CA

echo 🔐 Generating SSL certificates for HTTPS...

REM Create ssl directory if it doesn't exist
if not exist ssl mkdir ssl

REM Generate private key
openssl genrsa -out ssl\server.key 2048

REM Generate certificate signing request
openssl req -new -key ssl\server.key -out ssl\server.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

REM Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in ssl\server.csr -signkey ssl\server.key -out ssl\server.crt

echo ✅ SSL certificates generated successfully!
echo 📁 Files created:
echo    - ssl\server.key (private key)
echo    - ssl\server.crt (certificate)
echo.
echo ⚠️  Note: These are self-signed certificates for development only.
echo    For production, use certificates from a trusted CA.

pause

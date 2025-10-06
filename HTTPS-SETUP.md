# 🔐 HTTPS Setup Guide

This guide will help you configure all services to run on HTTPS for secure communication.

## 🚀 Quick Start (HTTPS)

### Windows
```bash
# Run the HTTPS startup script
start-https.bat
```

### Linux/macOS
```bash
# Make scripts executable and run
chmod +x start-https.sh ssl/generate-certs.sh
./start-https.sh
```

## 📋 Manual Setup

### 1. Generate SSL Certificates

#### Windows
```bash
# Run the certificate generation script
ssl\generate-certs.bat
```

#### Linux/macOS
```bash
# Make executable and run
chmod +x ssl/generate-certs.sh
./ssl/generate-certs.sh
```

### 2. Start Services with HTTPS

```bash
# Start Docker services with HTTPS profile
docker-compose --profile https up -d

# Start frontend with HTTPS
npm run dev
```

## 🌐 Service URLs (HTTPS)

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `https://localhost:5173` | React UI |
| **API Gateway** | `https://localhost:443` | Nginx reverse proxy |
| **Whisper Service** | `https://localhost:443/api/whisper/` | Speech-to-text |
| **Translation Service** | `https://localhost:443/api/translation/` | Language translation |

## 🔧 Configuration Details

### SSL Certificates
- **Location**: `ssl/server.crt` and `ssl/server.key`
- **Type**: Self-signed certificates (development only)
- **Validity**: 365 days
- **Subject**: CN=localhost

### Nginx Configuration
- **HTTP Port**: 80 (redirects to HTTPS)
- **HTTPS Port**: 443
- **SSL Protocol**: TLSv1.2, TLSv1.3
- **CORS**: Enabled for `https://localhost:5173`

### Backend Services
- **Whisper Service**: Port 9000 (internal)
- **Translation Service**: Port 9001 (internal)
- **SSL Support**: Automatic detection of certificates

### Frontend (Vite)
- **HTTPS Port**: 5173
- **SSL**: Auto-enabled if certificates exist
- **Proxy**: Routes API calls to HTTPS backend

## 🔍 Health Checks

```bash
# Check Whisper service
curl -k https://localhost/health/whisper

# Check Translation service
curl -k https://localhost/health/translation

# Check API endpoints
curl -k https://localhost:443/api/whisper/models
curl -k https://localhost:443/api/translation/languages
```

## 🛠️ Troubleshooting

### SSL Certificate Issues

**Problem**: Browser shows "Not Secure" warning
**Solution**: This is normal for self-signed certificates. Click "Advanced" → "Proceed to localhost"

**Problem**: Certificate generation fails
**Solution**: 
```bash
# Install OpenSSL
# Windows: Download from https://slproweb.com/products/Win32OpenSSL.html
# Ubuntu: sudo apt-get install openssl
# macOS: brew install openssl
```

### Service Connection Issues

**Problem**: Services won't start
**Solution**:
```bash
# Check Docker status
docker-compose ps

# View logs
docker-compose logs nginx
docker-compose logs whisper-service
docker-compose logs translation-service
```

**Problem**: Frontend can't connect to backend
**Solution**:
```bash
# Check if Nginx is running
curl -k https://localhost/health/whisper

# Restart services
docker-compose --profile https down
docker-compose --profile https up -d
```

### Port Conflicts

**Problem**: Port 443 already in use
**Solution**:
```bash
# Check what's using port 443
netstat -an | findstr :443  # Windows
lsof -i :443                # Linux/macOS

# Stop conflicting service or change port in docker-compose.yml
```

## 🔒 Security Features

### Enabled Security Headers
- **HSTS**: Strict Transport Security
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin

### Rate Limiting
- **API Endpoints**: 10 requests/second
- **Transcription**: 2 requests/second
- **Burst**: 5-10 requests allowed

### CORS Configuration
- **Allowed Origin**: `https://localhost:5173`
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Credentials**: Enabled

## 🚀 Production Deployment

For production, replace self-signed certificates with proper SSL certificates:

### Option 1: Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to ssl directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/server.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/server.key
```

### Option 2: Commercial CA
1. Purchase SSL certificate from trusted CA
2. Replace `ssl/server.crt` and `ssl/server.key`
3. Update domain in nginx.conf

## 📝 Environment Variables

Create `.env` file for custom configuration:

```env
# SSL Configuration
SSL_CERT_PATH=./ssl/server.crt
SSL_KEY_PATH=./ssl/server.key

# Service URLs
WHISPER_SERVICE_URL=https://localhost:443/api/whisper
TRANSLATION_SERVICE_URL=https://localhost:443/api/translation

# Development
NODE_ENV=development
HTTPS_ENABLED=true
```

## 🔄 Switching Between HTTP and HTTPS

### Start with HTTP (Development)
```bash
docker-compose up -d
npm run dev
```

### Start with HTTPS (Secure)
```bash
docker-compose --profile https up -d
npm run dev
```

## 📊 Monitoring

### Service Status
```bash
# Check all services
docker-compose ps

# View real-time logs
docker-compose logs -f

# Check SSL certificate validity
openssl x509 -in ssl/server.crt -text -noout
```

### Performance Monitoring
- **Nginx Access Logs**: `/var/log/nginx/access.log`
- **Nginx Error Logs**: `/var/log/nginx/error.log`
- **Service Logs**: `docker-compose logs [service-name]`

## 🆘 Support

If you encounter issues:

1. **Check logs**: `docker-compose logs`
2. **Verify certificates**: `openssl x509 -in ssl/server.crt -text -noout`
3. **Test connectivity**: `curl -k https://localhost/health/whisper`
4. **Restart services**: `docker-compose --profile https restart`

---

**Note**: This setup uses self-signed certificates for development. For production, always use certificates from a trusted Certificate Authority.

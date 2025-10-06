# 🔐 Medical Transcription App - HTTPS Configuration

Your speech-to-text medical transcription application is now configured to run entirely on HTTPS for secure communication.

## 🚀 Quick Start with HTTPS

### Windows Users
```bash
# One-command HTTPS setup
start-https.bat
```

### Linux/macOS Users
```bash
# One-command HTTPS setup
chmod +x start-https.sh && ./start-https.sh
```

## 📱 Access Your App

Once started, access your application at:
- **Frontend**: https://localhost:5173
- **API**: https://localhost:443

## 🔧 What's Been Configured

### ✅ SSL Certificates
- Self-signed certificates generated for development
- Located in `ssl/` directory
- Valid for 365 days

### ✅ Nginx Reverse Proxy
- HTTPS termination on port 443
- HTTP to HTTPS redirect on port 80
- Security headers enabled
- Rate limiting configured
- CORS properly set up

### ✅ Backend Services
- Whisper service (port 9000) with SSL support
- Translation service (port 9001) with SSL support
- Automatic SSL detection and enablement

### ✅ Frontend (Vite)
- HTTPS enabled on port 5173
- SSL certificate auto-detection
- API proxy configuration for HTTPS backend

## 🛠️ Available Commands

```bash
# Start with HTTPS
npm run start:https
docker-compose --profile https up -d

# Generate SSL certificates
npm run ssl:generate

# Stop all services
npm run docker:stop
```

## 🔍 Service Health Checks

```bash
# Check all services
curl -k https://localhost/health/whisper
curl -k https://localhost/health/translation

# Check API endpoints
curl -k https://localhost:443/api/whisper/models
curl -k https://localhost:443/api/translation/languages
```

## ⚠️ Important Notes

1. **Browser Security Warning**: You'll see a security warning for self-signed certificates. Click "Advanced" → "Proceed to localhost" to continue.

2. **Development Only**: These are self-signed certificates for development. For production, use certificates from a trusted CA.

3. **Port Requirements**: Ensure ports 80, 443, and 5173 are available.

## 🔒 Security Features Enabled

- **HTTPS Everywhere**: All communication encrypted
- **Security Headers**: HSTS, XSS protection, content type validation
- **Rate Limiting**: API and transcription rate limits
- **CORS**: Properly configured for secure cross-origin requests

## 📚 Documentation

- **Detailed Setup**: See `HTTPS-SETUP.md` for comprehensive configuration details
- **Troubleshooting**: Check the troubleshooting section in `HTTPS-SETUP.md`
- **Production**: See production deployment guide in `HTTPS-SETUP.md`

## 🆘 Need Help?

1. Check service logs: `docker-compose logs`
2. Verify certificates: `openssl x509 -in ssl/server.crt -text -noout`
3. Test connectivity: `curl -k https://localhost/health/whisper`
4. Restart services: `docker-compose --profile https restart`

---

**Your medical transcription app is now running securely on HTTPS! 🎉**

#!/bin/bash

echo "🔐 Starting Medical Transcription App with HTTPS..."

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL not found. Please install OpenSSL."
    echo "   Ubuntu/Debian: sudo apt-get install openssl"
    echo "   macOS: brew install openssl"
    exit 1
fi

# Generate SSL certificates if they don't exist
if [ ! -f "ssl/server.crt" ]; then
    echo "📜 Generating SSL certificates..."
    chmod +x ssl/generate-certs.sh
    ./ssl/generate-certs.sh
    if [ $? -ne 0 ]; then
        echo "❌ Failed to generate SSL certificates"
        exit 1
    fi
else
    echo "✅ SSL certificates already exist"
fi

# Start Docker services with HTTPS
echo "🐳 Starting Docker services with HTTPS..."
docker-compose --profile https up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start Docker services"
    exit 1
fi

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
if curl -k -s https://localhost/health/whisper > /dev/null 2>&1; then
    echo "✅ Whisper service is healthy"
else
    echo "⚠️  Whisper service may still be starting..."
fi

if curl -k -s https://localhost/health/translation > /dev/null 2>&1; then
    echo "✅ Translation service is healthy"
else
    echo "⚠️  Translation service may still be starting..."
fi

# Start frontend
echo "🚀 Starting React frontend with HTTPS..."
npm run dev &

echo ""
echo "🎉 HTTPS setup complete!"
echo ""
echo "📱 Access your app at:"
echo "   Frontend: https://localhost:5173"
echo "   API:      https://localhost:443"
echo ""
echo "⚠️  Note: You'll see a security warning for self-signed certificates."
echo "   Click 'Advanced' and 'Proceed to localhost' to continue."
echo ""
echo "Press Ctrl+C to stop all services"

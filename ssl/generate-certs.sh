#!/bin/bash

# Generate self-signed SSL certificates for development
# For production, use proper certificates from Let's Encrypt or your CA

echo "🔐 Generating SSL certificates for HTTPS..."

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/server.key 2048

# Generate certificate signing request
openssl req -new -key ssl/server.key -out ssl/server.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in ssl/server.csr -signkey ssl/server.key -out ssl/server.crt

# Set proper permissions
chmod 600 ssl/server.key
chmod 644 ssl/server.crt

echo "✅ SSL certificates generated successfully!"
echo "📁 Files created:"
echo "   - ssl/server.key (private key)"
echo "   - ssl/server.crt (certificate)"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only."
echo "   For production, use certificates from a trusted CA."

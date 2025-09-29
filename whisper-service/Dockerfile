FROM python:3.9-slim

WORKDIR /app

# Install system dependencies including CUDA support
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Create models directory for caching
RUN mkdir -p /app/models

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
    CMD curl -f http://localhost:9000/health || exit 1

# Run the application
CMD ["python", "app.py"]

FROM nvidia/cuda:12.4.1-devel-ubuntu22.04

WORKDIR /app

# Set environment variables for CUDA
ENV DEBIAN_FRONTEND=noninteractive
ENV CUDA_HOME=/usr/local/cuda-12.4.1
ENV PATH=${CUDA_HOME}/bin:${PATH}
ENV LD_LIBRARY_PATH=${CUDA_HOME}/lib64:${LD_LIBRARY_PATH}

# Install system dependencies including CUDA support
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    curl \
    gcc \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create symbolic link for python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Create models directory
RUN mkdir -p /app/models/torch /app/models/transformers

# Create SSL directory
RUN mkdir -p /app/ssl

EXPOSE 9001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
    CMD curl -f http://localhost:9001/health || exit 1

CMD ["python", "app.py"]

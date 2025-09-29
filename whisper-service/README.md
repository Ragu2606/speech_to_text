# Whisper Service - Large-v2 with CUDA Support

This service provides high-quality speech-to-text transcription using OpenAI's Whisper large-v2 model with CUDA acceleration.

## Features

- **Model**: Whisper large-v2 (best accuracy)
- **CUDA Support**: GPU acceleration for faster processing
- **Auto Language Detection**: Automatically detects and transcribes multiple languages
- **Translation**: Translates non-English audio to English
- **Docker Ready**: Fully containerized with NVIDIA Docker support

## Prerequisites

### For CUDA Support (Recommended)
1. **NVIDIA GPU** with CUDA Compute Capability 3.5 or higher
2. **NVIDIA Drivers** (latest version)
3. **NVIDIA Container Toolkit** (for Docker GPU support)
4. **Docker** with GPU support

### For CPU Only
- Docker (will work but slower)

## Quick Start

### 1. Verify CUDA Setup (Optional)
```bash
# Run inside the container to verify CUDA
docker run --rm --gpus all -v $(pwd):/app -w /app whisper-service python verify_cuda.py
```

### 2. Start the Service
```bash
# From the project root
docker-compose up whisper-service
```

### 3. Test the Service
```bash
# Health check
curl http://localhost:9000/health

# List available models
curl http://localhost:9000/models
```

## Configuration

### Environment Variables
- `WHISPER_MODEL`: Model to use (default: `large-v2`)
- `LANGUAGE`: Language code or `auto` for auto-detection
- `CUDA_VISIBLE_DEVICES`: GPU device to use (default: `0`)

### Docker Compose Configuration
The service is configured in `docker-compose.yml` with:
- **Model**: `large-v2` (best accuracy)
- **CUDA**: Enabled with GPU support
- **Port**: `9000`
- **Health Check**: Automatic monitoring

## API Endpoints

### POST /transcribe
Transcribe audio file to text.

**Request:**
- `audio`: Audio file (WebM, MP4, WAV, OGG)
- `language`: Language code or `auto` (optional)
- `mode`: `fast` or `accurate` (optional)

**Response:**
```json
{
  "text": "Transcribed text in English",
  "language": "detected_language",
  "segments": [...]
}
```

### GET /health
Check service health and CUDA status.

### GET /models
List available Whisper models.

## Performance

### With CUDA (GPU)
- **Model Loading**: ~30-60 seconds (first time)
- **Transcription Speed**: ~10-20x faster than CPU
- **Memory Usage**: ~6-8 GB VRAM
- **Accuracy**: Highest (large-v2 model)

### Without CUDA (CPU)
- **Model Loading**: ~60-120 seconds (first time)
- **Transcription Speed**: Baseline
- **Memory Usage**: ~4-6 GB RAM
- **Accuracy**: Same as GPU (large-v2 model)

## Troubleshooting

### CUDA Issues
1. **Check GPU availability:**
   ```bash
   nvidia-smi
   ```

2. **Verify Docker GPU support:**
   ```bash
   docker run --rm --gpus all nvidia/cuda:11.8-base-ubuntu20.04 nvidia-smi
   ```

3. **Run CUDA verification:**
   ```bash
   docker-compose exec whisper-service python verify_cuda.py
   ```

### Common Issues
- **Out of Memory**: Reduce batch size or use smaller model
- **Slow Performance**: Ensure CUDA is properly configured
- **Model Download**: First run downloads ~3GB model (large-v2)

## Model Information

### Whisper large-v2
- **Size**: ~3GB
- **Languages**: 99 languages supported
- **Accuracy**: Highest available
- **Speed**: Fastest with CUDA
- **Use Case**: Production, high-accuracy requirements

### Alternative Models
Available in `/models` endpoint:
- `tiny`, `base`, `small`, `medium`, `large`, `large-v2`, `large-v3`
- Smaller models = faster but less accurate
- Larger models = slower but more accurate

## Development

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python app.py

# Test CUDA
python verify_cuda.py
```

### Building Docker Image
```bash
docker build -t whisper-service .
```

## Monitoring

The service includes:
- **Health checks** every 30 seconds
- **Automatic restart** on failure
- **Detailed logging** for debugging
- **CUDA status** in health endpoint

## Support

For issues related to:
- **CUDA**: Check NVIDIA documentation
- **Docker**: Check Docker GPU support
- **Whisper**: Check OpenAI Whisper documentation
- **Service**: Check logs with `docker-compose logs whisper-service`

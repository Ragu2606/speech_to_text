#!/usr/bin/env python3
"""
Whisper Speech-to-Text Service
Provides REST API for audio transcription using Faster Whisper with CUDA support
"""

import os
import tempfile
import logging
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
from faster_whisper import WhisperModel
import torch
from pydub import AudioSegment

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global model variable
model = None

def load_model():
    """Load the Faster Whisper model with CUDA support"""
    global model
    try:
        model_name = os.getenv('WHISPER_MODEL', 'small')
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Check if CUDA device supports float16
        if device == "cuda":
            try:
                # Test if float16 is supported
                test_tensor = torch.tensor([1.0], dtype=torch.float16, device="cuda")
                compute_type = "float16"
                logger.info("CUDA device supports float16")
            except Exception as e:
                logger.warning(f"CUDA device does not support float16: {e}, falling back to int8")
                compute_type = "int8"
        else:
            compute_type = "int8"
        
        logger.info(f"Loading Faster Whisper model: {model_name}")
        logger.info(f"Device: {device}, Compute type: {compute_type}")
        logger.info(f"CUDA available: {torch.cuda.is_available()}")
        
        if torch.cuda.is_available():
            logger.info(f"CUDA device: {torch.cuda.get_device_name(0)}")
            logger.info(f"CUDA memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        
        try:
            model = WhisperModel(
                model_name, 
                device=device, 
                compute_type=compute_type,
                download_root="/app/models",  # Cache models in Docker volume
                local_files_only=False  # Allow downloading if not cached
            )
        except Exception as e:
            if compute_type == "float16" and device == "cuda":
                logger.warning(f"Failed to load with float16: {e}, trying int8")
                compute_type = "int8"
                model = WhisperModel(
                    model_name, 
                    device=device, 
                    compute_type=compute_type,
                    download_root="/app/models",
                    local_files_only=False
                )
            else:
                raise e
        
        logger.info(f"Faster Whisper model {model_name} loaded successfully on {device}")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'model_name': os.getenv('WHISPER_MODEL', 'small'),
        'device': device,
        'cuda_available': torch.cuda.is_available(),
        'faster_whisper': True
    })

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio file"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': 'No audio file selected'}), 400
        
        # Save uploaded file temporarily with proper extension based on content type
        original_filename = audio_file.filename or 'audio'
        
        # Determine file extension based on content type or filename
        content_type = request.content_type or ''
        logger.info(f"Request content type: {content_type}")
        logger.info(f"Original filename: {original_filename}")
        
        if 'webm' in content_type or 'webm' in original_filename.lower():
            file_extension = '.webm'
        elif 'mp4' in content_type or 'mp4' in original_filename.lower():
            file_extension = '.mp4'
        elif 'wav' in content_type or 'wav' in original_filename.lower():
            file_extension = '.wav'
        elif 'ogg' in content_type or 'ogg' in original_filename.lower():
            file_extension = '.ogg'
        else:
            file_extension = '.webm'  # Default to webm for browser audio
        
        logger.info(f"Determined file extension: {file_extension}")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            audio_file.save(tmp_file.name)
            file_size = os.path.getsize(tmp_file.name)
            logger.info(f"Saved audio file: {tmp_file.name} (type: {content_type}, size: {file_size} bytes)")
            
            # Validate file size
            if file_size == 0:
                raise Exception("Uploaded audio file is empty")
            if file_size < 100:
                raise Exception(f"Audio file too small: {file_size} bytes (minimum 100 bytes)")
            
            # Always convert to WAV for Whisper compatibility
            wav_file_path = tmp_file.name.replace(file_extension, '.wav')
            try:
                # Convert to WAV using pydub with explicit format detection
                if file_extension.lower() == '.webm':
                    logger.info("Converting WebM to WAV...")
                    audio = AudioSegment.from_file(tmp_file.name, format="webm")
                elif file_extension.lower() == '.mp4':
                    logger.info("Converting MP4 to WAV...")
                    audio = AudioSegment.from_file(tmp_file.name, format="mp4")
                elif file_extension.lower() == '.ogg':
                    logger.info("Converting OGG to WAV...")
                    audio = AudioSegment.from_file(tmp_file.name, format="ogg")
                else:
                    logger.info("Auto-detecting audio format...")
                    audio = AudioSegment.from_file(tmp_file.name)
                
                # Validate audio duration
                duration_ms = len(audio)
                if duration_ms < 100:  # Less than 0.1 seconds
                    raise Exception(f"Audio too short: {duration_ms}ms (minimum 100ms)")
                
                logger.info(f"Audio duration: {duration_ms}ms, channels: {audio.channels}, frame_rate: {audio.frame_rate}")
                
                # Export as WAV with specific parameters for Whisper
                audio.export(wav_file_path, format="wav", parameters=["-ac", "1", "-ar", "16000"])
                wav_size = os.path.getsize(wav_file_path)
                logger.info(f"Converted {file_extension} to WAV format: {wav_file_path} (size: {wav_size} bytes)")
                
                # Verify the converted file is valid
                if wav_size == 0:
                    raise Exception("Converted WAV file is empty")
                if wav_size < 100:
                    raise Exception(f"Converted WAV file too small: {wav_size} bytes")
                    
            except Exception as e:
                logger.error(f"Could not convert audio format with pydub: {e}")
                # Try FFmpeg directly as fallback
                try:
                    logger.info("Trying FFmpeg direct conversion...")
                    ffmpeg_cmd = [
                        'ffmpeg', '-i', tmp_file.name,
                        '-ac', '1',  # mono
                        '-ar', '16000',  # 16kHz sample rate
                        '-y',  # overwrite output file
                        wav_file_path
                    ]
                    result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
                    if result.returncode == 0:
                        wav_size = os.path.getsize(wav_file_path)
                        logger.info(f"FFmpeg conversion successful: {wav_file_path} (size: {wav_size} bytes)")
                        if wav_size == 0:
                            raise Exception("FFmpeg converted file is empty")
                    else:
                        logger.error(f"FFmpeg conversion failed: {result.stderr}")
                        raise Exception(f"FFmpeg conversion failed: {result.stderr}")
                except Exception as ffmpeg_error:
                    logger.error(f"FFmpeg conversion also failed: {ffmpeg_error}")
                    # Use original file as last resort only if it's already WAV
                    if file_extension.lower() == '.wav':
                        wav_file_path = tmp_file.name
                        logger.info(f"Using original WAV file as last resort: {wav_file_path}")
                    else:
                        raise Exception(f"All audio conversion methods failed. Original error: {e}, FFmpeg error: {ffmpeg_error}")
            
            # Transcribe using Fast Whisper
            language = request.form.get('language', 'auto')
            logger.info(f"Transcribing with language: {language}")
            mode = request.form.get('mode', 'fast')
            
            # Faster Whisper transcribe method with safer parameters
            try:
                if mode == 'accurate':
                    transcribe_kwargs = {
                        "beam_size": 5,
                        "best_of": 5,
                        "condition_on_previous_text": True,
                        "word_timestamps": False
                    }
                else:  # fast mode
                    transcribe_kwargs = {
                        "beam_size": 1,
                        "condition_on_previous_text": False,
                        "word_timestamps": False
                    }

                # Handle auto vs fixed language - always translate to English
                if language == 'auto':
                    segments, info = model.transcribe(wav_file_path, task="translate", **transcribe_kwargs)
                else:
                    segments, info = model.transcribe(wav_file_path, language=language, task="translate", **transcribe_kwargs)
            except Exception as transcribe_error:
                logger.error(f"Faster Whisper transcribe error: {transcribe_error}")
                # Fallback to simpler parameters - always translate to English
                if language == 'auto':
                    segments, info = model.transcribe(wav_file_path, task="translate")
                else:
                    segments, info = model.transcribe(wav_file_path, language=language, task="translate")
            
            # Convert generator to list first
            segments_list = list(segments)
            
            # Combine segments into full text
            full_text = " ".join([segment.text for segment in segments_list])
            detected_language = info.language if hasattr(info, 'language') else language
            
            logger.info(f"Transcription segments count: {len(segments_list)}")
            logger.info(f"Detected language: {detected_language}")
            
            # Convert segments to list format for compatibility
            formatted_segments = []
            for i, segment in enumerate(segments_list):
                formatted_segments.append({
                    'id': i,
                    'start': getattr(segment, 'start', 0.0),
                    'end': getattr(segment, 'end', 0.0),
                    'text': segment.text.strip() if hasattr(segment, 'text') else str(segment)
                })
            
            # Clean up temp files
            os.unlink(tmp_file.name)
            if wav_file_path != tmp_file.name and os.path.exists(wav_file_path):
                os.unlink(wav_file_path)
            
            logger.info(f"Transcription completed. Language: {detected_language}, Text length: {len(full_text)}")
            
            return jsonify({
                'text': full_text,
                'language': detected_language,
                'segments': formatted_segments
            })
            
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/models', methods=['GET'])
def list_models():
    """List available Whisper models"""
    available_models = ['tiny', 'tiny.en', 'base', 'base.en', 'small', 'small.en', 'medium', 'medium.en', 'large', 'large-v2', 'large-v3']
    return jsonify({
        'models': available_models,
        'current_model': os.getenv('WHISPER_MODEL', 'small'),
        'faster_whisper': True,
        'cuda_available': torch.cuda.is_available()
    })

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Test endpoint for debugging"""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'model_name': os.getenv('WHISPER_MODEL', 'small'),
        'device': device,
        'cuda_available': torch.cuda.is_available(),
        'faster_whisper': True,
        'ffmpeg_available': True
    })

if __name__ == '__main__':
    # Load model on startup
    if load_model():
        logger.info("Starting Whisper service on port 9000")
        app.run(host='0.0.0.0', port=9000, debug=False)
    else:
        logger.error("Failed to load model. Exiting.")
        exit(1)

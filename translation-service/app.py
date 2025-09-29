from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import MarianMTModel, MarianTokenizer
import torch
import logging
import os

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TranslationService:
    def __init__(self):
        self.models = {}
        self.tokenizers = {}
        self.model_name = os.getenv('MODEL_NAME', 'Helsinki-NLP/opus-mt-mul-en')
        self.load_models()
    
    def load_models(self):
        """Load translation models"""
        try:
            logger.info(f"Loading model: {self.model_name}")
            logger.info("This may take several minutes on first run...")
            
            # Set cache directories
            cache_dir = "/app/models/transformers"
            
            self.tokenizers[self.model_name] = MarianTokenizer.from_pretrained(
                self.model_name,
                cache_dir=cache_dir
            )
            self.models[self.model_name] = MarianMTModel.from_pretrained(
                self.model_name,
                cache_dir=cache_dir
            )
            
            logger.info("✅ Models loaded successfully")
        except Exception as e:
            logger.error(f"❌ Error loading models: {e}")
            raise e
    
    def translate(self, text, source_lang="gu", target_lang="en"):
        """Translate text from source to target language"""
        try:
            if self.model_name not in self.models:
                raise ValueError("Model not loaded")
            
            tokenizer = self.tokenizers[self.model_name]
            model = self.models[self.model_name]
            
            # Prepare input with language code
            input_text = f">>{target_lang}<< {text}"
            inputs = tokenizer(input_text, return_tensors="pt", padding=True, truncation=True, max_length=512)
            
            # Generate translation
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_length=512,
                    num_beams=4,
                    early_stopping=True,
                    do_sample=False
                )
            
            translated = tokenizer.decode(outputs[0], skip_special_tokens=True)
            return translated
            
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return text  # Return original text if translation fails

# Initialize service
logger.info("🚀 Starting Translation Service...")
translation_service = TranslationService()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "translation",
        "model": translation_service.model_name
    })

@app.route('/translate', methods=['POST'])
def translate_text():
    try:
        data = request.json
        text = data.get('text', '')
        source_lang = data.get('source_language', 'gu')
        target_lang = data.get('target_language', 'en')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        logger.info(f"Translating: {text[:50]}... ({source_lang} -> {target_lang})")
        translated_text = translation_service.translate(text, source_lang, target_lang)
        
        return jsonify({
            "original_text": text,
            "translated_text": translated_text,
            "source_language": source_lang,
            "target_language": target_lang
        })
        
    except Exception as e:
        logger.error(f"Translation endpoint error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/languages', methods=['GET'])
def supported_languages():
    return jsonify({
        "supported_languages": [
            {"code": "gu", "name": "Gujarati (ગુજરાતી)"},
            {"code": "hi", "name": "Hindi (हिन्दी)"},
            {"code": "bn", "name": "Bengali (বাংলা)"},
            {"code": "ta", "name": "Tamil (தமிழ்)"},
            {"code": "te", "name": "Telugu (తెలుగు)"},
            {"code": "mr", "name": "Marathi (मराठी)"},
            {"code": "kn", "name": "Kannada (ಕನ್ನಡ)"},
            {"code": "ml", "name": "Malayalam (മലയാളം)"},
            {"code": "pa", "name": "Punjabi (ਪੰਜਾਬੀ)"},
            {"code": "ur", "name": "Urdu (اردو)"},
            {"code": "or", "name": "Odia (ଓଡ଼ିଆ)"},
            {"code": "as", "name": "Assamese (অসমীয়া)"}
        ]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9001, debug=False)

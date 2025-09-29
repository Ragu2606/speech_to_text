#!/usr/bin/env python3
"""
CUDA Verification Script for Whisper Service
Run this script to verify CUDA setup before starting the service
"""

import torch
import sys

def verify_cuda():
    """Verify CUDA installation and configuration"""
    print("🔍 Verifying CUDA Setup for Whisper Service")
    print("=" * 50)
    
    # Check PyTorch CUDA availability
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"CUDA version: {torch.version.cuda}")
        print(f"Number of GPUs: {torch.cuda.device_count()}")
        
        for i in range(torch.cuda.device_count()):
            props = torch.cuda.get_device_properties(i)
            print(f"GPU {i}: {props.name}")
            print(f"  - Memory: {props.total_memory / 1024**3:.1f} GB")
            print(f"  - Compute Capability: {props.major}.{props.minor}")
        
        # Test CUDA tensor operations
        try:
            test_tensor = torch.tensor([1.0, 2.0, 3.0], device='cuda')
            result = test_tensor * 2
            print("✅ CUDA tensor operations working correctly")
        except Exception as e:
            print(f"❌ CUDA tensor operations failed: {e}")
            return False
            
        # Test float16 support
        try:
            test_tensor_fp16 = torch.tensor([1.0], dtype=torch.float16, device='cuda')
            print("✅ CUDA float16 support available")
        except Exception as e:
            print(f"⚠️  CUDA float16 not supported: {e}")
            print("   Will fall back to int8 precision")
    else:
        print("❌ CUDA not available - will use CPU")
        print("   For optimal performance, ensure:")
        print("   1. NVIDIA GPU is installed")
        print("   2. NVIDIA drivers are installed")
        print("   3. CUDA toolkit is installed")
        print("   4. PyTorch with CUDA support is installed")
        return False
    
    print("\n🎯 Whisper Configuration:")
    print(f"Model: large-v2 (configured in docker-compose.yml)")
    print(f"Device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
    print(f"Compute Type: {'float16' if torch.cuda.is_available() else 'int8'}")
    
    return True

if __name__ == "__main__":
    success = verify_cuda()
    if success:
        print("\n✅ CUDA setup verified successfully!")
        print("   You can now start the Whisper service with optimal performance.")
    else:
        print("\n❌ CUDA setup issues detected.")
        print("   The service will still work but may be slower on CPU.")
    
    sys.exit(0 if success else 1)

import cv2
import numpy as np
from PIL import Image
import json
import sys
import os
import base64
from io import BytesIO

def analyze_image_authenticity(image_data):
    """
    Analyze image for AI-generated or manipulated content
    """
    try:
        # Decode base64 image
        if image_data.startswith('data:image'):
            # Data URL format
            header, encoded = image_data.split(',', 1)
            image_bytes = base64.b64decode(encoded)
        else:
            # Direct base64
            image_bytes = base64.b64decode(image_data)
        
        # Load image
        image = Image.open(BytesIO(image_bytes))
        image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Analyze image characteristics
        analysis = {
            "isAuthentic": True,
            "confidence": 50,
            "reasoning": "",
            "aiGenerationDetected": False,
            "aiGenerationConfidence": 0,
            "aiGenerationEvidence": [],
            "manipulationDetected": False,
            "manipulationConfidence": 0,
            "manipulationEvidence": []
        }
        
        # 1. Check image dimensions and compression
        height, width = image_cv.shape[:2]
        analysis["image_dimensions"] = f"{width}x{height}"
        
        # Uncommon dimensions suggest potential AI generation
        common_widths = [640, 768, 800, 1024, 1280, 1600, 1920, 2048]
        if width not in common_widths:
            analysis["aiGenerationEvidence"].append(f"Uncommon width dimension: {width}px")
            analysis["aiGenerationConfidence"] += 5
        
        # 2. Analyze JPEG artifacts (compression)
        # Check for compression artifacts using Laplacian variance
        gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        if laplacian_var < 100:
            analysis["manipulationEvidence"].append("Heavy compression detected")
            analysis["manipulationConfidence"] += 10
        
        # 3. Analyze color distribution (AI models have characteristic distributions)
        hist_r = cv2.calcHist([image_cv], [2], None, [256], [0, 256])
        hist_g = cv2.calcHist([image_cv], [1], None, [256], [0, 256])
        hist_b = cv2.calcHist([image_cv], [0], None, [256], [0, 256])
        
        # Calculate entropy for each channel
        def calc_entropy(hist):
            hist = hist.flatten() / hist.sum()
            return -np.sum(hist * np.log2(hist + 1e-10))
        
        entropy_vals = [calc_entropy(h) for h in [hist_r, hist_g, hist_b]]
        avg_entropy = np.mean(entropy_vals)
        
        # AI images often have unusual entropy patterns
        if avg_entropy < 5:
            analysis["aiGenerationEvidence"].append("Low color entropy detected (characteristic of AI generation)")
            analysis["aiGenerationConfidence"] += 15
        
        # 4. Detect edge consistency issues (manipulation)
        edges = cv2.Canny(gray, 100, 200)
        edge_density = np.count_nonzero(edges) / edges.size
        
        if edge_density > 0.15:
            analysis["manipulationEvidence"].append("High edge density detected")
            analysis["manipulationConfidence"] += 5
        
        # 5. Check for blur/focus inconsistencies
        edges_laplace = cv2.Laplacian(gray, cv2.CV_64F)
        focus_measure = edges_laplace.var()
        
        if focus_measure < 500:
            analysis["manipulationEvidence"].append("Potential focus inconsistency detected")
            analysis["manipulationConfidence"] += 10
        
        # 6. Analyze for cloning artifacts using simple correlation
        # Divide image into blocks and check for repetitive patterns
        block_size = 32
        blocks = []
        for i in range(0, height - block_size, block_size):
            for j in range(0, width - block_size, block_size):
                block = gray[i:i+block_size, j:j+block_size]
                blocks.append(block.flatten())
        
        if len(blocks) > 1:
            # Check correlation between blocks (cloning has high correlation)
            correlations = []
            for i in range(min(10, len(blocks)-1)):
                for j in range(i+1, min(i+5, len(blocks))):
                    corr = np.corrcoef(blocks[i], blocks[j])[0, 1]
                    if not np.isnan(corr) and corr > 0.8:
                        correlations.append(corr)
            
            if len(correlations) > 2:
                analysis["manipulationEvidence"].append("Potential cloning detected (high block correlation)")
                analysis["manipulationConfidence"] += 20
        
        # 7. Check noise patterns (AI images have characteristic noise)
        # Calculate local variance
        kernel_size = 15
        local_var = np.zeros_like(gray, dtype=float)
        for i in range(kernel_size, height - kernel_size):
            for j in range(kernel_size, width - kernel_size):
                patch = gray[i-kernel_size:i+kernel_size, j-kernel_size:j+kernel_size]
                local_var[i, j] = patch.var()
        
        var_entropy = local_var[local_var > 0].std() if len(local_var[local_var > 0]) > 0 else 0
        if var_entropy < 50:
            analysis["aiGenerationEvidence"].append("Uniform noise pattern (characteristic of diffusion models)")
            analysis["aiGenerationConfidence"] += 25  # Increased from 15
        
        # 8. Detect frequency domain artifacts common in AI generation
        # Use FFT to detect unnatural frequency patterns
        fft_result = np.fft.fft2(gray)
        fft_shifted = np.fft.fftshift(fft_result)
        magnitude = np.abs(fft_shifted)
        
        # Check for suspicious frequency patterns (AI models have distinct patterns)
        center = np.array(magnitude.shape) // 2
        ring_size = 20
        
        # Compare energy in different frequency rings
        inner_energy = np.sum(magnitude[center[0]-ring_size:center[0]+ring_size, 
                                       center[1]-ring_size:center[1]+ring_size])
        outer_energy = np.sum(magnitude) - inner_energy
        
        if outer_energy > 0 and (inner_energy / outer_energy) > 2:
            analysis["aiGenerationEvidence"].append("Abnormal frequency domain patterns detected")
            analysis["aiGenerationConfidence"] += 20  # New detection method
        
        # 9. Final assessment
        analysis["aiGenerationConfidence"] = min(95, analysis["aiGenerationConfidence"])
        analysis["manipulationConfidence"] = min(95, analysis["manipulationConfidence"])
        
        ai_confidence = analysis["aiGenerationConfidence"]
        manip_confidence = analysis["manipulationConfidence"]
        
        # Determine which type of issue is more prominent
        max_issue_confidence = max(ai_confidence, manip_confidence)
        
        # DEBUG: Print detection results
        print(f"DEBUG: AI Confidence={ai_confidence}, Manip Confidence={manip_confidence}, Max={max_issue_confidence}", file=sys.stderr)
        
        # Decide if image is authentic or fake based on threshold (lowered from 30 to 25)
        if max_issue_confidence > 25:
            # Image appears fake/manipulated
            analysis["isAuthentic"] = False
            
            if ai_confidence > manip_confidence:
                analysis["aiGenerationDetected"] = True
                analysis["confidence"] = ai_confidence
                analysis["reasoning"] = f"⚠️ AI GENERATION DETECTED: {ai_confidence}% confidence. {', '.join(analysis['aiGenerationEvidence'][:2]) if analysis['aiGenerationEvidence'] else 'Multiple anomalies detected'}"
            else:
                analysis["manipulationDetected"] = True
                analysis["confidence"] = manip_confidence
                analysis["reasoning"] = f"⚠️ MANIPULATION DETECTED: {manip_confidence}% confidence. {', '.join(analysis['manipulationEvidence'][:2]) if analysis['manipulationEvidence'] else 'anomalies'}"
        else:
            # Image appears authentic
            analysis["isAuthentic"] = True
            analysis["confidence"] = 95 - max_issue_confidence
            analysis["reasoning"] = "✓ Image appears authentic with no significant anomalies detected."
        
        return analysis
        
    except Exception as e:
        return {
            "isAuthentic": True,
            "confidence": 0,
            "reasoning": f"Error during analysis: {str(e)}",
            "aiGenerationDetected": False,
            "aiGenerationConfidence": 0,
            "aiGenerationEvidence": [],
            "manipulationDetected": False,
            "manipulationConfidence": 0,
            "manipulationEvidence": []
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Check if argument is a file path or direct data URL
        arg = sys.argv[1]
        if os.path.isfile(arg):
            # Read image data from temp file
            with open(arg, 'r') as f:
                image_data = f.read()
        else:
            # Direct data URL (fallback for backward compatibility)
            image_data = arg
        
        result = analyze_image_authenticity(image_data)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "No image data provided"}))

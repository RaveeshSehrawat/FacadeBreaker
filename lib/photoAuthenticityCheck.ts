import { execSync } from "child_process";
import path from "path";
import fs from "fs";

export interface PhotoAuthenticityResult {
    isAuthentic: boolean;
    confidence: number;
    reasoning: string;
    indicators: {
        aiGeneration: {
            detected: boolean;
            confidence: number;
            evidence: string[];
        };
        manipulation: {
            detected: boolean;
            confidence: number;
            evidence: string[];
        };
        metadata: {
            hasExif: boolean;
            suspiciousEditing: boolean;
        };
    };
}

export async function checkPhotoAuthenticity(
    imageDataUrl: string
): Promise<PhotoAuthenticityResult> {
    try {
        const pythonScriptPath = path.join(process.cwd(), "python_analysis", "image_auth.py");
        
        // Check if Python script exists
        if (!fs.existsSync(pythonScriptPath)) {
            return getDefaultResponse("Python analysis module not found. Install dependencies with: pip install pillow opencv-python numpy");
        }

        // Write image data to temporary file to avoid command-line length limits
        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempFile = path.join(tempDir, `temp_${Date.now()}.txt`);
        fs.writeFileSync(tempFile, imageDataUrl);
        
        // Call Python script with temp file path instead of full data URL
        console.log("Calling Python script at:", pythonScriptPath);
        const result = execSync(`python "${pythonScriptPath}" "${tempFile}"`, {
            encoding: "utf-8",
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large base64 strings
        });

        // Clean up temp file
        fs.unlinkSync(tempFile);
        
        console.log("Python script result:", result.substring(0, 200));
        const analysis = JSON.parse(result);

        return {
            isAuthentic: analysis.isAuthentic ?? true,
            confidence: analysis.confidence ?? 50,
            reasoning: analysis.reasoning ?? "Image analysis completed",
            indicators: {
                aiGeneration: {
                    detected: analysis.aiGenerationDetected ?? false,
                    confidence: analysis.aiGenerationConfidence ?? 0,
                    evidence: analysis.aiGenerationEvidence ?? []
                },
                manipulation: {
                    detected: analysis.manipulationDetected ?? false,
                    confidence: analysis.manipulationConfidence ?? 0,
                    evidence: analysis.manipulationEvidence ?? []
                },
                metadata: {
                    hasExif: false,
                    suspiciousEditing: false
                }
            }
        };

    } catch (error) {
        console.error("Photo authenticity check failed:", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("Error details:", errorMsg);
        return getDefaultResponse(`Analysis error: ${errorMsg.substring(0, 100)}`);
    }
}

function getDefaultResponse(reason: string): PhotoAuthenticityResult {
    return {
        isAuthentic: true,
        confidence: 0,
        reasoning: reason,
        indicators: {
            aiGeneration: {
                detected: false,
                confidence: 0,
                evidence: []
            },
            manipulation: {
                detected: false,
                confidence: 0,
                evidence: []
            },
            metadata: {
                hasExif: false,
                suspiciousEditing: false
            }
        }
    };
}

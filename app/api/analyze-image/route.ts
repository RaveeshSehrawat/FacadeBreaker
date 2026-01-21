import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    let tempFilePath: string | null = null;

    try {
        console.log("=== PYTHON IMAGE ANALYSIS REQUEST START ===");

        const body = await req.json();
        const { imageDataUrl } = body;

        if (!imageDataUrl || typeof imageDataUrl !== "string") {
            return NextResponse.json(
                { error: "Invalid input. Please provide an image." },
                { status: 400 }
            );
        }

        if (!imageDataUrl.startsWith("data:image/")) {
            return NextResponse.json(
                { error: "Invalid image format." },
                { status: 400 }
            );
        }

        console.log("Image received, preparing for Python analysis...");

        // Create a temporary file with the image data
        tempFilePath = join(tmpdir(), `image-${Date.now()}.txt`);
        writeFileSync(tempFilePath, imageDataUrl);

        // Get the Python script path
        const scriptPath = join(process.cwd(), "python_analysis", "image_auth.py");

        console.log("Calling Python script:", scriptPath);

        // Execute Python script with timeout
        const result = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => {
                pythonProcess.kill();
                reject(new Error("Python analysis timeout after 30 seconds"));
            }, 30000);

            const pythonProcess = spawn("python", [scriptPath, tempFilePath]);
            
            let outputData = "";
            let errorData = "";

            pythonProcess.stdout.on("data", (data) => {
                outputData += data.toString();
            });

            pythonProcess.stderr.on("data", (data) => {
                errorData += data.toString();
                console.error("Python stderr:", data.toString());
            });

            pythonProcess.on("close", (code) => {
                clearTimeout(timeout);
                
                if (code !== 0) {
                    reject(new Error(`Python process exited with code ${code}: ${errorData}`));
                    return;
                }

                try {
                    const result = JSON.parse(outputData);
                    resolve(result);
                } catch (parseError) {
                    reject(new Error(`Failed to parse Python output: ${outputData}`));
                }
            });

            pythonProcess.on("error", (error) => {
                clearTimeout(timeout);
                reject(new Error(`Failed to spawn Python process: ${error.message}`));
            });
        });

        console.log("Python analysis completed:", result);

        // Format response to match expected structure
        const response = {
            isAuthentic: result.isAuthentic,
            confidence: result.confidence,
            reasoning: result.reasoning,
            indicators: {
                aiGeneration: {
                    detected: result.aiGenerationDetected,
                    confidence: result.aiGenerationConfidence,
                    evidence: result.aiGenerationEvidence || []
                },
                manipulation: {
                    detected: result.manipulationDetected,
                    confidence: result.manipulationConfidence,
                    evidence: result.manipulationEvidence || []
                }
            }
        };

        console.log("=== PYTHON IMAGE ANALYSIS REQUEST END ===");

        return NextResponse.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error("=== PYTHON IMAGE ANALYSIS ERROR ===");
        console.error(error);

        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

        return NextResponse.json(
            { error: `Image analysis failed: ${errorMessage}` },
            { status: 500 }
        );
    } finally {
        // Clean up temp file
        if (tempFilePath) {
            try {
                unlinkSync(tempFilePath);
            } catch (e) {
                console.warn("Failed to delete temp file:", e);
            }
        }
    }
}

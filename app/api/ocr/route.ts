import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { base64Image } = body;

        if (!base64Image) {
            return NextResponse.json(
                { error: "No image provided" },
                { status: 400 }
            );
        }

        const apiKey = process.env.OCR_SPACE_API_KEY;
        
        if (!apiKey || apiKey === "your_ocr_space_api_key_here") {
            return NextResponse.json(
                { error: "OCR service not configured. Get a free API key from https://ocr.space/ocrapi and add it to .env.local as OCR_SPACE_API_KEY" },
                { status: 503 }
            );
        }

        console.log("Sending request to OCR.space API...");

        // Use application/x-www-form-urlencoded format
        const formBody = new URLSearchParams({
            apikey: apiKey,
            base64Image: base64Image,
            language: "eng",
            isOverlayRequired: "false",
            detectOrientation: "true",
            scale: "true",
            OCREngine: "2"
        });

        const response = await fetch("https://api.ocr.space/parse/image", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formBody.toString(),
        });

        console.log("OCR.space response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OCR.space error response:", errorText.substring(0, 200));
            
            if (response.status === 403) {
                return NextResponse.json(
                    { error: "OCR API key is invalid or rate limited. Get a free API key from https://ocr.space/ocrapi" },
                    { status: 403 }
                );
            }
            
            throw new Error(`OCR API returned status ${response.status}`);
        }

        const data = await response.json();

        console.log("OCR.space response:", JSON.stringify(data).substring(0, 200));

        if (data.IsErroredOnProcessing) {
            throw new Error(data.ErrorMessage || "OCR processing failed");
        }

        if (!data.ParsedResults || data.ParsedResults.length === 0) {
            throw new Error("No text could be extracted from the image");
        }

        const extractedText = data.ParsedResults[0].ParsedText;

        if (!extractedText || extractedText.trim().length === 0) {
            return NextResponse.json(
                { error: "No text found in the image. The image may not contain readable text." },
                { status: 400 }
            );
        }

        return NextResponse.json({
            text: extractedText.trim(),
            confidence: data.ParsedResults[0].TextOrientation || 0,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("OCR Error:", errorMessage);

        return NextResponse.json(
            { 
                error: `OCR failed: ${errorMessage}. Please paste the text manually.`,
            },
            { status: 500 }
        );
    }
}

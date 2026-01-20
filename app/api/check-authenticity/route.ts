import { NextResponse } from "next/server";
import { checkPhotoAuthenticity } from "@/lib/photoAuthenticityCheck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        console.log("=== PHOTO AUTHENTICITY CHECK REQUEST START ===");

        const body = await req.json();
        const { imageDataUrl, mode } = body;

        // Validate input
        if (!imageDataUrl || typeof imageDataUrl !== "string") {
            return NextResponse.json(
                { error: "Invalid input. Please provide an image." },
                { status: 400 }
            );
        }

        // Check if it's a valid data URL
        if (!imageDataUrl.startsWith("data:image/")) {
            return NextResponse.json(
                { error: "Invalid image format. Please provide a valid image data URL." },
                { status: 400 }
            );
        }

        console.log(`Image received (${imageDataUrl.length} bytes), mode: ${mode || 'detailed'}`);

        // Set timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Authenticity check timeout after 30 seconds")), 30000)
        );

        console.log("Starting authenticity analysis...");

        const result = await Promise.race([
            checkPhotoAuthenticity(imageDataUrl),
            timeoutPromise,
        ]);

        console.log("Authenticity analysis completed:", result);
        console.log("=== PHOTO AUTHENTICITY CHECK REQUEST END ===");

        return NextResponse.json({
            success: true,
            data: result,
        });

    } catch (error) {
        console.error("=== PHOTO AUTHENTICITY CHECK ERROR ===");
        console.error(error);

        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

        // Handle specific errors
        if (errorMessage.includes("GOOGLE_GEMINI_API_KEY")) {
            return NextResponse.json(
                {
                    error: "Configuration error: Google Gemini API key not found. Please add GOOGLE_GEMINI_API_KEY to your .env.local file. Get one free at: https://aistudio.google.com/app/apikey",
                },
                { status: 500 }
            );
        }

        if (errorMessage.includes("timeout")) {
            return NextResponse.json(
                {
                    error: "Request timeout. The analysis took too long. Please try again.",
                },
                { status: 504 }
            );
        }

        return NextResponse.json(
            {
                error: `Authenticity check failed: ${errorMessage}`,
            },
            { status: 500 }
        );
    }
}

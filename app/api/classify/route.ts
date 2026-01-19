import { NextResponse } from "next/server";
import { classifyNews } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        console.log("=== CLASSIFY REQUEST START ===");
        const { text } = await req.json();
        console.log("Text received:", text.substring(0, 100));

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Invalid input. Please provide news text." },
                { status: 400 }
            );
        }

        // Set a timeout for the classification process
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Classification timeout after 30 seconds")), 30000)
        );

        console.log("Starting classification...");
        const classificationPromise = classifyNews(text);
        const classification = await Promise.race([classificationPromise, timeoutPromise]);

        console.log("Classification successful:", JSON.stringify(classification).substring(0, 100));
        return NextResponse.json(classification);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : "";
        
        console.error("=== CLASSIFY ERROR START ===");
        console.error("Error Message:", errorMessage);
        console.error("Error Stack:", errorStack);
        console.error("Error Type:", error instanceof Error ? error.constructor.name : typeof error);
        console.error("Full Error Object:", JSON.stringify(error));
        console.error("=== CLASSIFY ERROR END ===");

        // Return detailed error info in development
        const isDev = process.env.NODE_ENV === "development";
        
        return NextResponse.json(
            { 
                error: "Failed to classify news. Please try again.",
                label: "Uncertain",
                confidence: 0,
                reason: isDev ? `Error: ${errorMessage}` : "Analysis error. Please try again later.",
                ...(isDev && { 
                    debugInfo: errorMessage,
                    errorType: error instanceof Error ? error.constructor.name : typeof error
                })
            },
            { status: 500 }
        );
    }
}

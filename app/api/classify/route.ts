import { NextResponse } from "next/server";
import { classifyNews, classifyImage, type ClassificationResult } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("=== CLASSIFY REQUEST START ===");

    const body = await req.json();
    const text = body?.text;
    const file = body?.file;

    // Validate input
    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return NextResponse.json(
        {
          error: "Invalid input. Please provide meaningful news text.",
        },
        { status: 400 }
      );
    }

    console.log("Text received:", text.substring(0, 120));
    
    if (file && file.dataUrl) {
      console.log(`File received: ${file.name} (${file.type})`);
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Classification timeout after 30 seconds")), 30000)
    );

    console.log("Starting classification...");

    let classificationPromise;
    
    // If image/video file is provided, use vision analysis
    if (file && file.dataUrl && (file.type.startsWith('image') || file.type.startsWith('video'))) {
      classificationPromise = classifyImage(text.trim(), file.dataUrl, file.type);
    } else {
      classificationPromise = classifyNews(text.trim());
    }

    const classification = await Promise.race([
      classificationPromise,
      timeoutPromise,
    ]) as ClassificationResult;

    if (!classification || typeof classification !== "object") {
      throw new Error("Invalid classification response from Gemini");
    }

    console.log("Classification result:", classification);

    return NextResponse.json({
      label: classification.label,
      confidence: classification.confidence,
      aiReasoning: classification.aiReasoning,
      webSourcesSummary: classification.webSourcesSummary,
      webSearchResults: classification.webSearchResults,
      webSearchStatus: classification.webSearchStatus,
    });

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("=== CLASSIFY ERROR ===");
    console.error(errorMessage);

    return NextResponse.json(
      {
        label: "Uncertain",
        confidence: 0,
        aiReasoning:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Analysis failed. Please try again later.",
        webSourcesSummary: "No web sources summary available",
        error: "Classification failed",
        webSearchResults: [],
        webSearchStatus: "unavailable",
      },
      { status: 500 }
    );
  }
}

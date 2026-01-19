import { NextResponse } from "next/server";
import { classifyNews } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("=== CLASSIFY REQUEST START ===");

    const body = await req.json();
    const text = body?.text;

    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return NextResponse.json(
        {
          error: "Invalid input. Please provide meaningful news text.",
        },
        { status: 400 }
      );
    }

    console.log("Text received:", text.substring(0, 120));

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Classification timeout after 30 seconds")), 30000)
    );

    console.log("Starting classification...");

    const classificationPromise = classifyNews(text.trim());

    const classification = await Promise.race([
      classificationPromise,
      timeoutPromise,
    ]);

    if (!classification || typeof classification !== "object") {
      throw new Error("Invalid classification response from Gemini");
    }

    console.log("Classification result:", classification);

    return NextResponse.json({
      label: classification.label ?? "Uncertain",
      confidence: classification.confidence ?? 0,
      reason: classification.reason ?? "No explanation provided",
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
        reason:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Analysis failed. Please try again later.",
        error: "Classification failed",
      },
      { status: 500 }
    );
  }
}

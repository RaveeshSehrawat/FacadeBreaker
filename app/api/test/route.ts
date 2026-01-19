import { NextResponse } from "next/server";

export async function GET() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    return NextResponse.json({
        apiKeySet: !!apiKey,
        apiKeyFormat: apiKey ? apiKey.substring(0, 20) + "..." : "not set",
        env: process.env.NODE_ENV,
        provider: "Groq",
        message: "API Key check"
    });
}

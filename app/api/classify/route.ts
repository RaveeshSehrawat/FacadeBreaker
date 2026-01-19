import { NextResponse } from "next/server";
import { classifyNews } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Invalid input. Please provide news text." },
                { status: 400 }
            );
        }

        const classification = await classifyNews(text);
        return NextResponse.json(classification);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Failed to classify news." },
            { status: 500 }
        );
    }
}

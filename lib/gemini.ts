import Groq from "groq-sdk";
import { searchAndScrapeWeb } from "./webscraper";

export const classifyNews = async (text: string) => {
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set. Please add your Groq API key to .env.local");
    }

    const groq = new Groq({ apiKey: API_KEY });

    // Step 1: Perform web scraping for verification (optional, fast)
    let webEvidences = "";
    try {
        const searchQuery = extractMainClaim(text);
        if (searchQuery) {
            console.log("Starting web scraping for:", searchQuery);
            webEvidences = await Promise.race([
                searchAndScrapeWeb(searchQuery),
                new Promise<string>((_, reject) =>
                    setTimeout(() => reject(new Error("Web search timeout after 8 seconds")), 8000)
                ),
            ]);
            console.log("Web scraping completed");
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.warn("Web scraping failed:", errorMsg);
        webEvidences = "Web verification unavailable - using AI analysis only";
    }

    // Step 2: AI analysis with web evidence summary
    const hasWebEvidence = webEvidences && !webEvidences.includes("unavailable") && !webEvidences.includes("Failed");
    
    const prompt = `You are a professional AI fact-checker with extensive training knowledge. Analyze this news and summarize web evidence.

NEWS TO ANALYZE:
"${text}"

WEB SEARCH RESULTS (if available):
${webEvidences}

YOUR TASK:
1. Provide YOUR OWN AI ANALYSIS based on your training knowledge
2. IF web results are available, provide a SEPARATE SUMMARY of what those web sources say

Provide a JSON response with:
- label: "Fake", "Real", or "Uncertain" (based on YOUR AI knowledge only)
- confidence: number (0-100) - your confidence in this assessment
- aiReasoning: brief explanation (max 3 lines) - what YOU know from your training
- webSourcesSummary: ${hasWebEvidence ? 'brief summary (max 3 lines) of what the web sources indicate about this claim' : '"No web sources available"'}

Respond with ONLY the JSON object, no markdown formatting.`;

    try {
        console.log("Calling Groq for classification...");
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            response_format: { type: "json_object" }
        });

        console.log("Classification received");
        console.log("Raw completion object:", JSON.stringify(completion, null, 2));
        
        const responseText = completion.choices[0]?.message?.content || "{}";
        console.log("Response text:", responseText.substring(0, 200));
        
        let aiAnalysis;
        
        try {
            aiAnalysis = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse classification JSON:", responseText.substring(0, 500));
            throw new Error(`Invalid JSON response from Groq: ${responseText.substring(0, 200)}`);
        }

        // Parse web search results separately
        let webSearchResults = [];
        try {
            if (hasWebEvidence && webEvidences) {
                const parsedWeb = JSON.parse(webEvidences);
                webSearchResults = Array.isArray(parsedWeb) ? parsedWeb : [];
            }
        } catch {
            console.log("Could not parse web evidence as JSON, treating as text");
        }

        // Return combined but separated results
        return {
            label: aiAnalysis.label ?? "Uncertain",
            confidence: aiAnalysis.confidence ?? 0,
            aiReasoning: aiAnalysis.aiReasoning ?? "No AI analysis provided",
            webSourcesSummary: aiAnalysis.webSourcesSummary ?? "No web sources summary available",
            webSearchResults: webSearchResults,
            webSearchStatus: hasWebEvidence ? "available" : "unavailable"
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        console.error("=== Classification Error ===");
        console.error("Error Message:", errorMessage);
        console.error("Error Type:", error instanceof Error ? error.constructor.name : typeof error);
        console.error("Full Error:", error);
        console.error("Error Stack:", error instanceof Error ? error.stack : "No stack");
        console.error("API Key Present:", !!process.env.GEMINI_API_KEY);
        console.error("API Key Format Check:", process.env.GEMINI_API_KEY?.substring(0, 10));
        console.error("==========================");
        
        // Provide more specific error handling
        if (errorMessage.includes("401") || errorMessage.includes("authentication") || errorMessage.includes("Unauthorized") || errorMessage.includes("Invalid API Key")) {
            throw new Error("Authentication failed. Check your GEMINI_API_KEY in .env.local. Make sure it's a valid Groq API key (starts with gsk_).");
        } else if (errorMessage.includes("429") || errorMessage.includes("quota")) {
            throw new Error("Rate limit exceeded. Please try again later.");
        } else if (errorMessage.includes("timeout")) {
            throw new Error("Request timeout. The analysis took too long.");
        } else if (errorMessage.includes("<!DOCTYPE") || errorMessage.includes("not valid JSON")) {
            throw new Error("Received HTML instead of JSON. Check your Groq API key and network connection.");
        }
        
        throw new Error(`Classification failed: ${errorMessage}`);
    }
};

// Extract main claim from text for web search
const extractMainClaim = (text: string): string => {
    // Remove common phrases and get the core claim
    const cleaned = text
        .replace(/according to|reported by|claimed that|said that/gi, "")
        .trim();
    
    // Return first 100 characters or until first period
    const claim = cleaned.split(".")[0];
    return claim.substring(0, 100);
};

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

    // Step 2: Single AI call with web evidence included
    const hasWebEvidence = webEvidences && !webEvidences.includes("unavailable") && !webEvidences.includes("Failed");
    
    const prompt = `You are a professional fact-checker with extensive knowledge. Use BOTH your training knowledge AND web evidence to classify this news.

NEWS TO ANALYZE:
"${text}"

WEB EVIDENCE (supplementary source):
${webEvidences}

YOUR TASK - Use a BALANCED approach:
1. First, analyze the claim using YOUR OWN KNOWLEDGE (context, plausibility, known facts, logic)
2. Then, cross-reference with the web evidence provided
3. Combine BOTH sources to reach a verdict
4. If your knowledge and web evidence AGREE: High confidence
5. If your knowledge and web evidence CONFLICT: State this and use "Uncertain" with explanation
6. If web evidence is weak but you KNOW the answer: Trust your knowledge, set webEvidenceWeight lower (20-40)
7. If web evidence is strong and aligns: High webEvidenceWeight (60-85)

CRITICAL INSTRUCTIONS FOR webEvidenceWeight:
- webEvidenceWeight shows HOW MUCH the web sources influenced your decision (not your confidence)
- If web sources STRONGLY influenced your verdict: 60-85
- If web sources MODERATELY influenced your verdict: 30-60
- If you relied MORE on your own knowledge than web: 10-30
- If web verification failed/unavailable: 5-15 (you still have your knowledge!)
- NEVER set to 0 unless absolutely no web data attempted

VERDICT MAPPING:
- "Verified by Web Sources": Web evidence strongly supports your analysis (webEvidenceWeight > 60)
- "Partially Verified": Web + your knowledge both contribute (webEvidenceWeight 30-60)
- "Contradicted by Web Sources": Web clearly disproves the claim (webEvidenceWeight > 50)
- "Insufficient Web Evidence": Relied mainly on your knowledge (webEvidenceWeight < 30)

Provide a JSON response with:
- label: "Fake", "Real", or "Uncertain" (based on BOTH your knowledge AND web evidence)
- confidence: number (0-100) - your overall confidence in the verdict
- reason: detailed explanation (max 5 lines) - explain what YOU know AND what web sources show
- sources: array of actual URLs from web evidence (empty if none)
- verdict: one of the 4 options above
- webEvidenceWeight: number (0-100) showing how much WEB influenced you vs YOUR OWN KNOWLEDGE

Respond with ONLY the JSON object, no markdown formatting.`;

    try {
        console.log("Calling Groq for classification...");
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        console.log("Classification received");
        console.log("Raw completion object:", JSON.stringify(completion, null, 2));
        
        const responseText = completion.choices[0]?.message?.content || "{}";
        console.log("Response text:", responseText.substring(0, 200));
        
        let classification;
        
        try {
            classification = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse classification JSON:", responseText.substring(0, 500));
            throw new Error(`Invalid JSON response from Groq: ${responseText.substring(0, 200)}`);
        }

        return classification;
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

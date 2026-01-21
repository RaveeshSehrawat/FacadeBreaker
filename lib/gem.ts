import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchAndScrapeWeb } from "./webscraper";
import { reverseImageSearch } from "./reverseImageSearch";

export interface ClassificationResult {
    label: "Fake" | "Real" | "Uncertain";
    confidence: number;
    aiReasoning: string;
    webSourcesSummary: string;
    webSearchResults: unknown[];
    webSearchStatus: "available" | "unavailable";
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const classifyNews = async (text: string): Promise<ClassificationResult> => {

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set.");
    }

    // Step 1: Web scraping
    let webEvidences = "";
    try {
        const searchQuery = extractMainClaim(text);

        if (searchQuery) {
            webEvidences = await Promise.race([
                searchAndScrapeWeb(searchQuery),
                new Promise<string>((_, reject) =>
                    setTimeout(() => reject(new Error("Web search timeout")), 8000)
                ),
            ]);
        }
    } catch {
        webEvidences = "Web verification unavailable - using AI analysis only";
    }

    const hasWebEvidence =
        webEvidences &&
        !webEvidences.includes("unavailable") &&
        !webEvidences.includes("Failed");

    const prompt = `You are a professional AI fact-checker.

NEWS:
"${text}"

${hasWebEvidence ? `WEB SEARCH RESULTS:\n${webEvidences}` : "WEB SEARCH: No results available"}

Return ONLY valid JSON:
{
  "label": "Fake" | "Real" | "Uncertain",
  "confidence": 0-100,
  "aiReasoning": "short reasoning",
  "webSourcesSummary": "summary of sources"
}`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const aiAnalysis = JSON.parse(responseText);

        let webSearchResults: any[] = [];
        try {
            if (hasWebEvidence) {
                const parsed = JSON.parse(webEvidences);
                webSearchResults = Array.isArray(parsed) ? parsed : [];
            }
        } catch {}

        return {
            label: aiAnalysis.label ?? "Uncertain",
            confidence: aiAnalysis.confidence ?? 0,
            aiReasoning: aiAnalysis.aiReasoning ?? "",
            webSourcesSummary: aiAnalysis.webSourcesSummary ?? "",
            webSearchResults,
            webSearchStatus: hasWebEvidence ? "available" : "unavailable",
        };

    } catch (error: any) {
        throw new Error(`Classification failed: ${error.message}`);
    }
};

export const classifyImage = async (
    text: string,
    imageDataUrl: string,
    fileType: string
): Promise<ClassificationResult> => {

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set.");
    }

    let reverseSearchResults: any[] = [];

    try {
        const reverseSearch = await Promise.race([
            reverseImageSearch(imageDataUrl),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
        ]) as any;

        if (reverseSearch?.originalSources) {
            reverseSearchResults = reverseSearch.originalSources.map((s: any) => ({
                title: s.title,
                url: s.url,
                snippet: s.snippet
            }));
        }
    } catch {}

    const prompt = `USER CLAIM:
"${text}"

FILE TYPE: ${fileType}

Return ONLY JSON:
{
    "label": "Fake" | "Real" | "Uncertain",
    "confidence": 0-100,
    "aiReasoning": "explanation",
    "webSourcesSummary": "verification guidance"
}`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid JSON");

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            label: parsed.label || "Uncertain",
            confidence: parsed.confidence || 0,
            aiReasoning: parsed.aiReasoning || "",
            webSourcesSummary: parsed.webSourcesSummary || "",
            webSearchResults: reverseSearchResults,
            webSearchStatus: reverseSearchResults.length ? "available" : "unavailable",
        };

    } catch (error: any) {
        throw new Error(`Image classification failed: ${error.message}`);
    }
};

// Extract main claim
const extractMainClaim = (text: string): string => {
    const cleaned = text.replace(/according to|reported by|claimed that|said that/gi, "").trim();
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 20);

    if (!sentences.length) return cleaned.substring(0, 150);

    let claim = sentences[0];
    if (sentences[1] && claim.length < 100) claim += ". " + sentences[1];

    return claim.substring(0, 150).trim();
};

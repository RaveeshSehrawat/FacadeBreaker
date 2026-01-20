import OpenAI from "openai";
import { searchAndScrapeWeb } from "./webscraper";

export interface ClassificationResult {
  label: "Fake" | "Real" | "Uncertain";
  confidence: number;
  aiReasoning: string;
  webSourcesSummary: string;
  webSearchResults: unknown[];
  webSearchStatus: "available" | "unavailable";
}

export const classifyNews = async (text: string): Promise<ClassificationResult> => {
  const API_KEY = process.env.OPENAI_API_KEY;

  if (!API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }

  const openai = new OpenAI({ apiKey: API_KEY });

  // Step 1: Web scraping
  let webEvidences = "";
  try {
    const searchQuery = extractMainClaim(text);
    if (searchQuery) {
      webEvidences = await Promise.race([
        searchAndScrapeWeb(searchQuery),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Web search timeout after 8 seconds")), 8000)
        ),
      ]);
    }
  } catch {
    webEvidences = "Web verification unavailable - using AI analysis only";
  }

  const hasWebEvidence =
    webEvidences && !webEvidences.includes("unavailable") && !webEvidences.includes("Failed");

  const prompt = `You are a professional AI fact-checker.

NEWS:
"${text}"

WEB RESULTS:
${webEvidences}

Return JSON with:
label, confidence, aiReasoning, webSourcesSummary`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content || "{}";
    const aiAnalysis = JSON.parse(responseText);

    let webSearchResults: unknown[] = [];
    try {
      if (hasWebEvidence) {
        const parsedWeb = JSON.parse(webEvidences);
        webSearchResults = Array.isArray(parsedWeb) ? parsedWeb : [];
      }
    } catch {}

    return {
      label: aiAnalysis.label ?? "Uncertain",
      confidence: aiAnalysis.confidence ?? 0,
      aiReasoning: aiAnalysis.aiReasoning ?? "No AI analysis provided",
      webSourcesSummary: aiAnalysis.webSourcesSummary ?? "No web sources summary available",
      webSearchResults,
      webSearchStatus: hasWebEvidence ? "available" : "unavailable"
    };

  } catch (error: any) {
    const msg = error.message || "Unknown error";

    if (msg.includes("401")) throw new Error("Invalid OpenAI API Key");
    if (msg.includes("429")) throw new Error("Rate limit exceeded");

    throw new Error(`Classification failed: ${msg}`);
  }
};

const extractMainClaim = (text: string): string => {
  const cleaned = text.replace(/according to|reported by|claimed that|said that/gi, "").trim();
  return cleaned.split(".")[0].substring(0, 100);
};

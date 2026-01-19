import Groq from "groq-sdk";

export const classifyNews = async (text: string) => {
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined. Please set it in your .env.local file.");
    }

    const groq = new Groq({ apiKey: API_KEY });

    const prompt = `You are a fact-checking AI. Classify the following news as Fake, Real, or Uncertain.
Provide a JSON response with the following keys:
- label: "Fake", "Real", or "Uncertain"
- confidence: number (0-100)
- reason: short explanation (max 3 lines)

News: "${text}"

Respond with ONLY the JSON object, no markdown formatting.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const responseText = completion.choices[0]?.message?.content || "{}";
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Groq API Error:", error);
        throw new Error("Failed to classify news");
    }
};

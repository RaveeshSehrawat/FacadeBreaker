const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log("API Key:", API_KEY ? "Found" : "Not found");
console.log("Testing API key...");

async function testKey() {
  if (!API_KEY) {
    console.error("GEMINI_API_KEY is not defined in .env.local");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello");
    console.log("✓ API key is valid!");
  } catch (error) {
    console.error("✗ API key is invalid:", error.message);
  }
}

testKey();

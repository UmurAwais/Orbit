import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Summarizes the content of a page or a long text.
 */
export async function summarizeText(text) {
  if (!text || text.length < 50) return "Not enough content to analyze on this page.";
  try {
    const prompt = `You are Orbit AI, an elite browser intelligence system. 
    Analyze the following webpage content and provide a MASTER SUMMARY.
    
    Structure your response with:
    1. A one-sentence 'High-Level Intent' overview.
    2. 3-5 'Key Insights' in bullet points.
    3. A 'Quick Verdict' (e.g., is this a technical guide, news piece, or commercial site?).
    
    Be professional, direct, and avoid filler text. Use the provided text only: \n\n${text.substring(0, 15000)}`;
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Orbit AI Summary failed:", error);
    return "Failed to synchronize intelligence with this page.";
  }
}

/**
 * Answers a question based on web context or general knowledge.
 */
export async function askAI(question, context = "") {
  try {
    const prompt = context 
      ? `You are Orbit AI. Use the provided Page Context to answer the User Input.
      
      Page Context: ${context.substring(0, 15000)}
      User Input: ${question}
      
      Instructions:
      - If the answer is in the context, provide it precisely.
      - If the answer is not in the context, use your vast knowledge to answer, but prefix with [Global Knowledge].
      - Keep the tone elite, helpful, and concise.`
      : question;
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Orbit AI Query failed:", error);
    return "I hit a data turbulence. Could you repeat that?";
  }
}

/**
 * Extends search queries with AI suggestions or direct answers.
 */
export async function getSmartSearchInsights(query) {
  if (query.length < 3) return null;
  try {
    const prompt = `The user is searching for: "${query}". 
    Provide a very brief (1 sentence) context or "Quick Fact" about this topic, 
    and suggest 3 related but specialized search terms. 
    Format as JSON: { "fact": "...", "suggestions": ["...", "...", "..."] }`;
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

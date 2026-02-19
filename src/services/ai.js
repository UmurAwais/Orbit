import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Summarizes the content of a page or a long text.
 */
export async function summarizeText(text) {
  if (!text) return "No content to summarize.";
  try {
    const prompt = `Summarize the following text concisely in 3-5 bullet points. Focus on key information and intent: \n\n${text.substring(0, 10000)}`;
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Summarization failed:", error);
    return "Failed to generate summary.";
  }
}

/**
 * Answers a question based on web context or general knowledge.
 */
export async function askAI(question, context = "") {
  try {
    const prompt = context 
      ? `Context: ${context}\n\nQuestion: ${question}\n\nAnswer the question based on the context provided. If the answer is not in the context, use your general knowledge but mention that.`
      : question;
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Query failed:", error);
    return "I'm sorry, I couldn't process that request right now.";
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

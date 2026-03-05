import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Fail-safe check
if (!API_KEY) {
  console.error("[Orbit AI] FATAL: VITE_GEMINI_API_KEY is not defined in .env");
}

const genAI = new GoogleGenerativeAI(API_KEY || "NONE");

// Using gemini-1.5-flash as it has broader regional availability and higher reliability for structured tasks
export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.1, // Lower temperature for more consistent formatting
    topP: 0.95,
  }
});

/**
 * Summarizes the content of a page or a long text.
 */
export async function summarizeText(text) {
  if (!text || text.length < 50) {
    return {
      summary: "Not enough content to analyze on this page.",
      questions: []
    };
  }

  console.log(`[Orbit AI] Starting analysis. Key length: ${API_KEY ? API_KEY.length : 0}. Starts with AIza: ${API_KEY ? API_KEY.startsWith('AIza') : false}`);
  
  try {
    const prompt = `You are Orbit AI, an elite browser intelligence system. 
    Analyze the following webpage content and provide a MASTER SUMMARY and SUGGESTED QUESTIONS.
    
    Format your response EXACTLY like this with no intro or outro:
    SUMMARY_START
    1. **High-Level Intent:** [1 sentence]
    2. **Key Insights:** 
       - [Insight 1]
       - [Insight 2]
       - [Insight 3]
    3. **Quick Verdict:** [1 sentence]
    SUMMARY_END
    QUESTIONS_START
    [Suggestion 1]
    [Suggestion 2]
    [Suggestion 3]
    QUESTIONS_END

    Use the provided text only: \n\n${text.substring(0, 15000)}`;
    
    const result = await geminiModel.generateContent(prompt);
    const textOutput = (await result.response.text()).trim();
    
    let summaryText = "Analysis complete.";
    let questionsList = [];
    
    const summaryMatch = textOutput.match(/SUMMARY_START([\s\S]*?)SUMMARY_END/);
    if (summaryMatch) summaryText = summaryMatch[1].trim();
    else summaryText = textOutput;

    const questionsMatch = textOutput.match(/QUESTIONS_START([\s\S]*?)QUESTIONS_END/);
    if (questionsMatch) {
      questionsList = questionsMatch[1].split('\n').map(q => q.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^\[|\]$/g, '').trim()).filter(q => q.length > 5);
    }

    return {
      summary: summaryText,
      questions: questionsList
    };
  } catch (error) {
    console.error("[Orbit AI] Summary failed with error:", error);
    let errorMsg = error.message || "Unknown error";
    let errorType = "General Error";
    
    // Provide user-friendly guidance for common Gemini errors
    // Note: Only match specific HTTP codes, NOT the word "API" as SDK messages always contain it
    if (errorMsg.includes("User location is not supported") || errorMsg.includes("location")) {
      errorType = "Regional Restriction";
      errorMsg = "Orbit AI (Gemini) is not available in your region. Please use a VPN or try a different Google account.";
    } else if (errorMsg.includes("401") || errorMsg.includes("403") || errorMsg.includes("invalid") || errorMsg.includes("API_KEY_INVALID")) {
      errorType = "API Key Issue";
      errorMsg = "Your Gemini API Key appears to be invalid or expired. Please verify it at aistudio.google.com.";
    } else if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      errorType = "Rate Limited";
      errorMsg = "Too many requests. Please wait a moment before trying again.";
    }

    return {
      summary: `### Analysis Failed\n\n**Error Type:** ${errorType}\n\n**Details:** ${errorMsg}\n\n**Raw Error:** ${error.message || 'none'}\n\n*Please restart the browser after changing your .env file.*`,
      questions: []
    };
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

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the AI client using your API key.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    // ⭐ ROLLING SUMMARY CHANGE: We receive the 'summary' passed from the frontend ChatContext.
    const { text, history, summary } = await request.json();

    const cleanText = (text || '').trim();

    if (!cleanText) {
      return NextResponse.json({ text: 'Message text is empty' }, { status: 400 });
    }

    try {
      // ⭐ BENTO BOX: Rulebook Compartment (System Instructions)
      // This is the "God Mode" rulebook. By placing the summary here, Gemini 
      // treats it as permanent knowledge for the entire session.
      const systemInstructions = `
        You are a helpful AI assistant.
        
        CONVERSATION CHEAT SHEET (Summary of past chat):
        ${summary || "No summary available yet. This is the start of a new chat."}
        
        INSTRUCTION: Use the cheat sheet above to understand the long-term context.
        After your helpful response to the user, add a short, updated summary of the entire conversation 
        so far, formatted like this: [NEW_SUMMARY: ...insert updated summary here...].
        Keep the summary under 100 words and focus on key decisions or facts.
      `;

      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: systemInstructions
      });

      // ⭐ BENTO BOX: Filing Cabinet Compartment (History)
      // We map your database format into the strict role/parts format Gemini requires.
      let geminiHistory: any[] = [];
      if (history && Array.isArray(history)) {
        geminiHistory = history.map((msg: any) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        }));
      }

      // Add the new user message to the bottom of the history
      geminiHistory.push({ 
        role: 'user',
        parts: [{ text: cleanText }]
      });

      // Delivering the box to Gemini
      const result = await model.generateContent({
        contents: geminiHistory
      });
      
      const response = await result.response;
      let aiText = response.text() || "Sorry, I couldn't generate a response.";

      // ⭐ ROLLING SUMMARY: Extraction Logic
      // We use a "Regular Expression" (Regex) to find the tag inside the AI's response.
      let newSummary = summary;
      const summaryMatch = aiText.match(/\[NEW_SUMMARY: (.*?)\]/);
      
      if (summaryMatch) {
        // If the AI found a summary, grab the text inside the [NEW_SUMMARY: ...] tag
        newSummary = summaryMatch[1]; 
        // Remove the tag from the message so the user doesn't see our internal notes
        aiText = aiText.replace(summaryMatch[0], '').trim(); 
      }

      // Send both the text and the updated summary back to your frontend
      return NextResponse.json({
        text: aiText,
        summary: newSummary, 
        source: "gemini"
      });

    } catch (geminiError: any) {
      console.log("Gemini Error:", geminiError);

      // Handle heavy traffic errors gracefully
      if (
        geminiError?.status === 503 ||
        geminiError?.message?.includes("503") ||
        geminiError?.message?.toLowerCase().includes("overloaded")
      ) {
        return NextResponse.json({
          text: "⚠️ The AI model is experiencing heavy traffic. Please try again in a few seconds.",
          source: "fallback",
          isFallback: true
        });
      }

      return NextResponse.json({
        text: "⚠️ AI service temporarily unavailable.",
        source: "fallback",
        isFallback: true
      });
    }

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ text: "⚠️ Server error." }, { status: 500 });
  }
}
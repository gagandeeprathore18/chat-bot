import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the AI client using your API key.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const SUMMARY_MARKER = '[NEW_SUMMARY:';

const encodeStreamEvent = (event: Record<string, unknown>) =>
  new TextEncoder().encode(`${JSON.stringify(event)}\n`);

export async function POST(request: NextRequest) {
  try {
    // ROLLING SUMMARY CHANGE: We receive the 'summary' passed from the frontend ChatContext.
    const { text, history, summary } = await request.json();

    const cleanText = (text || '').trim();

    if (!cleanText) {
      return NextResponse.json({ text: 'Message text is empty' }, { status: 400 });
    }

    try {
      // BENTO BOX: Rulebook Compartment (System Instructions)
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

      // the instruction are passed alongside the model initlization. 
      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: systemInstructions
      });

      // BENTO BOX: Filing Cabinet Compartment (History)
      // We map your database format into the strict role/parts format Gemini requires.
      let geminiHistory: any[] = []; // into array format
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

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const result = await model.generateContentStream({
              contents: geminiHistory
            });

            let rawText = '';
            let visibleText = '';
            let sentVisibleLength = 0;

            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (!chunkText) continue;

              rawText += chunkText;

              // Stream only user-visible answer text. A small tail buffer keeps a
              // split [NEW_SUMMARY: ...] marker from flashing in the chat UI.
              const markerIndex = rawText.indexOf(SUMMARY_MARKER);
              if (markerIndex >= 0) {
                visibleText = rawText.slice(0, markerIndex);
              } else {
                const safeLength = Math.max(0, rawText.length - SUMMARY_MARKER.length + 1);
                visibleText = rawText.slice(0, safeLength);
              }

              const delta = visibleText.slice(sentVisibleLength);
              if (delta) {
                sentVisibleLength = visibleText.length;
                controller.enqueue(encodeStreamEvent({
                  type: 'chunk',
                  text: delta,
                }));
              }
            }

            let aiText = rawText || "Sorry, I couldn't generate a response.";
            let newSummary = summary;
            const summaryMatch = aiText.match(/\[NEW_SUMMARY:\s*([\s\S]*?)\]/);

            if (summaryMatch) {
              newSummary = summaryMatch[1].trim();
              aiText = aiText.replace(summaryMatch[0], '').trim();
            }

            const remainingVisibleText = aiText.slice(sentVisibleLength);
            if (remainingVisibleText) {
              controller.enqueue(encodeStreamEvent({
                type: 'chunk',
                text: remainingVisibleText,
              }));
            }

            // Final event lets the client persist the cleaned text and updated summary.
            controller.enqueue(encodeStreamEvent({
              type: 'done',
              text: aiText,
              summary: newSummary,
              source: 'gemini',
            }));
            controller.close();
          } catch (streamError) {
            console.log("Gemini Stream Error:", streamError);
            controller.enqueue(encodeStreamEvent({
              type: 'done',
              text: "⚠️ AI service temporarily unavailable.",
              source: "fallback",
              isFallback: true,
              summary,
            }));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });

    } catch (geminiError: any) {
      console.log("Gemini Error:", geminiError);

      // Handle heavy traffic errors gracefully
      if (
        geminiError?.status === 503 ||
        geminiError?.message?.includes("503") ||
        geminiError?.message?.toLowerCase().includes("overloaded")
      ) {
        return new Response(encodeStreamEvent({
          type: 'done',
          text: "⚠️ The AI model is experiencing heavy traffic. Please try again in a few seconds.",
          source: "fallback",
          isFallback: true,
          summary,
        }), {
          headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
        });
      }

      return new Response(encodeStreamEvent({
        type: 'done',
        text: "⚠️ AI service temporarily unavailable.",
        source: "fallback",
        isFallback: true,
        summary,
      }), {
        headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
      });
    }

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ text: "⚠️ Server error." }, { status: 500 });
  }
}

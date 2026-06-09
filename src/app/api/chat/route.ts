import { NextRequest, NextResponse } from 'next/server';
import { FAQS } from '../../../data/faqs';
import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("API KEY loaded:", !!process.env.GOOGLE_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { text, history } = await request.json();

    // 1. Clean input
    const cleanText = (text || '').trim();

    if (!cleanText) {
      return NextResponse.json(
        { text: 'Message text is empty' },
        { status: 400 }
      );
    }

    const query = cleanText.toLowerCase();

    // // 2. FAQ MATCHING (FAST LAYER)
    // const matchedFAQ = FAQS.find(faq => {
    //   const questionMatch = faq.question.toLowerCase().includes(query);
    //   const keywordMatch = faq.keywords.some(kw =>
    //     query.includes(kw.toLowerCase())
    //   );
    //   return questionMatch || keywordMatch;
    // });

    // if (matchedFAQ) {
    //   return NextResponse.json({
    //     text: matchedFAQ.answer,
    //     faqId: matchedFAQ.id, // ✅ FIXED (was question earlier)
    //     source: "faq"
    //   });
    // }

    // 3. GEMINI FALLBACK - using the bento gemini approach. System instruction is passed here.
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction : "You are a helpful AI assistant. Answer clearly and concisely. Format responses in clean Markdown like ChatGPT: use short paragraphs, bullet lists when useful, bold only for important labels, and keep each bullet on its own line."
      });

      // formatting the history for gemnini in its desired format. acts as a filling cabinet. 
        let geminiHistory: any[] = [];

      if (history && Array.isArray(history)) { //checking if history exists and is an array which is non empty.
        geminiHistory = history.map((msg: any) => ({
          role: msg.sender === 'user' ? 'user':"model",
          parts : [{text:msg.text}]
        }))   
      }
      // adding the latest user message to the gemini history as well.
      geminiHistory.push({ 
        role: 'user',
        parts: [{ text: cleanText }]
      });

      const result = await model.generateContent({
        contents: geminiHistory
      })
      const response = await result.response;
      const aiText = response.text();

      return NextResponse.json({
        text: aiText || "Sorry, I couldn't generate a response.",
        source: "gemini"
      });

    } catch (geminiError: any) {
      console.log("Gemini Error:", geminiError);

      // ✅ HANDLE OVERLOAD / 503
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

      // fallback for other Gemini errors
      return NextResponse.json({
        text: "⚠️ AI service temporarily unavailable. Please try again later.",
        source: "fallback",
        isFallback: true
      });
    }

  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json({
      text: "⚠️ Something went wrong. Please try again later.",
      source: "server-error"
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { FAQS } from '../../../data/faqs';
import { GoogleGenerativeAI } from "@google/generative-ai";
console.log("API KEY:", process.env.GOOGLE_API_KEY)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    // 1. Clean input
    const cleanText = (text || '').trim();

    if (!cleanText) {
      return NextResponse.json(
        { error: 'Message text is empty' },
        { status: 400 }
      );
    }

    // 2. Normalize query
    const query = cleanText.toLowerCase();

    // 3. FAQ MATCHING (FAST LAYER)
    const matchedFAQ = FAQS.find(faq => {
      const questionMatch = faq.question.toLowerCase().includes(query);
      const keywordMatch = faq.keywords.some(kw =>
        query.includes(kw.toLowerCase())
      );

      return questionMatch || keywordMatch;
    });

    // 4. If FAQ found → return FAQ answer
    if (matchedFAQ) {
      return NextResponse.json({
        text: matchedFAQ.answer,
        faqId: matchedFAQ.question,
      });
    }

    // 5. GEMINI FALLBACK (SMART LAYER)

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const result = await model.generateContent(cleanText);

    const response = await result.response;
    const aiText = response.text();
    console.log(aiText)

    return NextResponse.json({
      text: aiText || "Sorry, I couldn't generate a response.",
    });

  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      { error: 'Failed to process chat response' },
      { status: 500 }
    );
  }
}
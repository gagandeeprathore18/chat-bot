import { NextRequest, NextResponse } from 'next/server';
import { FAQS } from '../../../data/faqs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    let filteredList = FAQS;

    // 3. Filter by Search Query
    if (query) {
      const lowercaseQuery = query.toLowerCase().trim();

      filteredList = filteredList.filter(faq => {
        const questionMatches =
          faq.question.toLowerCase().includes(lowercaseQuery);

        const keywordMatches = faq.keywords.some(kw =>
          kw.toLowerCase().includes(lowercaseQuery)
        );

        return questionMatches || keywordMatches;
      });
    }

    return NextResponse.json(filteredList);
  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      { error: 'Failed to retrieve FAQs' },
      { status: 500 }
    );
  }
}
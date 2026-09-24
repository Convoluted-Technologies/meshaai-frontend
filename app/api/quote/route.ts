import { NextRequest, NextResponse } from 'next/server';
import { calculateOrderQuote } from '@/lib/orders';
import { createProblemDetails } from '@/lib/utils/errors';
import { QuoteRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuoteRequest;

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return createProblemDetails(
        400,
        'Invalid Request Body',
        'Quote request must include at least one item.',
        'https://meshaai.com/errors/invalid-items',
        '/api/quote'
      );
    }

    const quote = calculateOrderQuote(body);
    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Quote Calculation Failed',
      err.message || 'Failed to calculate quote',
      'https://meshaai.com/errors/quote-failed',
      '/api/quote'
    );
  }
}

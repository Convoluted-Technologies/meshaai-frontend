import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';
import { getActivePresets } from '@/lib/catalog';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currency = searchParams.get('currency') || undefined;

    const queryStr = currency ? `?currency=${encodeURIComponent(currency)}` : '';
    const data = await backendFetch(`/api/v1/catalog${queryStr}`, {
      method: 'GET',
      currency,
      skipAuth: true,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Failed to fetch backend catalog:', err.message);

    // Fallback to local default presets if backend is temporarily unreachable
    const fallbackPresets = getActivePresets();
    return NextResponse.json({
      currency: 'NGN',
      presets: fallbackPresets,
      categories: [
        {
          id: 'signature-specials',
          name: 'Signature Specials',
          items: fallbackPresets.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            available: p.isAvailable,
            basePrice: {
              currency: 'NGN',
              amount: p.priceKobo,
              formatted: `₦${(p.priceKobo / 100).toLocaleString()}`,
            },
            imageUrl: p.imageUrl,
            components: p.components,
          })),
        },
      ],
    });
  }
}

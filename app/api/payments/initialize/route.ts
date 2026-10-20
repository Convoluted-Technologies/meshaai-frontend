import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

/**
 * POST /api/payments/initialize
 * Contract section 2.9: Payment Checkout Session Initiation.
 *
 * Delegates entirely to the backend: POST /api/v1/orders/{code}/pay
 * The backend contacts Flutterwave, registers the attempt, and returns
 * { checkoutUrl, reference, gateway }.
 *
 * If FLW_SECRET_KEY is absent (local dev) the backend itself will either
 * fall back to a sandbox URL or we redirect to the mock checkout page.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderCode, orderId } = body;
    const code = (orderCode || orderId || '').toString().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { title: 'Missing Order Identifier', detail: 'orderCode is required to initialize payment.' },
        { status: 400 }
      );
    }

    // Delegate to backend: POST /api/v1/orders/{code}/pay
    const res = await backendFetch(`/orders/${encodeURIComponent(code)}/pay`, {
      method: 'POST',
    });

    const data = await res.json();

    if (!res.ok) {
      // Map backend error codes to frontend-friendly messages (contract section 7.4)
      const errorCode = data.code || data.errorCode || '';
      let detail = data.detail || data.message || 'Unable to initialize payment.';
      if (errorCode === 'ORDER_NOT_PAYABLE') {
        detail = 'Payment cannot be initiated. This order is already paid or cancelled.';
      } else if (errorCode === 'ORDER_NOT_FOUND') {
        detail = `Order ${code} not found.`;
      }
      return NextResponse.json(
        { title: 'Payment Initialization Failed', detail, code: errorCode },
        { status: res.status }
      );
    }

    // Contract response: { checkoutUrl, reference, gateway }
    const checkoutUrl: string = data.checkoutUrl || data.link || '';

    // If the backend returned no checkout URL (e.g. no gateway configured in dev),
    // fall back to the local mock checkout page so the flow stays intact.
    if (!checkoutUrl) {
      const hostOrigin = req.headers.get('origin') || 'http://localhost:3000';
      const mockUrl = `${hostOrigin}/checkout/mock?tx_ref=${encodeURIComponent(data.reference || `MSH-${code}`)}&code=${code}`;
      return NextResponse.json({
        success: true,
        checkoutUrl: mockUrl,
        reference: data.reference || '',
        gateway: data.gateway || 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
      reference: data.reference || '',
      gateway: data.gateway || 'flutterwave',
    });
  } catch (err: any) {
    console.error('[payments/initialize] error:', err);
    return NextResponse.json(
      { title: 'Payment Initialization Failed', detail: err.message || 'Unable to initialize checkout' },
      { status: 502 }
    );
  }
}

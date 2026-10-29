import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

/**
 * POST /api/payments/webhook
 * Contract section 3.2: Inbound Asynchronous Payment Webhook.
 *
 * Flutterwave sends a signed JSON payload to this endpoint.
 * We verify the verif-hash signature, then forward the full payload to the
 * backend's own webhook endpoint: POST /api/v1/webhooks/flutterwave
 * The backend handles authoritative verification and idempotent order updates.
 */

const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH || 'Meeshaai-secret-hash';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('verif-hash');

  if (!signature || signature !== FLW_SECRET_HASH) {
    console.warn('[webhook] Invalid or missing verif-hash signature');
    return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  console.log('[webhook] Received Flutterwave event:', payload?.event);

  try {
    // Forward the full webhook payload to the backend (contract section 3.2)
    // The backend validates the event, calls Flutterwave verify API, and updates order state.
    const backendRes = await backendFetch('/webhooks/flutterwave', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, {
      // Forward the original signature so the backend can re-verify if needed
      'verif-hash': FLW_SECRET_HASH,
    });

    if (!backendRes.ok) {
      const errData = await backendRes.json().catch(() => ({}));
      console.error('[webhook] Backend webhook forwarding failed:', backendRes.status, errData);
      // Still return 200 to Flutterwave to prevent retries for non-transient errors
      return NextResponse.json({ status: 'forwarding_failed', detail: errData?.message }, { status: 200 });
    }

    const result = await backendRes.json().catch(() => ({ status: 'success' }));
    return NextResponse.json({ status: result.status || 'success', message: 'Webhook processed successfully' });
  } catch (err: any) {
    console.error('[webhook] Processing error:', err);
    // Return 200 so Flutterwave does not retry on our network errors
    return NextResponse.json({ status: 'error', message: err.message }, { status: 200 });
  }
}

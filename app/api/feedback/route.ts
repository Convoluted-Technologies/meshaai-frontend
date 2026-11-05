import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://meshaai-mainframe-744177391644.europe-west1.run.app';

// Category map from frontend values → backend enum
const CATEGORY_MAP: Record<string, string> = {
  general: 'GENERAL_ENQUIRY',
  complaint: 'COMPLAINT',
  suggestion: 'SUGGESTION',
  compliment: 'COMPLIMENT',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, email, orderCode, subject, message } = body;

    const category = CATEGORY_MAP[type] || 'GENERAL_ENQUIRY';

    const payload: Record<string, string> = {
      category,
      name: String(name || '').trim().slice(0, 100),
      email: String(email || '').trim().slice(0, 128),
      subject: String(subject || '').trim().slice(0, 150),
      message: String(message || '').trim().slice(0, 2000),
    };

    // orderCode is optional — only include if provided and matches pattern
    const cleanCode = String(orderCode || '').trim().toUpperCase();
    if (cleanCode) payload.orderCode = cleanCode;

    const res = await fetch(`${BACKEND_URL}/api/v1/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 201 || res.ok) {
      return NextResponse.json({ success: true, id: data.id, createdAt: data.createdAt }, { status: 201 });
    }

    // 400 validation or 429 rate limit
    if (res.status === 429) {
      return NextResponse.json(
        { success: false, detail: 'Too many submissions. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, detail: data.detail || data.title || 'Failed to submit feedback.' },
      { status: res.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, detail: 'Network error. Please try again.' },
      { status: 502 }
    );
  }
}

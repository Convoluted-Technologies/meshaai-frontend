import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'UP',
    service: 'meshaai-backend',
    timestamp: new Date().toISOString(),
  });
}

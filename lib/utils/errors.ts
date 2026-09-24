import { NextResponse } from 'next/server';
import { RFCProblemDetails } from '@/lib/types';

export function createProblemDetails(
  status: number,
  title: string,
  detail: string,
  type = 'about:blank',
  instance?: string,
  errors?: Record<string, string[]>
): NextResponse<RFCProblemDetails> {
  const body: RFCProblemDetails = {
    type,
    title,
    status,
    detail,
    instance: instance || '/api/error',
    ...(errors ? { errors } : {}),
  };

  return NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/problem+json',
    },
  });
}

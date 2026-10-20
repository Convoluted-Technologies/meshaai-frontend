import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';

export async function GET(req: NextRequest) {
  try {
    const data = await backendFetch('/api/v1/admin/kitchens', {
      method: 'GET',
    });
    return NextResponse.json({ kitchens: data.kitchens || data.content || data || [] });
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    return NextResponse.json({ kitchens: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await backendFetch('/api/v1/admin/kitchens', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json({ kitchen: data.kitchen || data });
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    return NextResponse.json({ title: 'Failed to create kitchen', detail: err.message, status: 400 }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { getActivePresets } from '@/lib/catalog';

export async function GET() {
  const presets = getActivePresets();
  return NextResponse.json({
    success: true,
    presets,
    count: presets.length,
  });
}

import { NextResponse } from 'next/server';
import { getPresetsFromStore, getSettingsFromStore } from '@/lib/db/store';

export async function GET() {
  try {
    const presets = getPresetsFromStore();
    const settings = getSettingsFromStore();
    return NextResponse.json({
      status: 'READY',
      presetsCount: presets.length,
      shopName: settings.shopName,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'NOT_READY', error: err.message },
      { status: 503 }
    );
  }
}

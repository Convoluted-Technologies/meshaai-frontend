import { NextRequest, NextResponse } from 'next/server';
import { getSettingsFromStore, saveSettingsToStore } from '@/lib/db/store';
import { createProblemDetails } from '@/lib/utils/errors';
import { SystemSettings } from '@/lib/types';
import { broadcastAdminEvent } from '@/lib/events/sse';

export async function GET() {
  const settings = getSettingsFromStore();
  return NextResponse.json({
    success: true,
    settings,
  });
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as SystemSettings;
    if (!body.shopName || !body.operatingHours || !body.deliveryZone || !body.deliveryFee) {
      return createProblemDetails(
        400,
        'Invalid Settings Object',
        'System settings payload is missing required core fields.',
        'https://meshaai.com/errors/invalid-settings',
        '/api/admin/settings'
      );
    }

    saveSettingsToStore(body);
    broadcastAdminEvent('SETTINGS_UPDATED', { settings: body });

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      settings: body,
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Settings Update Failed',
      err.message || 'Unable to save system settings',
      'https://meshaai.com/errors/settings-update-failed',
      '/api/admin/settings'
    );
  }
}

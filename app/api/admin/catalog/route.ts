import { NextRequest, NextResponse } from 'next/server';
import {
  getAllPresets,
  createPreset,
  updatePreset,
  togglePresetAvailability,
  getCatalogVersions,
} from '@/lib/catalog';
import { createProblemDetails } from '@/lib/utils/errors';

export async function GET() {
  const presets = getAllPresets();
  const versions = getCatalogVersions();

  return NextResponse.json({
    success: true,
    presets,
    versions,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, components, priceKobo, imageUrl, isAvailable, actor = 'ADMIN' } = body;

    if (id) {
      // Update existing preset
      const updated = updatePreset(
        id,
        {
          ...(name ? { name } : {}),
          ...(description ? { description } : {}),
          ...(components ? { components } : {}),
          ...(priceKobo !== undefined ? { priceKobo: Number(priceKobo) } : {}),
          ...(imageUrl ? { imageUrl } : {}),
          ...(isAvailable !== undefined ? { isAvailable: Boolean(isAvailable) } : {}),
        },
        actor
      );
      return NextResponse.json({ success: true, preset: updated, message: 'Preset updated successfully' });
    } else {
      // Create new preset
      if (!name || !priceKobo || !components) {
        return createProblemDetails(
          400,
          'Missing Preset Fields',
          'Name, price in kobo, and components array are required to create a preset.',
          'https://meshaai.com/errors/missing-preset-fields',
          '/api/admin/catalog'
        );
      }

      const created = createPreset(
        {
          name,
          description: description || '',
          components,
          priceKobo: Number(priceKobo),
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
          isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        },
        actor
      );

      return NextResponse.json({ success: true, preset: created, message: 'Preset created successfully' }, { status: 201 });
    }
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Preset Save Failed',
      err.message || 'Unable to save preset',
      'https://meshaai.com/errors/preset-save-failed',
      '/api/admin/catalog'
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isAvailable, actor = 'ADMIN' } = body;

    if (!id || isAvailable === undefined) {
      return createProblemDetails(
        400,
        'Invalid Toggle Request',
        'Preset ID and isAvailable boolean are required.',
        'https://meshaai.com/errors/invalid-toggle-payload',
        '/api/admin/catalog'
      );
    }

    const updated = togglePresetAvailability(id, Boolean(isAvailable), actor);
    return NextResponse.json({
      success: true,
      preset: updated,
      message: `Preset "${updated.name}" availability set to ${isAvailable}`,
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Toggle Failed',
      err.message || 'Unable to toggle preset availability',
      'https://meshaai.com/errors/toggle-failed',
      '/api/admin/catalog'
    );
  }
}

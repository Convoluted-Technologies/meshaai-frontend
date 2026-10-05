import { NextRequest, NextResponse } from 'next/server';
import {
  getAllPresets,
  createPreset,
  updatePreset,
  deletePreset,
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

    const formattedComponents = Array.isArray(components)
      ? components
      : typeof components === 'string'
      ? components.split(',').map((c) => c.trim()).filter(Boolean)
      : ['Artisan Bread', 'Farm Eggs'];

    if (id) {
      // Update existing preset
      const updated = updatePreset(
        id,
        {
          ...(name ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(components ? { components: formattedComponents } : {}),
          ...(priceKobo !== undefined ? { priceKobo: Number(priceKobo) } : {}),
          ...(imageUrl ? { imageUrl } : {}),
          ...(isAvailable !== undefined ? { isAvailable: Boolean(isAvailable) } : {}),
        },
        actor
      );
      return NextResponse.json({ success: true, preset: updated, message: 'Preset updated successfully' });
    } else {
      // Create new preset
      if (!name || priceKobo === undefined) {
        return createProblemDetails(
          400,
          'Missing Preset Fields',
          'Product name and price in kobo (or NGN) are required.',
          'https://meshaai.com/errors/missing-preset-fields',
          '/api/admin/catalog'
        );
      }

      const created = createPreset(
        {
          name,
          description: description || 'Delicious freshly prepared bread & egg meal combo.',
          components: formattedComponents,
          priceKobo: Number(priceKobo),
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80',
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return createProblemDetails(
        400,
        'Missing ID',
        'Preset ID query parameter is required for deletion.',
        'https://meshaai.com/errors/missing-preset-id',
        '/api/admin/catalog'
      );
    }

    deletePreset(id);
    return NextResponse.json({ success: true, message: `Product ${id} deleted successfully.` });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Delete Failed',
      err.message || 'Unable to delete preset',
      'https://meshaai.com/errors/delete-failed',
      '/api/admin/catalog'
    );
  }
}

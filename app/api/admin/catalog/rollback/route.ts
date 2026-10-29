import { NextRequest, NextResponse } from 'next/server';
import { rollbackCatalog } from '@/lib/catalog';
import { createProblemDetails } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { versionId, actor = 'ADMIN' } = body;

    if (!versionId) {
      return createProblemDetails(
        400,
        'Missing Version ID',
        'versionId is required to execute catalog rollback.',
        'https://Meeshaai.com/errors/missing-version-id',
        '/api/admin/catalog/rollback'
      );
    }

    const restoredPresets = rollbackCatalog(versionId, actor);

    return NextResponse.json({
      success: true,
      message: `Catalog rolled back to version ${versionId} successfully`,
      presets: restoredPresets,
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Rollback Failed',
      err.message || 'Unable to execute rollback',
      'https://Meeshaai.com/errors/rollback-failed',
      '/api/admin/catalog/rollback'
    );
  }
}

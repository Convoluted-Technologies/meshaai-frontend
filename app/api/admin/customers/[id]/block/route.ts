import { NextRequest, NextResponse } from 'next/server';
import { toggleBlockedPhoneStore } from '@/lib/db/store';
import { createProblemDetails } from '@/lib/utils/errors';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // phone number or customer id
    const body = await req.json();
    const { block } = body;

    if (block === undefined) {
      return createProblemDetails(
        400,
        'Block Status Required',
        'block boolean property is required.',
        'https://meshaai.com/errors/missing-block-boolean',
        `/api/admin/customers/${id}/block`
      );
    }

    const updatedList = toggleBlockedPhoneStore(id, Boolean(block));

    return NextResponse.json({
      success: true,
      message: `Phone number ${id} ${block ? 'blocked' : 'unblocked'} successfully.`,
      blockedPhones: updatedList,
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Block Action Failed',
      err.message || 'Unable to block/unblock customer',
      'https://meshaai.com/errors/block-failed',
      `/api/admin/customers/block`
    );
  }
}

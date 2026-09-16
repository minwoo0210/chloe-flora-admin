import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { deleteSection, updateSection } from '@/server/services/homepage-service';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  title: z.string().trim().min(1).max(64).optional(),
  subtitle: z.string().max(128).nullable().optional(),
  image_key: z.string().min(1).optional(),
  category_id: z.string().min(1).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '参数错误' }, { status: 400 });
  }
  await updateSection(id, parsed.data);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const { id } = await params;
  await deleteSection(id);
  return NextResponse.json({ success: true });
}

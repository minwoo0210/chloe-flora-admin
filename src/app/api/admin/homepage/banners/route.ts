import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createBanner, listBanners } from '@/server/services/homepage-service';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  title: z.string().max(64).nullable().optional(),
  image_key: z.string().trim().min(1, '请先上传图片'),
  link_target: z.string().max(255).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;
  return NextResponse.json({ items: await listBanners() });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '参数错误' }, { status: 400 });
  }
  const item = await createBanner(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createSection, listSections } from '@/server/services/homepage-service';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  title: z.string().trim().min(1, '请输入标题').max(64),
  subtitle: z.string().max(128).nullable().optional(),
  image_key: z.string().trim().min(1, '请先上传宣传图'),
  category_id: z.string().min(1).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;
  return NextResponse.json({ items: await listSections() });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '参数错误' }, { status: 400 });
  }
  const item = await createSection(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import {
  createHotRecommendation,
  listHotRecommendations,
} from '@/server/services/homepage-service';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  product_id: z.string().min(1, '请选择商品'),
  title: z.string().max(64).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;
  return NextResponse.json({ items: await listHotRecommendations() });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '参数错误' }, { status: 400 });
  }
  try {
    const result = await createHotRecommendation(parsed.data);
    return NextResponse.json({ item: result, success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '添加失败' },
      { status: 409 }
    );
  }
}

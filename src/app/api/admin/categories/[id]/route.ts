import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import {
  countProductsInCategory,
  deleteCategory,
  updateCategory,
} from '@/server/services/category-service';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().trim().min(1).max(64).optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(255).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
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

  try {
    const item = await updateCategory(id, parsed.data);
    return NextResponse.json({ item });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '更新失败';
    const status = /duplicate|unique/i.test(msg) ? 409 : 500;
    return NextResponse.json(
      { error: /duplicate|unique/i.test(msg) ? '分类标识已存在' : msg },
      { status }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const count = await countProductsInCategory(id);
  if (count > 0) {
    return NextResponse.json(
      { error: `该分类下仍有 ${count} 件商品，请先移除或改挂其他分类` },
      { status: 409 }
    );
  }
  await deleteCategory(id);
  return NextResponse.json({ success: true });
}

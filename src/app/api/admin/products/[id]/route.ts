import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { deleteProduct, getProduct, updateProduct } from '@/server/services/product-service';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  price: z.coerce.number().min(0).optional(),
  original_price: z.coerce.number().min(0).nullable().optional(),
  main_image: z.string().nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  category_id: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const item = await getProduct(id);
  if (!item) return NextResponse.json({ error: '商品不存在' }, { status: 404 });
  return NextResponse.json({ item });
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
    const item = await updateProduct(id, parsed.data);
    return NextResponse.json({ item });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '更新失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const { id } = await params;
  await deleteProduct(id);
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createProduct, listProducts } from '@/server/services/product-service';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(1, '商品名称不能为空').max(128),
  price: z.coerce.number().min(0, '价格不能为负'),
  original_price: z.coerce.number().min(0).nullable().optional(),
  main_image: z.string().nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  category_id: z.string().min(1, '请选择商品分类'),
  status: z.enum(['active', 'inactive']),
  stock: z.coerce.number().int().min(0, '库存不能为负'),
  sort_order: z.coerce.number().int().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const sp = req.nextUrl.searchParams;
  const result = await listProducts({
    categoryId: sp.get('category') ?? undefined,
    status: (sp.get('status') as 'active' | 'inactive' | null) ?? undefined,
    keyword: sp.get('keyword') ?? undefined,
    page: sp.get('page') ? Number(sp.get('page')) : 1,
    pageSize: sp.get('pageSize') ? Number(sp.get('pageSize')) : 12,
  });
  return NextResponse.json(result);
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
    const item = await createProduct(parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '创建失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

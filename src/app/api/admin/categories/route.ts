import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createCategory, listCategories } from '@/server/services/category-service';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(1, '分类名称不能为空').max(64),
  slug: z
    .string()
    .trim()
    .min(1, '分类标识不能为空')
    .max(64)
    .regex(/^[a-z0-9-]+$/, '标识仅支持小写字母、数字与短横'),
  description: z.string().max(255).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;
  // all=0（或传 includeInactive=0）时仅返回启用分类；默认后台返回全部
  const onlyActive =
    req.nextUrl.searchParams.get('all') === '0' ||
    req.nextUrl.searchParams.get('includeInactive') === '0';
  const categories = await listCategories(!onlyActive);
  return NextResponse.json({ items: categories });
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
    const category = await createCategory(parsed.data);
    return NextResponse.json({ item: category }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '创建失败';
    const status = /duplicate|unique/i.test(msg) ? 409 : 500;
    return NextResponse.json(
      { error: /duplicate|unique/i.test(msg) ? '分类标识已存在' : msg },
      { status }
    );
  }
}

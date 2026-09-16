import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { getBrandSettings, saveBrandSettings } from '@/server/services/settings-service';

export const dynamic = 'force-dynamic';

const brandSchema = z.object({
  studio_name: z.string().trim().min(1, '工作室名称不能为空').max(64),
  slogan_primary: z.string().trim().min(1, '主 Slogan 不能为空').max(128),
  slogan_secondary: z.string().trim().max(255).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;
  return NextResponse.json(await getBrandSettings());
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '参数错误' }, { status: 400 });
  }
  await saveBrandSettings({
    studio_name: parsed.data.studio_name,
    slogan_primary: parsed.data.slogan_primary,
    slogan_secondary: parsed.data.slogan_secondary ?? '',
  });
  return NextResponse.json({ success: true });
}

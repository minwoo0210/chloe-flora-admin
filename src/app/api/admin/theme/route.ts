import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { getThemeSettings, saveThemeSettings } from '@/server/services/settings-service';

export const dynamic = 'force-dynamic';

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, '请输入 6 位 HEX 色值，如 #E8830C');

const themeSchema = z.object({
  primary: hexColor,
  background: hexColor,
  text_primary: hexColor,
  text_secondary: hexColor,
  text_tertiary: hexColor,
});

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;
  return NextResponse.json(await getThemeSettings());
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = themeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '参数错误' }, { status: 400 });
  }
  await saveThemeSettings(parsed.data);
  return NextResponse.json({ success: true });
}

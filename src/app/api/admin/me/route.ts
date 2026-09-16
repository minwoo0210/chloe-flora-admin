import { NextRequest } from 'next/server';
import { apiOk, requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** 当前登录管理员信息（页面级路由守卫用） */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;
  return apiOk({ user: guard.user });
}

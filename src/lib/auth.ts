import 'server-only';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 管理员白名单（T1：登录即全权）。
 * 可用环境变量 ADMIN_EMAILS 覆盖（逗号分隔）。
 * 店主账号由 scripts/create-admin.mjs 通过 service role 直接开通，
 * 不开放公开注册入口。
 */
const DEFAULT_ADMIN_EMAILS = ['admin@chloeflora.com'];

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  if (raw && raw.trim()) {
    return raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS;
}

export interface AdminUser {
  id: string;
  email: string;
}

/**
 * 校验 x-session 中的 Supabase access token，并要求邮箱在管理员白名单内。
 * 返回 NextResponse 表示失败（直接 return 即可），返回 user 表示通过。
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ user: AdminUser } | { response: NextResponse }> {
  const token = req.headers.get('x-session');
  if (!token) {
    return {
      response: NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 }),
    };
  }

  const client = getSupabaseClient(token);
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user || !user.email) {
    return {
      response: NextResponse.json({ error: '登录态无效，请重新登录' }, { status: 401 }),
    };
  }

  if (!getAdminEmails().includes(user.email.toLowerCase())) {
    return {
      response: NextResponse.json({ error: '该账号无管理员权限' }, { status: 403 }),
    };
  }

  return { user: { id: user.id, email: user.email } };
}

/** 标准错误响应 */
export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** 标准成功响应 */
export function apiOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

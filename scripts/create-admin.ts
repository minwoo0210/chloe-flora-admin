/**
 * 创建/重置管理员账号（通过 Supabase service role，不走公开注册）。
 *
 * 用法：
 *   pnpm tsx scripts/create-admin.ts [email] [password]
 * 默认：admin@chloeflora.com / Chloe@2026
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from '../src/storage/database/supabase-client';

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.COZE_SUPABASE_URL;
  const serviceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('缺少 COZE_SUPABASE_URL / COZE_SUPABASE_SERVICE_ROLE_KEY');
  }

  const email = (process.argv[2] ?? 'admin@chloeflora.com').trim().toLowerCase();
  const password = process.argv[3] ?? 'Chloe@2026';

  if (password.length < 8) {
    throw new Error('密码至少 8 位');
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = list.users.find((u) => u.email?.toLowerCase() === email);

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`[OK] 管理员密码已重置: ${email}`);
  } else {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`[OK] 管理员账号已创建: ${email}`);
  }

  console.log(`[INFO] 初始密码: ${password}（登录后可通过 Supabase 后台修改）`);
}

main().catch((err: unknown) => {
  console.error('[ERROR]', err instanceof Error ? err.message : err);
  process.exit(1);
});

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Flower2 } from 'lucide-react';
import { useSupabaseConfig } from '@/lib/supabase-config-inject';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: '工作台', subtitle: '今日门店经营概览' },
  '/products': { title: '商品管理', subtitle: '维护花礼商品、分类、库存与上下架' },
  '/homepage': { title: '首页内容', subtitle: '编辑小程序首页 Banner、文案与推荐位' },
  '/theme': { title: '风格配置', subtitle: '调整小程序视觉主题色，保存后前端同步生效' },
  '/orders': { title: '订单管理', subtitle: '处理小程序订单与配送状态' },
  '/customers': { title: '客户管理', subtitle: '查看客户联系信息与消费记录' },
};

function resolveMeta(pathname: string): { title: string; subtitle: string } {
  const exact = PAGE_META[pathname];
  if (exact) return exact;
  const base = Object.keys(PAGE_META).find(
    (key) => key !== '/dashboard' && pathname.startsWith(key)
  );
  return base ? PAGE_META[base] : { title: 'Chloe Flora', subtitle: '' };
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: configLoading } = useSupabaseConfig();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (configLoading) return;
    let active = true;

    const guard = async (): Promise<void> => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      const res = await fetch('/api/admin/me', {
        headers: { 'x-session': session.access_token },
      });
      if (!active) return;
      if (res.status === 401 || res.status === 403) {
        await supabase.auth.signOut();
        router.replace('/login');
        return;
      }
      const data = (await res.json()) as { user?: { email?: string } };
      setEmail(data.user?.email ?? '');
      setReady(true);
    };

    void guard();
    return () => {
      active = false;
    };
  }, [configLoading, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cf-bg">
        <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-cf-primary/10">
          <Flower2 className="h-5 w-5 text-cf-primary" />
        </span>
        <p className="text-[12px] tracking-[0.3em] text-cf-text-3">LOADING</p>
      </div>
    );
  }

  const meta = resolveMeta(pathname);

  return (
    <div className="flex min-h-screen bg-cf-bg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] border-r border-cf-line md:block">
        <AdminSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-[232px]">
        <AdminHeader title={meta.title} subtitle={meta.subtitle} email={email} />
        <main className="flex-1 px-5 py-7 md:px-8">{children}</main>
      </div>
    </div>
  );
}

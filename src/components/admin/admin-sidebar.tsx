'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Images,
  Palette,
  ClipboardList,
  Users,
  Flower2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { href: '/products', label: '商品管理', icon: Package },
  { href: '/homepage', label: '首页内容', icon: Images },
  { href: '/theme', label: '风格配置', icon: Palette },
  { href: '/orders', label: '订单管理', icon: ClipboardList },
  { href: '/customers', label: '客户管理', icon: Users },
] as const;

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[#FDFBF7]">
      <div className="flex h-16 items-center gap-2.5 border-b border-cf-line px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cf-primary/10">
          <Flower2 className="h-4 w-4 text-cf-primary" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-[17px] font-semibold tracking-wide text-cf-text-1">
            Chloe Flora
          </p>
          <p className="text-[10px] tracking-[0.25em] text-cf-text-3">ATELIER ADMIN</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-base',
                active
                  ? 'bg-cf-primary/10 font-medium text-cf-primary'
                  : 'text-cf-text-2 hover:bg-cf-input hover:text-cf-text-1'
              )}
            >
              <Icon
                className={cn(
                  'h-[17px] w-[17px] transition-base',
                  active ? 'text-cf-primary' : 'text-cf-text-3 group-hover:text-cf-text-2'
                )}
                strokeWidth={1.6}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-cf-line px-6 py-4">
        <p className="text-[10px] leading-relaxed tracking-[0.2em] text-cf-text-3">
          以花为礼
          <br />
          优雅无言
        </p>
      </div>
    </div>
  );
}

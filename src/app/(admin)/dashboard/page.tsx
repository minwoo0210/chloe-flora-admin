'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Boxes,
  Flower2,
  Image as ImageIcon,
  Loader2,
  ReceiptText,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { DashboardStats } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/admin/order-status-badge';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/constants';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<DashboardStats>('/admin/stats')
      .then(setStats)
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand" />
      </div>
    );
  }

  const needsAttention =
    stats.orderCounts.pending_payment +
    stats.orderCounts.paid +
    stats.orderCounts.making +
    stats.orderCounts.delivering;

  const metrics = [
    {
      label: '今日成交额',
      value: formatCurrency(stats.todayRevenue),
      hint: '不含已取消订单',
      icon: Wallet,
    },
    {
      label: '待处理订单',
      value: String(needsAttention),
      hint: '待付款至配送中',
      icon: ReceiptText,
      href: '/orders',
    },
    {
      label: '在售商品',
      value: `${stats.activeProductTotal} / ${stats.productTotal}`,
      hint: '在售 / 全部',
      icon: Flower2,
      href: '/products',
    },
    {
      label: '客户总数',
      value: String(stats.customerTotal),
      hint: '累计下单客户',
      icon: Users,
      href: '/customers',
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-serif text-2xl tracking-wide">概览</h1>
        <p className="mt-1 text-sm text-muted">今日花事，一目了然。</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => {
          const inner = (
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div className="space-y-1.5">
                <p className="text-xs tracking-widest text-muted">{m.label}</p>
                <p className="text-2xl font-light tracking-wide">{m.value}</p>
                <p className="text-[11px] text-muted/80">{m.hint}</p>
              </div>
              <span className="rounded-full bg-brand/10 p-2.5 text-brand">
                <m.icon className="h-4 w-4" />
              </span>
            </CardContent>
          );
          return m.href ? (
            <Card
              key={m.label}
              className="card-luxury transition-transform hover:-translate-y-0.5"
            >
              <Link href={m.href} className="block">
                {inner}
              </Link>
            </Card>
          ) : (
            <Card key={m.label} className="card-luxury">
              {inner}
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="card-luxury lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-lg tracking-wide">最新订单</h2>
              <Button variant="link" asChild className="px-0 text-brand">
                <Link href="/orders">
                  全部订单 <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            {stats.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted">
                <Boxes className="h-8 w-8 opacity-40" />
                <p className="text-sm">暂无订单，小程序提交后将显示在这里</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {stats.recentOrders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/orders?id=${o.id}`}
                      className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-brand"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {o.customers?.name ?? '未留名'}
                          <span className="ml-2 font-normal text-muted">{o.order_no}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatDateTime(o.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <OrderStatusBadge status={o.status as OrderStatus} />
                        <span className="w-20 text-right text-sm font-medium">
                          {formatCurrency(o.total_amount)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="card-luxury">
          <CardContent className="p-6">
            <h2 className="mb-5 font-serif text-lg tracking-wide">订单分布</h2>
            <ul className="space-y-3">
              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => {
                const total = Object.values(stats.orderCounts).reduce(
                  (a, b) => a + b,
                  0
                );
                const count = stats.orderCounts[s];
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <li key={s} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-secondary">{ORDER_STATUS_LABELS[s]}</span>
                      <span className="tabular-nums text-muted">
                        {count} · {percent}%
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 rounded-md bg-muted/50 p-4 text-xs leading-relaxed text-muted">
              <p className="mb-1 flex items-center gap-1.5 font-medium text-secondary">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                在制/配送货值
              </p>
              <p className="text-lg font-light text-ink">{formatCurrency(stats.pendingRevenue)}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/homepage">
          <Card className="card-luxury h-full transition-transform hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="rounded-full bg-brand/10 p-2.5 text-brand">
                <ImageIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">首页内容</p>
                <p className="text-xs text-muted">
                  {stats.bannerTotal} 张 Banner · {stats.hotTotal} 个热门推荐位
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/theme">
          <Card className="card-luxury h-full transition-transform hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="rounded-full bg-brand/10 p-2.5 text-brand">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">设计风格</p>
                <p className="text-xs text-muted">主题色、底色与文字颜色，小程序实时同步</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}

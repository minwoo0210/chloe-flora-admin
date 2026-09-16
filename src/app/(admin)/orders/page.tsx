'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, ReceiptText, Search } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { ORDER_STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from '@/lib/constants';
import type { OrderWithItems } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/admin/order-status-badge';
import { OrderDetailDialog } from '@/components/admin/order-detail-dialog';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

type Tab = OrderStatus | 'all';

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<OrderWithItems[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (tab !== 'all') params.set('status', tab);
      if (keyword.trim()) params.set('keyword', keyword.trim());
      const res = await apiClient.get<{
        items: OrderWithItems[];
        total: number;
      }>(`/admin/orders?${params.toString()}`);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [page, tab, keyword]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) setDetailId(id);
  }, [searchParams]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-serif text-2xl tracking-wide">订单管理</h1>
        <p className="mt-1 text-sm text-muted">共 {total} 笔订单，跟进从付款到送达的每一个环节。</p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {([
            { key: 'all' as Tab, label: '全部' },
            ...ORDER_STATUSES.map((s) => ({ key: s as Tab, label: ORDER_STATUS_LABELS[s] })),
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition-colors',
                tab === t.key
                  ? 'border-ink bg-ink text-white'
                  : 'border-line bg-surface text-muted hover:border-muted-foreground/30 hover:text-ink'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            className="pl-9"
            placeholder="搜索订单号 / 客户姓名 / 手机号"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setKeyword(searchInput);
                setPage(1);
              }
            }}
          />
        </div>
      </section>

      <section className="card-luxury overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted">
            <ReceiptText className="h-10 w-10 opacity-30" />
            <p className="text-sm">暂无订单</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs tracking-widest text-muted">
                  <th className="px-5 py-3 font-normal">订单</th>
                  <th className="px-3 py-3 font-normal">客户</th>
                  <th className="px-3 py-3 font-normal">商品</th>
                  <th className="px-3 py-3 font-normal">金额</th>
                  <th className="px-3 py-3 font-normal">状态</th>
                  <th className="px-3 py-3 font-normal">下单时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {items.map((o) => (
                  <tr
                    key={o.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => setDetailId(o.id)}
                  >
                    <td className="px-5 py-3 font-mono text-xs">{o.order_no}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{o.customer?.name ?? '未留名'}</p>
                      <p className="text-xs text-muted">{o.customer?.phone ?? '—'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-52 truncate text-secondary">
                        {o.items.map((i) => i.product_name).join('、') || '—'}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-medium">{formatCurrency(o.total_amount)}</td>
                    <td className="px-3 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">{formatDateTime(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && total > pageSize && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-xs text-muted">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      <OrderDetailDialog
        orderId={detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        onChanged={() => void load()}
      />
    </div>
  );
}

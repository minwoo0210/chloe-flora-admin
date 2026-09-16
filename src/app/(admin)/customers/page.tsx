'use client';

import { useEffect, useState } from 'react';
import { Loader2, Phone, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/format';

interface CustomerItem {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  order_count: number;
  latest_order_at: string | null;
}

export default function CustomersPage() {
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      apiClient
        .get<{ items: CustomerItem[] }>(
          `/admin/customers${keyword.trim() ? `?keyword=${encodeURIComponent(keyword.trim())}` : ''}`
        )
        .then((res) => setItems(res.items))
        .catch((e: unknown) => toast.error(e instanceof Error ? e.message : '加载失败'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [keyword]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-serif text-2xl tracking-wide">客户管理</h1>
        <p className="mt-1 text-sm text-muted">由小程序订单自动沉淀的客户与联系方式。</p>
      </section>

      <section className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          className="pl-9"
          placeholder="搜索姓名或手机号"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </section>

      <Card className="card-luxury overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm">暂无客户，订单提交后自动建档</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs tracking-widest text-muted">
                  <th className="px-5 py-3 font-normal">客户</th>
                  <th className="px-3 py-3 font-normal">联系电话</th>
                  <th className="px-3 py-3 font-normal">最近地址</th>
                  <th className="px-3 py-3 font-normal">订单数</th>
                  <th className="px-3 py-3 font-normal">最近下单</th>
                  <th className="px-3 py-3 font-normal">建档时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {items.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-xs font-medium text-brand">
                          {c.name.slice(0, 1)}
                        </span>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone}`}
                          className="inline-flex items-center gap-1.5 text-brand hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {c.phone}
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="max-w-64 px-3 py-3">
                      <span className="line-clamp-1 text-secondary">{c.address ?? '—'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          c.order_count > 0
                            ? 'font-medium'
                            : 'text-muted'
                        }
                      >
                        {c.order_count}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">
                      {c.latest_order_at ? formatDate(c.latest_order_at) : '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

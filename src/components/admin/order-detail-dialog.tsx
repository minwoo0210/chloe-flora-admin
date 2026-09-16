'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/admin/order-status-badge';
import { apiClient } from '@/lib/api-client';
import { ORDER_STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from '@/lib/constants';
import type { OrderWithItems } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface OrderDetailDialogProps {
  orderId: string | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const NEXT_ACTIONS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }[]>> = {
  pending_payment: [{ next: 'paid', label: '确认收款' }],
  paid: [{ next: 'making', label: '开始制作' }],
  making: [{ next: 'delivering', label: '开始配送' }],
  delivering: [{ next: 'completed', label: '确认完成' }],
};

export function OrderDetailDialog({ orderId, onOpenChange, onChanged }: OrderDetailDialogProps) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    setLoading(true);
    apiClient
      .get<{ item: OrderWithItems }>(`/admin/orders/${orderId}`)
      .then((res) => setOrder(res.item))
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const changeStatus = async (next: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await apiClient.patch<{ item: OrderWithItems }>(
        `/admin/orders/${order.id}`,
        { status: next }
      );
      setOrder(res.item);
      toast.success(`订单已更新为「${ORDER_STATUS_LABELS[next]}」`);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '操作失败');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={Boolean(orderId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-line bg-surface">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl tracking-wide">订单详情</DialogTitle>
          <DialogDescription>查看客户信息、商品明细并处理订单状态。</DialogDescription>
        </DialogHeader>

        {loading || !order ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted">订单编号</p>
                <p className="font-mono text-sm">{order.order_no}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* 状态时间轴 */}
            <div className="rounded-md bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                {(['pending_payment', 'paid', 'making', 'delivering', 'completed'] as OrderStatus[]).map(
                  (s, idx, arr) => {
                    const activeIdx = ORDER_STATUSES.indexOf(order.status);
                    const myIdx = ORDER_STATUSES.indexOf(s);
                    const reached =
                      order.status !== 'cancelled' && activeIdx >= myIdx;
                    return (
                      <div key={s} className="flex flex-1 items-center last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={cn(
                              'h-2.5 w-2.5 rounded-full',
                              reached ? 'bg-brand' : 'bg-line'
                            )}
                          />
                          <span
                            className={cn(
                              'whitespace-nowrap text-[10px]',
                              reached ? 'text-secondary' : 'text-muted/70'
                            )}
                          >
                            {ORDER_STATUS_LABELS[s]}
                          </span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div
                            className={cn(
                              'mx-1 mb-4 h-px flex-1',
                              order.status !== 'cancelled' && activeIdx > myIdx
                                ? 'bg-brand'
                                : 'bg-line'
                            )}
                          />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
              {order.status === 'cancelled' && (
                <p className="mt-2 text-center text-xs text-muted">该订单已取消</p>
              )}
            </div>

            {/* 客户信息 */}
            <div className="space-y-2.5 rounded-md border border-line p-4 text-sm">
              <p className="mb-1 text-xs tracking-widest text-muted">客户与配送</p>
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted" />
                {order.customer?.name ?? '未留名'}
              </p>
              {order.customer?.phone && (
                <a
                  href={`tel:${order.customer.phone}`}
                  className="flex items-center gap-2 text-brand hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {order.customer.phone}
                </a>
              )}
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                {order.address}
              </p>
              {order.remark && (
                <p className="rounded bg-muted/50 px-3 py-2 text-xs text-secondary">
                  备注：{order.remark}
                </p>
              )}
            </div>

            {/* 商品明细 */}
            <div className="space-y-3">
              <p className="text-xs tracking-widest text-muted">商品明细</p>
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-muted">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.product_name}</p>
                    <p className="text-xs text-muted">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
              <div className="space-y-1 border-t border-line pt-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>商品金额</span>
                  <span>{formatCurrency(Number(order.total_amount) - Number(order.delivery_fee))}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>配送费</span>
                  <span>{formatCurrency(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between pt-1 text-base font-medium">
                  <span>合计</span>
                  <span className="text-brand">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-muted">
              <p>下单时间：{formatDateTime(order.created_at)}</p>
              {order.completed_at && <p>完成时间：{formatDateTime(order.completed_at)}</p>}
            </div>

            {/* 操作区 */}
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              {NEXT_ACTIONS[order.status]?.map((a) => (
                <Button
                  key={a.next}
                  onClick={() => void changeStatus(a.next)}
                  disabled={updating}
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {a.label}
                </Button>
              ))}
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  className="text-muted hover:text-red-600"
                  disabled={updating}
                  onClick={() => void changeStatus('cancelled')}
                >
                  取消订单
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

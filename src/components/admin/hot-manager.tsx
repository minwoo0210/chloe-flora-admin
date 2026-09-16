'use client';

import { useState } from 'react';
import { Loader2, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ProductPicker } from '@/components/admin/product-picker';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { apiClient } from '@/lib/api-client';
import type { HotRecommendationRow, ProductWithCategory } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface HotManagerProps {
  items: HotRecommendationRow[];
  onChange: () => void;
}

export function HotManager({ items, onChange }: HotManagerProps) {
  const [adding, setAdding] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const [title, setTitle] = useState('');
  const [sortOrder, setSortOrder] = useState(items.length);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<HotRecommendationRow | null>(null);

  const startAdd = () => {
    setAdding(true);
    setSelectedProduct(null);
    setTitle('');
    setSortOrder(items.length);
    setPickerKey((k) => k + 1);
  };

  const add = async () => {
    if (!selectedProduct) return toast.error('请选择要推荐的商品');
    setSaving(true);
    try {
      await apiClient.post('/admin/homepage/hot', {
        product_id: selectedProduct.id,
        title: title || null,
        sort_order: sortOrder,
        is_active: true,
      });
      toast.success('已加入热门推荐');
      setAdding(false);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '添加失败');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (item: HotRecommendationRow, payload: Record<string, unknown>) => {
    try {
      await apiClient.patch(`/admin/homepage/hot/${item.id}`, payload);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '操作失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-widest text-muted">
              <th className="px-4 py-3 font-normal">商品</th>
              <th className="px-3 py-3 font-normal">自定义文案</th>
              <th className="px-3 py-3 font-normal">排序</th>
              <th className="px-3 py-3 font-normal">启用</th>
              <th className="px-4 py-3 text-right font-normal">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded bg-muted">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.products?.name ?? ''}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted/40">
                          <Star className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.products?.name ?? '商品已删除'}</p>
                      <p className="text-xs text-muted">
                        {item.products ? formatCurrency(item.products.price) : '—'}
                        {item.products && item.products.status !== 'active' && (
                          <span className="ml-1.5 text-brand">（商品已下架）</span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Input
                    className="h-8 w-40"
                    defaultValue={item.title ?? ''}
                    placeholder="默认显示商品名"
                    onBlur={(e) => {
                      if ((e.target.value || '') !== (item.title ?? '')) {
                        void patch(item, { title: e.target.value || null });
                      }
                    }}
                  />
                </td>
                <td className="px-3 py-3">
                  <Input
                    type="number"
                    className="h-8 w-20"
                    defaultValue={item.sort_order}
                    onBlur={(e) => {
                      const v = Number(e.target.value) || 0;
                      if (v !== item.sort_order) void patch(item, { sort_order: v });
                    }}
                  />
                </td>
                <td className="px-3 py-3">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(v) => void patch(item, { is_active: v })}
                    aria-label="启用推荐"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted hover:text-red-600"
                    onClick={() => setDeleting(item)}
                    aria-label="移除推荐"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && !adding && (
          <div className="flex flex-col items-center gap-2 py-12 text-muted">
            <Star className="h-8 w-8 opacity-30" />
            <p className="text-sm">还没有热门推荐，从在售商品中挑选花礼上架到首页</p>
          </div>
        )}
      </div>

      {adding ? (
        <div className="space-y-3 rounded-md border border-dashed border-brand/50 bg-brand/[0.03] p-4">
          <ProductPicker
            key={pickerKey}
            value={selectedProduct?.id ?? null}
            excludeIds={items.map((i) => i.product_id)}
            onChange={(_id, product) => setSelectedProduct(product)}
            placeholder="搜索并选择在售商品"
          />
          <div className="flex items-center gap-3">
            <Input
              className="h-9 flex-1"
              value={title}
              placeholder="自定义文案（可选，如：本周热卖）"
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              type="number"
              className="h-9 w-24"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            />
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
              取消
            </Button>
            <Button size="sm" onClick={add} disabled={saving || !selectedProduct}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '确认添加'}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={startAdd}>
          <Plus className="h-4 w-4" /> 添加热门推荐
        </Button>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="移除热门推荐"
        description="仅从首页推荐位移除，不会删除商品本身。"
        confirmText="移除"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await apiClient.del(`/admin/homepage/hot/${deleting.id}`);
            toast.success('已移除推荐');
            setDeleting(null);
            onChange();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : '移除失败');
          }
        }}
      />
    </div>
  );
}

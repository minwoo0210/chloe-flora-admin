'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flower2, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { CategoryRow, ProductWithCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductDialog } from '@/components/admin/product-dialog';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { CategoryManager } from '@/components/admin/category-manager';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function ProductsPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [items, setItems] = useState<ProductWithCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);
  const [deleting, setDeleting] = useState<ProductWithCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '50' });
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (keyword.trim()) params.set('keyword', keyword.trim());
      const res = await apiClient.get<{
        items: ProductWithCategory[];
        total: number;
      }>(`/admin/products?${params.toString()}`);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, keyword]);

  useEffect(() => {
    apiClient
      .get<{ items: CategoryRow[] }>('/admin/categories')
      .then((res) => setCategories(res.items))
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : '分类加载失败'));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.is_active),
    [categories]
  );

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiClient.del(`/admin/products/${deleting.id}`);
      toast.success('商品已删除');
      setDeleting(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl tracking-wide">商品管理</h1>
          <p className="mt-1 text-sm text-muted">共 {total} 件商品，管理花礼的上架、价格与库存。</p>
        </div>
        <div className="flex gap-2">
          <CategoryManager categories={categories} onChange={() => {
            apiClient
              .get<{ items: CategoryRow[] }>('/admin/categories')
              .then((res) => setCategories(res.items))
              .catch(() => undefined);
          }} />
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            新增商品
          </Button>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            className="pl-9"
            placeholder="搜索商品名称"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setKeyword(searchInput);
            }}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-md border border-line p-0.5">
          {(
            [
              { key: 'all', label: '全部' },
              { key: 'active', label: '在售' },
              { key: 'inactive', label: '已下架' },
            ] as { key: StatusFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                'rounded px-3 py-1.5 text-xs tracking-wide transition-colors',
                statusFilter === tab.key
                  ? 'bg-ink text-white'
                  : 'text-muted hover:text-ink'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {(keyword || categoryFilter !== 'all' || statusFilter !== 'all') && (
          <Button
            variant="link"
            className="text-muted"
            onClick={() => {
              setKeyword('');
              setSearchInput('');
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
          >
            清除筛选
          </Button>
        )}
      </section>

      <section className="card-luxury overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted">
            <Flower2 className="h-10 w-10 opacity-30" />
            <p className="text-sm">暂无符合条件的商品</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> 新增第一件商品
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs tracking-widest text-muted">
                  <th className="px-5 py-3 font-normal">商品</th>
                  <th className="px-3 py-3 font-normal">分类</th>
                  <th className="px-3 py-3 font-normal">售价</th>
                  <th className="px-3 py-3 font-normal">库存</th>
                  <th className="px-3 py-3 font-normal">状态</th>
                  <th className="px-3 py-3 font-normal">更新时间</th>
                  <th className="px-5 py-3 text-right font-normal">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {items.map((p) => (
                  <tr key={p.id} className="group transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted/40">
                              <Flower2 className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-56 truncate font-medium">{p.name}</p>
                          <p className="mt-0.5 line-clamp-1 max-w-56 text-xs text-muted">
                            {p.description || '暂无描述'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-secondary">
                      {p.categories?.name ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-medium">{formatCurrency(p.price)}</span>
                      {p.original_price ? (
                        <span className="ml-1.5 text-xs text-muted line-through">
                          {formatCurrency(p.original_price)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(p.stock <= 5 ? 'text-brand' : 'text-secondary')}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {p.status === 'active' ? (
                        <Badge variant="secondary" className="bg-brand/10 text-brand hover:bg-brand/15">
                          在售
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted">
                          已下架
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">{formatDate(p.updated_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(p);
                            setDialogOpen(true);
                          }}
                          aria-label="编辑"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted hover:text-red-600"
                          onClick={() => setDeleting(p)}
                          aria-label="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={activeCategories.length > 0 ? activeCategories : categories}
        product={editing}
        onSaved={() => void load()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="删除商品"
        description={`确定删除「${deleting?.name ?? ''}」吗？此操作不可撤销。`}
        confirmText="删除"
        destructive
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}

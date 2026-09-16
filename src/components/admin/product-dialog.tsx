'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUploader } from '@/components/admin/image-uploader';
import { apiClient } from '@/lib/api-client';
import { formatCurrencyInput } from '@/lib/format';
import type { CategoryRow, ProductRow, ProductWithCategory } from '@/lib/types';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryRow[];
  product: ProductWithCategory | null;
  onSaved: () => void;
}

interface FormState {
  name: string;
  price: string;
  original_price: string;
  category_id: string;
  status: 'active' | 'inactive';
  stock: string;
  sort_order: string;
  main_image: string;
  description: string;
}

const EMPTY: FormState = {
  name: '',
  price: '',
  original_price: '',
  category_id: '',
  status: 'active',
  stock: '0',
  sort_order: '0',
  main_image: '',
  description: '',
};

export function ProductDialog({
  open,
  onOpenChange,
  categories,
  product,
  onSaved,
}: ProductDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        name: product.name,
        price: product.price,
        original_price: product.original_price ?? '',
        category_id: product.category_id,
        status: product.status,
        stock: String(product.stock),
        sort_order: String(product.sort_order),
        main_image: product.main_image ?? '',
        description: product.description ?? '',
      });
    } else {
      setForm({ ...EMPTY, category_id: categories[0]?.id ?? '' });
    }
  }, [open, product, categories]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('请输入商品名称');
    const price = Number(form.price);
    if (!form.price || Number.isNaN(price) || price < 0) return toast.error('请输入正确的售价');
    if (!form.category_id) return toast.error('请选择分类');
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) return toast.error('库存需为非负整数');

    const payload = {
      name: form.name.trim(),
      price,
      original_price: form.original_price ? Number(form.original_price) : null,
      category_id: form.category_id,
      status: form.status,
      stock,
      sort_order: Number(form.sort_order) || 0,
      main_image: form.main_image || null,
      description: form.description || null,
    };

    setSaving(true);
    try {
      if (product) {
        await apiClient.patch(`/admin/products/${product.id}`, payload);
        toast.success('商品已更新');
      } else {
        await apiClient.post('/admin/products', payload);
        toast.success('商品已创建');
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-line bg-surface">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl tracking-wide">
            {product ? '编辑商品' : '新增商品'}
          </DialogTitle>
          <DialogDescription>
            商品信息保存后将同步至小程序，下架商品不会在前端展示。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2 md:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            <Label className="text-xs tracking-widest">商品主图</Label>
            <ImageUploader
              value={form.main_image}
              onChange={(url) => set('main_image', url)}
              ratioHint="1:1 或 4:3"
              folder="products"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name" className="text-xs tracking-widest">
                商品名称
              </Label>
              <Input
                id="p-name"
                value={form.name}
                maxLength={128}
                placeholder="如：晨曦玫瑰花束"
                onChange={(e) => set('name', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-price" className="text-xs tracking-widest">
                  售价（元）
                </Label>
                <Input
                  id="p-price"
                  inputMode="decimal"
                  value={form.price}
                  placeholder="399"
                  onChange={(e) => set('price', formatCurrencyInput(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-original" className="text-xs tracking-widest">
                  划线价（可选）
                </Label>
                <Input
                  id="p-original"
                  inputMode="decimal"
                  value={form.original_price}
                  placeholder="599"
                  onChange={(e) => set('original_price', formatCurrencyInput(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs tracking-widest">分类</Label>
                <Select value={form.category_id} onValueChange={(v) => set('category_id', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stock" className="text-xs tracking-widest">
                  库存
                </Label>
                <Input
                  id="p-stock"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value.replace(/[^\d]/g, ''))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs tracking-widest">上架状态</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => set('status', v as 'active' | 'inactive')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">上架</SelectItem>
                    <SelectItem value="inactive">下架</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-sort" className="text-xs tracking-widest">
                  排序权重
                </Label>
                <Input
                  id="p-sort"
                  inputMode="numeric"
                  value={form.sort_order}
                  onChange={(e) => set('sort_order', e.target.value.replace(/[^\d]/g, ''))}
                />
                <p className="text-[11px] text-muted">数值越小越靠前</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="p-desc" className="text-xs tracking-widest">
            商品描述
          </Label>
          <Textarea
            id="p-desc"
            rows={4}
            maxLength={2000}
            value={form.description}
            placeholder="花材、尺寸、适用场合、养护建议…"
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-24">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : product ? '保存修改' : '创建商品'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { ProductRow };

'use client';

import { useEffect, useState } from 'react';
import { GripVertical, Loader2, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api-client';
import type { CategoryRow } from '@/lib/types';

interface CategoryManagerProps {
  categories: CategoryRow[];
  onChange: () => void;
}

interface EditState {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export function CategoryManager({ categories, onChange }: CategoryManagerProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditState>({
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCreating(false);
      setEditingId(null);
    }
  }, [open]);

  const startCreate = () => {
    setEditingId(null);
    setCreating(true);
    setForm({
      name: '',
      slug: '',
      description: '',
      sort_order: categories.length,
      is_active: true,
    });
  };

  const startEdit = (c: CategoryRow) => {
    setCreating(false);
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      sort_order: c.sort_order,
      is_active: c.is_active,
    });
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('请输入分类名称');
    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      return toast.error('标识仅支持小写字母、数字与短横');
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (editingId) {
        await apiClient.patch(`/admin/categories/${editingId}`, payload);
        toast.success('分类已更新');
      } else {
        await apiClient.post('/admin/categories', payload);
        toast.success('分类已创建');
      }
      setCreating(false);
      setEditingId(null);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: CategoryRow) => {
    try {
      await apiClient.patch(`/admin/categories/${c.id}`, { is_active: !c.is_active });
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '操作失败');
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.del(`/admin/categories/${id}`);
      toast.success('分类已删除');
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Tags className="h-4 w-4" />
          分类管理
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-line bg-surface">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl tracking-wide">分类管理</DialogTitle>
          <DialogDescription>
            分类对应小程序品类入口，停用后不在前端展示，但不影响历史订单。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-md border border-line/70 px-3 py-2.5"
            >
              <GripVertical className="h-4 w-4 shrink-0 text-muted/40" />
              {editingId === c.id ? (
                <div className="grid flex-1 grid-cols-2 gap-2">
                  <Input
                    value={form.name}
                    placeholder="分类名称"
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <Input
                    value={form.slug}
                    placeholder="英文标识"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      }))
                    }
                  />
                  <Input
                    className="col-span-2"
                    value={form.description}
                    placeholder="描述（可选）"
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted">
                    {c.slug}
                    {c.description ? ` · ${c.description}` : ''}
                  </p>
                </div>
              )}

              {editingId === c.id ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" onClick={save} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '保存'}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <Switch
                    checked={c.is_active}
                    onCheckedChange={() => void toggleActive(c)}
                    aria-label="启用分类"
                  />
                  <Button size="icon" variant="ghost" onClick={() => startEdit(c)} aria-label="编辑分类">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted hover:text-red-600"
                    disabled={deletingId === c.id}
                    onClick={() => void remove(c.id)}
                    aria-label="删除分类"
                  >
                    {deletingId === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {creating ? (
          <div className="space-y-3 rounded-md border border-dashed border-line p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs tracking-widest">分类名称</Label>
                <Input
                  value={form.name}
                  placeholder="如：婚礼布置"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs tracking-widest">英文标识</Label>
                <Input
                  value={form.slug}
                  placeholder="wedding"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs tracking-widest">描述（可选）</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCreating(false)}>
                取消
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '创建'}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            新增分类
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

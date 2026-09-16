'use client';

import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUploader } from '@/components/admin/image-uploader';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { apiClient } from '@/lib/api-client';
import type { CategoryRow, CategorySectionRow } from '@/lib/types';

interface SectionManagerProps {
  sections: CategorySectionRow[];
  categories: CategoryRow[];
  onChange: () => void;
}

interface FormState {
  title: string;
  subtitle: string;
  image_key: string;
  category_id: string;
  sort_order: number;
  is_active: boolean;
}

export function SectionManager({ sections, categories, onChange }: SectionManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: '',
    subtitle: '',
    image_key: '',
    category_id: '',
    sort_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<CategorySectionRow | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setCreating(true);
    setForm({
      title: '',
      subtitle: '',
      image_key: '',
      category_id: categories[0]?.id ?? '',
      sort_order: sections.length,
      is_active: true,
    });
  };

  const startEdit = (s: CategorySectionRow) => {
    setCreating(false);
    setEditingId(s.id);
    setForm({
      title: s.title,
      subtitle: s.subtitle ?? '',
      image_key: s.image_key ?? '',
      category_id: s.category_id ?? '',
      sort_order: s.sort_order,
      is_active: s.is_active,
    });
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error('请输入宣传区标题');
    if (!form.image_key) return toast.error('请先上传宣传图');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle || null,
        image_key: form.image_key,
        category_id: form.category_id || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (editingId) {
        await apiClient.patch(`/admin/homepage/sections/${editingId}`, payload);
        toast.success('宣传区已更新');
      } else {
        await apiClient.post('/admin/homepage/sections', payload);
        toast.success('宣传区已添加');
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

  const toggleActive = async (s: CategorySectionRow) => {
    try {
      await apiClient.patch(`/admin/homepage/sections/${s.id}`, { is_active: !s.is_active });
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '操作失败');
    }
  };

  const renderForm = (previewUrl: string) => (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <ImageUploader
          value={previewUrl}
          onChange={(url) => setForm((f) => ({ ...f, image_key: url }))}
          ratioHint="3:4 或 4:5"
          folder="sections"
        />
        <div className="space-y-3">
          <Input
            value={form.title}
            placeholder="标题，如：婚礼花艺"
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            value={form.subtitle}
            placeholder="副标题（可选），如：为重要的日子定制"
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          />
          <Select
            value={form.category_id}
            onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="关联分类（可选）" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted">
              排序
              <Input
                type="number"
                className="h-8 w-20"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              启用
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <div key={s.id} className="overflow-hidden rounded-md border border-line bg-surface">
            {editingId === s.id ? (
              <div className="p-3">
                {renderForm(form.image_key || s.image_url || '')}
                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    取消
                  </Button>
                  <Button size="sm" onClick={save} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '保存'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 p-3">
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image_url ?? ''} alt={s.title} className="h-full w-full object-cover" />
                  {!s.is_active && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/50 text-[10px] tracking-widest text-white">
                      已停用
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                      {s.subtitle || '无副标题'}
                    </p>
                    <p className="mt-1 text-[11px] text-muted/80">
                      关联：{s.categories?.name ?? '未关联'} · 排序 {s.sort_order}
                    </p>
                  </div>
                  <div className="flex justify-end gap-1">
                    <Switch checked={s.is_active} onCheckedChange={() => void toggleActive(s)} aria-label="启用" />
                    <Button size="icon" variant="ghost" onClick={() => startEdit(s)} aria-label="编辑">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted hover:text-red-600"
                      onClick={() => setDeleting(s)}
                      aria-label="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {creating && (
        <div className="rounded-md border border-dashed border-brand/50 bg-brand/[0.03] p-3">
          {renderForm(form.image_key)}
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setCreating(false)}>
              <X className="h-4 w-4" /> 取消
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '添加'}
            </Button>
          </div>
        </div>
      )}

      {!creating && (
        <Button variant="outline" onClick={startCreate}>
          <Plus className="h-4 w-4" /> 添加品类宣传区
        </Button>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="删除品类宣传区"
        description={`确定删除「${deleting?.title ?? ''}」吗？`}
        confirmText="删除"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await apiClient.del(`/admin/homepage/sections/${deleting.id}`);
            toast.success('宣传区已删除');
            setDeleting(null);
            onChange();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : '删除失败');
          }
        }}
      />
    </div>
  );
}
